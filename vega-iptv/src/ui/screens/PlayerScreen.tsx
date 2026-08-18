import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {KeplerVideoSurfaceView} from '@amazon-devices/react-native-w3cmedia';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {MediaCard} from '../components/MediaCard';
import {
  MediaRequest,
  PlaybackStatus,
  ProgressSnapshot,
  useMediaPlayer,
} from '../../player/useMediaPlayer';
import {TrackOption} from '../../player/tracks';
import {PlaybackTarget} from '../navigation';
import {formatDuration} from '../format';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface PlayerScreenProps {
  target: PlaybackTarget;
  favorite: boolean;
  onProgress: (snapshot: ProgressSnapshot) => void;
  onToggleFavorite: () => void;
  onBack: () => void;
}

const STATUS_LABEL: Record<PlaybackStatus, string> = {
  idle: 'Arrêté',
  loading: 'Chargement…',
  playing: 'Lecture',
  paused: 'Pause',
  ended: 'Terminé',
  error: 'Erreur',
};

const SEEK_SECONDS = 10;

type Panel = 'none' | 'audio' | 'text';

export const PlayerScreen = ({
  target,
  favorite,
  onProgress,
  onToggleFavorite,
  onBack,
}: PlayerScreenProps) => {
  const [panel, setPanel] = useState<Panel>('none');

  // Stabilisé : le hook relance toute la lecture dès que cette référence change.
  const request = useMemo<MediaRequest>(
    () => ({url: target.url, startAt: target.startAt, live: target.live}),
    [target.url, target.startAt, target.live],
  );

  const player = useMediaPlayer(request, onProgress);

  const togglePanel = useCallback(
    (next: Panel) => setPanel(current => (current === next ? 'none' : next)),
    [],
  );

  const tracks: TrackOption[] =
    panel === 'audio' ? player.audioTracks : panel === 'text' ? player.textTracks : [];

  const progressRatio =
    player.duration > 0 ? Math.min(1, player.position / player.duration) : 0;

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
          <Text style={styles.title} numberOfLines={1}>
            {favorite ? '★ ' : ''}
            {target.title}
          </Text>
          <Text style={styles.status} testID="player-status">
            {STATUS_LABEL[player.status]}
            {target.subtitle === undefined ? '' : ` · ${target.subtitle}`}
            {target.live ? ' · direct' : ''}
          </Text>
          {player.error !== null && (
            <Text style={styles.error} testID="player-error">
              {player.error}
            </Text>
          )}
        </View>

        {panel !== 'none' && (
          <View style={styles.panel} testID="player-panel">
            <Text style={styles.panelTitle}>
              {panel === 'audio' ? 'Pistes audio' : 'Sous-titres'}
            </Text>
            {tracks.length === 0 ? (
              <Text style={styles.panelEmpty} testID="player-panel-empty">
                Aucune piste annoncée par ce flux.
              </Text>
            ) : (
              <FlatList
                data={tracks}
                keyExtractor={track => track.id}
                initialNumToRender={8}
                windowSize={3}
                maxToRenderPerBatch={8}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
                renderItem={({item, index}) => (
                  <MediaCard
                    testID={`track-${item.id}`}
                    title={`${item.active ? '● ' : ''}${item.label}`}
                    layout="list"
                    hasTVPreferredFocus={index === 0}
                    onPress={() =>
                      panel === 'audio'
                        ? player.selectAudioTrack(item.id)
                        : player.selectTextTrack(item.id)
                    }
                    style={styles.track}
                  />
                )}
              />
            )}
          </View>
        )}

        <View style={styles.bottom}>
          {!target.live && (
            <View style={styles.timeline}>
              <Text style={styles.time}>{formatDuration(player.position)}</Text>
              <View style={styles.track4}>
                <View style={[styles.fill, {width: `${progressRatio * 100}%`}]} />
              </View>
              <Text style={styles.time}>{formatDuration(player.duration)}</Text>
            </View>
          )}

          <TVFocusGuideView style={styles.controls}>
            <ActionButton
              testID="player-toggle"
              label={player.status === 'playing' ? 'Pause' : 'Lecture'}
              hasTVPreferredFocus={true}
              onPress={player.togglePlayback}
              style={styles.control}
            />
            {!target.live && (
              <>
                <ActionButton
                  testID="player-rewind"
                  label={`− ${SEEK_SECONDS} s`}
                  onPress={() => player.seekBy(-SEEK_SECONDS)}
                  style={styles.control}
                />
                <ActionButton
                  testID="player-forward"
                  label={`+ ${SEEK_SECONDS} s`}
                  onPress={() => player.seekBy(SEEK_SECONDS)}
                  style={styles.control}
                />
              </>
            )}
            <ActionButton
              testID="player-audio"
              label="Audio"
              onPress={() => togglePanel('audio')}
              style={styles.control}
            />
            <ActionButton
              testID="player-subtitles"
              label="Sous-titres"
              onPress={() => togglePanel('text')}
              style={styles.control}
            />
            <ActionButton
              testID="player-favorite"
              label={favorite ? 'Retirer' : 'Favori'}
              onPress={onToggleFavorite}
              style={styles.control}
            />
            <ActionButton
              testID="player-back"
              label="Retour"
              onPress={onBack}
              style={styles.control}
            />
          </TVFocusGuideView>
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
    backgroundColor: colors.overlay,
    borderRadius: radius,
    padding: spacing.md,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  status: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  panel: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 420,
    maxHeight: 520,
    backgroundColor: colors.overlay,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  panelEmpty: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
  },
  track: {
    marginBottom: spacing.xs,
  },
  bottom: {
    backgroundColor: colors.overlay,
    borderRadius: radius,
    padding: spacing.md,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    width: 110,
    textAlign: 'center',
  },
  track4: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  fill: {
    height: 6,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  control: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    minWidth: 150,
  },
});
