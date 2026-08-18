import React from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {Movie} from '../../iptv/types';
import {PlaybackProgress} from '../../storage/schema';
import {formatDuration} from '../format';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface MovieDetailScreenProps {
  movie: Movie;
  favorite: boolean;
  resume: PlaybackProgress | undefined;
  onPlay: (startAt: number) => void;
  onToggleFavorite: () => void;
  onBack: () => void;
}

export const MovieDetailScreen = ({
  movie,
  favorite,
  resume,
  onPlay,
  onToggleFavorite,
  onBack,
}: MovieDetailScreenProps) => (
  <View style={styles.container}>
    <View style={styles.body}>
      <View style={styles.posterBox}>
        {movie.poster === undefined ? (
          <Text style={styles.posterFallback}>{movie.name}</Text>
        ) : (
          <Image
            source={{uri: movie.poster}}
            style={styles.poster}
            resizeMode="cover"
            accessible={false}
          />
        )}
      </View>

      <ScrollView style={styles.info} contentContainerStyle={styles.infoContent}>
        <Text style={styles.title}>{movie.name}</Text>
        <Text style={styles.meta}>
          {[
            movie.year,
            movie.genre,
            movie.rating === undefined ? undefined : `${movie.rating.toFixed(1)}/10`,
            movie.durationSeconds === undefined
              ? undefined
              : formatDuration(movie.durationSeconds),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        {resume !== undefined && (
          <Text style={styles.resume} testID="movie-resume-hint">
            Repris à {formatDuration(resume.positionSeconds)} sur{' '}
            {formatDuration(resume.durationSeconds)}
          </Text>
        )}

        {movie.plot !== undefined && <Text style={styles.plot}>{movie.plot}</Text>}
      </ScrollView>
    </View>

    <TVFocusGuideView style={styles.actions}>
      {resume !== undefined && (
        <ActionButton
          testID="movie-resume"
          label="Reprendre"
          hasTVPreferredFocus={true}
          onPress={() => onPlay(resume.positionSeconds)}
          style={styles.action}
        />
      )}
      <ActionButton
        testID="movie-play"
        label={resume === undefined ? 'Lecture' : 'Reprendre au début'}
        hasTVPreferredFocus={resume === undefined}
        onPress={() => onPlay(0)}
        style={styles.action}
      />
      <ActionButton
        testID="movie-favorite"
        label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onPress={onToggleFavorite}
        style={styles.action}
      />
      <ActionButton testID="movie-back" label="Retour" onPress={onBack} style={styles.action} />
    </TVFocusGuideView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  posterBox: {
    width: 320,
    height: 460,
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  infoContent: {
    paddingRight: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  resume: {
    color: colors.accent,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
  },
  plot: {
    color: colors.text,
    fontSize: fontSize.caption,
    lineHeight: 28,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  action: {
    marginRight: spacing.sm,
  },
});
