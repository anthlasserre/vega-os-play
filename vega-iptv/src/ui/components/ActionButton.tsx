import React from 'react';
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Focusable} from './Focusable';
import {Icon, IconName} from './Icon';
import {colors, fontSize, radius, spacing} from '../../theme';

export interface ActionButtonProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
  tone?: 'default' | 'danger' | 'primary';
  /**
   * Masque le libellé et ne garde que l'icône. Le libellé reste porté par
   * `accessibilityLabel` : une cible sans nom accessible est inutilisable au
   * lecteur d'écran.
   */
  iconOnly?: boolean;
  /** Occupe toute la largeur disponible, pour une colonne de réglages. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Hauteur de la pastille, en points. Cible confortable à la télécommande. */
const HEIGHT = 34;

export const ActionButton = ({
  label,
  icon,
  onPress,
  hasTVPreferredFocus,
  tone = 'default',
  iconOnly,
  block,
  style,
  testID,
}: ActionButtonProps) => (
  <Focusable
    accessibilityLabel={label}
    onPress={onPress}
    hasTVPreferredFocus={hasTVPreferredFocus}
    // Un bouton porte un libellé court : l'aplat orange y reste lisible, et il
    // signale le focus plus franchement qu'un simple liseré.
    emphasis="fill"
    testID={testID}
    style={[
      styles.button,
      iconOnly === true ? styles.square : styles.padded,
      tone === 'danger' && styles.danger,
      tone === 'primary' && styles.primary,
      block === true && styles.block,
      style,
    ]}>
    {focused => (
      // Une rangée centrée sur les deux axes : le texte s'aligne alors sur
      // l'icône quelle que soit la hauteur de la pastille.
      <View style={styles.row}>
        {icon !== undefined && (
          <Icon
            name={icon}
            size={fontSize.body}
            color={
              focused
                ? '#FFFFFF'
                : tone === 'danger'
                ? colors.danger
                : tone === 'primary'
                ? colors.accent
                : colors.text
            }
          />
        )}
        {iconOnly !== true && (
          <Text
            style={[
              styles.label,
              icon !== undefined && styles.labelWithIcon,
              tone === 'primary' && !focused && styles.primaryLabel,
              tone === 'danger' && !focused && styles.dangerLabel,
              focused && styles.labelFocused,
            ]}
            numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    )}
  </Focusable>
);

const styles = StyleSheet.create({
  button: {
    height: HEIGHT,
    borderRadius: radius.pill,
  },
  padded: {
    paddingHorizontal: spacing.sm,
  },
  square: {
    width: HEIGHT,
  },
  block: {
    alignSelf: 'stretch',
  },
  danger: {
    borderColor: colors.danger,
  },
  primary: {
    borderColor: colors.accent,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: '600',
    // `includeFontPadding` sur Android laisse un liseré d'espace au-dessus du
    // texte : sans cette ligne le libellé paraît légèrement remonté dans la
    // pastille, même avec un centrage correct.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  labelWithIcon: {
    marginLeft: spacing.xs,
  },
  primaryLabel: {
    color: colors.accent,
  },
  dangerLabel: {
    color: colors.danger,
  },
  labelFocused: {
    color: '#FFFFFF',
  },
});
