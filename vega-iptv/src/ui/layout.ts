import {useWindowDimensions} from 'react-native';
import {spacing} from '../theme';

/**
 * Dimensions dérivées de la surface réelle.
 *
 * Rien de ce qui dépend de la place disponible n'est écrit en dur : la première
 * version fixait une grille à 4 colonnes de 240 points de large, soit 1008
 * points pour une zone qui n'en fait que 624 sur le Fire TV Stick — la
 * quatrième colonne sortait de l'écran. On calcule donc les colonnes à partir
 * d'une largeur d'affiche *souhaitée*, et on répartit l'espace restant.
 */
export interface Layout {
  width: number;
  height: number;
  /** Marge horizontale de l'écran. */
  gutter: number;
  /** Marge verticale de l'écran. */
  vGutter: number;
  /** Colonne des catégories. */
  sidebarWidth: number;
  /** Colonne d'appoint (panneau EPG). */
  asideWidth: number;
  /** Nombre de colonnes d'affiches, et taille exacte d'une carte. */
  posterColumns: number;
  posterWidth: number;
  posterHeight: number;
  /** Hauteur d'une ligne de liste dense. */
  rowHeight: number;
  /** Vignette de logo de chaîne, en mode liste. */
  logoWidth: number;
  logoHeight: number;
  /** Vrai sur une surface étroite : on sacrifie alors la colonne d'appoint. */
  compact: boolean;
}

/** Largeur d'affiche visée. Sous 110 points, un titre devient illisible à 3 m. */
const TARGET_POSTER_WIDTH = 132;

/** Les affiches TMDB que servent les panels Xtream sont en 2:3. */
const POSTER_RATIO = 3 / 2;

/** Hauteur de la zone de texte sous une affiche : titre + sous-titre. */
export const POSTER_TEXT_HEIGHT = 42;

const GRID_GAP = spacing.sm;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Calcule les colonnes d'une grille d'affiches pour une largeur donnée.
 *
 * Exporté séparément du hook pour être testable sans moteur de rendu, et
 * réutilisable par un écran qui connaît sa largeur utile mieux que le hook
 * (une fiche série, par exemple, n'a pas de colonne de catégories).
 */
export const gridMetrics = (
  availableWidth: number,
): {columns: number; posterWidth: number; posterHeight: number} => {
  const columns = Math.max(
    2,
    Math.floor((availableWidth + GRID_GAP) / (TARGET_POSTER_WIDTH + GRID_GAP)),
  );
  const posterWidth = Math.floor(
    (availableWidth - (columns - 1) * GRID_GAP) / columns,
  );
  return {
    columns,
    posterWidth,
    posterHeight: Math.round(posterWidth * POSTER_RATIO),
  };
};

export const GRID_GAP_SIZE = GRID_GAP;

export const useLayout = (): Layout => {
  const {width, height} = useWindowDimensions();

  const gutter = Math.round(clamp(width * 0.025, 12, 32));
  const vGutter = Math.round(clamp(height * 0.022, 8, 24));
  const compact = width < 800;

  const sidebarWidth = Math.round(clamp(width * 0.21, 140, 240));
  const asideWidth = compact ? 0 : Math.round(clamp(width * 0.26, 200, 320));

  // Largeur restante pour la grille, une fois retirées les deux colonnes.
  // Les écrans films et séries n'ont pas de colonne d'appoint : on dimensionne
  // sur ce cas, le plus fréquent pour une grille d'affiches.
  const mainWidth = width - 2 * gutter - sidebarWidth - spacing.sm;
  const grid = gridMetrics(mainWidth);

  return {
    width,
    height,
    gutter,
    vGutter,
    sidebarWidth,
    asideWidth,
    posterColumns: grid.columns,
    posterWidth: grid.posterWidth,
    posterHeight: grid.posterHeight,
    rowHeight: Math.round(clamp(height * 0.095, 44, 64)),
    logoWidth: 56,
    logoHeight: 38,
    compact,
  };
};
