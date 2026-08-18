import {DEMO_M3U} from './demoPlaylist';
import {parseM3U, toPlaylist} from './m3u';
import {loadXtreamPlaylist} from './xtream';
import {Playlist, Source} from './types';

const M3U_TIMEOUT_MS = 20000;

const fetchM3U = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), M3U_TIMEOUT_MS);
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

export const loadPlaylist = async (source: Source): Promise<Playlist> => {
  switch (source.kind) {
    case 'demo':
      return toPlaylist(parseM3U(DEMO_M3U));
    case 'm3u':
      return toPlaylist(parseM3U(await fetchM3U(source.url)));
    case 'xtream':
      return loadXtreamPlaylist(source);
  }
};
