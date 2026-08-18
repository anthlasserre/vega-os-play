import {labelTrack, readTrackList} from '../../src/player/tracks';

describe('labelTrack', () => {
  it('préfère le libellé fourni', () => {
    expect(labelTrack({id: '1', label: 'VF Dolby', language: 'fr'}, 0)).toBe('VF Dolby');
  });

  it('traduit un code langue connu', () => {
    expect(labelTrack({id: '1', language: 'eng'}, 0)).toBe('Anglais');
  });

  it('remonte le code en majuscules pour une langue inconnue', () => {
    expect(labelTrack({id: '1', language: 'zho'}, 0)).toBe('ZHO');
  });

  it('retombe sur un numéro de piste sans métadonnée', () => {
    expect(labelTrack({id: '1'}, 2)).toBe('Piste 3');
  });

  it('ignore un libellé vide', () => {
    expect(labelTrack({id: '1', label: '   ', language: 'fr'}, 0)).toBe('Français');
  });
});

describe('readTrackList', () => {
  it('convertit une TrackList indexée en tableau', () => {
    const list = {length: 2, 0: {id: 'a'}, 1: {id: 'b'}} as {length: number};

    expect(readTrackList<{id: string}>(list)).toEqual([{id: 'a'}, {id: 'b'}]);
  });

  it('rend un tableau vide sans liste', () => {
    expect(readTrackList(undefined)).toEqual([]);
  });

  it('ignore les trous', () => {
    const sparse = {length: 3, 0: {id: 'a'}} as {length: number};

    expect(readTrackList<{id: string}>(sparse)).toEqual([{id: 'a'}]);
  });
});
