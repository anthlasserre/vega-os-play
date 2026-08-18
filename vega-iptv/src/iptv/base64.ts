/* eslint-disable no-bitwise -- un décodeur base64 est de l'arithmétique de bits par nature. */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Décodeur base64 → UTF-8.
 *
 * Écrit à la main parce que `atob` n'est pas garanti sur Hermes, et que même là
 * où il existe il rend du latin-1 : les titres EPG accentués ressortent cassés.
 */
export const decodeBase64Utf8 = (input: string): string => {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];

  // Au-delà de la fin de la chaîne, l'index doit valoir -1 : `indexOf('')`
  // renvoie 0, ce qui ferait passer un caractère absent pour un 'A' et
  // ajouterait des octets fantômes en fin de décodage.
  const sextetAt = (index: number): number => {
    const char = clean[index];
    return char === undefined ? -1 : ALPHABET.indexOf(char);
  };

  for (let i = 0; i < clean.length; i += 4) {
    const chunk = [0, 1, 2, 3].map(offset => sextetAt(i + offset));
    const bits =
      (Math.max(chunk[0], 0) << 18) |
      (Math.max(chunk[1], 0) << 12) |
      (Math.max(chunk[2], 0) << 6) |
      Math.max(chunk[3], 0);

    bytes.push((bits >> 16) & 0xff);
    if (chunk[2] !== -1) {
      bytes.push((bits >> 8) & 0xff);
    }
    if (chunk[3] !== -1) {
      bytes.push(bits & 0xff);
    }
  }

  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const byte = bytes[i];
    let codePoint: number;
    let width: number;

    if (byte < 0x80) {
      codePoint = byte;
      width = 1;
    } else if (byte >= 0xf0) {
      codePoint = byte & 0x07;
      width = 4;
    } else if (byte >= 0xe0) {
      codePoint = byte & 0x0f;
      width = 3;
    } else if (byte >= 0xc0) {
      codePoint = byte & 0x1f;
      width = 2;
    } else {
      // Continuation isolée : séquence invalide, on la saute.
      i += 1;
      continue;
    }

    if (i + width > bytes.length) {
      break;
    }
    for (let k = 1; k < width; k += 1) {
      codePoint = (codePoint << 6) | (bytes[i + k] & 0x3f);
    }
    out += String.fromCodePoint(codePoint);
    i += width;
  }

  return out;
};

const LOOKS_BASE64 = /^[A-Za-z0-9+/\r\n]+={0,2}$/;

/**
 * Présence de caractères de contrôle : signe qu'on a décodé du binaire, pas du
 * texte. Écrit en boucle plutôt qu'en classe de caractères pour garder le source
 * lisible et sans octet de contrôle littéral.
 */
const hasControlChars = (value: string): boolean => {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      return true;
    }
  }
  return false;
};

/**
 * Les panels Xtream encodent titres et descriptions EPG en base64, mais pas
 * toujours : certains renvoient du texte brut. On ne décode que si la chaîne
 * ressemble vraiment à du base64 et que le résultat n'est pas du binaire.
 */
export const decodeMaybeBase64 = (input: string | undefined): string => {
  if (input === undefined || input === '') {
    return '';
  }
  const compact = input.replace(/[\r\n]/g, '');
  if (!LOOKS_BASE64.test(input) || compact.length % 4 !== 0) {
    return input;
  }
  const decoded = decodeBase64Utf8(compact);
  return decoded === '' || hasControlChars(decoded) ? input : decoded;
};
