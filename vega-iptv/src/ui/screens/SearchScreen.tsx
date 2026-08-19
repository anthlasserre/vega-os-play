import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
import {TextField} from '../components/TextField';
import {useLayout} from '../layout';
import {imageOf} from '../mediaItem';
import {searchCatalog} from '../../iptv/search';
import {Catalog, MediaItem} from '../../iptv/types';
import {colors, fontSize, spacing} from '../../theme';

export interface SearchScreenProps {
  catalog: Catalog;
  onSelect: (item: MediaItem) => void;
  onBack: () => void;
}

const MIN_QUERY_LENGTH = 2;

interface Row {
  section: string;
  item: MediaItem;
}

export const SearchScreen = ({
  catalog,
  onSelect,
  onBack,
}: SearchScreenProps) => {
  const [query, setQuery] = useState('');
  const metrics = useLayout();

  const results = useMemo(
    () =>
      query.trim().length < MIN_QUERY_LENGTH
        ? {live: [], movies: [], series: [], total: 0}
        : searchCatalog(catalog, query),
    [catalog, query],
  );

  const rows = useMemo<Row[]>(
    () => [
      ...results.live.map((item) => ({section: 'Direct', item})),
      ...results.movies.map((item) => ({section: 'Film', item})),
      ...results.series.map((item) => ({section: 'Série', item})),
    ],
    [results],
  );

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      <TVFocusGuideView style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <ActionButton
          testID="search-back"
          label="Retour"
          icon="back"
          iconOnly={true}
          onPress={onBack}
        />
      </TVFocusGuideView>

      <TextField
        testID="search-input"
        label="Chaîne, film ou série"
        value={query}
        onChangeText={setQuery}
        placeholder="ex. bein sport"
        icon="search"
        hasTVPreferredFocus={true}
        style={styles.field}
      />

      <Text style={styles.summary} testID="search-summary">
        {query.trim().length < MIN_QUERY_LENGTH
          ? `Saisis au moins ${MIN_QUERY_LENGTH} caractères.`
          : `${results.total} résultat${results.total > 1 ? 's' : ''}${
              results.total > rows.length ? ` · ${rows.length} affichés` : ''
            }`}
      </Text>

      <TVFocusGuideView style={styles.results}>
        <FlatList
          data={rows}
          keyExtractor={(row) => `${row.section}-${row.item.id}`}
          initialNumToRender={12}
          windowSize={5}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={({item: row}) => (
            <MediaCard
              testID={`result-${row.item.id}`}
              title={row.item.name}
              subtitle={row.section}
              image={imageOf(row.item)}
              layout="list"
              rowHeight={metrics.rowHeight}
              logoSlot={{width: metrics.logoWidth, height: metrics.logoHeight}}
              onPress={() => onSelect(row.item)}
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
  field: {
    maxWidth: 640,
  },
  summary: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginBottom: spacing.xs,
  },
  results: {
    flex: 1,
  },
  row: {
    marginBottom: spacing.xxs,
    maxWidth: 700,
  },
});
