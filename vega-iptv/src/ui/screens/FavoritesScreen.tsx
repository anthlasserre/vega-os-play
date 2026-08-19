import React, {useCallback, useMemo} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
import {useLayout} from '../layout';
import {imageOf} from '../mediaItem';
import {Catalog, MediaItem, mediaKey} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';
import {colors, fontSize, spacing} from '../../theme';

export interface FavoritesScreenProps {
  catalog: Catalog;
  state: PersistedState;
  onSelect: (item: MediaItem) => void;
  onBack: () => void;
}

const SECTION_LABEL: Record<MediaItem['kind'], string> = {
  live: 'Direct',
  movie: 'Film',
  series: 'Série',
};

export const FavoritesScreen = ({
  catalog,
  state,
  onSelect,
  onBack,
}: FavoritesScreenProps) => {
  const metrics = useLayout();

  const items = useMemo(() => {
    const all: MediaItem[] = [
      ...catalog.live.items,
      ...catalog.movies.items,
      ...catalog.series.items,
    ];
    const favorites = new Set(state.favorites);
    return all.filter(item => favorites.has(mediaKey(item.kind, item.id)));
  }, [catalog, state.favorites]);

  const handleSelect = useCallback(
    (item: MediaItem) => onSelect(item),
    [onSelect],
  );

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      {/* Retour en haut : sous une liste longue, un pied de page n'est jamais
          atteignable au D-PAD. */}
      <TVFocusGuideView style={styles.header}>
        <View>
          <Text style={styles.title}>Favoris</Text>
          <Text style={styles.summary}>
            {items.length === 0
              ? 'Aucun favori pour cette source.'
              : `${items.length} élément${items.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <ActionButton
          testID="favorites-back"
          label="Retour"
          icon="back"
          iconOnly={true}
          hasTVPreferredFocus={items.length === 0}
          onPress={onBack}
        />
      </TVFocusGuideView>

      <TVFocusGuideView style={styles.list}>
        <FlatList
          data={items}
          keyExtractor={item => mediaKey(item.kind, item.id)}
          initialNumToRender={12}
          windowSize={5}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={({item, index}) => (
            <MediaCard
              testID={`favorite-${item.id}`}
              title={item.name}
              subtitle={SECTION_LABEL[item.kind]}
              image={imageOf(item)}
              layout="list"
              rowHeight={metrics.rowHeight}
              logoSlot={{width: metrics.logoWidth, height: metrics.logoHeight}}
              favorite={true}
              hasTVPreferredFocus={index === 0}
              onPress={() => handleSelect(item)}
              style={styles.row}
            />
          )}
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
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  list: {
    flex: 1,
  },
  row: {
    marginBottom: spacing.xxs,
    maxWidth: 700,
  },
});
