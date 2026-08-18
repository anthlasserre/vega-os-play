import {Category, Channel, Playlist} from './types';
import {buildCategories} from './m3u';

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

interface XtreamCategory {
  category_id: string;
  category_name: string;
}

interface XtreamStream {
  stream_id: number;
  name: string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id?: string;
}

/** Strips a trailing slash so `${host}/player_api.php` never doubles up. */
export const normaliseHost = (host: string): string =>
  host.trim().replace(/\/+$/, '');

export const playerApiUrl = (
  credentials: XtreamCredentials,
  action: string,
): string => {
  const {username, password} = credentials;
  const query = new URLSearchParams({username, password, action});
  return `${normaliseHost(credentials.host)}/player_api.php?${query.toString()}`;
};

/**
 * Xtream serves live channels as HLS (`.m3u8`) or raw MPEG-TS (`.ts`).
 * HLS is the default because it is what the Vega MSE pipeline expects.
 */
export const liveStreamUrl = (
  credentials: XtreamCredentials,
  streamId: number,
  extension: 'm3u8' | 'ts' = 'm3u8',
): string =>
  `${normaliseHost(credentials.host)}/live/${credentials.username}/${
    credentials.password
  }/${streamId}.${extension}`;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Xtream a répondu ${response.status} sur ${url}`);
  }
  return (await response.json()) as T;
};

export const buildXtreamPlaylist = (
  credentials: XtreamCredentials,
  categories: XtreamCategory[],
  streams: XtreamStream[],
): Playlist => {
  const names = new Map(
    categories.map(category => [category.category_id, category.category_name]),
  );

  const channels: Channel[] = streams.map(stream => ({
    id: `xtream-${stream.stream_id}`,
    name: stream.name,
    url: liveStreamUrl(credentials, stream.stream_id),
    group: names.get(stream.category_id ?? '') ?? 'Non classé',
    logo: stream.stream_icon || undefined,
    tvgId: stream.epg_channel_id || undefined,
  }));

  return {channels, categories: buildCategories(channels)};
};

export const loadXtreamPlaylist = async (
  credentials: XtreamCredentials,
): Promise<Playlist> => {
  const [categories, streams] = await Promise.all([
    fetchJson<XtreamCategory[]>(playerApiUrl(credentials, 'get_live_categories')),
    fetchJson<XtreamStream[]>(playerApiUrl(credentials, 'get_live_streams')),
  ]);
  return buildXtreamPlaylist(credentials, categories, streams);
};

export type {XtreamCategory, XtreamStream, Category};
