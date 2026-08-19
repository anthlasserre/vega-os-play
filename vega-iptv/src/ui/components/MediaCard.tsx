import React from 'react';
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Focusable} from './Focusable';
import {Icon, IconName} from './Icon';
import {POSTER_TEXT_HEIGHT} from '../layout';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface MediaCardProps {
  title: string;
  subtitle?: string;
  /** Affiche en grille, logo de chaîne en liste. */
  image?: string;
  badge?: string;
  favorite?: boolean;
  /** Avancement de lecture entre 0 et 1 ; masqué si absent. */
  progress?: number;
  layout: 'grid' | 'list';
  /** Dimensions de l'affiche, calculées par `useLayout()`. */
  posterWidth?: number;
  posterHeight?: number;
  /**
   * Forme de la vignette en grille.
   *
   * `poster` : 2:3 rogné, pour une affiche de film ou de série.
   * `wide` : 16:9 contenu, pour un logo de chaîne — l'étirer dans un portrait le
   * déforme, et le rogner en coupe le sigle.
   */
  shape?: 'poster' | 'wide';
  /** Hauteur d'une ligne de liste, calculée par `useLayout()`. */
  rowHeight?: number;
  /**
   * En liste, réserve la vignette de logo même sans image. Aligne les titres
   * d'une grille de chaînes, dont une partie n'a pas de logo côté fournisseur.
   */
  logoSlot?: {width: number; height: number};
  /** Icône en tête de ligne, à la place d'une vignette d'image. */
  icon?: IconName;
  /**
   * Pastille d'avertissement, en bas à droite de l'affiche.
   *
   * Le sous-titre ne convient pas pour cela : limité à une ligne, il tronque
   * l'information dès que le genre est un peu long.
   */
  warning?: string;
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Deux premières lettres significatives, en repli quand le logo manque. */
const initials = (title: string): string =>
  title
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase() || '•';

export const MediaCard = ({
  title,
  subtitle,
  image,
  badge,
  favorite,
  progress,
  layout,
  posterWidth,
  posterHeight,
  shape = 'poster',
  rowHeight,
  logoSlot,
  icon,
  warning,
  onPress,
  onFocus,
  hasTVPreferredFocus,
  style,
  testID,
}: MediaCardProps) => {
  const grid = layout === 'grid';
  const wide = shape === 'wide';
  // En 16:9, la vignette est bien plus basse qu'une affiche : la carte se réduit
  // d'autant, sinon le logo flotte au milieu d'un grand vide.
  const mediaHeight =
    wide && posterWidth !== undefined
      ? Math.round((posterWidth * 9) / 16)
      : posterHeight;

  return (
    <Focusable
      accessibilityLabel={subtitle === undefined ? title : `${title}, ${subtitle}`}
      onPress={onPress}
      onFocus={onFocus}
      hasTVPreferredFocus={hasTVPreferredFocus}
      testID={testID}
      style={[
        grid ? styles.grid : styles.list,
        grid && posterWidth !== undefined
          ? {
              width: posterWidth,
              height: (mediaHeight ?? posterWidth) + POSTER_TEXT_HEIGHT,
            }
          : undefined,
        !grid && rowHeight !== undefined ? {height: rowHeight} : undefined,
        style,
      ]}>
      {focused => (
        <>
          {grid && (
            <View style={[styles.posterArea, {height: mediaHeight}]}>
              {image === undefined ? (
                <Text style={styles.posterFallback} numberOfLines={3}>
                  {title}
                </Text>
              ) : (
                <Image
                  source={{uri: image}}
                  style={[styles.poster, wide && styles.wideImage]}
                  resizeMode={wide ? 'contain' : 'cover'}
                  accessible={false}
                />
              )}
              {badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
              {favorite === true && (
                <View style={styles.star} testID={`${testID ?? 'card'}-favorite`}>
                  <Text style={styles.starText}>★</Text>
                </View>
              )}
              {warning !== undefined && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningText}>{warning}</Text>
                </View>
              )}
            </View>
          )}

          <View style={grid ? styles.gridText : styles.row}>
            {!grid && icon !== undefined && (
              <Icon
                name={icon}
                size={fontSize.subtitle}
                color={focused ? colors.text : colors.textMuted}
                style={styles.leadingIcon}
              />
            )}
            {!grid && logoSlot !== undefined && (
              <View
                style={[styles.logoSlot, {width: logoSlot.width, height: logoSlot.height}]}>
                {image === undefined ? (
                  <Text style={styles.logoFallback} numberOfLines={1}>
                    {initials(title)}
                  </Text>
                ) : (
                  // `contain` et non `cover` : un logo de chaîne est fourni avec
                  // ses marges, le rogner coupe le sigle.
                  <Image
                    source={{uri: image}}
                    style={styles.logo}
                    resizeMode="contain"
                    accessible={false}
                  />
                )}
              </View>
            )}

            <View style={styles.rowText}>
              <Text
                style={[styles.title, focused && styles.titleFocused]}
                numberOfLines={1}>
                {favorite === true && !grid ? '★ ' : ''}
                {title}
              </Text>
              {subtitle !== undefined && subtitle !== '' && (
                <Text
                  style={[styles.subtitle, focused && styles.subtitleFocused]}
                  numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            {!grid && badge !== undefined && (
              <View style={styles.rowBadge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>

          {progress !== undefined && progress > 0 && (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.min(100, Math.max(0, progress * 100))}%`},
                ]}
              />
            </View>
          )}
        </>
      )}
    </Focusable>
  );
};

const styles = StyleSheet.create({
  grid: {
    // Dimensions réelles injectées par `useLayout()` ; ces valeurs ne servent
    // que de repli si un appelant oublie de les passer.
    width: 132,
    height: 240,
  },
  list: {
    justifyContent: 'center',
  },
  posterArea: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  wideImage: {
    // Un logo servi avec ses marges respire mal collé aux bords de la carte.
    padding: spacing.xs,
  },
  posterFallback: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.xxs,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xxs,
    paddingVertical: 1,
  },
  badgeText: {
    color: colors.accent,
    fontSize: fontSize.micro,
    fontWeight: '700',
  },
  star: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xxs,
  },
  starText: {
    color: colors.warning,
    fontSize: fontSize.caption,
  },
  warningBadge: {
    position: 'absolute',
    bottom: spacing.xxs,
    right: spacing.xxs,
    backgroundColor: colors.overlay,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingHorizontal: spacing.xxs,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.micro,
    fontWeight: '700',
  },
  gridText: {
    height: POSTER_TEXT_HEIGHT,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xxs,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  logoSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  logoFallback: {
    color: colors.textDim,
    fontSize: fontSize.caption,
    fontWeight: '700',
  },
  rowText: {
    flex: 1,
    justifyContent: 'center',
  },
  rowBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },
  titleFocused: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
  },
  subtitleFocused: {
    color: colors.text,
  },
  // Posée en absolu : empilée dans le flux, elle ajoutait 3 points à une carte
  // de hauteur fixe, et se faisait donc rogner par l'`overflow: hidden`.
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
  },
});
