import React, {useState} from 'react';
import {Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {colors, focusRing, radius} from '../../theme';

export interface FocusableProps {
  children: (focused: boolean) => React.ReactNode;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel: string;
  /**
   * `fill` peint la surface entière en orange : réservé aux boutons, dont le
   * libellé court reste lisible dessus. `ring` se contente d'un liseré et d'un
   * fond éclairci — le seul choix tenable pour une carte, où un aplat orange
   * écrase l'affiche et le texte.
   */
  emphasis?: 'ring' | 'fill';
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Brique focusable de base.
 *
 * Deux pièges évités ici, tous deux visibles à l'œil dans la version précédente.
 *
 * 1. **Pas d'agrandissement au focus.** Un `transform: scale()` fait sortir
 *    l'élément de sa boîte de layout, et le conteneur — cellule de `FlatList`,
 *    colonne à `overflow: hidden` — rogne ce qui dépasse : le liseré orange
 *    apparaissait tronqué en haut et en bas. Le focus se signale donc par la
 *    couleur du liseré et l'éclaircissement du fond, à géométrie constante.
 *    L'épaisseur de bordure ne change pas non plus, sinon le contenu se
 *    décalerait d'un point à chaque déplacement du curseur.
 *
 * 2. **Pas de vue intermédiaire.** Un `<View style={{flex: 1}}>` autour des
 *    enfants absorbait la hauteur et annulait le `justifyContent: 'center'`
 *    posé sur le bouton : les libellés se retrouvaient collés en haut. Les
 *    enfants sont donc rendus directement dans le `Pressable`, dont les styles
 *    d'alignement s'appliquent alors vraiment.
 */
export const Focusable = ({
  children,
  onPress,
  onFocus,
  onBlur,
  hasTVPreferredFocus,
  accessibilityLabel,
  emphasis = 'ring',
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
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.base,
        style,
        focused && (emphasis === 'fill' ? styles.filled : styles.ringed),
        focused && focusedStyle,
      ]}>
      {children(focused)}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: focusRing,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  ringed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.focus,
  },
  filled: {
    backgroundColor: colors.focus,
    borderColor: colors.focus,
  },
});
