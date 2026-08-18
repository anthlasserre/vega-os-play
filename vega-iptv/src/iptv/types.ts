/** Modèle de domaine commun à toutes les sources (M3U, Xtream, démo). */

export type MediaKind = 'live' | 'movie' | 'series';

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface LiveChannel {
  kind: 'live';
  id: string;
  name: string;
  url: string;
  categoryId: string;
  logo?: string;
  /** Identifiant EPG côté fournisseur (`tvg-id` en M3U, `epg_channel_id` en Xtream). */
  epgId?: string;
  /** Identifiant natif Xtream, nécessaire pour l'EPG et le catch-up. */
  streamId?: number;
  /** Nombre de jours de replay disponibles (0 = pas de catch-up). */
  archiveDays: number;
}

export interface Movie {
  kind: 'movie';
  id: string;
  name: string;
  url: string;
  categoryId: string;
  poster?: string;
  rating?: number;
  year?: string;
  plot?: string;
  durationSeconds?: number;
  genre?: string;
}

export interface Episode {
  id: string;
  title: string;
  url: string;
  season: number;
  episode: number;
  plot?: string;
  durationSeconds?: number;
  still?: string;
}

export interface Series {
  kind: 'series';
  id: string;
  name: string;
  categoryId: string;
  poster?: string;
  rating?: number;
  year?: string;
  plot?: string;
  genre?: string;
  /** Identifiant natif Xtream, nécessaire pour charger les épisodes à la demande. */
  seriesId?: number;
}

export type MediaItem = LiveChannel | Movie | Series;

export interface Catalog {
  live: {categories: Category[]; items: LiveChannel[]};
  movies: {categories: Category[]; items: Movie[]};
  series: {categories: Category[]; items: Series[]};
  account: AccountInfo | null;
}

export interface AccountInfo {
  username: string;
  status?: string;
  expiresAt?: Date | null;
  activeConnections?: number;
  maxConnections?: number;
  trial?: boolean;
}

export interface EpgEntry {
  title: string;
  description?: string;
  start: Date;
  end: Date;
}

export type SourceKind = 'demo' | 'm3u' | 'xtream';

export interface DemoSource {
  id: string;
  kind: 'demo';
  label: string;
}

export interface M3uSource {
  id: string;
  kind: 'm3u';
  label: string;
  url: string;
}

export interface XtreamSource {
  id: string;
  kind: 'xtream';
  label: string;
  host: string;
  username: string;
  password: string;
}

export type Source = DemoSource | M3uSource | XtreamSource;

export const ALL_CATEGORY_ID = '__all__';

/** Clé stable d'un élément, tous types confondus — sert aux favoris et à l'historique. */
export const mediaKey = (kind: MediaKind, id: string): string => `${kind}:${id}`;
