import React from 'react';
import {StyleProp, StyleSheet, Text, ViewStyle} from 'react-native';
import {Focusable} from './Focusable';
import {colors, fontSize, spacing} from '../../theme';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  tone?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ActionButton = ({
  label,
  onPress,
  hasTVPreferredFocus,
  tone = 'default',
  style,
  testID,
}: ActionButtonProps) => (
  <Focusable
    accessibilityLabel={label}
    onPress={onPress}
    hasTVPreferredFocus={hasTVPreferredFocus}
    testID={testID}
    style={[styles.button, tone === 'danger' && styles.danger, style]}>
    {focused => (
      <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
    )}
  </Focusable>
);

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 160,
  },
  danger: {
    borderColor: colors.danger,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelFocused: {
    color: '#FFFFFF',
  },
});
