/**
 * Le lecteur Vega expose deux modes (cf. react_native_for_vega_media_playback_architecture) :
 *
 * - `url` : on pose l'URL sur `VideoPlayer.src`. Fichiers plats uniquement.
 * - `mse` : un lecteur JS (Shaka, hls.js) pousse les segments via MSE. Requis pour
 *   tout ce qui est adaptatif — donc pour la quasi-totalité d'un vrai bouquet IPTV.
 */
export type StreamKind = 'url' | 'mse';

const URL_MODE_EXTENSIONS = ['mp4', 'mkv', 'mp3', 'flv', 'ogg', 'flac'];

/**
 * Conteneurs que le mode URL accepte en théorie mais refuse en pratique.
 *
 * Constaté sur appareil : un film servi en `video/x-matroska` — réponse 206
 * correcte, signature EBML `1A 45 DF A3` bien présente — échoue sur
 * `MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4). Le `README` de
 * `@amazon-devices/react-native-w3cmedia` annonce pourtant MKV parmi les formats
 * du mode URL.
 *
 * On n'en bloque pas la lecture pour autant : la mesure vient d'un appareil
 * virtuel, dont le décodeur logiciel est plus limité que celui d'un Fire TV, et
 * interdire d'essayer serait pire que d'échouer. La liste ne sert donc qu'à
 * prévenir l'utilisateur — avant la tentative par un badge, après par un message
 * d'erreur qui nomme la cause.
 */
const RISKY_URL_CONTAINERS = ['mkv'];

/** Renvoie l'extension en minuscules, en ignorant query string et fragment. */
export const extensionOf = (url: string): string => {
  const withoutQuery = url.split(/[?#]/, 1)[0];
  const lastSegment = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1);
  const dot = lastSegment.lastIndexOf('.');
  return dot === -1 ? '' : lastSegment.slice(dot + 1).toLowerCase();
};

export const streamKindOf = (url: string): StreamKind =>
  URL_MODE_EXTENSIONS.includes(extensionOf(url)) ? 'url' : 'mse';

/** Conteneur en majuscules, pour l'afficher (`MKV`, `MP4`…). Vide si inconnu. */
export const containerOf = (url: string): string => extensionOf(url).toUpperCase();

/** Vrai si le lecteur Vega risque de refuser ce conteneur. */
export const isRiskyContainer = (url: string): boolean =>
  RISKY_URL_CONTAINERS.includes(extensionOf(url));
