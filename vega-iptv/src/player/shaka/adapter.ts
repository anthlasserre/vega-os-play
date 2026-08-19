// Hermes n'expose pas `TextEncoder`, dont Shaka a besoin pour les manifestes.
// Les polyfills d'Amazon ne couvrent que `TextDecoder` : cet import, placé avant
// celui de ShakaPlayer, complète le manque en s'installant sur le global.
import 'fastestsmallesttextencoderdecoder';
// Doit précéder l'import de ShakaPlayer : le module Shaka lit `navigator` dès
// son évaluation. Voir le commentaire de ./polyfills.
import './polyfills';
import {VideoPlayer} from '@amazon-devices/react-native-w3cmedia/dist/headless';
import {ShakaPlayer, ShakaPlayerSettings} from '../../shakaplayer/ShakaPlayer';
import {extensionOf} from '../streamKind';
import {MseAdapter, MseOptions} from './index';

/**
 * Branche le Shaka patché Vega sur l'interface `MseAdapter` de l'app.
 *
 * Ce module est le seul à importer `src/shakaplayer/` : il n'est chargé que par
 * `index.js`, jamais par les écrans ni par les tests. La prévisualisation
 * navigateur et Jest, qui n'exécutent pas `index.js`, n'ont donc pas besoin des
 * fichiers installés par `npm run setup:shaka`.
 */

// Le Fire TV Stick 4K Select décode jusqu'à l'UHD ; laisser l'ABR viser plus
// haut que l'écran ne sert qu'à gaspiller de la bande passante.
const ABR_MAX_WIDTH = 3840;
const ABR_MAX_HEIGHT = 2160;

// `startPosition` reste indéfini à dessein : `ShakaPlayer.load()` le transmet
// tel quel à `shaka.Player.load(uri, startTime)`, et Shaka ne choisit le bord du
// direct que si `startTime` vaut null. Un 0 explicite ferait démarrer chaque
// chaîne au début de sa fenêtre de rattrapage. La reprise d'un film, elle, passe
// par `currentTime` une fois le chargement résolu — voir useMediaPlayer.
const SETTINGS: ShakaPlayerSettings = {
  secure: false,
  abrEnabled: true,
  abrMaxWidth: ABR_MAX_WIDTH,
  abrMaxHeight: ABR_MAX_HEIGHT,
};

/**
 * Descripteur attendu par `ShakaPlayer.load()`.
 *
 * Les champs ne sont pas optionnels côté Amazon : `load()` fait un
 * `content.container.toUpperCase()` sans garde, et lit `vcodec` / `acodec` pour
 * les passer à `preferredVideoCodecs`. Une chaîne vide y est neutre (tout codec
 * « commence par » la chaîne vide), là où `undefined` casse la configuration.
 */
const describeContent = (url: string) => {
  const dash = extensionOf(url) === 'mpd';
  return {
    uri: url,
    secure: 'false',
    drm_scheme: '',
    drm_license_uri: '',
    vcodec: '',
    acodec: '',
    // Un bouquet Xtream sert son direct en HLS/MPEG-TS. Annoncer MPEG2TS laisse
    // `manifest.hls.sequenceMode` à sa valeur par défaut (vrai), nécessaire pour
    // les segments TS dont les horodatages ne se suivent pas.
    type: dash ? 'DASH' : 'HLS',
    container: dash ? 'MP4' : 'MPEG2TS',
  };
};

/** Tampon en lecture différée : aucune contrainte de latence, on voit large. */
const VOD_BUFFER_SECONDS = 30;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Impose le tampon choisi par l'utilisateur.
 *
 * `ShakaPlayer.load()` écrit ses propres valeurs (`bufferingGoal: 10`,
 * `rebufferingGoal: 0.01`) en dur, sans rien exposer pour les changer : on
 * reconfigure donc par-dessus. Le moment est contraint — voir l'appelant.
 */
const applyBuffering = (shaka: ShakaPlayer, seconds: number): void => {
  const player = shaka.player;
  if (player === null || player === undefined) {
    console.warn('vega-iptv: tampon MSE non appliqué (lecteur absent)');
    return;
  }
  // Trace volontaire : le moment de cet appel est subtil (voir l'appelant), et
  // s'il tombait à côté le réglage serait silencieusement sans effet.
  console.log(`vega-iptv: tampon MSE réglé à ${seconds} s`);
  player.configure('streaming.bufferingGoal', seconds);
  // Seuil de redémarrage après une coupure. Le garder bas rend le zapping vif ;
  // le relever un peu quand l'utilisateur demande un gros tampon, puisqu'il le
  // fait précisément parce que son réseau hoquette.
  player.configure('streaming.rebufferingGoal', clamp(seconds * 0.2, 0.5, 4));
  // Marge conservée derrière la tête de lecture, pour absorber un petit retour
  // arrière sans re-télécharger.
  player.configure('streaming.bufferBehind', Math.max(seconds, 10));
};

export const createShakaAdapter = (
  player: VideoPlayer,
  options: MseOptions,
): MseAdapter => {
  // Les polyfills d'Amazon font pointer `document.createElement()` vers
  // `global.gmedia` : Shaka croit manipuler une balise <video>, il obtient en
  // réalité ce `VideoPlayer`. Sans cette affectation, la création du
  // `shaka.Player` renvoie undefined et la lecture ne démarre jamais.
  (globalThis as any).gmedia = player;

  const shaka = new ShakaPlayer(player as any, SETTINGS);
  const bufferSeconds = options.live ? options.bufferSeconds : VOD_BUFFER_SECONDS;

  return {
    load: async (url: string) => {
      // `ShakaPlayer.load()` est `async` mais son corps est synchrone jusqu'au
      // `await this.player.load(...)` final : au retour de cet appel, l'instance
      // `shaka.Player` existe et est configurée, et le téléchargement vient de
      // démarrer. C'est la seule fenêtre où notre `configure` porte dès le
      // premier remplissage — l'attendre d'abord laisserait le tampon d'Amazon
      // s'appliquer au démarrage, celui qui compte pour le zapping.
      // Le cast est là parce que la signature d'Amazon annonce `void` pour une
      // méthode `async` — le fichier est en `@ts-nocheck`, rien ne l'a corrigée.
      const loading = shaka.load(
        describeContent(url),
        false,
      ) as unknown as Promise<void>;
      applyBuffering(shaka, bufferSeconds);
      await loading;
    },
    unload: async () => {
      await shaka.unload();
    },
    destroy: async () => {
      await shaka.destroy();
      if ((globalThis as any).gmedia === player) {
        (globalThis as any).gmedia = null;
      }
    },
  };
};
