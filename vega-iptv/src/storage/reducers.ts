import {Category, MediaKind, mediaKey} from '../iptv/types';
import {
  HistoryEntry,
  PersistedState,
  PlaybackProgress,
  Settings,
  filterKey,
} from './schema';

/** Au-delà, la liste « Reprendre » devient un dépotoir illisible à la télécommande. */
export const MAX_PROGRESS_ENTRIES = 40;

/** L'historique se parcourt à la télécommande : au-delà, plus personne ne descend. */
export const MAX_HISTORY_ENTRIES = 200;

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

/**
 * Journalise un lancement de lecture.
 *
 * Une seule ligne par contenu : relancer la même chaîne la remonte en tête et
 * incrémente son compteur, au lieu d'empiler dix fois TF1 après une soirée de
 * zapping.
 */
export const recordHistory = (
  state: PersistedState,
  entry: Omit<HistoryEntry, 'plays'>,
): PersistedState => {
  const previous = state.history.find(item => item.key === entry.key);
  const others = state.history.filter(item => item.key !== entry.key);

  return {
    ...state,
    history: [{...entry, plays: (previous?.plays ?? 0) + 1}, ...others].slice(
      0,
      MAX_HISTORY_ENTRIES,
    ),
  };
};

export const clearHistory = (state: PersistedState): PersistedState => ({
  ...state,
  history: [],
});

export const removeHistoryEntry = (
  state: PersistedState,
  key: string,
): PersistedState => ({
  ...state,
  history: state.history.filter(entry => entry.key !== key),
});

export const hiddenCategoriesFor = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
): string[] => state.hiddenCategories[filterKey(sourceId, kind)] ?? [];

export const isCategoryHidden = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
  categoryId: string,
): boolean => hiddenCategoriesFor(state, sourceId, kind).includes(categoryId);

const withHidden = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
  hidden: string[],
): PersistedState => {
  const key = filterKey(sourceId, kind);
  const next = {...state.hiddenCategories};
  if (hidden.length === 0) {
    delete next[key];
  } else {
    next[key] = hidden;
  }
  return {...state, hiddenCategories: next};
};

export const toggleCategoryHidden = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
  categoryId: string,
): PersistedState => {
  const current = hiddenCategoriesFor(state, sourceId, kind);
  return withHidden(
    state,
    sourceId,
    kind,
    current.includes(categoryId)
      ? current.filter(entry => entry !== categoryId)
      : [...current, categoryId],
  );
};

/** Tout masquer sauf rien : sert de base à une sélection « je ne garde que X ». */
export const hideAllCategories = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
  categories: Category[],
): PersistedState =>
  withHidden(state, sourceId, kind, categories.map(category => category.id));

export const showAllCategories = (
  state: PersistedState,
  sourceId: string,
  kind: MediaKind,
): PersistedState => withHidden(state, sourceId, kind, []);

/**
 * Applique le filtre à un couple catégories / éléments.
 *
 * Les deux doivent être filtrés ensemble : ne retirer que les catégories
 * laisserait leurs chaînes visibles dans « Tout », ce qui donne l'impression
 * que le réglage ne sert à rien.
 *
 * Prend la liste des catégories masquées et non l'état complet : sur un
 * catalogue de 36 000 films, l'appelant mémoïse sur `state.hiddenCategories`
 * seul, sans rejouer le filtre à chaque tick de progression de lecture.
 */
export const applyCategoryFilter = <T extends {categoryId: string}>(
  hidden: string[],
  categories: Category[],
  items: T[],
): {categories: Category[]; items: T[]} => {
  if (hidden.length === 0) {
    return {categories, items};
  }
  const hiddenSet = new Set(hidden);
  return {
    categories: categories.filter(category => !hiddenSet.has(category.id)),
    items: items.filter(item => !hiddenSet.has(item.categoryId)),
  };
};

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

  const hiddenCategories = Object.fromEntries(
    Object.entries(state.hiddenCategories).filter(
      ([key]) => !key.startsWith(`${sourceId}|`),
    ),
  );

  return {
    ...state,
    sources,
    activeSourceId:
      state.activeSourceId === sourceId ? sources[0]?.id ?? null : state.activeSourceId,
    favorites: state.favorites.filter(key => !key.includes(prefix)),
    progress: state.progress.filter(entry => entry.sourceId !== sourceId),
    history: state.history.filter(entry => entry.sourceId !== sourceId),
    hiddenCategories,
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
