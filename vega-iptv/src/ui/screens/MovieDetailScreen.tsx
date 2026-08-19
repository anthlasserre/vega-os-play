import React from 'react';
import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {ActionButton} from '../components/ActionButton';
import {useLayout} from '../layout';
import {containerOf, isRiskyContainer} from '../../player/streamKind';
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

/** Puce de métadonnée : plus lisible qu'une ligne de valeurs séparées par des points. */
const Chip = ({label, tone}: {label: string; tone?: 'warning'}) => (
  <View style={[styles.chip, tone === 'warning' && styles.chipWarning]}>
    <Text style={[styles.chipText, tone === 'warning' && styles.chipWarningText]}>
      {label}
    </Text>
  </View>
);

export const MovieDetailScreen = ({
  movie,
  favorite,
  resume,
  onPlay,
  onToggleFavorite,
  onBack,
}: MovieDetailScreenProps) => {
  const metrics = useLayout();

  // L'affiche occupe une fraction de la hauteur, pas une taille fixe : la
  // première version en imposait 460 points de haut pour un écran qui n'en fait
  // que 540, si bien que les boutons finissaient posés dessus.
  const posterHeight = Math.round(metrics.height * 0.58);
  const posterWidth = Math.round(posterHeight / 1.5);

  const chips = [
    movie.year,
    movie.genre,
    movie.rating === undefined ? undefined : `★ ${movie.rating.toFixed(1)}/10`,
    movie.durationSeconds === undefined
      ? undefined
      : formatDuration(movie.durationSeconds),
  ].filter((value): value is string => value !== undefined && value !== '');

  // Le conteneur est affiché à part, et signalé quand le lecteur Vega risque de
  // le refuser : sur un catalogue de 36 000 titres, mieux vaut le savoir avant
  // de lancer la lecture.
  const container = containerOf(movie.url);
  const risky = isRiskyContainer(movie.url);

  const progressRatio =
    resume !== undefined && resume.durationSeconds > 0
      ? Math.min(1, resume.positionSeconds / resume.durationSeconds)
      : 0;

  return (
    <View
      style={[
        styles.container,
        {paddingHorizontal: metrics.gutter, paddingVertical: metrics.vGutter},
      ]}>
      <View style={styles.body}>
        <View style={[styles.posterBox, {width: posterWidth, height: posterHeight}]}>
          {movie.poster === undefined ? (
            <Text style={styles.posterFallback} numberOfLines={4}>
              {movie.name}
            </Text>
          ) : (
            <Image
              source={{uri: movie.poster}}
              style={styles.poster}
              resizeMode="cover"
              accessible={false}
            />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {favorite ? '★ ' : ''}
            {movie.name}
          </Text>

          <View style={styles.chips}>
            {chips.map(chip => (
              <Chip key={chip} label={chip} />
            ))}
            {container !== '' && (
              <Chip label={container} tone={risky ? 'warning' : undefined} />
            )}
          </View>

          {risky && (
            <Text style={styles.warning} testID="movie-container-warning">
              Le lecteur Vega ne décode pas le {container} en lecture directe :
              ce titre a de fortes chances de ne pas démarrer.
            </Text>
          )}

          {resume !== undefined && (
            <View style={styles.resumeBox} testID="movie-resume-hint">
              <Text style={styles.resumeText}>
                Vu jusqu'à {formatDuration(resume.positionSeconds)} sur{' '}
                {formatDuration(resume.durationSeconds)}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, {width: `${progressRatio * 100}%`}]}
                />
              </View>
            </View>
          )}

          {/*
            Les actions viennent avant le résumé : leur position ne dépend alors
            plus de la longueur du texte, et un portail avare en métadonnées ne
            les repousse pas en bas d'un écran vide.
          */}
          <TVFocusGuideView style={styles.actions}>
            {resume !== undefined && (
              <ActionButton
                testID="movie-resume"
                label={`Reprendre à ${formatDuration(resume.positionSeconds)}`}
icon="play"
                hasTVPreferredFocus={true}
                onPress={() => onPlay(resume.positionSeconds)}
                style={styles.action}
              />
            )}
            <ActionButton
              testID="movie-play"
              label={resume === undefined ? 'Lecture' : 'Depuis le début'}
icon={resume === undefined ? 'play' : 'rewind'}
              hasTVPreferredFocus={resume === undefined}
              onPress={() => onPlay(0)}
              style={styles.action}
            />
            <ActionButton
              testID="movie-favorite"
              label={favorite ? 'Retirer des favoris' : 'Favori'}
icon="star"
              onPress={onToggleFavorite}
              style={styles.action}
            />
            <ActionButton
              testID="movie-back"
              label="Retour"
              icon="back"
              iconOnly={true}
              onPress={onBack}
              style={styles.action}
            />
          </TVFocusGuideView>

          {movie.plot === undefined ? (
            <Text style={styles.noPlot}>
              Ce portail ne fournit pas de résumé pour ce titre.
            </Text>
          ) : (
            <ScrollView style={styles.plotScroll}>
              <Text style={styles.plot}>{movie.plot}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  posterBox: {
    borderRadius: radius.md,
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
    fontSize: fontSize.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    // Le texte ne s'étale pas sur toute la largeur : au-delà d'environ 90
    // caractères, une ligne devient pénible à suivre à 3 m.
    maxWidth: 560,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: spacing.xxs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    fontWeight: '600',
  },
  chipWarning: {
    borderColor: colors.warning,
  },
  chipWarningText: {
    color: colors.warning,
  },
  warning: {
    color: colors.warning,
    fontSize: fontSize.micro,
    marginTop: spacing.xs,
  },
  resumeBox: {
    marginTop: spacing.sm,
  },
  resumeText: {
    color: colors.accent,
    fontSize: fontSize.micro,
    marginBottom: spacing.xxs,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    maxWidth: 320,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  plotScroll: {
    flex: 1,
    marginTop: spacing.sm,
  },
  plot: {
    color: colors.text,
    fontSize: fontSize.caption,
    lineHeight: 22,
  },
  noPlot: {
    flex: 1,
    color: colors.textDim,
    fontSize: fontSize.micro,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  action: {},
});
