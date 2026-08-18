import React, {useCallback, useMemo} from 'react';
import {CatalogBrowser} from '../components/CatalogBrowser';
import {Catalog, Movie, mediaKey} from '../../iptv/types';
import {PersistedState} from '../../storage/schema';
import {progressFor} from '../../storage/reducers';

export interface MoviesScreenProps {
  catalog: Catalog;
  state: PersistedState;
  onSelect: (movie: Movie) => void;
  onBack: () => void;
}

export const MoviesScreen = ({
  catalog,
  state,
  onSelect,
  onBack,
}: MoviesScreenProps) => {
  const byId = useMemo(
    () => new Map(catalog.movies.items.map(movie => [movie.id, movie])),
    [catalog.movies.items],
  );

  const items = useMemo(
    () =>
      catalog.movies.items.map(movie => {
        const resume = progressFor(state, 'movie', movie.id);
        return {
          id: movie.id,
          title: movie.name,
          subtitle: [movie.year, movie.genre].filter(Boolean).join(' · ') || undefined,
          image: movie.poster,
          badge: movie.rating === undefined ? undefined : movie.rating.toFixed(1),
          favorite: state.favorites.includes(mediaKey('movie', movie.id)),
          progress:
            resume !== undefined && resume.durationSeconds > 0
              ? resume.positionSeconds / resume.durationSeconds
              : undefined,
          categoryId: movie.categoryId,
        };
      }),
    [catalog.movies.items, state],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const movie = byId.get(id);
      if (movie !== undefined) {
        onSelect(movie);
      }
    },
    [byId, onSelect],
  );

  return (
    <CatalogBrowser
      title="Films"
      categories={catalog.movies.categories}
      items={items}
      layout={state.settings.layout}
      emptyLabel="Aucun film. Les playlists M3U n'exposent pas de VOD : il faut un portail Xtream."
      onSelect={handleSelect}
      onBack={onBack}
    />
  );
};
