import {
  DEFAULT_LIVE_BUFFER_SECONDS,
  LIVE_BUFFER_CHOICES,
  nextLiveBuffer,
  parseState,
} from '../../src/storage/schema';

describe('nextLiveBuffer', () => {
  it('parcourt les paliers puis reboucle', () => {
    const seen: number[] = [];
    let current: number = LIVE_BUFFER_CHOICES[0];
    for (let i = 0; i < LIVE_BUFFER_CHOICES.length; i += 1) {
      seen.push(current);
      current = nextLiveBuffer(current);
    }
    expect(seen).toEqual([...LIVE_BUFFER_CHOICES]);
    expect(current).toBe(LIVE_BUFFER_CHOICES[0]);
  });

  it('repart du premier palier sur une valeur inconnue', () => {
    expect(nextLiveBuffer(7)).toBe(LIVE_BUFFER_CHOICES[0]);
  });
});

describe('parseState — tampon direct', () => {
  it('applique la valeur par défaut quand le champ manque', () => {
    expect(parseState({}).settings.liveBufferSeconds).toBe(
      DEFAULT_LIVE_BUFFER_SECONDS,
    );
  });

  it('conserve un palier valide', () => {
    expect(
      parseState({settings: {liveBufferSeconds: 20}}).settings.liveBufferSeconds,
    ).toBe(20);
  });

  it('ramène une valeur libre au palier le plus proche', () => {
    // Une valeur bricolée à la main dans le fichier ne doit pas se propager
    // jusqu'à la configuration Shaka.
    expect(
      parseState({settings: {liveBufferSeconds: 17}}).settings.liveBufferSeconds,
    ).toBe(20);
    expect(
      parseState({settings: {liveBufferSeconds: 3}}).settings.liveBufferSeconds,
    ).toBe(2);
    expect(
      parseState({settings: {liveBufferSeconds: 900}}).settings.liveBufferSeconds,
    ).toBe(30);
  });

  it('ignore un type invalide', () => {
    expect(
      parseState({settings: {liveBufferSeconds: 'beaucoup'}}).settings
        .liveBufferSeconds,
    ).toBe(DEFAULT_LIVE_BUFFER_SECONDS);
    expect(
      parseState({settings: {liveBufferSeconds: Number.NaN}}).settings
        .liveBufferSeconds,
    ).toBe(DEFAULT_LIVE_BUFFER_SECONDS);
  });
});
