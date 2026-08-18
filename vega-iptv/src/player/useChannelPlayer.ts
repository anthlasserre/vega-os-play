import {useCallback, useEffect, useRef, useState} from 'react';
import {VideoPlayer} from '@amazon-devices/react-native-w3cmedia/dist/headless';
import {Channel} from '../iptv/types';
import {getMseAdapterFactory, MseAdapter} from './shaka';
import {streamKindOf} from './streamKind';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface ChannelPlayer {
  status: PlaybackStatus;
  error: string | null;
  /** À câbler sur `KeplerVideoSurfaceView.onSurfaceViewCreated`. */
  onSurfaceViewCreated: (handle: string) => void;
  /** À câbler sur `KeplerVideoSurfaceView.onSurfaceViewDestroyed`. */
  onSurfaceViewDestroyed: (handle: string) => void;
  togglePlayback: () => void;
}

const MSE_UNAVAILABLE =
  "Ce flux est adaptatif (HLS/DASH) : il a besoin du lecteur MSE. Dépose le dist Shaka patché Vega dans src/player/shaka/ (voir le README). Les chaînes « Démo · MP4 » se lisent, elles, sans rien ajouter.";

/**
 * Pilote un `VideoPlayer` W3C sur tout le cycle de vie d'une chaîne.
 *
 * L'ordre imposé par le SDK est strict : `new VideoPlayer()` → `initialize()` →
 * listeners → tout le reste. La surface native, elle, arrive de façon
 * indépendante via le rendu React : on la mémorise et on l'applique dès que
 * l'init est résolue.
 */
export const useChannelPlayer = (channel: Channel | null): ChannelPlayer => {
  const playerRef = useRef<VideoPlayer | null>(null);
  const adapterRef = useRef<MseAdapter | null>(null);
  const surfaceRef = useRef<string | null>(null);
  const readyRef = useRef(false);

  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const applySurface = useCallback(() => {
    const player = playerRef.current;
    const handle = surfaceRef.current;
    if (player !== null && handle !== null && readyRef.current) {
      player.setSurfaceHandle(handle);
      player.play();
    }
  }, []);

  useEffect(() => {
    if (channel === null) {
      return;
    }

    let cancelled = false;
    const player = new VideoPlayer();
    playerRef.current = player;
    readyRef.current = false;
    setStatus('loading');
    setError(null);

    const onPlaying = () => !cancelled && setStatus('playing');
    const onPause = () => !cancelled && setStatus('paused');
    const onEnded = () => !cancelled && setStatus('idle');
    const onError = () => {
      if (!cancelled) {
        setStatus('error');
        setError(player.error?.message ?? 'Lecture impossible.');
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
        player.autoplay = false;

        if (streamKindOf(channel.url) === 'url') {
          player.src = channel.url;
        } else {
          const factory = getMseAdapterFactory();
          if (factory === null) {
            setStatus('error');
            setError(MSE_UNAVAILABLE);
            return;
          }
          adapterRef.current = factory(player);
          await adapterRef.current.load(channel.url);
          if (cancelled) {
            return;
          }
        }

        readyRef.current = true;
        applySurface();
      } catch (cause) {
        if (!cancelled) {
          setStatus('error');
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      readyRef.current = false;

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
          await player.deinitialize();
        } catch {
          // Rien à récupérer sur un démontage : l'écran est déjà quitté.
        }
      };

      teardown();
      playerRef.current = null;
    };
  }, [channel, applySurface]);

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

  return {
    status,
    error,
    onSurfaceViewCreated,
    onSurfaceViewDestroyed,
    togglePlayback,
  };
};
