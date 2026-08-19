import {VideoPlayer} from '@amazon-devices/react-native-w3cmedia/dist/headless';

/**
 * Adaptateur MSE minimal attendu par le lecteur.
 * Shaka et hls.js exposent tous les deux `load` / `unload` / `destroy`.
 */
export interface MseAdapter {
  load(url: string): Promise<void>;
  unload(): Promise<void>;
  destroy(): Promise<void>;
}

/** Réglages de lecture que l'utilisateur pilote depuis les préférences. */
export interface MseOptions {
  /** Tampon visé, en secondes. Sur un direct, arbitre stabilité contre latence. */
  bufferSeconds: number;
  live: boolean;
}

export type MseAdapterFactory = (
  player: VideoPlayer,
  options: MseOptions,
) => MseAdapter;

let factory: MseAdapterFactory | null = null;

/**
 * Point d'injection du lecteur MSE.
 *
 * L'implémentation réelle vit dans `./adapter`, qui importe le Shaka patché
 * Vega installé sous `src/shakaplayer/`. Elle est enregistrée depuis `index.js`,
 * l'entrée de l'application, et *seulement* de là : ni les écrans, ni Jest, ni
 * la prévisualisation navigateur ne tirent alors ces fichiers dans leur bundle.
 *
 * Le registre reste donc utile même une fois Shaka branché : hors application —
 * tests, preview — `getMseAdapterFactory()` renvoie `null` et l'appelant affiche
 * un message explicite au lieu d'un écran noir.
 *
 * Installation du dist Shaka : `npm run setup:shaka` (voir le README).
 */
export const registerMseAdapterFactory = (next: MseAdapterFactory): void => {
  factory = next;
};

export const getMseAdapterFactory = (): MseAdapterFactory | null => factory;
