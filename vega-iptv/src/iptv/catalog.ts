import {DEMO_M3U, DEMO_MOVIES} from './demoPlaylist';
import {buildM3uCategories, fetchM3U, parseM3U} from './m3u';
import {
  Catalog,
  Category,
  Episode,
  EpgEntry,
  Movie,
  MovieDetails,
  Source,
} from './types';
import {
  loadEpisodes,
  loadMovieDetails as loadXtreamMovieDetails,
  loadShortEpg,
  loadXtreamCatalog,
} from './xtream';

const emptySection = <T>() => ({categories: [] as Category[], items: [] as T[]});

const demoMovies = (sourceId: string): Movie[] =>
  DEMO_MOVIES.map(movie => ({
    ...movie,
    kind: 'movie' as const,
    id: `${sourceId}:${movie.id}`,
  }));

const categoriesOf = (items: {categoryId: string}[]): Category[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([id, count]) => ({id, name: id, count}))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
};

/**
 * Charge le catalogue d'une source, quel que soit son type.
 *
 * M3U et démo n'ont ni VOD ni séries côté protocole : leurs sections
 * correspondantes restent vides (la démo mise à part, qui embarque quelques
 * films pour que les écrans VOD soient exerçables sans portail).
 */
export const loadCatalog = async (source: Source): Promise<Catalog> => {
  if (source.kind === 'xtream') {
    return loadXtreamCatalog(source);
  }

  const raw = source.kind === 'demo' ? DEMO_M3U : await fetchM3U(source.url);
  const live = parseM3U(raw, source.id);
  const movies = source.kind === 'demo' ? demoMovies(source.id) : [];

  return {
    live: {items: live, categories: buildM3uCategories(live)},
    movies: {items: movies, categories: categoriesOf(movies)},
    series: emptySection(),
    account: null,
  };
};

export const emptyCatalog = (): Catalog => ({
  live: emptySection(),
  movies: emptySection(),
  series: emptySection(),
  account: null,
});

/** Les épisodes ne sont chargés qu'à l'ouverture d'une fiche série. */
export const loadSeriesEpisodes = async (
  source: Source,
  seriesId: number | undefined,
): Promise<Episode[]> => {
  if (source.kind !== 'xtream' || seriesId === undefined) {
    return [];
  }
  return loadEpisodes(source, seriesId);
};

/**
 * Détails d'un film, chargés à l'ouverture de sa fiche.
 *
 * Rend un objet vide hors Xtream : ni M3U ni la démo n'ont d'équivalent, et un
 * appelant n'a pas à connaître cette différence.
 */
export const loadMovieDetails = async (
  source: Source,
  streamId: number | undefined,
): Promise<MovieDetails> => {
  if (source.kind !== 'xtream' || streamId === undefined) {
    return {};
  }
  return loadXtreamMovieDetails(source, streamId);
};

export const loadChannelEpg = async (
  source: Source,
  streamId: number | undefined,
): Promise<EpgEntry[]> => {
  if (source.kind !== 'xtream' || streamId === undefined) {
    return [];
  }
  return loadShortEpg(source, streamId);
};
