import {formatSlot, progressOf, selectNowNext} from '../src/iptv/epg';
import {EpgEntry} from '../src/iptv/types';

const entry = (startHour: number, endHour: number, title: string): EpgEntry => ({
  title,
  start: new Date(2026, 7, 18, startHour, 0),
  end: new Date(2026, 7, 18, endHour, 0),
});

const GRID = [entry(20, 21, 'Journal'), entry(21, 23, 'Film'), entry(19, 20, 'Météo')];

describe('selectNowNext', () => {
  it('trouve le programme en cours et le suivant', () => {
    const {now, next} = selectNowNext(GRID, new Date(2026, 7, 18, 20, 30));

    expect(now?.title).toBe('Journal');
    expect(next?.title).toBe('Film');
  });

  it('rend now à null avant le début de la grille', () => {
    const {now, next} = selectNowNext(GRID, new Date(2026, 7, 18, 18, 0));

    expect(now).toBeNull();
    expect(next?.title).toBe('Météo');
  });

  it('rend next à null après la fin de la grille', () => {
    const {now, next} = selectNowNext(GRID, new Date(2026, 7, 19, 1, 0));

    expect(now).toBeNull();
    expect(next).toBeNull();
  });

  it("considère la borne de fin comme exclusive", () => {
    const {now} = selectNowNext(GRID, new Date(2026, 7, 18, 21, 0));

    expect(now?.title).toBe('Film');
  });

  it('ne modifie pas le tableau reçu', () => {
    const input = [...GRID];
    selectNowNext(input, new Date(2026, 7, 18, 20, 30));

    expect(input[0].title).toBe('Journal');
  });
});

describe('progressOf', () => {
  it('rend la fraction écoulée', () => {
    expect(progressOf(entry(20, 22, 'X'), new Date(2026, 7, 18, 21, 0))).toBeCloseTo(0.5);
  });

  it('borne à [0, 1]', () => {
    expect(progressOf(entry(20, 21, 'X'), new Date(2026, 7, 18, 23, 0))).toBe(1);
    expect(progressOf(entry(20, 21, 'X'), new Date(2026, 7, 18, 19, 0))).toBe(0);
  });

  it('rend 0 sur une durée nulle ou négative', () => {
    expect(progressOf(entry(20, 20, 'X'), new Date(2026, 7, 18, 20, 0))).toBe(0);
  });
});

describe('formatSlot', () => {
  it('formate la tranche horaire', () => {
    expect(formatSlot(entry(9, 10, 'X'))).toBe('09:00 – 10:00');
  });
});
