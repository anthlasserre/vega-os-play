/** Domain model shared by every playlist provider (M3U, Xtream, demo). */

export interface Channel {
  /** Stable id, unique within a playlist. */
  id: string;
  name: string;
  /** Absolute stream URL, ready to hand to the media engine. */
  url: string;
  /** Category label as advertised by the provider ("group-title" in M3U). */
  group: string;
  logo?: string;
  /** EPG identifier ("tvg-id"), kept for a future EPG integration. */
  tvgId?: string;
}

export interface Category {
  id: string;
  name: string;
  channelCount: number;
}

export interface Playlist {
  channels: Channel[];
  categories: Category[];
}

export type Source =
  | {kind: 'demo'}
  | {kind: 'm3u'; url: string}
  | {kind: 'xtream'; host: string; username: string; password: string};

export const ALL_CATEGORY_ID = '__all__';
