import {normalise, searchCatalog} from '../src/iptv/search';
import {Catalog} from '../src/iptv/types';

const catalog: Catalog = {
  live: {
    categories: [],
    items: [
      {kind: 'live', id: 'l1', name: 'beIN SPORTS 1', url: 'u', categoryId: 'c', archiveDays: 0},
      {kind: 'live', id: 'l2', name: 'Canal+ Cinéma', url: 'u', categoryId: 'c', archiveDays: 0},
    ],
  },
  movies: {
    categories: [],
    items: [{kind: 'movie', id: 'm1', name: 'Le Fabuleux Destin', url: 'u', categoryId: 'c'}],
  },
  series: {
    categories: [],
    items: [{kind: 'series', id: 's1', name: 'Engrenages', categoryId: 'c'}],
  },
  account: null,
};

describe('normalise', () => {
  it('supprime accents et casse', () => {
    expect(normalise('  Canal+ CINÉMA ')).toBe('canal+ cinema');
  });
});

describe('searchCatalog', () => {
  it('cherche dans les trois sections', () => {
    expect(searchCatalog(catalog, 'e').total).toBe(4);
  });

  it('ignore l\'ordre des mots', () => {
    expect(searchCatalog(catalog, 'sports bein').live).toHaveLength(1);
    expect(searchCatalog(catalog, 'bein sports').live).toHaveLength(1);
  });

  it('ignore les accents', () => {
    expect(searchCatalog(catalog, 'cinema').live[0].name).toBe('Canal+ Cinéma');
  });

  it('rend un résultat vide sur une requête vide', () => {
    expect(searchCatalog(catalog, '   ')).toEqual({
      live: [],
      movies: [],
      series: [],
      total: 0,
    });
  });

  it('plafonne chaque section mais compte le total réel', () => {
    const results = searchCatalog(catalog, 'e', 1);

    expect(results.live).toHaveLength(1);
    expect(results.total).toBe(4);
  });
});
