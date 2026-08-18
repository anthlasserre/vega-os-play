import {
  buildXtreamPlaylist,
  liveStreamUrl,
  normaliseHost,
  playerApiUrl,
} from '../src/iptv/xtream';

const CREDENTIALS = {
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
    expect(playerApiUrl(CREDENTIALS, 'get_live_streams')).toBe(
      'http://portail.example:8080/player_api.php?username=user&password=pass&action=get_live_streams',
    );
  });
});

describe('liveStreamUrl', () => {
  it('produit du HLS par défaut', () => {
    expect(liveStreamUrl(CREDENTIALS, 42)).toBe(
      'http://portail.example:8080/live/user/pass/42.m3u8',
    );
  });

  it('sait produire du MPEG-TS', () => {
    expect(liveStreamUrl(CREDENTIALS, 42, 'ts')).toBe(
      'http://portail.example:8080/live/user/pass/42.ts',
    );
  });
});

describe('buildXtreamPlaylist', () => {
  it('résout le nom de catégorie et retombe sur « Non classé »', () => {
    const playlist = buildXtreamPlaylist(
      CREDENTIALS,
      [{category_id: '5', category_name: 'Sport'}],
      [
        {stream_id: 1, name: 'beIN 1', category_id: '5'},
        {stream_id: 2, name: 'Inconnue', category_id: '99'},
      ],
    );

    expect(playlist.channels[0]).toEqual({
      id: 'xtream-1',
      name: 'beIN 1',
      url: 'http://portail.example:8080/live/user/pass/1.m3u8',
      group: 'Sport',
      logo: undefined,
      tvgId: undefined,
    });
    expect(playlist.channels[1].group).toBe('Non classé');
    expect(playlist.categories.map(c => c.name)).toEqual([
      'Toutes',
      'Non classé',
      'Sport',
    ]);
  });
});
