import {
  MAX_PROGRESS_ENTRIES,
  MIN_RESUME_SECONDS,
  addSource,
  clearProgress,
  isFavorite,
  progressFor,
  recordProgress,
  removeSource,
  selectSource,
  toggleFavorite,
  updateSettings,
} from '../../src/storage/reducers';
import {PersistedState, PlaybackProgress, defaultState} from '../../src/storage/schema';

const entry = (over: Partial<PlaybackProgress> = {}): PlaybackProgress => ({
  key: 'movie:m1',
  kind: 'movie',
  itemId: 'm1',
  sourceId: 'portail',
  title: 'Film',
  url: 'http://u',
  positionSeconds: 600,
  durationSeconds: 6000,
  updatedAt: 1000,
  ...over,
});

const withSources = (): PersistedState => ({
  ...defaultState(),
  sources: [
    ...defaultState().sources,
    {id: 'portail', kind: 'xtream', label: 'P', host: 'h', username: 'u', password: 'p'},
  ],
});

describe('favoris', () => {
  it('bascule dans les deux sens', () => {
    const added = toggleFavorite(defaultState(), 'live', 'l1');
    expect(isFavorite(added, 'live', 'l1')).toBe(true);

    const removed = toggleFavorite(added, 'live', 'l1');
    expect(isFavorite(removed, 'live', 'l1')).toBe(false);
  });

  it('sépare les types partageant un identifiant', () => {
    const state = toggleFavorite(defaultState(), 'movie', 'x');

    expect(isFavorite(state, 'movie', 'x')).toBe(true);
    expect(isFavorite(state, 'series', 'x')).toBe(false);
  });
});

describe('recordProgress', () => {
  it('enregistre une lecture en cours', () => {
    const state = recordProgress(defaultState(), entry());

    expect(progressFor(state, 'movie', 'm1')?.positionSeconds).toBe(600);
  });

  it('ignore une lecture à peine commencée', () => {
    const state = recordProgress(
      defaultState(),
      entry({positionSeconds: MIN_RESUME_SECONDS - 1}),
    );

    expect(state.progress).toHaveLength(0);
  });

  it('retire une lecture quasiment terminée', () => {
    const started = recordProgress(defaultState(), entry());
    const finished = recordProgress(started, entry({positionSeconds: 5900}));

    expect(finished.progress).toHaveLength(0);
  });

  it('ignore un contenu sans durée (direct)', () => {
    expect(
      recordProgress(defaultState(), entry({durationSeconds: 0})).progress,
    ).toHaveLength(0);
  });

  it('remplace l\'entrée existante au lieu de la dupliquer', () => {
    const first = recordProgress(defaultState(), entry());
    const second = recordProgress(first, entry({positionSeconds: 900, updatedAt: 2000}));

    expect(second.progress).toHaveLength(1);
    expect(second.progress[0].positionSeconds).toBe(900);
  });

  it('trie par récence et plafonne la liste', () => {
    let state = defaultState();
    for (let i = 0; i < MAX_PROGRESS_ENTRIES + 5; i += 1) {
      state = recordProgress(
        state,
        entry({key: `movie:m${i}`, itemId: `m${i}`, updatedAt: i}),
      );
    }

    expect(state.progress).toHaveLength(MAX_PROGRESS_ENTRIES);
    expect(state.progress[0].itemId).toBe(`m${MAX_PROGRESS_ENTRIES + 4}`);
  });

  it('vide l\'historique', () => {
    expect(clearProgress(recordProgress(defaultState(), entry())).progress).toEqual([]);
  });
});

describe('sources', () => {
  it('ajoute une source et la rend active', () => {
    const state = addSource(defaultState(), {
      id: 'x',
      kind: 'm3u',
      label: 'X',
      url: 'http://x',
    });

    expect(state.activeSourceId).toBe('x');
    expect(state.sources).toHaveLength(2);
  });

  it('remplace une source de même identifiant', () => {
    const first = addSource(defaultState(), {
      id: 'x',
      kind: 'm3u',
      label: 'Ancien',
      url: 'http://a',
    });
    const second = addSource(first, {
      id: 'x',
      kind: 'm3u',
      label: 'Nouveau',
      url: 'http://b',
    });

    expect(second.sources.filter(source => source.id === 'x')).toHaveLength(1);
    expect(second.sources.find(source => source.id === 'x')?.label).toBe('Nouveau');
  });

  it('supprime une source avec ses favoris et son historique', () => {
    let state = withSources();
    state = selectSource(state, 'portail');
    state = toggleFavorite(state, 'movie', 'portail:movie:1');
    state = recordProgress(state, entry({sourceId: 'portail'}));

    const cleaned = removeSource(state, 'portail');

    expect(cleaned.sources.map(source => source.id)).toEqual(['demo']);
    expect(cleaned.favorites).toEqual([]);
    expect(cleaned.progress).toEqual([]);
    expect(cleaned.activeSourceId).toBe('demo');
  });

  it('refuse de supprimer la source de démo', () => {
    expect(removeSource(defaultState(), 'demo')).toEqual(defaultState());
  });

  it('ignore une sélection vers une source inconnue', () => {
    expect(selectSource(defaultState(), 'fantôme')).toEqual(defaultState());
  });
});

describe('updateSettings', () => {
  it('applique un patch partiel', () => {
    expect(updateSettings(defaultState(), {layout: 'list'}).settings).toEqual({
      layout: 'list',
      resumePlayback: true,
    });
  });
});
