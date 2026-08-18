import {formatCount, formatDate, formatDuration} from '../src/ui/format';

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
