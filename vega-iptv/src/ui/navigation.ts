import {MediaKind} from '../iptv/types';

/** Tout ce qu'il faut pour lire un contenu ET enregistrer sa progression. */
export interface PlaybackTarget {
  kind: MediaKind;
  itemId: string;
  sourceId: string;
  title: string;
  subtitle?: string;
  poster?: string;
  url: string;
  /** Un direct n'est ni reprenable ni seekable. */
  live: boolean;
  startAt?: number;
}

export type Route =
  | {name: 'home'}
  | {name: 'live'}
  | {name: 'movies'}
  | {name: 'series'}
  | {name: 'movie'; id: string}
  | {name: 'seriesDetail'; id: string}
  | {name: 'favorites'}
  | {name: 'history'}
  | {name: 'search'}
  | {name: 'settings'}
  | {name: 'sources'}
  | {name: 'categoryFilter'; kind: MediaKind}
  | {name: 'player'; target: PlaybackTarget};

/**
 * Profondeur maximale de la pile de navigation.
 *
 * Une pile est la seule façon correcte de gérer le Retour ici : le lecteur peut
 * être atteint depuis le direct, une fiche film, une fiche série, la recherche
 * ou la reprise, et un parent statique renverrait au mauvais écran. On borne
 * quand même la pile — un aller-retour répété entre deux écrans ne doit pas
 * faire enfler la mémoire indéfiniment.
 */
export const MAX_STACK_DEPTH = 12;

export const pushRoute = (stack: Route[], route: Route): Route[] => {
  const next = [...stack, route];
  return next.length > MAX_STACK_DEPTH ? next.slice(next.length - MAX_STACK_DEPTH) : next;
};

/** Rend la pile inchangée sur l'écran racine : c'est au système de quitter l'app. */
export const popRoute = (stack: Route[]): Route[] =>
  stack.length <= 1 ? stack : stack.slice(0, -1);

export const currentRoute = (stack: Route[]): Route => stack[stack.length - 1];
