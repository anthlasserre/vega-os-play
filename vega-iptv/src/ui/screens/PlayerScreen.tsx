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
import {useLayout} from '../layout';
import {PlaybackTarget} from '../navigation';
import {formatDuration} from '../format';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface PlayerScreenProps {
  target: PlaybackTarget;
  /** Tampon visé sur un direct, en secondes (réglage utilisateur). */
  bufferSeconds: number;
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
  bufferSeconds,
  favorite,
  onProgress,
  onToggleFavorite,
  onBack,
}: PlayerScreenProps) => {
  const [panel, setPanel] = useState<Panel>('none');
  const metrics = useLayout();

  // Stabilisé : le hook relance toute la lecture dès que cette référence change.
  const request = useMemo<MediaRequest>(
    () => ({
      url: target.url,
      startAt: target.startAt,
      live: target.live,
      bufferSeconds,
    }),
    [target.url, target.startAt, target.live, bufferSeconds],
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
            <Text style={styles.error} testID="player-error" numberOfLines={3}>
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
                    subtitle={item.language === '' ? undefined : item.language}
                    layout="list"
                    rowHeight={metrics.rowHeight}
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
              icon={player.status === 'playing' ? 'pause' : 'play'}
              hasTVPreferredFocus={true}
              onPress={player.togglePlayback}
              style={styles.control}
            />
            {!target.live && (
              <>
                <ActionButton
                  testID="player-rewind"
                  label={`− ${SEEK_SECONDS} s`}
                  icon="rewind"
                  onPress={() => player.seekBy(-SEEK_SECONDS)}
                  style={styles.control}
                />
                <ActionButton
                  testID="player-forward"
                  label={`+ ${SEEK_SECONDS} s`}
                  icon="forward"
                  onPress={() => player.seekBy(SEEK_SECONDS)}
                  style={styles.control}
                />
              </>
            )}
            <ActionButton
              testID="player-audio"
              label="Audio"
              icon="audio"
              onPress={() => togglePanel('audio')}
              style={styles.control}
            />
            <ActionButton
              testID="player-subtitles"
              label="Sous-titres"
              icon="subtitles"
              onPress={() => togglePanel('text')}
              style={styles.control}
            />
            <ActionButton
              testID="player-favorite"
              label={favorite ? 'Retirer des favoris' : 'Favori'}
              icon="star"
              onPress={onToggleFavorite}
              style={styles.control}
            />
            <ActionButton
              testID="player-back"
              label="Retour"
              icon="back"
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
    padding: spacing.md,
  },
  info: {
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.subtitle,
    fontWeight: '700',
  },
  status: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.micro,
    marginTop: spacing.xxs,
  },
  panel: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 280,
    maxHeight: '70%',
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.sm,
  },
  panelTitle: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  panelEmpty: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  track: {
    marginBottom: spacing.xxs,
  },
  bottom: {
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    width: 64,
    textAlign: 'center',
  },
  track4: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  fill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  control: {},
});
