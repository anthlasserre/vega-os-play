import {decodeBase64Utf8, decodeMaybeBase64} from '../src/iptv/base64';
import {encodeBase64Utf8, encodeBytes} from './base64Fixture';

describe('decodeBase64Utf8', () => {
  it('décode de l\'ASCII', () => {
    expect(decodeBase64Utf8('SGVsbG8gd29ybGQ=')).toBe('Hello world');
  });

  it('décode de l\'UTF-8 accentué', () => {
    const encoded = encodeBase64Utf8('Journée télé — été');
    expect(decodeBase64Utf8(encoded)).toBe('Journée télé — été');
  });

  it('décode un émoji (paire de substitution)', () => {
    const encoded = encodeBase64Utf8('Foot ⚽ direct');
    expect(decodeBase64Utf8(encoded)).toBe('Foot ⚽ direct');
  });
});

describe('decodeMaybeBase64', () => {
  it('laisse passer un titre déjà en clair', () => {
    expect(decodeMaybeBase64('Le journal de 20h')).toBe('Le journal de 20h');
  });

  it('décode un titre encodé', () => {
    const encoded = encodeBase64Utf8('Le journal');
    expect(decodeMaybeBase64(encoded)).toBe('Le journal');
  });

  it('rend une chaîne vide pour une entrée absente', () => {
    expect(decodeMaybeBase64(undefined)).toBe('');
  });

  it('préserve l\'entrée quand le décodage produit du binaire', () => {
    const binary = encodeBytes([0x00, 0x01, 0x02, 0x03]);
    expect(decodeMaybeBase64(binary)).toBe(binary);
  });

  it('préserve un mot qui ressemble à du base64 mais n\'en est pas', () => {
    // Longueur non multiple de 4 : ne peut pas être du base64 valide.
    expect(decodeMaybeBase64('Sport')).toBe('Sport');
  });
});
