import {emptyCatalog, loadCatalog} from '../src/iptv/catalog';
import {streamKindOf} from '../src/player/streamKind';

describe('emptyCatalog', () => {
  it('produit des sections vides et pas de compte', () => {
    const catalog = emptyCatalog();

    expect(catalog.live.items).toEqual([]);
    expect(catalog.movies.items).toEqual([]);
    expect(catalog.series.items).toEqual([]);
    expect(catalog.account).toBeNull();
  });
});

describe('source de démo', () => {
  it('expose des chaînes et des films sans réseau', async () => {
    const catalog = await loadCatalog({id: 'demo', kind: 'demo', label: 'Démo'});

    expect(catalog.live.items.length).toBeGreaterThanOrEqual(6);
    expect(catalog.movies.items.length).toBeGreaterThanOrEqual(3);
    expect(catalog.series.items).toEqual([]);
  });

  it('propose au moins trois chaînes lisibles sans lecteur MSE', async () => {
    const catalog = await loadCatalog({id: 'demo', kind: 'demo', label: 'Démo'});
    const urlMode = catalog.live.items.filter(item => streamKindOf(item.url) === 'url');

    expect(urlMode.length).toBeGreaterThanOrEqual(3);
  });

  it("n'expose que des URLs https", async () => {
    const catalog = await loadCatalog({id: 'demo', kind: 'demo', label: 'Démo'});

    expect(
      [...catalog.live.items, ...catalog.movies.items].every(item =>
        item.url.startsWith('https://'),
      ),
    ).toBe(true);
  });
});
