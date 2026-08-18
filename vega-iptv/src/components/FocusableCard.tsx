import React, {useState} from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {colors, fontSize, radius, spacing} from '../theme';

export interface FocusableCardProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Carte focusable générique.
 *
 * L'indicateur de focus combine bordure, échelle et couleur : une variation de
 * couleur seule ne passe pas les critères d'accessibilité TV.
 */
export const FocusableCard = ({
  title,
  subtitle,
  onPress,
  hasTVPreferredFocus,
  style,
  testID,
}: FocusableCardProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      testID={testID}
      style={[styles.card, focused && styles.cardFocused, style]}>
      <View>
        <Text style={[styles.title, focused && styles.titleFocused]} numberOfLines={2}>
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: radius,
    padding: spacing.md,
    justifyContent: 'center',
  },
  cardFocused: {
    backgroundColor: colors.surfaceFocused,
    borderColor: colors.text,
    transform: [{scale: 1.06}],
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
    fontSize: fontSize.caption,
    marginTop: spacing.xs / 2,
  },
  subtitleFocused: {
    color: '#FFF3E6',
  },
});
