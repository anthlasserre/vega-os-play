import React from 'react';
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Focusable} from './Focusable';
import {colors, fontSize, spacing} from '../../theme';

export interface MediaCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  favorite?: boolean;
  /** Avancement de lecture entre 0 et 1 ; masqué si absent. */
  progress?: number;
  layout: 'grid' | 'list';
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const MediaCard = ({
  title,
  subtitle,
  image,
  badge,
  favorite,
  progress,
  layout,
  onPress,
  onFocus,
  hasTVPreferredFocus,
  style,
  testID,
}: MediaCardProps) => (
  <Focusable
    accessibilityLabel={subtitle === undefined ? title : `${title}, ${subtitle}`}
    onPress={onPress}
    onFocus={onFocus}
    hasTVPreferredFocus={hasTVPreferredFocus}
    testID={testID}
    style={[layout === 'grid' ? styles.grid : styles.list, style]}>
    {focused => (
      <>
        {layout === 'grid' && (
          <View style={styles.posterArea}>
            {image === undefined ? (
              <Text style={styles.placeholder} numberOfLines={3}>
                {title}
              </Text>
            ) : (
              <Image
                source={{uri: image}}
                style={styles.poster}
                resizeMode="cover"
                accessible={false}
              />
            )}
            {badge !== undefined && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
            {favorite === true && (
              <View style={styles.favorite} testID={`${testID ?? 'card'}-favorite`}>
                <Text style={styles.favoriteText}>★</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.textArea}>
          <Text
            style={[styles.title, focused && styles.titleFocused]}
            numberOfLines={layout === 'grid' ? 1 : 2}>
            {favorite === true && layout === 'list' ? '★ ' : ''}
            {title}
          </Text>
          {subtitle !== undefined && (
            <Text
              style={[styles.subtitle, focused && styles.subtitleFocused]}
              numberOfLines={1}>
              {subtitle}
            </Text>
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

const styles = StyleSheet.create({
  grid: {
    width: 240,
    height: 300,
  },
  list: {
    minHeight: 92,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  posterArea: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.overlay,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.accent,
    fontSize: fontSize.micro,
    fontWeight: '700',
  },
  favorite: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.overlay,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  favoriteText: {
    color: '#FDE047',
    fontSize: fontSize.caption,
  },
  textArea: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  titleFocused: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginTop: 2,
  },
  subtitleFocused: {
    color: '#FFF3E6',
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 5,
    backgroundColor: colors.accent,
  },
});
