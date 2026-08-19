import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useKeplerBackHandler} from '@amazon-devices/react-native-kepler';
import {StoreProvider, useStore} from './storage/StoreProvider';
import {
  addSource,
  applyCategoryFilter,
  clearHistory,
  clearProgress,
  hiddenCategoriesFor,
  hideAllCategories,
  isFavorite,
  progressFor,
  recordHistory,
  recordProgress,
  removeHistoryEntry,
  removeSource,
  selectSource,
  showAllCategories,
  toggleCategoryHidden,
  toggleFavorite,
  updateSettings,
} from './storage/reducers';
import {
  HistoryEntry,
  PlaybackProgress,
  filterKey,
  nextLiveBuffer,
} from './storage/schema';
import {
  emptyCatalog,
  loadCatalog,
  loadMovieDetails,
  loadSeriesEpisodes,
} from './iptv/catalog';
import {
  Catalog,
  Episode,
  LiveChannel,
  MediaItem,
  MediaKind,
  Movie,
  MovieDetails,
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
import {CategoryFilterScreen} from './ui/screens/CategoryFilterScreen';
import {FavoritesScreen} from './ui/screens/FavoritesScreen';
import {HistoryScreen} from './ui/screens/HistoryScreen';
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

/**
 * Retire les clés à `undefined` avant une fusion par étalement.
 *
 * `{...movie, ...details}` écraserait sinon une valeur du catalogue par un
 * `undefined` venu d'un champ que le panel n'a pas rempli — l'affiche
 * disparaîtrait dès que `get_vod_info` omet `movie_image`.
 */
const prune = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;

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

  // Détails du film ouvert. `get_vod_streams` ne renvoie ni résumé, ni genre, ni
  // durée : sans cet appel la fiche reste un titre et une affiche.
  const [movieDetails, setMovieDetails] = useState<MovieDetails>({});

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
      // Le journal se remplit au lancement, pas à l'arrêt : on veut y retrouver
      // même une chaîne quittée au bout de dix secondes parce qu'elle ne
      // fonctionnait pas.
      update(previous =>
        recordHistory(previous, {
          key: mediaKey(target.kind, target.itemId),
          kind: target.kind,
          itemId: target.itemId,
          sourceId: target.sourceId,
          title: target.title,
          subtitle: target.subtitle,
          poster: target.poster,
          url: target.url,
          live: target.live,
          watchedAt: Date.now(),
        }),
      );
      push({name: 'player', target});
    },
    [push, update],
  );

  const liveCategoryNames = useMemo(
    () => new Map(catalog.live.categories.map(entry => [entry.id, entry.name])),
    [catalog.live.categories],
  );

  const playChannel = useCallback(
    (channel: LiveChannel) => {
      play({
        kind: 'live',
        itemId: channel.id,
        sourceId: source?.id ?? '',
        title: channel.name,
        // Le nom de la catégorie, pas son identifiant : l'OSD affichait « 1363 ».
        subtitle: liveCategoryNames.get(channel.categoryId),
        poster: channel.logo,
        url: channel.url,
        live: true,
      });
    },
    [play, source, liveCategoryNames],
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

  const openMovie = useCallback(
    (movie: Movie) => {
      push({name: 'movie', id: movie.id});
      setMovieDetails({});

      if (source === null) {
        return;
      }
      loadMovieDetails(source, movie.streamId)
        .then(setMovieDetails)
        // Un échec ici n'est pas bloquant : la fiche reste utilisable, elle est
        // seulement moins renseignée. Inutile d'alerter l'utilisateur.
        .catch(() => setMovieDetails({}));
    },
    [push, source],
  );

  const openItem = useCallback(
    (item: MediaItem) => {
      switch (item.kind) {
        case 'live':
          playChannel(item);
          break;
        case 'movie':
          openMovie(item);
          break;
        case 'series':
          openSeries(item);
          break;
      }
    },
    [playChannel, openSeries, openMovie],
  );

  const sourceId = source?.id ?? '';

  /**
   * Catalogue vu par les écrans de parcours, catégories masquées retirées.
   *
   * Les favoris, la recherche et l'historique gardent le catalogue complet :
   * masquer une catégorie sert à épurer la navigation, pas à rendre inaccessible
   * un film déjà mis de côté.
   */
  const {hiddenCategories} = state;
  const browseCatalog = useMemo<Catalog>(() => {
    const hidden = (kind: MediaKind): string[] =>
      hiddenCategories[filterKey(sourceId, kind)] ?? [];

    return {
      live: applyCategoryFilter(
        hidden('live'),
        catalog.live.categories,
        catalog.live.items,
      ),
      movies: applyCategoryFilter(
        hidden('movie'),
        catalog.movies.categories,
        catalog.movies.items,
      ),
      series: applyCategoryFilter(
        hidden('series'),
        catalog.series.categories,
        catalog.series.items,
      ),
      account: catalog.account,
    };
    // Mémoïsé sur `hiddenCategories` seul, et non sur `state` : filtrer 36 000
    // films à chaque tick de progression de lecture serait absurde.
  }, [catalog, hiddenCategories, sourceId]);

  const replay = useCallback(
    (entry: HistoryEntry) => {
      const started = progressFor(state, entry.kind, entry.itemId);
      play({
        kind: entry.kind,
        itemId: entry.itemId,
        sourceId: entry.sourceId,
        title: entry.title,
        subtitle: entry.subtitle,
        poster: entry.poster,
        url: entry.url,
        live: entry.live,
        startAt:
          !entry.live && state.settings.resumePlayback
            ? started?.positionSeconds ?? 0
            : 0,
      });
    },
    [play, state],
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
          catalog={browseCatalog}
          source={source}
          state={state}
          hiddenCount={hiddenCategoriesFor(state, sourceId, 'live').length}
          onOpenFilter={() => push({name: 'categoryFilter', kind: 'live'})}
          onPlay={playChannel}
          onBack={goBack}
        />
      );

    case 'movies':
      return (
        <MoviesScreen
          catalog={browseCatalog}
          state={state}
          hiddenCount={hiddenCategoriesFor(state, sourceId, 'movie').length}
          onOpenFilter={() => push({name: 'categoryFilter', kind: 'movie'})}
          onSelect={openMovie}
          onBack={goBack}
        />
      );

    case 'series':
      return (
        <SeriesScreen
          catalog={browseCatalog}
          state={state}
          hiddenCount={hiddenCategoriesFor(state, sourceId, 'series').length}
          onOpenFilter={() => push({name: 'categoryFilter', kind: 'series'})}
          onSelect={openSeries}
          onBack={goBack}
        />
      );

    case 'categoryFilter': {
      const {kind} = route;
      // Les catégories proposées viennent du catalogue *complet* : une catégorie
      // déjà masquée doit rester listée pour pouvoir la réafficher.
      const categories =
        kind === 'live'
          ? catalog.live.categories
          : kind === 'movie'
          ? catalog.movies.categories
          : catalog.series.categories;

      return (
        <CategoryFilterScreen
          kind={kind}
          categories={categories}
          hidden={hiddenCategoriesFor(state, sourceId, kind)}
          onToggle={categoryId =>
            update(previous =>
              toggleCategoryHidden(previous, sourceId, kind, categoryId),
            )
          }
          onShowAll={() =>
            update(previous => showAllCategories(previous, sourceId, kind))
          }
          onHideAll={() =>
            update(previous =>
              hideAllCategories(previous, sourceId, kind, categories),
            )
          }
          onBack={goBack}
        />
      );
    }

    case 'history':
      return (
        <HistoryScreen
          history={state.history}
          onReplay={replay}
          onRemove={key => update(previous => removeHistoryEntry(previous, key))}
          onClear={() => update(clearHistory)}
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
          // Les détails chargés à la demande complètent la fiche du catalogue,
          // sans jamais l'écraser : `poster` du catalogue est déjà bon.
          movie={{...movie, ...prune(movieDetails)}}
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
          onCycleLiveBuffer={() =>
            update(previous =>
              updateSettings(previous, {
                liveBufferSeconds: nextLiveBuffer(previous.settings.liveBufferSeconds),
              }),
            )
          }
          onClearResume={() => update(clearProgress)}
          onClearHistory={() => update(clearHistory)}
          onOpenHistory={() => push({name: 'history'})}
          onOpenFilter={kind => push({name: 'categoryFilter', kind})}
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
          bufferSeconds={state.settings.liveBufferSeconds}
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
            live: browseCatalog.live.items.length,
            movies: browseCatalog.movies.items.length,
            series: browseCatalog.series.items.length,
            favorites: state.favorites.length,
            history: state.history.length,
          }}
          resumable={state.progress}
          recent={state.history}
          onNavigate={push}
          onResume={resume}
          onReplay={replay}
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
