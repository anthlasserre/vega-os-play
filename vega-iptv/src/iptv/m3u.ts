import {ALL_CATEGORY_ID, Category, Channel, Playlist} from './types';

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

/**
 * Parses an extended M3U playlist.
 *
 * Deliberately tolerant: real IPTV providers emit inconsistent playlists, so an
 * entry missing a URL, or a stray line between the #EXTINF and its URL, must not
 * abort the whole parse.
 */
export const parseM3U = (raw: string, fallbackGroup = 'Non classé'): Channel[] => {
  const lines = raw.split(/\r?\n/);
  const channels: Channel[] = [];
  let pending: Omit<Channel, 'url' | 'id'> | null = null;

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
        group: attributes['group-title'] || fallbackGroup,
        logo: attributes['tvg-logo'] || undefined,
        tvgId: attributes['tvg-id'] || undefined,
      };
      continue;
    }

    // Any other directive (#EXTGRP, #EXTVLCOPT, #EXTM3U...) is not a stream URL.
    if (trimmed.startsWith('#')) {
      continue;
    }

    if (pending !== null) {
      channels.push({...pending, id: `m3u-${channels.length}`, url: trimmed});
      pending = null;
    }
  }

  return channels;
};

export const buildCategories = (channels: Channel[]): Category[] => {
  const counts = new Map<string, number>();
  for (const channel of channels) {
    counts.set(channel.group, (counts.get(channel.group) ?? 0) + 1);
  }

  const groups = Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
    .map(([name, channelCount]) => ({id: name, name, channelCount}));

  return [
    {id: ALL_CATEGORY_ID, name: 'Toutes', channelCount: channels.length},
    ...groups,
  ];
};

export const toPlaylist = (channels: Channel[]): Playlist => ({
  channels,
  categories: buildCategories(channels),
});
