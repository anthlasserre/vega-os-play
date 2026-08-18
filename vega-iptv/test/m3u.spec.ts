import {buildCategories, parseM3U, toPlaylist} from '../src/iptv/m3u';
import {ALL_CATEGORY_ID} from '../src/iptv/types';

const PLAYLIST = `#EXTM3U
#EXTINF:-1 tvg-id="tf1.fr" tvg-logo="http://logo/tf1.png" group-title="Généralistes",TF1 HD
http://server/live/1.m3u8
#EXTINF:-1 tvg-id="france2.fr" group-title="Généralistes",France 2
http://server/live/2.ts
#EXTINF:-1 group-title="Sport",beIN 1
#EXTVLCOPT:http-user-agent=VLC
http://server/live/3.m3u8
`;

describe('parseM3U', () => {
  it('lit nom, groupe, logo et tvg-id', () => {
    const channels = parseM3U(PLAYLIST);

    expect(channels).toHaveLength(3);
    expect(channels[0]).toEqual({
      id: 'm3u-0',
      name: 'TF1 HD',
      url: 'http://server/live/1.m3u8',
      group: 'Généralistes',
      logo: 'http://logo/tf1.png',
      tvgId: 'tf1.fr',
    });
    expect(channels[1].logo).toBeUndefined();
  });

  it('saute les directives intercalées entre #EXTINF et son URL', () => {
    const channels = parseM3U(PLAYLIST);

    expect(channels[2]).toMatchObject({
      name: 'beIN 1',
      group: 'Sport',
      url: 'http://server/live/3.m3u8',
    });
  });

  it('retombe sur le groupe par défaut quand group-title manque', () => {
    const channels = parseM3U('#EXTINF:-1,Sans groupe\nhttp://server/x.ts');

    expect(channels[0].group).toBe('Non classé');
  });

  it('ignore une entrée sans URL en fin de fichier', () => {
    const channels = parseM3U('#EXTINF:-1,Orpheline\n');

    expect(channels).toHaveLength(0);
  });

  it('retombe sur tvg-name quand le titre après la virgule est vide', () => {
    const channels = parseM3U('#EXTINF:-1 tvg-name="Repli",\nhttp://server/x.mp4');

    expect(channels[0].name).toBe('Repli');
  });
});

describe('buildCategories', () => {
  it('préfixe une catégorie « Toutes » et compte les chaînes', () => {
    const categories = buildCategories(parseM3U(PLAYLIST));

    expect(categories[0]).toEqual({
      id: ALL_CATEGORY_ID,
      name: 'Toutes',
      channelCount: 3,
    });
    expect(categories.slice(1)).toEqual([
      {id: 'Généralistes', name: 'Généralistes', channelCount: 2},
      {id: 'Sport', name: 'Sport', channelCount: 1},
    ]);
  });
});

describe('toPlaylist', () => {
  it('assemble chaînes et catégories', () => {
    const playlist = toPlaylist(parseM3U(PLAYLIST));

    expect(playlist.channels).toHaveLength(3);
    expect(playlist.categories).toHaveLength(3);
  });
});
