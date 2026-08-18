import {MediaKind, mediaKey} from '../iptv/types';
import {PersistedState, PlaybackProgress, Settings} from './schema';

/** Au-delà, la liste « Reprendre » devient un dépotoir illisible à la télécommande. */
export const MAX_PROGRESS_ENTRIES = 40;

/** En deçà, l'utilisateur n'a rien vraiment commencé : on ne pollue pas la reprise. */
export const MIN_RESUME_SECONDS = 30;

/** Au-delà, le contenu est considéré comme terminé et sort de la reprise. */
export const COMPLETION_RATIO = 0.95;

export const isFavorite = (
  state: PersistedState,
  kind: MediaKind,
  id: string,
): boolean => state.favorites.includes(mediaKey(kind, id));

export const toggleFavorite = (
  state: PersistedState,
  kind: MediaKind,
  id: string,
): PersistedState => {
  const key = mediaKey(kind, id);
  const favorites = state.favorites.includes(key)
    ? state.favorites.filter(entry => entry !== key)
    : [key, ...state.favorites];
  return {...state, favorites};
};

/**
 * Enregistre l'avancement d'une lecture.
 *
 * Trois cas sortent l'entrée de la liste : trop tôt (moins de 30 s), quasiment
 * terminé, ou durée inconnue — un direct n'a pas de position à reprendre.
 */
export const recordProgress = (
  state: PersistedState,
  entry: PlaybackProgress,
): PersistedState => {
  const others = state.progress.filter(item => item.key !== entry.key);

  const tooEarly = entry.positionSeconds < MIN_RESUME_SECONDS;
  const finished =
    entry.durationSeconds > 0 &&
    entry.positionSeconds / entry.durationSeconds >= COMPLETION_RATIO;

  if (entry.durationSeconds <= 0 || tooEarly || finished) {
    return {...state, progress: others};
  }

  return {
    ...state,
    progress: [entry, ...others]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_PROGRESS_ENTRIES),
  };
};

export const progressFor = (
  state: PersistedState,
  kind: MediaKind,
  id: string,
): PlaybackProgress | undefined =>
  state.progress.find(entry => entry.key === mediaKey(kind, id));

export const clearProgress = (state: PersistedState): PersistedState => ({
  ...state,
  progress: [],
});

export const addSource = (
  state: PersistedState,
  source: PersistedState['sources'][number],
): PersistedState => ({
  ...state,
  sources: [...state.sources.filter(entry => entry.id !== source.id), source],
  activeSourceId: source.id,
});

/**
 * Retire une source, ses favoris et son historique.
 *
 * La source de démo n'est pas supprimable : c'est le filet de sécurité qui évite
 * de se retrouver sans aucune source utilisable.
 */
export const removeSource = (
  state: PersistedState,
  sourceId: string,
): PersistedState => {
  const target = state.sources.find(source => source.id === sourceId);
  if (target === undefined || target.kind === 'demo') {
    return state;
  }

  const sources = state.sources.filter(source => source.id !== sourceId);
  const prefix = `${sourceId}:`;

  return {
    ...state,
    sources,
    activeSourceId:
      state.activeSourceId === sourceId ? sources[0]?.id ?? null : state.activeSourceId,
    favorites: state.favorites.filter(key => !key.includes(prefix)),
    progress: state.progress.filter(entry => entry.sourceId !== sourceId),
  };
};

export const selectSource = (
  state: PersistedState,
  sourceId: string,
): PersistedState =>
  state.sources.some(source => source.id === sourceId)
    ? {...state, activeSourceId: sourceId}
    : state;

export const updateSettings = (
  state: PersistedState,
  patch: Partial<Settings>,
): PersistedState => ({...state, settings: {...state.settings, ...patch}});
