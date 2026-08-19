import {MediaItem} from '../iptv/types';

/**
 * Visuel associé à un élément, quel que soit son type.
 *
 * Le domaine nomme le champ selon la nature du média — `logo` pour une chaîne,
 * `poster` pour un film ou une série — et c'est bien ainsi. Les écrans qui
 * mélangent les trois (favoris, recherche, historique) ont en revanche besoin
 * d'un accès uniforme.
 */
export const imageOf = (item: MediaItem): string | undefined =>
  item.kind === 'live' ? item.logo : item.poster;
