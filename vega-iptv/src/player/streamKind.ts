/**
 * Le lecteur Vega expose deux modes (cf. react_native_for_vega_media_playback_architecture) :
 *
 * - `url` : on pose l'URL sur `VideoPlayer.src`. Fichiers plats uniquement.
 * - `mse` : un lecteur JS (Shaka, hls.js) pousse les segments via MSE. Requis pour
 *   tout ce qui est adaptatif — donc pour la quasi-totalité d'un vrai bouquet IPTV.
 */
export type StreamKind = 'url' | 'mse';

const URL_MODE_EXTENSIONS = ['mp4', 'mkv', 'mp3', 'flv', 'ogg', 'flac'];

/** Renvoie l'extension en minuscules, en ignorant query string et fragment. */
export const extensionOf = (url: string): string => {
  const withoutQuery = url.split(/[?#]/, 1)[0];
  const lastSegment = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1);
  const dot = lastSegment.lastIndexOf('.');
  return dot === -1 ? '' : lastSegment.slice(dot + 1).toLowerCase();
};

export const streamKindOf = (url: string): StreamKind =>
  URL_MODE_EXTENSIONS.includes(extensionOf(url)) ? 'url' : 'mse';
