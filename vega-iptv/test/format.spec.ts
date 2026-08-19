import {
  formatCount,
  formatDate,
  formatDuration,
  formatRelativeDay,
  formatTime,
} from '../src/ui/format';

describe('formatDuration', () => {
  it.each([
    [0, '00:00'],
    [59, '00:59'],
    [605, '10:05'],
    [3661, '1:01:01'],
  ])('formate %p en %p', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });

  it.each([NaN, Infinity, -1])('rend un repli pour %p', input => {
    expect(formatDuration(input)).toBe('--:--');
  });
});

describe('formatDate', () => {
  it('formate en jj/mm/aaaa', () => {
    expect(formatDate(new Date(2026, 7, 18))).toBe('18/08/2026');
  });

  it.each([null, undefined, new Date('invalide')])(
    'traite %p comme illimité',
    input => {
      expect(formatDate(input)).toBe('illimité');
    },
  );
});

describe('formatCount', () => {
  it('accorde le pluriel', () => {
    expect(formatCount(1, 'chaîne')).toBe('1 chaîne');
    expect(formatCount(3, 'chaîne')).toBe('3 chaînes');
  });
});

describe('formatRelativeDay', () => {
  const now = new Date(2026, 7, 19, 14, 0);

  it("nomme aujourd'hui et hier", () => {
    expect(formatRelativeDay(new Date(2026, 7, 19, 9, 0).getTime(), now)).toBe(
      "aujourd'hui",
    );
    expect(formatRelativeDay(new Date(2026, 7, 18, 23, 30).getTime(), now)).toBe(
      'hier',
    );
  });

  it('compare des jours calendaires, pas des écarts en heures', () => {
    // 23 h la veille est « hier » même s'il s'est écoulé moins de 24 h.
    const justAfterMidnight = new Date(2026, 7, 19, 1, 0);
    expect(
      formatRelativeDay(new Date(2026, 7, 18, 23, 0).getTime(), justAfterMidnight),
    ).toBe('hier');
  });

  it('compte les jours dans la semaine puis bascule sur la date', () => {
    expect(formatRelativeDay(new Date(2026, 7, 16).getTime(), now)).toBe(
      'il y a 3 jours',
    );
    expect(formatRelativeDay(new Date(2026, 7, 1).getTime(), now)).toBe('01/08/2026');
  });

  it('ne casse pas sur une date invalide', () => {
    expect(formatRelativeDay(Number.NaN, now)).toBe('date inconnue');
  });
});

describe('formatTime', () => {
  it('rend hh:mm', () => {
    expect(formatTime(new Date(2026, 7, 19, 9, 5).getTime())).toBe('09:05');
  });

  it('ne casse pas sur une date invalide', () => {
    expect(formatTime(Number.NaN)).toBe('--:--');
  });
});
