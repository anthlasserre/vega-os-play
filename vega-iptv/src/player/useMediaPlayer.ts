import {useCallback, useEffect, useRef, useState} from 'react';
import {VideoPlayer} from '@amazon-devices/react-native-w3cmedia/dist/headless';
import {AudioTrack, TextTrack} from '@amazon-devices/react-native-w3cmedia';
import {describePlaybackError} from './errors';
import {getMseAdapterFactory, MseAdapter} from './shaka';
import {containerOf, extensionOf, isRiskyContainer, streamKindOf} from './streamKind';
import {labelTrack, readTrackList, TrackOption} from './tracks';

export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export interface MediaRequest {
  url: string;
  /** Position de reprise, en secondes. */
  startAt?: number;
  /** Un direct n'est ni pausable de façon utile, ni reprenable. */
  live: boolean;
  /** Tampon visé sur un direct, en secondes (réglage utilisateur). */
  bufferSeconds: number;
}

export interface ProgressSnapshot {
  positionSeconds: number;
  durationSeconds: number;
}

export interface MediaPlayerHandle {
  status: PlaybackStatus;
  error: string | null;
  position: number;
  duration: number;
  audioTracks: TrackOption[];
  textTracks: TrackOption[];
  onSurfaceViewCreated: (handle: string) => void;
  onSurfaceViewDestroyed: (handle: string) => void;
  togglePlayback: () => void;
  seekBy: (deltaSeconds: number) => void;
  selectAudioTrack: (id: string) => void;
  selectTextTrack: (id: string) => void;
}

const MSE_UNAVAILABLE =
  "Ce flux est adaptatif (HLS/DASH) : il a besoin du lecteur MSE. Aucun adaptateur n'est enregistré — dans l'application, index.js branche Shaka au démarrage ; il faut l'avoir installé via `npm run setup:shaka` (voir le README). Les contenus MP4 se lisent, eux, sans rien ajouter.";

/**
 * Résout les redirections HTTP avant de confier l'URL au lecteur.
 *
 * Un portail Xtream ne sert pas le fichier à l'adresse annoncée : il répond une
 * redirection vers un nœud de diffusion, sur une autre IP et sans extension —
 * `…/movie/user/pass/1406973.mkv` devient `…/live/play/<jeton>/1406973`. Le
 * lecteur natif, en mode URL, ne suit pas ce saut et échoue sur
 * `MEDIA_ERR_SRC_NOT_SUPPORTED`, quel que soit le conteneur. Le direct, lui,
 * fonctionnait déjà : Shaka fait ses requêtes en JavaScript et suit les
 * redirections tout seul.
 *
 * On se contente donc de refaire ce que Shaka fait : une requête d'un octet
 * suffit à obtenir l'adresse finale, sans télécharger le film.
 */
const resolveRedirect = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {headers: {Range: 'bytes=0-0'}});
    const resolved = response.url;
    if (typeof resolved === 'string' && resolved !== '' && resolved !== url) {
      console.log(`vega-iptv: redirection suivie vers ${new URL(resolved).host}`);
      return resolved;
    }
  } catch (cause) {
    // Sans réponse, on laisse le lecteur tenter l'adresse d'origine : elle est
    // peut-être bonne, et un échec réseau se signalera de lui-même.
    console.warn(`vega-iptv: résolution de redirection échouée ${String(cause)}`);
  }
  return url;
};

const TICK_MS = 1000;
const PROGRESS_REPORT_MS = 5000;

/**
 * Pilote un `VideoPlayer` W3C sur tout le cycle de vie d'un contenu.
 *
 * L'ordre imposé par le SDK est strict : `new VideoPlayer()` → `initialize()` →
 * listeners → tout le reste. La surface native arrive de façon indépendante via
 * le rendu React : on la mémorise et on l'applique dès que l'init est résolue.
 */
export const useMediaPlayer = (
  request: MediaRequest | null,
  onProgress?: (snapshot: ProgressSnapshot) => void,
): MediaPlayerHandle => {
  const playerRef = useRef<VideoPlayer | null>(null);
  const adapterRef = useRef<MseAdapter | null>(null);
  const surfaceRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const reportRef = useRef(onProgress);
  const lastReportRef = useRef(0);

  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioTracks, setAudioTracks] = useState<TrackOption[]>([]);
  const [textTracks, setTextTracks] = useState<TrackOption[]>([]);

  reportRef.current = onProgress;

  const refreshTracks = useCallback(() => {
    const player = playerRef.current;
    if (player === null) {
      return;
    }
    const audio = readTrackList<AudioTrack>(player.audioTracks);
    const text = readTrackList<TextTrack>(player.textTracks);

    setAudioTracks(
      audio.map((track, index) => ({
        id: track.id,
        label: labelTrack(track, index),
        language: track.language ?? '',
        active: track.enabled === true,
      })),
    );
    setTextTracks(
      text.map((track, index) => ({
        id: track.id,
        label: labelTrack(track, index),
        language: track.language ?? '',
        active: track.mode === 'showing',
      })),
    );
  }, []);

  const applySurface = useCallback(() => {
    const player = playerRef.current;
    const handle = surfaceRef.current;
    if (player !== null && handle !== null && readyRef.current) {
      player.setSurfaceHandle(handle);
      player.play();
    }
  }, []);

  useEffect(() => {
    if (request === null) {
      return;
    }

    let cancelled = false;
    const player = new VideoPlayer();
    playerRef.current = player;
    readyRef.current = false;
    lastReportRef.current = 0;
    setStatus('loading');
    setError(null);
    setPosition(0);
    setDuration(0);
    setAudioTracks([]);
    setTextTracks([]);

    const onPlaying = () => !cancelled && setStatus('playing');
    const onPause = () => !cancelled && setStatus('paused');
    const onEnded = () => !cancelled && setStatus('ended');
    const context = {
      container: containerOf(request.url),
      risky: isRiskyContainer(request.url),
    };

    const onError = () => {
      if (!cancelled) {
        const failure = player.error;
        console.warn(
          `vega-iptv: échec de lecture code=${failure?.code ?? '?'} message=${
            failure?.message ?? '(aucun)'
          }`,
        );
        setStatus('error');
        setError(describePlaybackError(failure, context));
      }
    };
    const onLoadedMetadata = () => {
      if (!cancelled) {
        refreshTracks();
      }
    };

    const start = async () => {
      try {
        await player.initialize();
        if (cancelled) {
          return;
        }

        player.addEventListener('playing', onPlaying);
        player.addEventListener('pause', onPause);
        player.addEventListener('ended', onEnded);
        player.addEventListener('error', onError);
        player.addEventListener('loadedmetadata', onLoadedMetadata);
        player.autoplay = false;

        const kind = streamKindOf(request.url);
        // Trace de diagnostic. L'URL entière n'y figure pas : elle contient les
        // identifiants du portail, et les journaux de l'appareil sont lisibles
        // par `vega device copy-logs`.
        console.log(
          `vega-iptv: lecture mode=${kind} ext=${extensionOf(request.url) || '(aucune)'} live=${request.live}`,
        );

        if (kind === 'url') {
          // Le lecteur natif ne suit pas les redirections : on lui donne
          // l'adresse finale. Voir `resolveRedirect`.
          const target = await resolveRedirect(request.url);
          if (cancelled) {
            return;
          }
          player.src = target;
        } else {
          const factory = getMseAdapterFactory();
          if (factory === null) {
            setStatus('error');
            setError(MSE_UNAVAILABLE);
            return;
          }
          adapterRef.current = factory(player, {
            bufferSeconds: request.bufferSeconds,
            live: request.live,
          });
          await adapterRef.current.load(request.url);
          if (cancelled) {
            return;
          }
        }

        readyRef.current = true;
        applySurface();

        if (!request.live && request.startAt !== undefined && request.startAt > 0) {
          player.currentTime = request.startAt;
        }
      } catch (cause) {
        if (!cancelled) {
          setStatus('error');
          setError(describePlaybackError(cause, context));
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      readyRef.current = false;

      // Dernier report avant démontage : sans lui, la position de reprise est
      // perdue dès qu'on quitte l'écran entre deux ticks.
      const report = reportRef.current;
      if (report !== undefined && !request.live) {
        const finalPosition = player.currentTime;
        const finalDuration = player.duration;
        if (Number.isFinite(finalPosition) && Number.isFinite(finalDuration)) {
          report({
            positionSeconds: finalPosition,
            durationSeconds: finalDuration,
          });
        }
      }

      // Ordre de démontage imposé : MSE d'abord, VideoPlayer ensuite.
      const teardown = async () => {
        try {
          if (adapterRef.current !== null) {
            await adapterRef.current.unload();
            await adapterRef.current.destroy();
            adapterRef.current = null;
          }
          player.pause();
          player.removeEventListener('playing', onPlaying);
          player.removeEventListener('pause', onPause);
          player.removeEventListener('ended', onEnded);
          player.removeEventListener('error', onError);
          player.removeEventListener('loadedmetadata', onLoadedMetadata);
          await player.deinitialize();
        } catch {
          // Rien à récupérer sur un démontage : l'écran est déjà quitté.
        }
      };

      teardown();
      playerRef.current = null;
    };
  }, [request, applySurface, refreshTracks]);

  // Horloge de lecture. Le `VideoPlayer` n'émet pas de `timeupdate` fiable sur
  // tous les flux, donc on interroge la position plutôt que de l'écouter.
  useEffect(() => {
    if (request === null || status === 'idle' || status === 'error') {
      return;
    }

    const timer = setInterval(() => {
      const player = playerRef.current;
      if (player === null || !readyRef.current) {
        return;
      }

      const currentPosition = player.currentTime;
      const currentDuration = player.duration;
      if (Number.isFinite(currentPosition)) {
        setPosition(currentPosition);
      }
      if (Number.isFinite(currentDuration) && currentDuration > 0) {
        setDuration(currentDuration);
      }

      const report = reportRef.current;
      const now = Date.now();
      if (
        report !== undefined &&
        !request.live &&
        now - lastReportRef.current >= PROGRESS_REPORT_MS &&
        Number.isFinite(currentPosition) &&
        Number.isFinite(currentDuration)
      ) {
        lastReportRef.current = now;
        report({
          positionSeconds: currentPosition,
          durationSeconds: currentDuration,
        });
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [request, status]);

  const onSurfaceViewCreated = useCallback(
    (handle: string) => {
      surfaceRef.current = handle;
      applySurface();
    },
    [applySurface],
  );

  const onSurfaceViewDestroyed = useCallback((handle: string) => {
    playerRef.current?.clearSurfaceHandle(handle);
    surfaceRef.current = null;
  }, []);

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (player === null || !readyRef.current) {
      return;
    }
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }, []);

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const player = playerRef.current;
      if (player === null || !readyRef.current || request?.live === true) {
        return;
      }
      const target = player.currentTime + deltaSeconds;
      const max = Number.isFinite(player.duration) ? player.duration : target;
      const clamped = Math.min(Math.max(0, target), Math.max(0, max));
      player.currentTime = clamped;
      setPosition(clamped);
    },
    [request],
  );

  const selectAudioTrack = useCallback(
    (id: string) => {
      const player = playerRef.current;
      if (player === null) {
        return;
      }
      for (const track of readTrackList<AudioTrack>(player.audioTracks)) {
        track.enabled = track.id === id;
      }
      refreshTracks();
    },
    [refreshTracks],
  );

  const selectTextTrack = useCallback(
    (id: string) => {
      const player = playerRef.current;
      if (player === null) {
        return;
      }
      for (const track of readTrackList<TextTrack>(player.textTracks)) {
        track.mode = track.id === id ? 'showing' : 'disabled';
      }
      refreshTracks();
    },
    [refreshTracks],
  );

  return {
    status,
    error,
    position,
    duration,
    audioTracks,
    textTracks,
    onSurfaceViewCreated,
    onSurfaceViewDestroyed,
    togglePlayback,
    seekBy,
    selectAudioTrack,
    selectTextTrack,
  };
};
