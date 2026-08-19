import React from 'react';
import {Image, StyleProp, StyleSheet, ImageStyle} from 'react-native';
import {colors} from '../../theme';

/**
 * Icônes de l'application.
 *
 * Tracés Feather (MIT) rastérisés en PNG par `scripts/build-icons.py` — voir
 * `src/ui/icons/README.md` pour le pourquoi de ce détour. Les `require` sont
 * écrits en clair parce que Metro résout les ressources statiquement : un chemin
 * calculé (`require(\`../icons/${name}.png\`)`) ne compile pas.
 */
const SOURCES = {
  audio: require('../icons/audio.png'),
  back: require('../icons/back.png'),
  buffer: require('../icons/buffer.png'),
  checked: require('../icons/checked.png'),
  close: require('../icons/close.png'),
  eye: require('../icons/eye.png'),
  'eye-off': require('../icons/eye-off.png'),
  favorite: require('../icons/favorite.png'),
  filter: require('../icons/filter.png'),
  forward: require('../icons/forward.png'),
  grid: require('../icons/grid.png'),
  history: require('../icons/history.png'),
  info: require('../icons/info.png'),
  list: require('../icons/list.png'),
  live: require('../icons/live.png'),
  movie: require('../icons/movie.png'),
  next: require('../icons/next.png'),
  pause: require('../icons/pause.png'),
  play: require('../icons/play.png'),
  previous: require('../icons/previous.png'),
  reload: require('../icons/reload.png'),
  rewind: require('../icons/rewind.png'),
  search: require('../icons/search.png'),
  series: require('../icons/series.png'),
  settings: require('../icons/settings.png'),
  source: require('../icons/source.png'),
  star: require('../icons/star.png'),
  subtitles: require('../icons/subtitles.png'),
  trash: require('../icons/trash.png'),
  unchecked: require('../icons/unchecked.png'),
} as const;

export type IconName = keyof typeof SOURCES;

export interface IconProps {
  name: IconName;
  /** Côté du carré, en points. Par défaut aligné sur la hauteur du texte. */
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}

const DEFAULT_SIZE = 16;

export const Icon = ({name, size = DEFAULT_SIZE, color, style}: IconProps) => (
  <Image
    source={SOURCES[name]}
    // Les PNG sont blancs : `tintColor` les recolore. Si la plateforme ignorait
    // la propriété, l'icône resterait blanche — lisible dans tous les cas, sur
    // fond sombre comme sur l'orange du focus.
    style={[styles.icon, {width: size, height: size}, {tintColor: color}, style]}
    resizeMode="contain"
    accessible={false}
  />
);

const styles = StyleSheet.create({
  icon: {
    tintColor: colors.text,
  },
});
