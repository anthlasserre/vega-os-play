import React, {useState} from 'react';
import {StyleProp, StyleSheet, Text, TextInput, View, ViewStyle} from 'react-native';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'url' | 'numeric';
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Champ texte pour télécommande.
 *
 * Sur Fire TV la saisie passe par le clavier système : le `TextInput` doit être
 * focusable et signaler visiblement son focus, sinon l'utilisateur ne sait pas
 * où il en est.
 */
export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType = 'default',
  hasTVPreferredFocus,
  style,
  testID,
}: TextFieldProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        hasTVPreferredFocus={hasTVPreferredFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: radius,
    color: colors.text,
    fontSize: fontSize.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 60,
  },
  inputFocused: {
    borderColor: colors.focus,
    backgroundColor: colors.surfaceAlt,
  },
});
