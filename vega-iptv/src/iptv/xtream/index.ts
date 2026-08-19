import {Catalog, Episode, EpgEntry, MovieDetails, XtreamSource} from '../types';
import {containerOf} from '../../player/streamKind';
import * as api from './api';
import {
  buildCategories,
  mapAccount,
  mapCategories,
  mapEpisodes,
  mapLiveChannels,
  mapMovieDetails,
  mapMovies,
  mapSeries,
  mapShortEpg,
} from './mappers';

export {XtreamError} from './api';
export * from './urls';

/**
 * Journalise la répartition des conteneurs VOD du portail.
 *
 * Le lecteur Vega refuse certains conteneurs — le Matroska notamment — et cette
 * ligne répond d'un coup d'œil à « pourquoi aucun de mes films ne démarre ? » :
 * un catalogue à 100 % en MKV n'a jamais pu être lu, indépendamment de l'app.
 */
const logContainerMix = (movies: {url: string}[]): void => {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    const container = containerOf(movie.url) || '(sans extension)';
    counts.set(container, (counts.get(container) ?? 0) + 1);
  }
  const summary = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([container, count]) => `${container}=${count}`)
    .join(' ');
  console.log(`vega-iptv: conteneurs VOD ${summary}`);
};

/**
 * Charge le catalogue complet d'un portail Xtream.
 *
 * Les six appels partent en parallèle : sur un panel lent c'est la différence
 * entre 3 s et 15 s avant le premier écran. `Promise.all` volontairement, pas
 * `allSettled` — un catalogue à moitié chargé donnerait une UI qui ment.
 */
export const loadXtreamCatalog = async (
  source: XtreamSource,
): Promise<Catalog> => {
  const [
    account,
    liveCategories,
    liveStreams,
    vodCategories,
    vodStreams,
    seriesCategories,
    seriesList,
  ] = await Promise.all([
    api.fetchAccount(source),
    api.fetchLiveCategories(source),
    api.fetchLiveStreams(source),
    api.fetchVodCategories(source),
    api.fetchVodStreams(source),
    api.fetchSeriesCategories(source),
    api.fetchSeriesList(source),
  ]);

  const live = mapLiveChannels(source, liveStreams);
  const movies = mapMovies(source, vodStreams);
  const series = mapSeries(source, seriesList);

  logContainerMix(movies);

  return {
    live: {items: live, categories: buildCategories(live, mapCategories(liveCategories))},
    movies: {
      items: movies,
      categories: buildCategories(movies, mapCategories(vodCategories)),
    },
    series: {
      items: series,
      categories: buildCategories(series, mapCategories(seriesCategories)),
    },
    account: mapAccount(account),
  };
};

export const loadEpisodes = async (
  source: XtreamSource,
  seriesId: number,
): Promise<Episode[]> =>
  mapEpisodes(source, await api.fetchSeriesInfo(source, seriesId));

export const loadMovieDetails = async (
  source: XtreamSource,
  streamId: number,
): Promise<MovieDetails> =>
  mapMovieDetails(await api.fetchVodInfo(source, streamId));

export const loadShortEpg = async (
  source: XtreamSource,
  streamId: number,
): Promise<EpgEntry[]> => mapShortEpg(await api.fetchShortEpg(source, streamId));
