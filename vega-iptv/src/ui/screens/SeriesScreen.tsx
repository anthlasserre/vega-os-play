import React, {useCallback, useMemo} from 'react';
import {CatalogBrowser} from '../components/CatalogBrowser';
import {Catalog, Series, mediaKey} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';

export interface SeriesScreenProps {
  catalog: Catalog;
  state: PersistedState;
  onSelect: (series: Series) => void;
  onBack: () => void;
}

export const SeriesScreen = ({
  catalog,
  state,
  onSelect,
  onBack,
}: SeriesScreenProps) => {
  const byId = useMemo(
    () => new Map(catalog.series.items.map(series => [series.id, series])),
    [catalog.series.items],
  );

  const items = useMemo(
    () =>
      catalog.series.items.map(series => ({
        id: series.id,
        title: series.name,
        subtitle: [series.year, series.genre].filter(Boolean).join(' · ') || undefined,
        image: series.poster,
        badge: series.rating === undefined ? undefined : series.rating.toFixed(1),
        favorite: state.favorites.includes(mediaKey('series', series.id)),
        categoryId: series.categoryId,
      })),
    [catalog.series.items, state.favorites],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const series = byId.get(id);
      if (series !== undefined) {
        onSelect(series);
      }
    },
    [byId, onSelect],
  );

  return (
    <CatalogBrowser
      title="Séries"
      categories={catalog.series.categories}
      items={items}
      layout={state.settings.layout}
      emptyLabel="Aucune série. Les playlists M3U n'exposent pas de séries : il faut un portail Xtream."
      onSelect={handleSelect}
      onBack={onBack}
    />
  );
};
