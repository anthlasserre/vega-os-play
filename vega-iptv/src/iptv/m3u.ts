import {Category, LiveChannel, Source} from './types';

const EXTINF = '#EXTINF:';
const ATTRIBUTE = /([a-zA-Z0-9-]+)="([^"]*)"/g;

const readAttributes = (header: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  ATTRIBUTE.lastIndex = 0;
  let match = ATTRIBUTE.exec(header);
  while (match !== null) {
    attributes[match[1].toLowerCase()] = match[2];
    match = ATTRIBUTE.exec(header);
  }
  return attributes;
};

export const UNCLASSIFIED = 'Non classé';

/**
 * Parse une playlist M3U étendue.
 *
 * Délibérément tolérant : les fournisseurs IPTV émettent des playlists
 * irrégulières, et une entrée sans URL ou une directive intercalée ne doit pas
 * faire échouer tout le fichier.
 */
export const parseM3U = (raw: string, sourceId: string): LiveChannel[] => {
  const lines = raw.split(/\r?\n/);
  const channels: LiveChannel[] = [];
  let pending: {name: string; group: string; logo?: string; epgId?: string} | null =
    null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.startsWith(EXTINF)) {
      const header = trimmed.slice(EXTINF.length);
      const separator = header.indexOf(',');
      const attributes = readAttributes(header);
      const name =
        (separator === -1 ? '' : header.slice(separator + 1).trim()) ||
        attributes['tvg-name'] ||
        'Sans titre';

      pending = {
        name,
        group: attributes['group-title'] || UNCLASSIFIED,
        logo: attributes['tvg-logo'] || undefined,
        epgId: attributes['tvg-id'] || undefined,
      };
      continue;
    }

    // Toute autre directive (#EXTGRP, #EXTVLCOPT, #EXTM3U...) n'est pas une URL.
    if (trimmed.startsWith('#')) {
      continue;
    }

    if (pending !== null) {
      channels.push({
        kind: 'live',
        id: `${sourceId}:live:${channels.length}`,
        name: pending.name,
        url: trimmed,
        categoryId: pending.group,
        logo: pending.logo,
        epgId: pending.epgId,
        archiveDays: 0,
      });
      pending = null;
    }
  }

  return channels;
};

export const buildM3uCategories = (channels: LiveChannel[]): Category[] => {
  const counts = new Map<string, number>();
  for (const channel of channels) {
    counts.set(channel.categoryId, (counts.get(channel.categoryId) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([id, count]) => ({id, name: id, count}))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
};

const TIMEOUT_MS = 25000;

export const fetchM3U = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {signal: controller.signal});
    if (!response.ok) {
      throw new Error(`La playlist a répondu ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
};

export const isM3uLike = (source: Source): source is Extract<Source, {kind: 'm3u'}> =>
  source.kind === 'm3u';
