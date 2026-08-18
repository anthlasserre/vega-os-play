import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from './ActionButton';
import {MediaCard} from './MediaCard';
import {ALL_CATEGORY_ID, Category} from '../../iptv/types';
import {colors, fontSize, spacing} from '../../theme';

export interface BrowsableItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  favorite?: boolean;
  progress?: number;
  categoryId: string;
}

export interface CatalogBrowserProps {
  title: string;
  categories: Category[];
  items: BrowsableItem[];
  layout: 'grid' | 'list';
  onSelect: (id: string) => void;
  onBack: () => void;
  emptyLabel: string;
  /** Panneau latéral optionnel (EPG en direct, par exemple). */
  aside?: React.ReactNode;
  /** Remonte l'élément survolé, pour alimenter le panneau latéral. */
  onFocusItem?: (id: string) => void;
}

const GRID_COLUMNS = 4;

/**
 * Écran de parcours partagé par le direct, les films et les séries.
 *
 * Mutualisé volontairement : ces trois écrans ne diffèrent que par leurs données
 * et leur panneau latéral, les dupliquer aurait triplé la surface de bugs de
 * navigation D-PAD.
 */
export const CatalogBrowser = ({
  title,
  categories,
  items,
  layout,
  onSelect,
  onBack,
  emptyLabel,
  aside,
  onFocusItem,
}: CatalogBrowserProps) => {
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORY_ID);

  const allCategories = useMemo<Category[]>(
    () => [
      {id: ALL_CATEGORY_ID, name: 'Tout', count: items.length},
      ...categories,
    ],
    [categories, items.length],
  );

  const visible = useMemo(
    () =>
      categoryId === ALL_CATEGORY_ID
        ? items
        : items.filter(item => item.categoryId === categoryId),
    [items, categoryId],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.counter}>
          {visible.length} / {items.length}
        </Text>
      </View>

      <View style={styles.body}>
        <TVFocusGuideView style={styles.sidebar}>
          <FlatList
            data={allCategories}
            keyExtractor={category => category.id}
            initialNumToRender={12}
            windowSize={5}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item, index}) => (
              <MediaCard
                testID={`category-${item.id}`}
                title={item.name}
                subtitle={`${item.count}`}
                layout="list"
                hasTVPreferredFocus={index === 0}
                onPress={() => setCategoryId(item.id)}
                style={[
                  styles.categoryCard,
                  item.id === categoryId && styles.categorySelected,
                ]}
              />
            )}
          />
        </TVFocusGuideView>

        <TVFocusGuideView style={styles.main}>
          <FlatList
            key={`${layout}-${GRID_COLUMNS}`}
            data={visible}
            numColumns={layout === 'grid' ? GRID_COLUMNS : 1}
            keyExtractor={item => item.id}
            columnWrapperStyle={layout === 'grid' ? styles.gridRow : undefined}
            initialNumToRender={12}
            windowSize={5}
            maxToRenderPerBatch={12}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item}) => (
              <MediaCard
                testID={`item-${item.id}`}
                title={item.title}
                subtitle={item.subtitle}
                image={item.image}
                badge={item.badge}
                favorite={item.favorite}
                progress={item.progress}
                layout={layout}
                onPress={() => onSelect(item.id)}
                onFocus={() => onFocusItem?.(item.id)}
                style={layout === 'grid' ? styles.gridCard : styles.listCard}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>{emptyLabel}</Text>}
          />
        </TVFocusGuideView>

        {aside !== undefined && <View style={styles.aside}>{aside}</View>}
      </View>

      <ActionButton label="Retour" onPress={onBack} style={styles.back} testID="browser-back" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  counter: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    marginRight: spacing.sm,
  },
  categoryCard: {
    marginBottom: spacing.xs,
    minHeight: 68,
  },
  categorySelected: {
    borderColor: colors.accent,
  },
  main: {
    flex: 1,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  gridCard: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  listCard: {
    marginBottom: spacing.xs,
  },
  aside: {
    width: 340,
    marginLeft: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    padding: spacing.md,
  },
  back: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
});
