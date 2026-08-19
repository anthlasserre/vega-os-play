import {MAX_ERROR_LENGTH, describePlaybackError} from '../../src/player/errors';

describe('describePlaybackError', () => {
  it('traduit un statut HTTP présent dans data', () => {
    // Le cas réel qui a motivé cette fonction : le portail répond 407 et Shaka
    // range plusieurs kilo-octets d'en-têtes dans `data`.
    const message = describePlaybackError({
      severity: 2,
      category: 1,
      code: 1001,
      data: ['http://portail/live/x.m3u8', 407, '', {'cf-ray': 'a'.repeat(4000)}],
    });
    expect(message).toContain('limite de connexions');
    expect(message).toContain('HTTP 407');
    expect(message).not.toContain('cf-ray');
  });

  it('retombe sur le code quand aucun statut HTTP n’est exploitable', () => {
    expect(describePlaybackError({category: 1, code: 1003, data: []})).toContain(
      'trop de temps',
    );
  });

  it('retombe sur la catégorie pour un code inconnu', () => {
    const message = describePlaybackError({category: 6, code: 6999, data: []});
    expect(message).toContain('protégé');
    expect(message).toContain('code 6999');
  });

  it('reste lisible sur un objet Shaka nu', () => {
    expect(describePlaybackError({code: 9999})).toBe('Lecture impossible. (code 9999)');
  });

  it('ignore un nombre hors plage HTTP dans data', () => {
    // `data[1]` vaut ici une durée, pas un statut.
    const message = describePlaybackError({category: 1, code: 1002, data: ['url', 42]});
    expect(message).not.toContain('HTTP');
    expect(message).toContain('Erreur réseau');
  });

  it('utilise le message d’une Error standard', () => {
    expect(describePlaybackError(new Error('surface perdue'))).toBe('surface perdue');
  });

  it('tronque un message interminable', () => {
    const long = describePlaybackError(new Error('x'.repeat(1000)));
    expect(long).toHaveLength(MAX_ERROR_LENGTH);
    expect(long.endsWith('…')).toBe(true);
  });

  it('accepte une chaîne', () => {
    expect(describePlaybackError('flux coupé')).toBe('flux coupé');
  });

  it('a un repli pour null, undefined et une Error vide', () => {
    expect(describePlaybackError(null)).toBe('Lecture impossible.');
    expect(describePlaybackError(undefined)).toBe('Lecture impossible.');
    expect(describePlaybackError(new Error(''))).toBe('Lecture impossible.');
  });
});

describe('describePlaybackError — MediaError du lecteur W3C', () => {
  it('traduit les quatre codes du HTMLMediaElement', () => {
    // Cas réel : une entrée « ##### GENERAL ##### » du bouquet, qui n'est pas
    // une chaîne mais un séparateur. Le lecteur rendait « code 3 » brut.
    expect(describePlaybackError({code: 3})).toContain('décodeur');
    expect(describePlaybackError({code: 4})).toContain('pas lisible');
    expect(describePlaybackError({code: 2})).toContain('réseau');
    expect(describePlaybackError({code: 1})).toContain('interrompue');
  });

  it('ne confond pas un code Shaka avec un MediaError', () => {
    // Même valeur numérique, mais la présence de `category` et `data` tranche.
    const shaka = describePlaybackError({code: 3, category: 3, data: []});
    expect(shaka).toContain('code 3');
    expect(describePlaybackError({code: 3})).not.toContain('code 3');
  });
});

describe('describePlaybackError — conteneur en cause', () => {
  it('nomme le conteneur quand il est connu pour être refusé', () => {
    const message = describePlaybackError({code: 4}, {container: 'MKV', risky: true});
    expect(message).toContain('MKV');
    expect(message).toContain('lecture directe');
  });

  it('reste prudent sur un conteneur sans historique de refus', () => {
    const message = describePlaybackError({code: 4}, {container: 'MP4', risky: false});
    expect(message).toContain('MP4');
    expect(message).toContain('adresse invalide');
  });

  it('retombe sur le message générique sans contexte', () => {
    expect(describePlaybackError({code: 4})).toContain('pas lisible');
  });

  it("n'enrichit que le code 4", () => {
    const message = describePlaybackError({code: 2}, {container: 'MKV', risky: true});
    expect(message).toContain('réseau');
    expect(message).not.toContain('MKV');
  });
});
