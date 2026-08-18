/* eslint-disable no-bitwise -- encodeur base64 : arithmétique de bits par nature. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encodeur base64 UTF-8 pour les tests.
 *
 * Écrit ici plutôt qu'en s'appuyant sur `Buffer` : le code applicatif tourne sur
 * Hermes, pas sur Node, et un fixture qui dépend de Node fait entrer ses types
 * dans la compilation du projet.
 */
export const encodeBase64Utf8 = (input: string): string => {
  const bytes: number[] = [];
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const bits =
      (bytes[i] << 16) |
      ((remaining > 1 ? bytes[i + 1] : 0) << 8) |
      (remaining > 2 ? bytes[i + 2] : 0);

    out += ALPHABET[(bits >> 18) & 0x3f];
    out += ALPHABET[(bits >> 12) & 0x3f];
    out += remaining > 1 ? ALPHABET[(bits >> 6) & 0x3f] : '=';
    out += remaining > 2 ? ALPHABET[bits & 0x3f] : '=';
  }
  return out;
};

/** Suite d'octets non textuels, pour vérifier qu'on ne décode pas du binaire. */
export const encodeBytes = (bytes: number[]): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const bits =
      (bytes[i] << 16) |
      ((remaining > 1 ? bytes[i + 1] : 0) << 8) |
      (remaining > 2 ? bytes[i + 2] : 0);

    out += ALPHABET[(bits >> 18) & 0x3f];
    out += ALPHABET[(bits >> 12) & 0x3f];
    out += remaining > 1 ? ALPHABET[(bits >> 6) & 0x3f] : '=';
    out += remaining > 2 ? ALPHABET[bits & 0x3f] : '=';
  }
  return out;
};
