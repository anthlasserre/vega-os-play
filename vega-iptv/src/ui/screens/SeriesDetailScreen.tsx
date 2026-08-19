import React, {useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
import {Episode, Series} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';
import {progressFor} from '../../storage/reducers';
import {containerOf, isRiskyContainer} from '../../player/streamKind';
import {formatDuration} from '../format';
import {colors, fontSize, spacing} from '../../theme';

export interface SeriesDetailScreenProps {
  series: Series;
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  favorite: boolean;
  state: PersistedState;
  onPlayEpisode: (episode: Episode, startAt: number) => void;
  onToggleFavorite: () => void;
  onBack: () => void;
}

export const SeriesDetailScreen = ({
  series,
  episodes,
  loading,
  error,
  favorite,
  state,
  onPlayEpisode,
  onToggleFavorite,
  onBack,
}: SeriesDetailScreenProps) => {
  const seasons = useMemo(
    () => Array.from(new Set(episodes.map(episode => episode.season))).sort((a, b) => a - b),
    [episodes],
  );
  const [season, setSeason] = useState<number | null>(null);
  const activeSeason = season ?? seasons[0] ?? null;

  const visible = useMemo(
    () => episodes.filter(episode => episode.season === activeSeason),
    [episodes, activeSeason],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{series.name}</Text>
      <Text style={styles.meta}>
        {[
          series.year,
          series.genre,
          series.rating === undefined ? undefined : `${series.rating.toFixed(1)}/10`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {series.plot !== undefined && (
        <Text style={styles.plot} numberOfLines={3}>
          {series.plot}
        </Text>
      )}

      {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      {error !== null && (
        <Text style={styles.error} testID="series-error">
          {error}
        </Text>
      )}

      {!loading && error === null && episodes.length === 0 && (
        <Text style={styles.empty} testID="series-empty">
          Aucun épisode retourné par la source.
        </Text>
      )}

      <View style={styles.body}>
        <TVFocusGuideView style={styles.seasons}>
          <FlatList
            data={seasons}
            keyExtractor={value => String(value)}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item, index}) => (
              <MediaCard
                testID={`season-${item}`}
                title={`Saison ${item}`}
                layout="list"
                hasTVPreferredFocus={index === 0}
                onPress={() => setSeason(item)}
                style={[
                  styles.seasonCard,
                  item === activeSeason && styles.seasonSelected,
                ]}
              />
            )}
          />
        </TVFocusGuideView>

        <TVFocusGuideView style={styles.episodes}>
          <FlatList
            data={visible}
            keyExtractor={episode => episode.id}
            initialNumToRender={12}
            windowSize={5}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item}) => {
              const resume = progressFor(state, 'series', item.id);
              return (
                <MediaCard
                  testID={`episode-${item.id}`}
                  title={`${item.episode}. ${item.title}`}
                  subtitle={
                    [
                      item.durationSeconds === undefined
                        ? undefined
                        : formatDuration(item.durationSeconds),
                      isRiskyContainer(item.url)
                        ? containerOf(item.url)
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  layout="list"
                  progress={
                    resume !== undefined && resume.durationSeconds > 0
                      ? resume.positionSeconds / resume.durationSeconds
                      : undefined
                  }
                  onPress={() =>
                    onPlayEpisode(item, resume?.positionSeconds ?? 0)
                  }
                  style={styles.episodeCard}
                />
              );
            }}
          />
        </TVFocusGuideView>
      </View>

      <TVFocusGuideView style={styles.actions}>
        <ActionButton
          testID="series-favorite"
          label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onPress={onToggleFavorite}
          style={styles.action}
        />
        <ActionButton testID="series-back" label="Retour" onPress={onBack} style={styles.action} />
      </TVFocusGuideView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  plot: {
    color: colors.text,
    fontSize: fontSize.micro,
    marginTop: spacing.xs,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  seasons: {
    width: 220,
    marginRight: spacing.sm,
  },
  seasonCard: {
    marginBottom: spacing.xs,
    minHeight: 68,
  },
  seasonSelected: {
    borderColor: colors.accent,
  },
  episodes: {
    flex: 1,
  },
  episodeCard: {
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  action: {
    marginRight: spacing.sm,
  },
});
