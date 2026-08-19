import {
  RawCategory,
  RawLiveStream,
  RawSeries,
  RawSeriesInfo,
  RawShortEpg,
  RawUserInfo,
  RawVodInfo,
  RawVodStream,
} from './raw';
import {XtreamSource} from '../types';
import {authUrl, playerApiUrl} from './urls';

const TIMEOUT_MS = 25000;

export class XtreamError extends Error {}

const request = async <T>(url: string, label: string): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {signal: controller.signal});
    if (!response.ok) {
      throw new XtreamError(`${label} : le serveur a répondu ${response.status}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new XtreamError(`${label} : réponse illisible (JSON attendu)`);
    }
  } catch (cause) {
    if (cause instanceof XtreamError) {
      throw cause;
    }
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new XtreamError(`${label} : délai dépassé (${TIMEOUT_MS / 1000} s)`);
    }
    throw new XtreamError(`${label} : ${String(cause)}`);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Certains panels répondent `[]` au lieu d'un objet, ou `{}` au lieu d'un
 * tableau. On normalise ici pour que les mappers restent purs et naïfs.
 */
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const fetchAccount = (source: XtreamSource): Promise<RawUserInfo> =>
  request<RawUserInfo>(authUrl(source), 'Authentification');

export const fetchLiveCategories = async (source: XtreamSource) =>
  asArray<RawCategory>(
    await request(playerApiUrl(source, 'get_live_categories'), 'Catégories live'),
  );

export const fetchLiveStreams = async (source: XtreamSource) =>
  asArray<RawLiveStream>(
    await request(playerApiUrl(source, 'get_live_streams'), 'Chaînes live'),
  );

export const fetchVodCategories = async (source: XtreamSource) =>
  asArray<RawCategory>(
    await request(playerApiUrl(source, 'get_vod_categories'), 'Catégories films'),
  );

export const fetchVodStreams = async (source: XtreamSource) =>
  asArray<RawVodStream>(
    await request(playerApiUrl(source, 'get_vod_streams'), 'Films'),
  );

export const fetchVodInfo = (
  source: XtreamSource,
  vodId: number,
): Promise<RawVodInfo> =>
  request<RawVodInfo>(
    playerApiUrl(source, 'get_vod_info', {vod_id: vodId}),
    'Fiche du film',
  );

export const fetchSeriesCategories = async (source: XtreamSource) =>
  asArray<RawCategory>(
    await request(playerApiUrl(source, 'get_series_categories'), 'Catégories séries'),
  );

export const fetchSeriesList = async (source: XtreamSource) =>
  asArray<RawSeries>(
    await request(playerApiUrl(source, 'get_series'), 'Séries'),
  );

export const fetchSeriesInfo = (
  source: XtreamSource,
  seriesId: number,
): Promise<RawSeriesInfo> =>
  request<RawSeriesInfo>(
    playerApiUrl(source, 'get_series_info', {series_id: seriesId}),
    'Épisodes',
  );

export const fetchShortEpg = (
  source: XtreamSource,
  streamId: number,
  limit = 8,
): Promise<RawShortEpg> =>
  request<RawShortEpg>(
    playerApiUrl(source, 'get_short_epg', {stream_id: streamId, limit}),
    'Guide des programmes',
  );
