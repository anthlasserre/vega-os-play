import {gridMetrics} from '../../src/ui/layout';

/**
 * Le bug d'origine : 4 colonnes de 240 points fixes dans une zone qui n'en fait
 * que 624 sur le Fire TV Stick, soit une colonne entière hors écran. Ces tests
 * verrouillent l'invariant qui l'empêche de revenir.
 */
describe('gridMetrics', () => {
  const WIDTHS = [320, 480, 624, 700, 960, 1660];

  it('ne déborde jamais de la largeur disponible', () => {
    for (const width of WIDTHS) {
      const {columns, posterWidth} = gridMetrics(width);
      const used = columns * posterWidth + (columns - 1) * 10;
      expect(used).toBeLessThanOrEqual(width);
    }
  });

  it('garde au moins deux colonnes, même très à l’étroit', () => {
    expect(gridMetrics(100).columns).toBe(2);
    expect(gridMetrics(0).columns).toBe(2);
  });

  it('ajoute des colonnes quand la place augmente', () => {
    const narrow = gridMetrics(624).columns;
    const wide = gridMetrics(1660).columns;
    expect(wide).toBeGreaterThan(narrow);
  });

  it('respecte le ratio 2:3 des affiches', () => {
    const {posterWidth, posterHeight} = gridMetrics(700);
    expect(posterHeight).toBe(Math.round(posterWidth * 1.5));
  });

  it('donne une grille utilisable sur la cible réelle du Fire TV', () => {
    // 960 points de large, moins les marges et la colonne de catégories.
    const {columns, posterWidth} = gridMetrics(624);
    expect(columns).toBeGreaterThanOrEqual(4);
    expect(posterWidth).toBeGreaterThanOrEqual(110);
  });
});
