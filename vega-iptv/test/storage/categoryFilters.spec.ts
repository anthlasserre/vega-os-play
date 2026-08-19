import {
  applyCategoryFilter,
  hiddenCategoriesFor,
  hideAllCategories,
  isCategoryHidden,
  removeSource,
  showAllCategories,
  toggleCategoryHidden,
} from '../../src/storage/reducers';
import {PersistedState, defaultState, filterKey} from '../../src/storage/schema';
import {Category} from '../../src/iptv/types';

const CATEGORIES: Category[] = [
  {id: 'a', name: 'Sport', count: 3},
  {id: 'b', name: 'Cinéma', count: 5},
  {id: 'c', name: 'Adulte', count: 9},
];

const withPortal = (): PersistedState => ({
  ...defaultState(),
  sources: [
    ...defaultState().sources,
    {id: 'portail', kind: 'xtream', label: 'P', host: 'h', username: 'u', password: 'p'},
  ],
});

describe('toggleCategoryHidden', () => {
  it('masque puis réaffiche', () => {
    const hidden = toggleCategoryHidden(defaultState(), 'portail', 'live', 'c');
    expect(isCategoryHidden(hidden, 'portail', 'live', 'c')).toBe(true);

    const shown = toggleCategoryHidden(hidden, 'portail', 'live', 'c');
    expect(isCategoryHidden(shown, 'portail', 'live', 'c')).toBe(false);
  });

  it("nettoie la clé quand plus rien n'est masqué", () => {
    const hidden = toggleCategoryHidden(defaultState(), 'portail', 'live', 'c');
    const shown = toggleCategoryHidden(hidden, 'portail', 'live', 'c');
    expect(shown.hiddenCategories[filterKey('portail', 'live')]).toBeUndefined();
  });

  it('isole les types entre eux', () => {
    const state = toggleCategoryHidden(defaultState(), 'portail', 'live', 'a');
    expect(isCategoryHidden(state, 'portail', 'live', 'a')).toBe(true);
    expect(isCategoryHidden(state, 'portail', 'movie', 'a')).toBe(false);
  });

  it('isole les sources entre elles', () => {
    const state = toggleCategoryHidden(defaultState(), 'portail', 'live', 'a');
    expect(isCategoryHidden(state, 'autre', 'live', 'a')).toBe(false);
  });
});

describe('hideAllCategories / showAllCategories', () => {
  it('masque tout puis remet tout', () => {
    const none = hideAllCategories(defaultState(), 'portail', 'live', CATEGORIES);
    expect(hiddenCategoriesFor(none, 'portail', 'live')).toEqual(['a', 'b', 'c']);

    const all = showAllCategories(none, 'portail', 'live');
    expect(hiddenCategoriesFor(all, 'portail', 'live')).toEqual([]);
  });
});

describe('applyCategoryFilter', () => {
  const items = [
    {id: '1', categoryId: 'a'},
    {id: '2', categoryId: 'b'},
    {id: '3', categoryId: 'c'},
  ];

  it('rend les entrées inchangées sans filtre', () => {
    const out = applyCategoryFilter([], CATEGORIES, items);
    expect(out.categories).toBe(CATEGORIES);
    expect(out.items).toBe(items);
  });

  it('retire les catégories ET leurs éléments', () => {
    const out = applyCategoryFilter(['c'], CATEGORIES, items);
    expect(out.categories.map(c => c.id)).toEqual(['a', 'b']);
    expect(out.items.map(i => i.id)).toEqual(['1', '2']);
  });

  it('peut tout masquer', () => {
    const out = applyCategoryFilter(['a', 'b', 'c'], CATEGORIES, items);
    expect(out.categories).toEqual([]);
    expect(out.items).toEqual([]);
  });
});

describe('removeSource', () => {
  it('emporte les filtres de la source supprimée', () => {
    const state = toggleCategoryHidden(withPortal(), 'portail', 'live', 'c');
    const pruned = removeSource(state, 'portail');
    expect(pruned.hiddenCategories).toEqual({});
  });

  it("laisse les filtres des autres sources", () => {
    const state = toggleCategoryHidden(withPortal(), 'autre', 'live', 'c');
    const pruned = removeSource(state, 'portail');
    expect(hiddenCategoriesFor(pruned, 'autre', 'live')).toEqual(['c']);
  });
});
