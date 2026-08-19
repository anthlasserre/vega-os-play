import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {IconName} from '../components/Icon';
import {MediaCard} from '../components/MediaCard';
import {useLayout} from '../layout';
import {formatRelativeDay, formatTime} from '../format';
import {MediaKind} from '../../iptv/types';
import {HistoryEntry} from '../../storage/schema';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface HistoryScreenProps {
  history: HistoryEntry[];
  onReplay: (entry: HistoryEntry) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onBack: () => void;
}

type Filter = 'all' | MediaKind;

const FILTERS: {id: Filter; label: string}[] = [
  {id: 'all', label: 'Tout'},
  {id: 'live', label: 'Direct'},
  {id: 'movie', label: 'Films'},
  {id: 'series', label: 'Séries'},
];

const FILTER_ICONS: Record<Filter, IconName> = {
  all: 'list',
  live: 'live',
  movie: 'movie',
  series: 'series',
};

const KIND_LABEL: Record<MediaKind, string> = {
  live: 'Direct',
  movie: 'Film',
  series: 'Série',
};

/**
 * Journal de visionnage.
 *
 * Séparé du rail « Reprendre » de l'accueil, qui ne montre que ce qui est
 * repris en cours de route : ici on retrouve aussi les directs et ce qu'on a
 * regardé jusqu'au bout. Le tri est chronologique — c'est la seule question
 * qu'on pose à un historique.
 */
export const HistoryScreen = ({
  history,
  onReplay,
  onRemove,
  onClear,
  onBack,
}: HistoryScreenProps) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const metrics = useLayout();

  const visible = useMemo(
    () => (filter === 'all' ? history : history.filter(entry => entry.kind === filter)),
    [history, filter],
  );

  const counts = useMemo(() => {
    const out: Record<Filter, number> = {all: history.length, live: 0, movie: 0, series: 0};
    for (const entry of history) {
      out[entry.kind] += 1;
    }
    return out;
  }, [history]);

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      {/* Actions en haut : un pied de page sous la liste serait hors d'atteinte
          au D-PAD dès que l'historique dépasse un écran. */}
      <TVFocusGuideView style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <View style={styles.headerRight}>
          {history.length > 0 && (
            <Text style={styles.counter}>
              {visible.length === history.length
                ? `${history.length}`
                : `${visible.length} / ${history.length}`}
            </Text>
          )}
          {history.length > 0 && (
            <ActionButton
              testID="history-clear"
              label="Vider"
              icon="trash"
              tone="danger"
              onPress={onClear}
            />
          )}
          <ActionButton
            testID="history-back"
            label="Retour"
            icon="back"
            iconOnly={true}
            hasTVPreferredFocus={history.length === 0}
            onPress={onBack}
          />
        </View>
      </TVFocusGuideView>

      <TVFocusGuideView style={styles.filters}>
        {FILTERS.map(entry => (
          <ActionButton
            key={entry.id}
            testID={`history-filter-${entry.id}`}
            label={`${entry.label} (${counts[entry.id]})`}
icon={FILTER_ICONS[entry.id]}
            tone={filter === entry.id ? 'primary' : 'default'}
            onPress={() => setFilter(entry.id)}
            style={styles.filter}
          />
        ))}
      </TVFocusGuideView>

      <TVFocusGuideView style={styles.list}>
        <FlatList
          data={visible}
          keyExtractor={entry => entry.key}
          initialNumToRender={12}
          windowSize={5}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={({item, index}) => (
            <View style={styles.rowWrap}>
              <MediaCard
                testID={`history-${item.key}`}
                title={item.title}
                subtitle={[
                  KIND_LABEL[item.kind],
                  `${formatRelativeDay(item.watchedAt)} à ${formatTime(item.watchedAt)}`,
                  item.plays > 1 ? `${item.plays} lectures` : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                image={item.poster}
                layout="list"
                rowHeight={metrics.rowHeight}
                logoSlot={{width: metrics.logoWidth, height: metrics.logoHeight}}
                hasTVPreferredFocus={index === 0}
                onPress={() => onReplay(item)}
                onFocus={() => setSelected(item.key)}
                style={styles.row}
              />
              {selected === item.key && (
                <ActionButton
                  testID={`history-remove-${item.key}`}
                  label="Retirer"
                  tone="danger"
                  icon="close"
                  iconOnly={true}
                  onPress={() => onRemove(item.key)}
                  style={styles.remove}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {history.length === 0
                ? "Rien encore. Ce que tu lances apparaîtra ici."
                : 'Aucune entrée de ce type.'}
            </Text>
          }
        />
      </TVFocusGuideView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  counter: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  filters: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  filter: {
    marginRight: spacing.xs,
  },
  list: {
    flex: 1,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  row: {
    flex: 1,
  },
  remove: {
    marginLeft: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
});
