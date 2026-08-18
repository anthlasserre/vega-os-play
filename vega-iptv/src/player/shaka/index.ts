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

export type MseAdapterFactory = (player: VideoPlayer) => MseAdapter;

let factory: MseAdapterFactory | null = null;

/**
 * Point d'injection du lecteur MSE.
 *
 * Vega n'accepte PAS les paquets shaka-player / hls.js publiés en amont : il faut
 * le `dist` patché fourni dans la release Vega
 * (https://developer.amazon.com/docs/vega/latest/media-player-shaka-player.html),
 * généré hors du dossier applicatif puis déposé ici.
 *
 * Tant que ce dist n'est pas déposé, `getMseAdapterFactory()` renvoie `null` et
 * l'app affiche un message explicite au lieu d'un écran noir. Les flux MP4 de la
 * playlist de démo, eux, passent par le mode URL et fonctionnent sans cette étape.
 *
 * Pour brancher Shaka :
 *   1. générer le dist Vega de shaka-player en dehors de ce dépôt ;
 *   2. le copier dans `src/player/shaka/dist/` ;
 *   3. appeler `registerMseAdapterFactory(...)` depuis `index.js`, avant
 *      `AppRegistry.registerComponent`.
 */
export const registerMseAdapterFactory = (next: MseAdapterFactory): void => {
  factory = next;
};

export const getMseAdapterFactory = (): MseAdapterFactory | null => factory;
