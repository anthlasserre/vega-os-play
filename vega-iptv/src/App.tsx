import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useKeplerBackHandler} from '@amazon-devices/react-native-kepler';
import {StoreProvider, useStore} from './storage/StoreProvider';
import {
  addSource,
  clearProgress,
  isFavorite,
  progressFor,
  recordProgress,
  removeSource,
  selectSource,
  toggleFavorite,
  updateSettings,
} from './storage/reducers';
import {PlaybackProgress} from './storage/schema';
import {emptyCatalog, loadCatalog, loadSeriesEpisodes} from './iptv/catalog';
import {
  Catalog,
  Episode,
  LiveChannel,
  MediaItem,
  Movie,
  Series,
  Source,
  mediaKey,
} from './iptv/types';
import {ProgressSnapshot} from './player/useMediaPlayer';
import {
  PlaybackTarget,
  Route,
  currentRoute,
  popRoute,
  pushRoute,
} from './ui/navigation';
import {ActionButton} from './ui/components/ActionButton';
import {FavoritesScreen} from './ui/screens/FavoritesScreen';
import {HomeScreen} from './ui/screens/HomeScreen';
import {LiveScreen} from './ui/screens/LiveScreen';
import {MovieDetailScreen} from './ui/screens/MovieDetailScreen';
import {MoviesScreen} from './ui/screens/MoviesScreen';
import {PlayerScreen} from './ui/screens/PlayerScreen';
import {SearchScreen} from './ui/screens/SearchScreen';
import {SeriesDetailScreen} from './ui/screens/SeriesDetailScreen';
import {SeriesScreen} from './ui/screens/SeriesScreen';
import {SettingsScreen} from './ui/screens/SettingsScreen';
import {SourcesScreen} from './ui/screens/SourcesScreen';
import {colors, fontSize, spacing} from './theme';

const Shell = () => {
  const {state, ready, update} = useStore();
  const backHandler = useKeplerBackHandler();

  const [stack, setStack] = useState<Route[]>([{name: 'home'}]);
  const route = currentRoute(stack);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodesError, setEpisodesError] = useState<string | null>(null);

  const source = useMemo<Source | null>(
    () => state.sources.find(entry => entry.id === state.activeSourceId) ?? null,
    [state.sources, state.activeSourceId],
  );

  // Chargement du catalogue : rejoué au changement de source et sur demande
  // explicite depuis les réglages.
  useEffect(() => {
    if (!ready || source === null) {
      return;
    }

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    loadCatalog(source)
      .then(loaded => {
        if (!cancelled) {
          setCatalog(loaded);
          setCatalogLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setCatalog(emptyCatalog());
          setCatalogError(cause instanceof Error ? cause.message : String(cause));
          setCatalogLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready, source, reloadToken]);

  const push = useCallback((next: Route) => {
    setStack(previous => pushRoute(previous, next));
  }, []);

  // Le gestionnaire Retour doit répondre *synchroniquement* si l'événement est
  // consommé : un updater `setStack` s'exécute trop tard pour ça, d'où la ref.
  // Rend `false` sur l'écran racine pour laisser le système fermer l'app.
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const goBack = useCallback(() => {
    if (stackRef.current.length <= 1) {
      return false;
    }
    setStack(popRoute);
    return true;
  }, []);

  useEffect(() => {
    const subscription = backHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [backHandler, goBack]);

  const openSeries = useCallback(
    (series: Series) => {
      push({name: 'seriesDetail', id: series.id});
      setEpisodes([]);
      setEpisodesError(null);

      if (source === null) {
        return;
      }
      setEpisodesLoading(true);
      loadSeriesEpisodes(source, series.seriesId)
        .then(loaded => {
          setEpisodes(loaded);
          setEpisodesLoading(false);
        })
        .catch((cause: unknown) => {
          setEpisodesError(cause instanceof Error ? cause.message : String(cause));
          setEpisodesLoading(false);
        });
    },
    [source, push],
  );

  const play = useCallback(
    (target: PlaybackTarget) => {
      push({name: 'player', target});
    },
    [push],
  );

  const playChannel = useCallback(
    (channel: LiveChannel) => {
      play({
        kind: 'live',
        itemId: channel.id,
        sourceId: source?.id ?? '',
        title: channel.name,
        subtitle: channel.categoryId,
        poster: channel.logo,
        url: channel.url,
        live: true,
      });
    },
    [play, source],
  );

  const playMovie = useCallback(
    (movie: Movie, startAt: number) => {
      play({
        kind: 'movie',
        itemId: movie.id,
        sourceId: source?.id ?? '',
        title: movie.name,
        subtitle: movie.year,
        poster: movie.poster,
        url: movie.url,
        live: false,
        startAt: state.settings.resumePlayback ? startAt : 0,
      });
    },
    [play, source, state.settings.resumePlayback],
  );

  const playEpisode = useCallback(
    (series: Series, episode: Episode, startAt: number) => {
      play({
        kind: 'series',
        itemId: episode.id,
        sourceId: source?.id ?? '',
        title: `${series.name} — S${episode.season}E${episode.episode}`,
        subtitle: episode.title,
        poster: episode.still ?? series.poster,
        url: episode.url,
        live: false,
        startAt: state.settings.resumePlayback ? startAt : 0,
      });
    },
    [play, source, state.settings.resumePlayback],
  );

  const openItem = useCallback(
    (item: MediaItem) => {
      switch (item.kind) {
        case 'live':
          playChannel(item);
          break;
        case 'movie':
          push({name: 'movie', id: item.id});
          break;
        case 'series':
          openSeries(item);
          break;
      }
    },
    [playChannel, openSeries, push],
  );

  const resume = useCallback(
    (entry: PlaybackProgress) => {
      play({
        kind: entry.kind,
        itemId: entry.itemId,
        sourceId: entry.sourceId,
        title: entry.title,
        subtitle: entry.subtitle,
        poster: entry.poster,
        url: entry.url,
        live: false,
        startAt: state.settings.resumePlayback ? entry.positionSeconds : 0,
      });
    },
    [play, state.settings.resumePlayback],
  );

  const handleProgress = useCallback(
    (target: PlaybackTarget, snapshot: ProgressSnapshot) => {
      update(previous =>
        recordProgress(previous, {
          key: mediaKey(target.kind, target.itemId),
          kind: target.kind,
          itemId: target.itemId,
          sourceId: target.sourceId,
          title: target.title,
          subtitle: target.subtitle,
          poster: target.poster,
          url: target.url,
          positionSeconds: snapshot.positionSeconds,
          durationSeconds: snapshot.durationSeconds,
          updatedAt: Date.now(),
        }),
      );
    },
    [update],
  );

  if (!ready) {
    return <Splash label="Démarrage…" />;
  }

  if (source === null) {
    return (
      <Centered
        message="Aucune source configurée."
        actionLabel="Ajouter une source"
        onAction={() => push({name: 'sources'})}
      />
    );
  }

  if (route.name === 'sources') {
    return (
      <SourcesScreen
        sources={state.sources}
        activeSourceId={state.activeSourceId}
        onSelect={id => update(previous => selectSource(previous, id))}
        onAdd={added => update(previous => addSource(previous, added))}
        onRemove={id => update(previous => removeSource(previous, id))}
        onBack={goBack}
      />
    );
  }

  if (catalogLoading) {
    return <Splash label={`Chargement de ${source.label}…`} />;
  }

  if (catalogError !== null) {
    return (
      <Centered
        message={`Impossible de charger ${source.label}. ${catalogError}`}
        actionLabel="Gérer les sources"
        onAction={() => push({name: 'sources'})}
        secondaryLabel="Réessayer"
        onSecondary={() => setReloadToken(token => token + 1)}
      />
    );
  }

  switch (route.name) {
    case 'live':
      return (
        <LiveScreen
          catalog={catalog}
          source={source}
          state={state}
          onPlay={playChannel}
          onBack={goBack}
        />
      );

    case 'movies':
      return (
        <MoviesScreen
          catalog={catalog}
          state={state}
          onSelect={movie => push({name: 'movie', id: movie.id})}
          onBack={goBack}
        />
      );

    case 'series':
      return (
        <SeriesScreen
          catalog={catalog}
          state={state}
          onSelect={openSeries}
          onBack={goBack}
        />
      );

    case 'movie': {
      const movie = catalog.movies.items.find(entry => entry.id === route.id);
      if (movie === undefined) {
        return (
          <Centered
            message="Ce film n'est plus dans le catalogue."
            actionLabel="Retour"
            onAction={goBack}
          />
        );
      }
      return (
        <MovieDetailScreen
          movie={movie}
          favorite={isFavorite(state, 'movie', movie.id)}
          resume={progressFor(state, 'movie', movie.id)}
          onPlay={startAt => playMovie(movie, startAt)}
          onToggleFavorite={() =>
            update(previous => toggleFavorite(previous, 'movie', movie.id))
          }
          onBack={goBack}
        />
      );
    }

    case 'seriesDetail': {
      const series = catalog.series.items.find(entry => entry.id === route.id);
      if (series === undefined) {
        return (
          <Centered
            message="Cette série n'est plus dans le catalogue."
            actionLabel="Retour"
            onAction={goBack}
          />
        );
      }
      return (
        <SeriesDetailScreen
          series={series}
          episodes={episodes}
          loading={episodesLoading}
          error={episodesError}
          favorite={isFavorite(state, 'series', series.id)}
          state={state}
          onPlayEpisode={(episode, startAt) => playEpisode(series, episode, startAt)}
          onToggleFavorite={() =>
            update(previous => toggleFavorite(previous, 'series', series.id))
          }
          onBack={goBack}
        />
      );
    }

    case 'favorites':
      return (
        <FavoritesScreen
          catalog={catalog}
          state={state}
          onSelect={openItem}
          onBack={goBack}
        />
      );

    case 'search':
      return (
        <SearchScreen
          catalog={catalog}
          onSelect={openItem}
          onBack={goBack}
        />
      );

    case 'settings':
      return (
        <SettingsScreen
          state={state}
          source={source}
          account={catalog.account}
          onToggleLayout={() =>
            update(previous =>
              updateSettings(previous, {
                layout: previous.settings.layout === 'grid' ? 'list' : 'grid',
              }),
            )
          }
          onToggleResume={() =>
            update(previous =>
              updateSettings(previous, {
                resumePlayback: !previous.settings.resumePlayback,
              }),
            )
          }
          onClearHistory={() => update(clearProgress)}
          onReloadCatalog={() => setReloadToken(token => token + 1)}
          onOpenSources={() => push({name: 'sources'})}
          onBack={goBack}
        />
      );

    case 'player': {
      const {target} = route;
      return (
        <PlayerScreen
          target={target}
          favorite={isFavorite(state, target.kind, target.itemId)}
          onProgress={snapshot => handleProgress(target, snapshot)}
          onToggleFavorite={() =>
            update(previous => toggleFavorite(previous, target.kind, target.itemId))
          }
          onBack={goBack}
        />
      );
    }

    default:
      return (
        <HomeScreen
          source={source}
          account={catalog.account}
          counts={{
            live: catalog.live.items.length,
            movies: catalog.movies.items.length,
            series: catalog.series.items.length,
            favorites: state.favorites.length,
          }}
          resumable={state.progress}
          onNavigate={push}
          onResume={resume}
        />
      );
  }
};

const Splash = ({label}: {label: string}) => (
  <View style={styles.centered} testID="splash">
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.message}>{label}</Text>
  </View>
);

const Centered = ({
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) => (
  <View style={styles.centered} testID="centered">
    <Text style={styles.message}>{message}</Text>
    <View style={styles.centeredActions}>
      <ActionButton
        label={actionLabel}
        hasTVPreferredFocus={true}
        onPress={onAction}
        style={styles.centeredAction}
      />
      {secondaryLabel !== undefined && onSecondary !== undefined && (
        <ActionButton
          label={secondaryLabel}
          onPress={onSecondary}
          style={styles.centeredAction}
        />
      )}
    </View>
  </View>
);

export const App = () => (
  <StoreProvider>
    <Shell />
  </StoreProvider>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  message: {
    color: colors.text,
    fontSize: fontSize.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  centeredActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  centeredAction: {
    marginRight: spacing.sm,
  },
});

export default App;
