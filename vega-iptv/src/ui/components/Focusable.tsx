import React, {useState} from 'react';
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {colors, radius} from '../../theme';

export interface FocusableProps {
  children: (focused: boolean) => React.ReactNode;
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Brique focusable de base.
 *
 * L'indicateur de focus combine bordure, échelle et couleur : une variation de
 * couleur seule ne passe pas les critères d'accessibilité TV.
 */
export const Focusable = ({
  children,
  onPress,
  onFocus,
  hasTVPreferredFocus,
  accessibilityLabel,
  style,
  focusedStyle,
  testID,
}: FocusableProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      testID={testID}
      style={[styles.base, focused && styles.focused, style, focused && focusedStyle]}>
      <View style={styles.content}>{children(focused)}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: radius,
    overflow: 'hidden',
  },
  focused: {
    backgroundColor: colors.focus,
    borderColor: colors.text,
    transform: [{scale: 1.05}],
  },
  content: {
    flex: 1,
  },
});
