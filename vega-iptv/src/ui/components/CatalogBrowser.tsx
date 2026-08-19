import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from './ActionButton';
import {MediaCard} from './MediaCard';
import {GRID_GAP_SIZE, gridMetrics, useLayout} from '../layout';
import {ALL_CATEGORY_ID, Category} from '../../iptv/types';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface BrowsableItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  favorite?: boolean;
  progress?: number;
  /** Pastille d'avertissement sur l'affiche (conteneur non lisible, par exemple). */
  warning?: string;
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
  /** Réserve la vignette de logo sur chaque ligne (grille de chaînes). */
  showLogos?: boolean;
  /** Ouvre l'écran de filtrage des catégories. Masqué si absent. */
  onOpenFilter?: () => void;
  /** Nombre de catégories masquées, affiché sur le bouton de filtrage. */
  hiddenCount?: number;
}

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
  showLogos,
  onOpenFilter,
  hiddenCount,
}: CatalogBrowserProps) => {
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORY_ID);
  const metrics = useLayout();

  // Une catégorie que le filtre vient de masquer ne doit pas laisser l'écran sur
  // une liste vide sans explication : on retombe sur « Tout ».
  useEffect(() => {
    if (
      categoryId !== ALL_CATEGORY_ID &&
      !categories.some(category => category.id === categoryId)
    ) {
      setCategoryId(ALL_CATEGORY_ID);
    }
  }, [categories, categoryId]);

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

  const hasAside = aside !== undefined && !metrics.compact;

  // La grille se recalcule sur la largeur réellement laissée par les colonnes
  // présentes : avec un panneau EPG, il y a une colonne d'affiches en moins.
  const grid = useMemo(() => {
    const mainWidth =
      metrics.width -
      2 * metrics.gutter -
      metrics.sidebarWidth -
      spacing.sm -
      (hasAside ? metrics.asideWidth + spacing.sm : 0);
    return gridMetrics(mainWidth);
  }, [metrics, hasAside]);

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      {/*
        Les actions vivent dans l'en-tête et non sous les listes : au D-PAD, un
        pied de page placé après une FlatList de 13 000 lignes n'est jamais
        atteignable. Depuis la première ligne d'une liste, « haut » y mène.
      */}
      <TVFocusGuideView style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.counter}>
            {visible.length === items.length
              ? `${items.length}`
              : `${visible.length} / ${items.length}`}
          </Text>
          {onOpenFilter !== undefined && (
            <ActionButton
              label={
                hiddenCount !== undefined && hiddenCount > 0
                  ? `Catégories · ${hiddenCount} masquée${hiddenCount > 1 ? 's' : ''}`
                  : 'Catégories'
              }
              icon="filter"
              onPress={onOpenFilter}
              style={styles.headerAction}
              testID="browser-filter"
            />
          )}
          <ActionButton
            label="Retour"
            icon="back"
            iconOnly={true}
            onPress={onBack}
            style={styles.headerAction}
            testID="browser-back"
          />
        </View>
      </TVFocusGuideView>

      <View style={styles.body}>
        <TVFocusGuideView style={[styles.sidebar, {width: metrics.sidebarWidth}]}>
          <FlatList
            data={allCategories}
            keyExtractor={category => category.id}
            initialNumToRender={14}
            windowSize={5}
            maxToRenderPerBatch={14}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item, index}) => (
              <MediaCard
                testID={`category-${item.id}`}
                title={item.name}
                badge={`${item.count}`}
                layout="list"
                rowHeight={metrics.rowHeight}
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
            key={`${layout}-${grid.columns}`}
            data={visible}
            numColumns={layout === 'grid' ? grid.columns : 1}
            keyExtractor={item => item.id}
            columnWrapperStyle={layout === 'grid' ? styles.gridRow : undefined}
            initialNumToRender={layout === 'grid' ? grid.columns * 3 : 14}
            windowSize={5}
            maxToRenderPerBatch={layout === 'grid' ? grid.columns * 2 : 14}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            renderItem={({item}) => (
              <MediaCard
                testID={`item-${item.id}`}
                title={item.title}
                // Dans une catégorie donnée, répéter son nom sous chaque ligne
                // n'apporte rien : le sous-titre ne sert qu'en vue « Tout ».
                subtitle={
                  categoryId === ALL_CATEGORY_ID ? item.subtitle : undefined
                }
                image={item.image}
                badge={item.badge}
                favorite={item.favorite}
                progress={item.progress}
                warning={item.warning}
                layout={layout}
                posterWidth={grid.posterWidth}
                posterHeight={grid.posterHeight}
                rowHeight={metrics.rowHeight}
                logoSlot={
                  showLogos === true
                    ? {width: metrics.logoWidth, height: metrics.logoHeight}
                    : undefined
                }
                onPress={() => onSelect(item.id)}
                onFocus={() => onFocusItem?.(item.id)}
                style={layout === 'grid' ? styles.gridCard : styles.listCard}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>{emptyLabel}</Text>}
          />
        </TVFocusGuideView>

        {hasAside && (
          <View style={[styles.aside, {width: metrics.asideWidth}]}>{aside}</View>
        )}
      </View>
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
    marginBottom: spacing.xs,
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
  headerAction: {},
  counter: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    marginRight: spacing.sm,
  },
  categoryCard: {
    marginBottom: spacing.xxs,
  },
  categorySelected: {
    backgroundColor: colors.selected,
    borderColor: colors.accent,
  },
  main: {
    flex: 1,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: GRID_GAP_SIZE,
    marginBottom: GRID_GAP_SIZE,
  },
  gridCard: {},
  listCard: {
    marginBottom: spacing.xxs,
  },
  aside: {
    marginLeft: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
});
