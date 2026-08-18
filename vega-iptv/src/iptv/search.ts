import {Catalog, MediaItem} from './types';

/**
 * Retire les marques diacritiques produites par la normalisation NFD.
 *
 * Écrit en boucle sur les points de code plutôt qu'en classe de caractères :
 * le bloc U+0300–U+036F est illisible en littéral et facile à corrompre.
 */
const stripDiacritics = (value: string): string => {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x300 || code > 0x36f) {
      out += char;
    }
  }
  return out;
};

/** Normalise pour une recherche insensible à la casse ET aux accents. */
export const normalise = (value: string): string =>
  stripDiacritics(value.toLowerCase().normalize('NFD')).trim();

export interface SearchResults {
  live: MediaItem[];
  movies: MediaItem[];
  series: MediaItem[];
  total: number;
}

const matches = (name: string, needles: string[]): boolean => {
  const haystack = normalise(name);
  return needles.every(needle => haystack.includes(needle));
};

/**
 * Recherche globale sur les trois sections.
 *
 * Tous les mots doivent matcher, dans n'importe quel ordre : « bein sport » et
 * « sport bein » trouvent la même chose, ce qu'un utilisateur à la télécommande
 * attend. Chaque section est plafonnée pour que le rendu reste borné même sur un
 * catalogue de plusieurs dizaines de milliers d'entrées.
 */
export const searchCatalog = (
  catalog: Catalog,
  query: string,
  limitPerSection = 60,
): SearchResults => {
  const needles = normalise(query).split(/\s+/).filter(part => part.length > 0);

  if (needles.length === 0) {
    return {live: [], movies: [], series: [], total: 0};
  }

  const live = catalog.live.items.filter(item => matches(item.name, needles));
  const movies = catalog.movies.items.filter(item => matches(item.name, needles));
  const series = catalog.series.items.filter(item => matches(item.name, needles));

  return {
    live: live.slice(0, limitPerSection),
    movies: movies.slice(0, limitPerSection),
    series: series.slice(0, limitPerSection),
    total: live.length + movies.length + series.length,
  };
};
