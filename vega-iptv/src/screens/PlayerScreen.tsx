import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {KeplerVideoSurfaceView} from '@amazon-devices/react-native-w3cmedia';
import {FocusableCard} from '../components/FocusableCard';
import {Channel} from '../iptv/types';
import {useChannelPlayer} from '../player/useChannelPlayer';
import {colors, fontSize, spacing} from '../theme';

export interface PlayerScreenProps {
  channel: Channel;
  onBack: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Arrêté',
  loading: 'Chargement…',
  playing: 'Lecture',
  paused: 'Pause',
  error: 'Erreur',
};

export const PlayerScreen = ({channel, onBack}: PlayerScreenProps) => {
  const player = useChannelPlayer(channel);

  return (
    <View style={styles.container}>
      <KeplerVideoSurfaceView
        style={styles.surface}
        scalingmode="fit"
        onSurfaceViewCreated={player.onSurfaceViewCreated}
        onSurfaceViewDestroyed={player.onSurfaceViewDestroyed}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.info}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          <Text style={styles.status} testID="player-status">
            {STATUS_LABEL[player.status] ?? player.status} · {channel.group}
          </Text>
          {player.error !== null && (
            <Text style={styles.error} testID="player-error">
              {player.error}
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <FocusableCard
            testID="player-toggle"
            title={player.status === 'playing' ? 'Pause' : 'Lecture'}
            hasTVPreferredFocus={true}
            style={styles.control}
            onPress={player.togglePlayback}
          />
          <FocusableCard
            testID="player-back"
            title="Retour"
            style={styles.control}
            onPress={onBack}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  info: {
    backgroundColor: 'rgba(11, 15, 23, 0.82)',
    borderRadius: 12,
    padding: spacing.md,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  channelName: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  status: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.xs / 2,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
  },
  control: {
    marginRight: spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
});
