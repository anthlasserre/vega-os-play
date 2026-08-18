import {DEMO_SOURCE, defaultState, parseState} from '../../src/storage/schema';

describe('parseState', () => {
  it('retombe sur les valeurs par défaut sur une entrée non-objet', () => {
    expect(parseState('cassé')).toEqual(defaultState());
    expect(parseState(null)).toEqual(defaultState());
  });

  it('réinjecte toujours la source de démo', () => {
    const state = parseState({
      sources: [{id: 'x', kind: 'm3u', label: 'X', url: 'http://x'}],
      activeSourceId: 'x',
    });

    expect(state.sources.some(source => source.kind === 'demo')).toBe(true);
    expect(state.activeSourceId).toBe('x');
  });

  it('écarte les sources malformées', () => {
    const state = parseState({
      sources: [
        {id: 'ok', kind: 'xtream', label: 'OK', host: 'h', username: 'u', password: 'p'},
        {id: 'ko', kind: 'xtream', label: 'KO'},
        {id: 'inconnu', kind: 'ftp', label: 'X'},
      ],
    });

    expect(state.sources.map(source => source.id)).toEqual([DEMO_SOURCE.id, 'ok']);
  });

  it('retombe sur la première source si l\'active n\'existe plus', () => {
    expect(parseState({sources: [], activeSourceId: 'disparu'}).activeSourceId).toBe(
      DEMO_SOURCE.id,
    );
  });

  it('déduplique les favoris et écarte les entrées non textuelles', () => {
    expect(parseState({favorites: ['a', 'a', 3, null, 'b']}).favorites).toEqual(['a', 'b']);
  });

  it('écarte les entrées d\'historique sans position', () => {
    const state = parseState({
      progress: [{key: 'k', positionSeconds: 10}, {key: 'x'}, 'nope'],
    });

    expect(state.progress).toHaveLength(1);
  });

  it('valide les réglages champ par champ', () => {
    const state = parseState({settings: {layout: 'mosaic', resumePlayback: 'oui'}});

    expect(state.settings).toEqual(defaultState().settings);
  });

  it('conserve des réglages valides', () => {
    expect(
      parseState({settings: {layout: 'list', resumePlayback: false}}).settings,
    ).toEqual({layout: 'list', resumePlayback: false});
  });
});
