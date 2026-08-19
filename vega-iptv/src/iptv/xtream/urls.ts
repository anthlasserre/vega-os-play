import { XtreamSource } from '../types';

export type StreamExtension = 'm3u8' | 'ts';

/** Retire les slashs de fin pour que `${host}/player_api.php` ne double jamais. */
export const normaliseHost = (host: string): string =>
  host.trim().replace(/\/+$/, '');

/**
 * Encodage manuel plutôt que `URLSearchParams` : le polyfill React Native n'en
 * implémente qu'une partie (pas de `set`), et les identifiants Xtream
 * contiennent régulièrement des caractères à échapper.
 */
const buildQuery = (params: Record<string, string | number>): string =>
  Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

export const playerApiUrl = (
  source: XtreamSource,
  action: string,
  params: Record<string, string | number> = {},
): string =>
  `${normaliseHost(source.host)}/player_api.php?${buildQuery({
    username: source.username,
    password: source.password,
    action,
    ...params,
  })}`;

/** L'authentification Xtream est le `player_api.php` sans action. */
export const authUrl = (source: XtreamSource): string =>
  `${normaliseHost(source.host)}/player_api.php?${buildQuery({
    username: source.username,
    password: source.password,
  })}`;

export const liveStreamUrl = (
  source: XtreamSource,
  streamId: number,
  extension: StreamExtension = 'm3u8',
): string =>
  `${normaliseHost(source.host)}/live/${source.username}/${source.password}/${streamId}.${extension}`;

export const movieStreamUrl = (
  source: XtreamSource,
  streamId: number,
  containerExtension = 'mp4',
): string =>
  `${normaliseHost(source.host)}/movie/${source.username}/${source.password}/${streamId}.${containerExtension}`;

export const episodeStreamUrl = (
  source: XtreamSource,
  episodeId: string | number,
  containerExtension = 'mp4',
): string =>
  `${normaliseHost(source.host)}/series/${source.username}/${source.password}/${episodeId}.${containerExtension}`;

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Le catch-up Xtream attend `YYYY-MM-DD:HH-MM` en heure locale du serveur.
 * On formate depuis l'heure locale de l'appareil, comme le font les clients IPTV
 * courants — un serveur sur un autre fuseau décalera le replay d'autant.
 */
export const formatTimeshiftStart = (start: Date): string =>
  `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}:${pad(
    start.getHours(),
  )}-${pad(start.getMinutes())}`;

export const timeshiftUrl = (
  source: XtreamSource,
  streamId: number,
  start: Date,
  durationMinutes: number,
): string =>
  `${normaliseHost(source.host)}/streaming/timeshift.php?${buildQuery({
    username: source.username,
    password: source.password,
    stream: streamId,
    start: formatTimeshiftStart(start),
    duration: Math.max(1, Math.round(durationMinutes)),
  })}`;
