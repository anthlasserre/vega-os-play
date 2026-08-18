export interface TrackOption {
  id: string;
  label: string;
  language: string;
  active: boolean;
}

interface NamedTrack {
  id: string;
  label?: string;
  language?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français',
  fra: 'Français',
  fre: 'Français',
  en: 'Anglais',
  eng: 'Anglais',
  es: 'Espagnol',
  spa: 'Espagnol',
  de: 'Allemand',
  deu: 'Allemand',
  ger: 'Allemand',
  it: 'Italien',
  ita: 'Italien',
  pt: 'Portugais',
  por: 'Portugais',
  ar: 'Arabe',
  ara: 'Arabe',
  nl: 'Néerlandais',
  pl: 'Polonais',
  tr: 'Turc',
};

/**
 * Fabrique un libellé lisible pour une piste.
 *
 * Les flux IPTV sont avares en métadonnées : souvent juste un code langue, voire
 * rien. On dégrade proprement plutôt que d'afficher une ligne vide.
 */
export const labelTrack = (track: NamedTrack, index: number): string => {
  const label = track.label?.trim();
  if (label !== undefined && label !== '') {
    return label;
  }
  const language = track.language?.trim().toLowerCase();
  if (language !== undefined && language !== '') {
    return LANGUAGE_NAMES[language] ?? language.toUpperCase();
  }
  return `Piste ${index + 1}`;
};

/** Accès indexé aux `TrackList` du W3C, que le typage Vega n'expose pas. */
export const readTrackList = <T>(list: {length: number} | undefined): T[] => {
  if (list === undefined) {
    return [];
  }
  const indexed = list as unknown as ArrayLike<T>;
  const out: T[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const entry = indexed[i];
    if (entry !== undefined) {
      out.push(entry);
    }
  }
  return out;
};
