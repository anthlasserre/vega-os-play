import {Catalog, Episode, EpgEntry, XtreamSource} from '../types';
import * as api from './api';
import {
  buildCategories,
  mapAccount,
  mapCategories,
  mapEpisodes,
  mapLiveChannels,
  mapMovies,
  mapSeries,
  mapShortEpg,
} from './mappers';

export {XtreamError} from './api';
export * from './urls';

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

export const loadShortEpg = async (
  source: XtreamSource,
  streamId: number,
): Promise<EpgEntry[]> => mapShortEpg(await api.fetchShortEpg(source, streamId));
