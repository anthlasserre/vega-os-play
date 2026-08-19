/**
 * Échelle pensée pour un rendu « 10-foot UI » à 3 m.
 *
 * Attention à l'unité : le Fire TV Stick 4K Select rend en 1080p à une densité
 * de 2, donc la surface React Native ne fait pas 1920×1080 mais **960×540 points**.
 * Une valeur de 32 ici occupe 64 pixels à l'écran, soit 3,3 % de la largeur.
 * C'est le piège dans lequel la première version est tombée : des tailles
 * choisies comme si l'écran faisait 1920 points, d'où une interface deux fois
 * trop grosse et des grilles qui débordent.
 *
 * Ce qui dépend de la place disponible (colonnes, cartes, colonnes latérales)
 * n'a rien à faire ici : c'est `useLayout()` qui le dérive des dimensions
 * réelles, cf. `src/ui/layout.ts`.
 */

/** Surface de référence, en points, sur laquelle cette échelle est calibrée. */
export const BASE_WIDTH = 960;
export const BASE_HEIGHT = 540;

export const colors = {
  background: '#0A0E15',
  /** Fond des cartes au repos. */
  surface: '#141A24',
  surfaceAlt: '#1B2330',
  /** Teinte de sélection persistante (catégorie active, source active). */
  selected: '#1E3A5F',
  focus: '#FF6200',
  border: '#232E40',
  borderStrong: '#37455C',
  accent: '#38BDF8',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  overlay: 'rgba(10, 14, 21, 0.88)',
  scrim: 'rgba(10, 14, 21, 0.55)',
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
};

export const fontSize = {
  /** Plancher de lisibilité à 3 m : ne pas descendre en dessous. */
  micro: 13,
  caption: 15,
  body: 18,
  subtitle: 22,
  title: 28,
  hero: 38,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

/** Épaisseur de l'anneau de focus, réservée au repos pour éviter tout décalage. */
export const focusRing = 2;
