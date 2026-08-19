import {HTMLMediaElement} from '@amazon-devices/react-native-w3cmedia';
import {PlayerInterface} from './PlayerInterface';

/**
 * Classe de base dont `ShakaPlayer` hérite (`extends PlayerBase`).
 *
 * Elle *manque* dans le paquet `shaka-rel` publié par Amazon : le tarball livre
 * `PlayerInterface.ts`, les polyfills et `shakaplayer/ShakaPlayer.ts`, mais pas
 * `PlayerBase.ts`. Sans elle, le bundle Metro échoue sur un module introuvable.
 * On la reconstitue à partir des seuls membres que `ShakaPlayer` consomme :
 *
 * - `this.mediaElement` (création du `shaka.Player`, pause, pistes natives) ;
 * - `super.loadOOBSubtitles(content)` pour le repli non adaptatif ;
 * - les méthodes qu'il redéclare en `override`.
 *
 * Ce fichier nous appartient — il n'est pas couvert par la licence Amazon des
 * fichiers installés par `npm run setup:shaka`, et reste donc versionné.
 */

/** Description d'une piste de sous-titres, côté lecteur JS ou piste native. */
export interface TextTrackInfo {
  id: string;
  kind: string;
  language: string;
  label: string;
  mode: string;
  playerTrackData: {type: 'shaka' | 'native'; track: any};
}

export class PlayerBase implements PlayerInterface {
  protected mediaElement: HTMLMediaElement | null;

  constructor(mediaElement: HTMLMediaElement | null) {
    this.mediaElement = mediaElement;
  }

  async load(_content: any, _autoplay: boolean): Promise<void> {}

  async unload(): Promise<void> {}

  async destroy(): Promise<void> {}

  play(): void {
    this.mediaElement?.play();
  }

  pause(): void {
    this.mediaElement?.pause();
  }

  seekBack(): void {
    this.seekBy(-10);
  }

  seekFront(): void {
    this.seekBy(10);
  }

  private seekBy(deltaSeconds: number): void {
    const media = this.mediaElement;
    if (media === null) {
      return;
    }
    const target = media.currentTime + deltaSeconds;
    media.currentTime = target < 0 ? 0 : target;
  }

  getAudioLanguages(): string[] {
    return [];
  }

  selectAudioLanguage(_language: string): void {}

  getTextTracks(): TextTrackInfo[] {
    return [];
  }

  async setTextTrack(
    _newTrack: TextTrackInfo | null,
    _currTrack: TextTrackInfo | null,
  ): Promise<void> {}

  /**
   * Sous-titres « out of band » : des fichiers servis à côté du flux, que le
   * manifeste n'annonce pas. En mode URL, seule voie possible, on les pousse
   * comme pistes natives du `HTMLMediaElement`.
   */
  loadOOBSubtitles(content: any): void {
    const media = this.mediaElement as any;
    if (media === null || content?.subtitles === undefined) {
      return;
    }
    for (const subtitle of content.subtitles) {
      const track = media.addTextTrack(
        'subtitles',
        subtitle.label,
        subtitle.language,
      );
      track.src = subtitle.uri;
    }
  }

  addPlayerEventListener(_type: string, _listener: any, _options?: any): void {}

  removePlayerEventListener(
    _type: string,
    _listener: any,
    _options?: any,
  ): void {}
}
