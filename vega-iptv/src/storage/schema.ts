import {MediaKind, Source} from '../iptv/types';

export interface PlaybackProgress {
  key: string;
  /** Type et identifiant recopiés pour pouvoir reconstruire une tuile sans catalogue. */
  kind: MediaKind;
  itemId: string;
  sourceId: string;
  title: string;
  subtitle?: string;
  poster?: string;
  url: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: number;
}

export interface Settings {
  /** Disposition des catalogues : grille d'affiches ou liste dense. */
  layout: 'grid' | 'list';
  /** Reprendre automatiquement là où on s'est arrêté. */
  resumePlayback: boolean;
}

export interface PersistedState {
  version: number;
  sources: Source[];
  activeSourceId: string | null;
  /** Clés `kind:id`, cf. `mediaKey`. */
  favorites: string[];
  progress: PlaybackProgress[];
  settings: Settings;
}

export const STATE_VERSION = 1;

export const DEMO_SOURCE: Source = {
  id: 'demo',
  kind: 'demo',
  label: 'Playlist de démo',
};

export const defaultState = (): PersistedState => ({
  version: STATE_VERSION,
  sources: [DEMO_SOURCE],
  activeSourceId: DEMO_SOURCE.id,
  favorites: [],
  progress: [],
  settings: {layout: 'grid', resumePlayback: true},
});

const isSource = (value: unknown): value is Source => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Source>;
  if (typeof candidate.id !== 'string' || typeof candidate.label !== 'string') {
    return false;
  }
  switch (candidate.kind) {
    case 'demo':
      return true;
    case 'm3u':
      return typeof (candidate as {url?: unknown}).url === 'string';
    case 'xtream': {
      const x = candidate as {host?: unknown; username?: unknown; password?: unknown};
      return (
        typeof x.host === 'string' &&
        typeof x.username === 'string' &&
        typeof x.password === 'string'
      );
    }
    default:
      return false;
  }
};

/**
 * Relit un état persisté sans jamais faire confiance au fichier.
 *
 * Le disque peut contenir une version antérieure, un JSON tronqué par une
 * coupure, ou n'importe quoi : on retombe champ par champ sur les valeurs par
 * défaut plutôt que de laisser une donnée douteuse remonter dans l'UI.
 */
export const parseState = (raw: unknown): PersistedState => {
  const fallback = defaultState();
  if (typeof raw !== 'object' || raw === null) {
    return fallback;
  }

  const candidate = raw as Partial<PersistedState>;
  const sources = Array.isArray(candidate.sources)
    ? candidate.sources.filter(isSource)
    : [];

  // La source de démo est toujours disponible : elle sert de porte de sortie
  // quand un portail configuré ne répond plus.
  const withDemo = sources.some(source => source.kind === 'demo')
    ? sources
    : [DEMO_SOURCE, ...sources];

  const activeSourceId =
    typeof candidate.activeSourceId === 'string' &&
    withDemo.some(source => source.id === candidate.activeSourceId)
      ? candidate.activeSourceId
      : withDemo[0].id;

  const favorites = Array.isArray(candidate.favorites)
    ? Array.from(
        new Set(candidate.favorites.filter((key): key is string => typeof key === 'string')),
      )
    : [];

  const progress = Array.isArray(candidate.progress)
    ? candidate.progress.filter(
        (entry): entry is PlaybackProgress =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as PlaybackProgress).key === 'string' &&
          typeof (entry as PlaybackProgress).positionSeconds === 'number',
      )
    : [];

  const layout = candidate.settings?.layout;
  const resumePlayback = candidate.settings?.resumePlayback;

  return {
    version: STATE_VERSION,
    sources: withDemo,
    activeSourceId,
    favorites,
    progress,
    settings: {
      layout: layout === 'grid' || layout === 'list' ? layout : fallback.settings.layout,
      resumePlayback:
        typeof resumePlayback === 'boolean'
          ? resumePlayback
          : fallback.settings.resumePlayback,
    },
  };
};
