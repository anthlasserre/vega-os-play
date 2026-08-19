import React, {useRef, useState} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import {Icon, IconName} from './Icon';
import {colors, focusRing, fontSize, radius, spacing} from '../../theme';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'default' | 'url' | 'numeric';
  /** Pictogramme d'appoint, à droite du champ. */
  icon?: IconName;
  hasTVPreferredFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Champ texte pour télécommande.
 *
 * Deux exigences se combinent mal sur un téléviseur, et il faut les tenir toutes
 * les deux.
 *
 * 1. **Le champ doit être atteignable au D-PAD.** C'est le `TextInput` lui-même
 *    qui porte le focus : l'envelopper dans un `Pressable` et retirer l'entrée de
 *    l'ordre de tabulation rend le champ tout simplement inaccessible — le
 *    curseur passe au travers sans jamais s'y arrêter.
 *
 * 2. **Le clavier système doit s'ouvrir.** Recevoir le focus ne le déclenche pas
 *    partout : `showSoftInputOnFocus` le réclame explicitement plutôt que de
 *    s'en remettre au défaut de la plateforme, et un appui sur la touche de
 *    validation rappelle `focus()` — ce qui rouvre le clavier si l'utilisateur
 *    l'avait fermé sans quitter le champ.
 */
export const TextField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType = 'default',
  icon,
  hasTVPreferredFocus,
  style,
  testID,
}: TextFieldProps) => {
  const input = useRef<TextInput | null>(null);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <TextInput
          ref={input}
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          hasTVPreferredFocus={hasTVPreferredFocus}
          // Sans cette demande explicite, le champ peut recevoir le focus
          // D-PAD sans qu'aucun clavier n'apparaisse : le champ paraît alors
          // actif mais rien ne s'y saisit.
          showSoftInputOnFocus={true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // Rouvre le clavier si l'utilisateur l'a refermé en restant dans le
          // champ ; `focus()` est sans effet si le clavier est déjà là.
          onSubmitEditing={() => input.current?.focus()}
          style={styles.input}
        />
        {icon !== undefined && (
          <Icon
            name={icon}
            size={fontSize.caption}
            color={focused ? colors.text : colors.textDim}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.micro,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: focusRing,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    minHeight: 38,
  },
  fieldFocused: {
    borderColor: colors.focus,
    backgroundColor: colors.surfaceAlt,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.caption,
    padding: 0,
    includeFontPadding: false,
  },
});
