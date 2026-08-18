import React, {useCallback, useMemo} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
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
    <View style={styles.container}>
      <Text style={styles.title}>Favoris</Text>
      <Text style={styles.summary}>
        {items.length === 0
          ? 'Aucun favori pour cette source.'
          : `${items.length} élément${items.length > 1 ? 's' : ''}`}
      </Text>

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
              layout="list"
              favorite={true}
              hasTVPreferredFocus={index === 0}
              onPress={() => handleSelect(item)}
              style={styles.row}
            />
          )}
        />
      </TVFocusGuideView>

      <ActionButton
        testID="favorites-back"
        label="Retour"
        hasTVPreferredFocus={items.length === 0}
        onPress={onBack}
        style={styles.back}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  row: {
    marginBottom: spacing.xs,
    maxWidth: 1200,
  },
  back: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
});
