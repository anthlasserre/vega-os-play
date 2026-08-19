import { decodeMaybeBase64 } from '../base64';
import {
  AccountInfo,
  Category,
  Episode,
  EpgEntry,
  LiveChannel,
  Movie,
  Series,
  XtreamSource,
} from '../types';
import {
  Numeric,
  RawCategory,
  RawEpgListing,
  RawLiveStream,
  RawSeries,
  RawSeriesInfo,
  RawShortEpg,
  RawUserInfo,
  RawVodStream,
} from './raw';
import { episodeStreamUrl, liveStreamUrl, movieStreamUrl } from './urls';

/** Les panels renvoient tantôt `12`, tantôt `"12"`, tantôt `""`. */
export const toNumber = (value: Numeric | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toText = (value: string | undefined): string | undefined =>
  value === undefined || value?.trim() === '' ? undefined : value?.trim();

const UNCATEGORISED = 'uncategorised';

export const mapCategories = (raw: RawCategory[]): Map<string, string> =>
  new Map(
    raw
      .filter(entry => entry.category_id !== undefined)
      .map(entry => [
        String(entry.category_id),
        toText(entry.category_name) ?? 'Sans nom',
      ]),
  );

/**
 * Construit la liste de catégories effectivement peuplée.
 *
 * On part des éléments et pas de `get_*_categories` : les panels annoncent
 * couramment des catégories vides, et une catégorie vide dans une UI TV est un
 * cul-de-sac pour l'utilisateur.
 */
export const buildCategories = (
  items: { categoryId: string }[],
  names: Map<string, string>,
): Category[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([id, count]) => ({
      id,
      name: names.get(id) ?? (id === UNCATEGORISED ? 'Non classé' : id),
      count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
};

export const mapLiveChannels = (
  source: XtreamSource,
  raw: RawLiveStream[],
): LiveChannel[] =>
  raw
    .filter(entry => toNumber(entry.stream_id) !== undefined)
    .map(entry => {
      const streamId = toNumber(entry.stream_id) as number;
      return {
        kind: 'live' as const,
        id: `${source.id}:live:${streamId}`,
        name: toText(entry.name) ?? `Chaîne ${streamId}`,
        url: liveStreamUrl(source, streamId),
        categoryId: entry.category_id === undefined
          ? UNCATEGORISED
          : String(entry.category_id),
        logo: toText(entry.stream_icon),
        epgId: toText(entry.epg_channel_id),
        streamId,
        archiveDays:
          toNumber(entry.tv_archive) === 1
            ? toNumber(entry.tv_archive_duration) ?? 0
            : 0,
      };
    });

export const mapMovies = (source: XtreamSource, raw: RawVodStream[]): Movie[] =>
  raw
    .filter(entry => toNumber(entry.stream_id) !== undefined)
    .map(entry => {
      const streamId = toNumber(entry.stream_id) as number;
      return {
        kind: 'movie' as const,
        id: `${source.id}:movie:${streamId}`,
        name: toText(entry.name) ?? `Film ${streamId}`,
        url: movieStreamUrl(
          source,
          streamId,
          toText(entry.container_extension) ?? 'mp4',
        ),
        categoryId: entry.category_id === undefined
          ? UNCATEGORISED
          : String(entry.category_id),
        poster: toText(entry.stream_icon),
        rating: toNumber(entry.rating),
      };
    });

export const mapSeries = (source: XtreamSource, raw: RawSeries[]): Series[] =>
  raw
    .filter(entry => toNumber(entry.series_id) !== undefined)
    .map(entry => {
      const seriesId = toNumber(entry.series_id) as number;
      return {
        kind: 'series' as const,
        id: `${source.id}:series:${seriesId}`,
        name: toText(entry.name) ?? `Série ${seriesId}`,
        categoryId: entry.category_id === undefined
          ? UNCATEGORISED
          : String(entry.category_id),
        poster: toText(entry.cover),
        rating: toNumber(entry.rating),
        year: toText(entry.releaseDate)?.slice(0, 4),
        plot: toText(entry.plot),
        genre: toText(entry.genre),
        seriesId,
      };
    });

/**
 * Aplatit `{"1": [...], "2": [...]}` en une liste triée saison puis épisode.
 * La clé de l'objet fait autorité sur `episode.season`, que certains panels
 * laissent vide.
 */
export const mapEpisodes = (
  source: XtreamSource,
  info: RawSeriesInfo,
): Episode[] => {
  const episodes: Episode[] = [];

  for (const [seasonKey, list] of Object.entries(info.episodes ?? {})) {
    const season = toNumber(seasonKey) ?? toNumber(list?.[0]?.season) ?? 0;
    for (const entry of list ?? []) {
      const id = entry.id;
      if (id === undefined || id === '') {
        continue;
      }
      const number = toNumber(entry.episode_num) ?? 0;
      episodes.push({
        id: String(id),
        title: toText(entry.title) ?? `Épisode ${number}`,
        url: episodeStreamUrl(
          source,
          id,
          toText(entry.container_extension) ?? 'mp4',
        ),
        season,
        episode: number,
        plot: toText(entry.info?.plot),
        durationSeconds: toNumber(entry.info?.duration_secs),
        still: toText(entry.info?.movie_image),
      });
    }
  }

  return episodes.sort((a, b) =>
    a.season === b.season ? a.episode - b.episode : a.season - b.season,
  );
};

export const mapAccount = (raw: RawUserInfo): AccountInfo | null => {
  const info = raw.user_info;
  if (info === undefined) {
    return null;
  }
  const expiry = toNumber(info.exp_date);
  return {
    username: toText(info.username) ?? '—',
    status: toText(info.status),
    // `exp_date` est un timestamp UNIX en secondes ; absent = compte illimité.
    expiresAt: expiry === undefined ? null : new Date(expiry * 1000),
    activeConnections: toNumber(info.active_cons),
    maxConnections: toNumber(info.max_connections),
    trial: toNumber(info.is_trial) === 1,
  };
};

export const mapShortEpg = (raw: RawShortEpg): EpgEntry[] =>
  (raw.epg_listings ?? [])
    .map((listing: RawEpgListing): EpgEntry | null => {
      const start = toNumber(listing.start_timestamp);
      const end = toNumber(listing.stop_timestamp);
      if (start === undefined || end === undefined) {
        return null;
      }
      return {
        title: decodeMaybeBase64(listing.title) || 'Programme',
        description: decodeMaybeBase64(listing.description) || undefined,
        start: new Date(start * 1000),
        end: new Date(end * 1000),
      };
    })
    .filter((entry): entry is EpgEntry => entry !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
