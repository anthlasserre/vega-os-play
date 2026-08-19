import {
  MAX_HISTORY_ENTRIES,
  clearHistory,
  recordHistory,
  removeHistoryEntry,
} from '../../src/storage/reducers';
import {
  HistoryEntry,
  PersistedState,
  defaultState,
} from '../../src/storage/schema';

const watched = (over: Partial<HistoryEntry> = {}): Omit<HistoryEntry, 'plays'> => ({
  key: 'live:c1',
  kind: 'live',
  itemId: 'c1',
  sourceId: 'portail',
  title: 'TF1',
  url: 'http://u/1',
  live: true,
  watchedAt: 1_000,
  ...over,
});

describe('recordHistory', () => {
  it('ajoute une entrée avec un compteur à 1', () => {
    const state = recordHistory(defaultState(), watched());
    expect(state.history).toHaveLength(1);
    expect(state.history[0].plays).toBe(1);
    expect(state.history[0].title).toBe('TF1');
  });

  it('remonte une entrée déjà vue et incrémente son compteur', () => {
    const first = recordHistory(defaultState(), watched());
    const other = recordHistory(first, watched({key: 'live:c2', itemId: 'c2', title: 'France 2'}));
    const again = recordHistory(other, watched({watchedAt: 5_000}));

    expect(again.history).toHaveLength(2);
    expect(again.history[0].key).toBe('live:c1');
    expect(again.history[0].plays).toBe(2);
    expect(again.history[0].watchedAt).toBe(5_000);
  });

  it('met à jour les métadonnées à la relecture', () => {
    const first = recordHistory(defaultState(), watched({title: 'Ancien nom'}));
    const again = recordHistory(first, watched({title: 'Nouveau nom'}));
    expect(again.history[0].title).toBe('Nouveau nom');
  });

  it('borne la taille du journal', () => {
    let state: PersistedState = defaultState();
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 20; i += 1) {
      state = recordHistory(state, watched({key: `live:c${i}`, itemId: `c${i}`, watchedAt: i}));
    }
    expect(state.history).toHaveLength(MAX_HISTORY_ENTRIES);
    // La plus récente est conservée, la plus ancienne évincée.
    expect(state.history[0].itemId).toBe(`c${MAX_HISTORY_ENTRIES + 19}`);
    expect(state.history.some(entry => entry.itemId === 'c0')).toBe(false);
  });
});

describe('removeHistoryEntry', () => {
  it('retire une seule ligne', () => {
    const state = recordHistory(
      recordHistory(defaultState(), watched()),
      watched({key: 'movie:m1', kind: 'movie', itemId: 'm1', live: false}),
    );
    const pruned = removeHistoryEntry(state, 'live:c1');
    expect(pruned.history.map(entry => entry.key)).toEqual(['movie:m1']);
  });
});

describe('clearHistory', () => {
  it('vide le journal sans toucher aux reprises', () => {
    const state = {
      ...recordHistory(defaultState(), watched()),
      progress: [
        {
          key: 'movie:m1',
          kind: 'movie' as const,
          itemId: 'm1',
          sourceId: 'portail',
          title: 'Film',
          url: 'http://u',
          positionSeconds: 60,
          durationSeconds: 600,
          updatedAt: 1,
        },
      ],
    };
    const cleared = clearHistory(state);
    expect(cleared.history).toEqual([]);
    expect(cleared.progress).toHaveLength(1);
  });
});
