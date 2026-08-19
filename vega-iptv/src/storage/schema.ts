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

/**
 * Une ligne du journal de visionnage.
 *
 * Distinct de `PlaybackProgress`, qui ne retient que ce qui est *reprenable* :
 * l'historique garde aussi les directs et les contenus terminés, et ne sert
 * qu'à retrouver « c'était quoi, cette chaîne, hier soir ? ».
 */
export interface HistoryEntry {
  /** `kind:itemId` — une seule ligne par contenu, remontée à chaque relecture. */
  key: string;
  kind: MediaKind;
  itemId: string;
  sourceId: string;
  title: string;
  subtitle?: string;
  poster?: string;
  url: string;
  live: boolean;
  /** Dernier visionnage, en millisecondes epoch. */
  watchedAt: number;
  /** Nombre de lancements, tous visionnages confondus. */
  plays: number;
}

/** Paliers proposés pour le tampon du direct, en secondes. */
export const LIVE_BUFFER_CHOICES = [2, 5, 10, 20, 30] as const;

export const DEFAULT_LIVE_BUFFER_SECONDS = 10;

/**
 * Palier suivant, en boucle.
 *
 * Un bouton qui fait défiler cinq valeurs demande deux appuis en moyenne, là où
 * un sous-écran dédié en demanderait quatre — c'est le bon compromis à la
 * télécommande pour un réglage qu'on ajuste par tâtonnement.
 */
export const nextLiveBuffer = (current: number): number => {
  const index = LIVE_BUFFER_CHOICES.indexOf(current as (typeof LIVE_BUFFER_CHOICES)[number]);
  return LIVE_BUFFER_CHOICES[(index + 1) % LIVE_BUFFER_CHOICES.length];
};

export interface Settings {
  /** Disposition des catalogues : grille d'affiches ou liste dense. */
  layout: 'grid' | 'list';
  /** Reprendre automatiquement là où on s'est arrêté. */
  resumePlayback: boolean;
  /**
   * Tampon visé par le lecteur sur un direct, en secondes.
   *
   * Compromis franc : plus il est haut, moins le flux coupe sur un réseau
   * irrégulier, mais plus le zapping est lent et plus on s'éloigne du direct.
   */
  liveBufferSeconds: number;
}

/**
 * Catégories masquées, par source et par type.
 *
 * Clé `sourceId|kind`, valeur = identifiants de catégories à cacher. On stocke
 * ce qui est *masqué* et non ce qui est visible : un portail qui ajoute une
 * catégorie la rend ainsi visible par défaut, au lieu de la faire disparaître
 * silencieusement d'une liste blanche figée.
 */
export type CategoryFilters = Record<string, string[]>;

export const filterKey = (sourceId: string, kind: MediaKind): string =>
  `${sourceId}|${kind}`;

export interface PersistedState {
  version: number;
  sources: Source[];
  activeSourceId: string | null;
  /** Clés `kind:id`, cf. `mediaKey`. */
  favorites: string[];
  progress: PlaybackProgress[];
  history: HistoryEntry[];
  hiddenCategories: CategoryFilters;
  settings: Settings;
}

export const STATE_VERSION = 2;

export const DEMO_SOURCE: Source = {
  id: 'demo',
  kind: 'demo',
  label: 'Playlist de démo',
};

export const defaultSettings = (): Settings => ({
  layout: 'grid',
  resumePlayback: true,
  liveBufferSeconds: DEFAULT_LIVE_BUFFER_SECONDS,
});

export const defaultState = (): PersistedState => ({
  version: STATE_VERSION,
  sources: [DEMO_SOURCE],
  activeSourceId: DEMO_SOURCE.id,
  favorites: [],
  progress: [],
  history: [],
  hiddenCategories: {},
  settings: defaultSettings(),
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

const isKind = (value: unknown): value is MediaKind =>
  value === 'live' || value === 'movie' || value === 'series';

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Partial<HistoryEntry>;
  return (
    typeof entry.key === 'string' &&
    typeof entry.itemId === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.url === 'string' &&
    typeof entry.watchedAt === 'number' &&
    isKind(entry.kind)
  );
};

const parseStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string')))
    : [];

const parseFilters = (value: unknown): CategoryFilters => {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const out: CategoryFilters = {};
  for (const [key, hidden] of Object.entries(value as Record<string, unknown>)) {
    const list = parseStringArray(hidden);
    if (list.length > 0) {
      out[key] = list;
    }
  }
  return out;
};

const parseLiveBuffer = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_LIVE_BUFFER_SECONDS;
  }
  // On retombe sur le palier proposé le plus proche : une valeur libre venue
  // d'un fichier bricolé n'a pas à se propager jusqu'à la configuration Shaka.
  return LIVE_BUFFER_CHOICES.reduce((best, choice) =>
    Math.abs(choice - value) < Math.abs(best - value) ? choice : best,
  );
};

/**
 * Relit un état persisté sans jamais faire confiance au fichier.
 *
 * Le disque peut contenir une version antérieure, un JSON tronqué par une
 * coupure, ou n'importe quoi : on retombe champ par champ sur les valeurs par
 * défaut plutôt que de laisser une donnée douteuse remonter dans l'UI. Une
 * montée de version se traduit donc par des champs simplement absents, sans
 * migration à écrire.
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

  const progress = Array.isArray(candidate.progress)
    ? candidate.progress.filter(
        (entry): entry is PlaybackProgress =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as PlaybackProgress).key === 'string' &&
          typeof (entry as PlaybackProgress).positionSeconds === 'number',
      )
    : [];

  const history = Array.isArray(candidate.history)
    ? candidate.history.filter(isHistoryEntry)
    : [];

  const layout = candidate.settings?.layout;
  const resumePlayback = candidate.settings?.resumePlayback;

  return {
    version: STATE_VERSION,
    sources: withDemo,
    activeSourceId,
    favorites: parseStringArray(candidate.favorites),
    progress,
    history: history.sort((a, b) => b.watchedAt - a.watchedAt),
    hiddenCategories: parseFilters(candidate.hiddenCategories),
    settings: {
      layout: layout === 'grid' || layout === 'list' ? layout : fallback.settings.layout,
      resumePlayback:
        typeof resumePlayback === 'boolean'
          ? resumePlayback
          : fallback.settings.resumePlayback,
      liveBufferSeconds: parseLiveBuffer(candidate.settings?.liveBufferSeconds),
    },
  };
};
