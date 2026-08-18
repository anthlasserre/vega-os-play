import {
  authUrl,
  episodeStreamUrl,
  formatTimeshiftStart,
  liveStreamUrl,
  movieStreamUrl,
  normaliseHost,
  playerApiUrl,
  timeshiftUrl,
} from '../../src/iptv/xtream/urls';
import {XtreamSource} from '../../src/iptv/types';

const SOURCE: XtreamSource = {
  id: 'portail',
  kind: 'xtream',
  label: 'Portail',
  host: 'http://portail.example:8080/',
  username: 'user',
  password: 'pass',
};

describe('normaliseHost', () => {
  it('retire les slashs de fin', () => {
    expect(normaliseHost('http://h:8080///')).toBe('http://h:8080');
  });
});

describe('playerApiUrl', () => {
  it('construit une URL player_api sans double slash', () => {
    expect(playerApiUrl(SOURCE, 'get_live_streams')).toBe(
      'http://portail.example:8080/player_api.php?username=user&password=pass&action=get_live_streams',
    );
  });

  it('ajoute les paramètres additionnels', () => {
    expect(playerApiUrl(SOURCE, 'get_series_info', {series_id: 42})).toContain(
      'series_id=42',
    );
  });

  it('échappe les identifiants exotiques', () => {
    const url = playerApiUrl(
      {...SOURCE, username: 'a b&c', password: 'p/w?'},
      'get_live_streams',
    );

    expect(url).toContain('username=a%20b%26c');
    expect(url).toContain('password=p%2Fw%3F');
  });
});

describe('authUrl', () => {
  it("n'ajoute pas d'action", () => {
    expect(authUrl(SOURCE)).toBe(
      'http://portail.example:8080/player_api.php?username=user&password=pass',
    );
  });
});

describe('URLs de flux', () => {
  it('produit du HLS par défaut pour le direct', () => {
    expect(liveStreamUrl(SOURCE, 42)).toBe(
      'http://portail.example:8080/live/user/pass/42.m3u8',
    );
  });

  it('sait produire du MPEG-TS', () => {
    expect(liveStreamUrl(SOURCE, 42, 'ts')).toBe(
      'http://portail.example:8080/live/user/pass/42.ts',
    );
  });

  it('respecte le conteneur des films', () => {
    expect(movieStreamUrl(SOURCE, 7, 'mkv')).toBe(
      'http://portail.example:8080/movie/user/pass/7.mkv',
    );
  });

  it('construit une URL d\'épisode', () => {
    expect(episodeStreamUrl(SOURCE, '99', 'mp4')).toBe(
      'http://portail.example:8080/series/user/pass/99.mp4',
    );
  });
});

describe('catch-up', () => {
  it('formate la date de départ au format attendu par Xtream', () => {
    expect(formatTimeshiftStart(new Date(2026, 7, 18, 9, 5))).toBe('2026-08-18:09-05');
  });

  it('construit une URL de timeshift avec une durée entière positive', () => {
    const url = timeshiftUrl(SOURCE, 42, new Date(2026, 7, 18, 9, 5), 0.2);

    expect(url).toContain('stream=42');
    expect(url).toContain('start=2026-08-18%3A09-05');
    expect(url).toContain('duration=1');
  });
});
