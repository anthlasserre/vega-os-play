import {UNCLASSIFIED, buildM3uCategories, parseM3U} from '../src/iptv/m3u';

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
    const channels = parseM3U(PLAYLIST, 'src');

    expect(channels).toHaveLength(3);
    expect(channels[0]).toEqual({
      kind: 'live',
      id: 'src:live:0',
      name: 'TF1 HD',
      url: 'http://server/live/1.m3u8',
      categoryId: 'Généralistes',
      logo: 'http://logo/tf1.png',
      epgId: 'tf1.fr',
      archiveDays: 0,
    });
    expect(channels[1].logo).toBeUndefined();
  });

  it('saute les directives intercalées entre #EXTINF et son URL', () => {
    expect(parseM3U(PLAYLIST, 'src')[2]).toMatchObject({
      name: 'beIN 1',
      categoryId: 'Sport',
      url: 'http://server/live/3.m3u8',
    });
  });

  it('retombe sur le groupe par défaut quand group-title manque', () => {
    expect(parseM3U('#EXTINF:-1,Sans groupe\nhttp://s/x.ts', 'src')[0].categoryId).toBe(
      UNCLASSIFIED,
    );
  });

  it('ignore une entrée sans URL en fin de fichier', () => {
    expect(parseM3U('#EXTINF:-1,Orpheline\n', 'src')).toHaveLength(0);
  });

  it('retombe sur tvg-name quand le titre après la virgule est vide', () => {
    expect(parseM3U('#EXTINF:-1 tvg-name="Repli",\nhttp://s/x.mp4', 'src')[0].name).toBe(
      'Repli',
    );
  });

  it('préfixe les identifiants par la source pour éviter les collisions', () => {
    const a = parseM3U(PLAYLIST, 'alpha');
    const b = parseM3U(PLAYLIST, 'beta');

    expect(a[0].id).not.toBe(b[0].id);
  });
});

describe('buildM3uCategories', () => {
  it('compte les chaînes par groupe et trie par nom', () => {
    expect(buildM3uCategories(parseM3U(PLAYLIST, 'src'))).toEqual([
      {id: 'Généralistes', name: 'Généralistes', count: 2},
      {id: 'Sport', name: 'Sport', count: 1},
    ]);
  });
});
