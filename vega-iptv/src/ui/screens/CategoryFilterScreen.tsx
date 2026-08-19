import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {Focusable} from '../components/Focusable';
import {TextField} from '../components/TextField';
import {useLayout} from '../layout';
import {normalise} from '../../iptv/search';
import {Category, MediaKind} from '../../iptv/types';
import {colors, fontSize, spacing} from '../../theme';

export interface CategoryFilterScreenProps {
  kind: MediaKind;
  categories: Category[];
  hidden: string[];
  onToggle: (categoryId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onBack: () => void;
}

const TITLES: Record<MediaKind, string> = {
  live: 'Catégories du direct',
  movie: 'Catégories de films',
  series: 'Catégories de séries',
};

/**
 * Choix des catégories visibles, pour un type de contenu.
 *
 * Un bouquet réel annonce ici plusieurs centaines de catégories, dont l'essentiel
 * ne concerne pas l'utilisateur — d'où le champ de recherche, et les deux
 * raccourcis « tout » : partir de zéro et cocher dix catégories est bien plus
 * rapide à la télécommande que d'en décocher trois cents.
 */
export const CategoryFilterScreen = ({
  kind,
  categories,
  hidden,
  onToggle,
  onShowAll,
  onHideAll,
  onBack,
}: CategoryFilterScreenProps) => {
  const [query, setQuery] = useState('');
  const metrics = useLayout();

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const visible = useMemo(() => {
    const needle = normalise(query);
    if (needle === '') {
      return categories;
    }
    return categories.filter(category =>
      normalise(category.name).includes(needle),
    );
  }, [categories, query]);

  const shownCount = categories.length - hiddenSet.size;

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>{TITLES[kind]}</Text>
        <Text style={styles.counter} testID="filter-counter">
          {shownCount} / {categories.length} affichées
        </Text>
      </View>

      <TextField
        label="Filtrer la liste"
        value={query}
        placeholder="Nom de catégorie"
        icon="search"
        onChangeText={setQuery}
        testID="filter-search"
      />

      <TVFocusGuideView style={styles.actions}>
        <ActionButton
          label="Tout afficher"
icon="eye"
          onPress={onShowAll}
          style={styles.action}
          testID="filter-show-all"
        />
        <ActionButton
          label="Tout masquer"
icon="eye-off"
          onPress={onHideAll}
          style={styles.action}
          testID="filter-hide-all"
        />
        <ActionButton
          label="Retour"
          onPress={onBack}
          icon="back"
          iconOnly={true}
          style={styles.action}
          testID="filter-back"
        />
      </TVFocusGuideView>

      <TVFocusGuideView style={styles.list}>
        <FlatList
          data={visible}
          keyExtractor={category => category.id}
          initialNumToRender={12}
          windowSize={5}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={({item, index}) => {
            const shown = !hiddenSet.has(item.id);
            return (
              <Focusable
                accessibilityLabel={`${item.name}, ${shown ? 'affichée' : 'masquée'}`}
                onPress={() => onToggle(item.id)}
                hasTVPreferredFocus={index === 0}
                testID={`filter-${item.id}`}
                style={[styles.row, {height: metrics.rowHeight}]}>
                {focused => (
                  <View style={styles.rowInner}>
                    <Text
                      style={[styles.check, shown ? styles.checkOn : styles.checkOff]}>
                      {shown ? '☑' : '☐'}
                    </Text>
                    <Text
                      style={[
                        styles.name,
                        !shown && styles.nameHidden,
                        focused && styles.nameFocused,
                      ]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.count}>{item.count}</Text>
                  </View>
                )}
              </Focusable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucune catégorie ne correspond.</Text>
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
    marginBottom: spacing.xs,
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
  actions: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  action: {
    marginRight: spacing.xs,
  },
  list: {
    flex: 1,
  },
  row: {
    marginBottom: spacing.xxs,
    justifyContent: 'center',
    maxWidth: 620,
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  check: {
    fontSize: fontSize.body,
    marginRight: spacing.sm,
  },
  checkOn: {
    color: colors.success,
  },
  checkOff: {
    color: colors.textDim,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  nameHidden: {
    color: colors.textDim,
  },
  nameFocused: {
    color: '#FFFFFF',
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginLeft: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    padding: spacing.md,
  },
});
