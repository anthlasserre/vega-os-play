import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useKeplerBackHandler} from '@amazon-devices/react-native-kepler';
import {ChannelsScreen} from './screens/ChannelsScreen';
import {PlayerScreen} from './screens/PlayerScreen';
import {SourceScreen} from './screens/SourceScreen';
import {loadPlaylist} from './iptv/loadPlaylist';
import {Channel, Playlist, Source} from './iptv/types';
import {colors, fontSize, spacing} from './theme';

type Route =
  | {name: 'source'}
  | {name: 'loading'; source: Source}
  | {name: 'channels'}
  | {name: 'player'; channel: Channel};

export const App = () => {
  const [route, setRoute] = useState<Route>({name: 'source'});
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backHandler = useKeplerBackHandler();

  const goToSource = useCallback(() => {
    setPlaylist(null);
    setRoute({name: 'source'});
  }, []);

  useEffect(() => {
    if (route.name !== 'loading') {
      return;
    }

    let cancelled = false;
    const source = route.source;

    loadPlaylist(source)
      .then(loaded => {
        if (cancelled) {
          return;
        }
        if (loaded.channels.length === 0) {
          setError('La source ne renvoie aucune chaîne.');
          setRoute({name: 'source'});
          return;
        }
        setPlaylist(loaded);
        setRoute({name: 'channels'});
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setError(cause instanceof Error ? cause.message : String(cause));
        setRoute({name: 'source'});
      });

    return () => {
      cancelled = true;
    };
  }, [route]);

  // Touche Retour de la télécommande : on remonte d'un écran, et on ne quitte
  // l'app que depuis l'écran racine.
  useEffect(() => {
    const subscription = backHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'player') {
        setRoute({name: 'channels'});
        return true;
      }
      if (route.name === 'channels') {
        goToSource();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [backHandler, route, goToSource]);

  const selectSource = useCallback((source: Source) => {
    setError(null);
    setRoute({name: 'loading', source});
  }, []);

  const selectChannel = useCallback((channel: Channel) => {
    setRoute({name: 'player', channel});
  }, []);

  if (route.name === 'loading') {
    return (
      <View style={styles.centered} testID="loading">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement de la playlist…</Text>
      </View>
    );
  }

  if (route.name === 'channels' && playlist !== null) {
    return (
      <ChannelsScreen
        playlist={playlist}
        onSelectChannel={selectChannel}
        onBack={goToSource}
      />
    );
  }

  if (route.name === 'player') {
    return (
      <PlayerScreen
        channel={route.channel}
        onBack={() => setRoute({name: 'channels'})}
      />
    );
  }

  return <SourceScreen onSelect={selectSource} error={error} />;
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    marginTop: spacing.md,
  },
});
