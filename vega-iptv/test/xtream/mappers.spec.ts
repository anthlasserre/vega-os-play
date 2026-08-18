import {
  buildCategories,
  mapAccount,
  mapCategories,
  mapEpisodes,
  mapLiveChannels,
  mapMovies,
  mapSeries,
  mapShortEpg,
  toNumber,
} from '../../src/iptv/xtream/mappers';
import {XtreamSource} from '../../src/iptv/types';
import {encodeBase64Utf8} from '../base64Fixture';

const SOURCE: XtreamSource = {
  id: 'portail',
  kind: 'xtream',
  label: 'Portail',
  host: 'http://h:8080',
  username: 'u',
  password: 'p',
};

describe('toNumber', () => {
  it.each([
    ['12', 12],
    [12, 12],
  ])('convertit %p', (input, expected) => {
    expect(toNumber(input)).toBe(expected);
  });

  it.each([undefined, null, '', 'abc'])('rend undefined pour %p', input => {
    expect(toNumber(input as never)).toBeUndefined();
  });
});

describe('mapLiveChannels', () => {
  it('mappe une chaîne complète', () => {
    const [channel] = mapLiveChannels(SOURCE, [
      {
        stream_id: '5',
        name: 'beIN 1',
        stream_icon: 'http://logo.png',
        epg_channel_id: 'bein1',
        category_id: 3,
        tv_archive: 1,
        tv_archive_duration: '7',
      },
    ]);

    expect(channel).toEqual({
      kind: 'live',
      id: 'portail:live:5',
      name: 'beIN 1',
      url: 'http://h:8080/live/u/p/5.m3u8',
      categoryId: '3',
      logo: 'http://logo.png',
      epgId: 'bein1',
      streamId: 5,
      archiveDays: 7,
    });
  });

  it('ignore la durée d\'archive quand tv_archive vaut 0', () => {
    const [channel] = mapLiveChannels(SOURCE, [
      {stream_id: 1, name: 'X', tv_archive: 0, tv_archive_duration: 7},
    ]);

    expect(channel.archiveDays).toBe(0);
  });

  it('écarte les entrées sans stream_id', () => {
    expect(mapLiveChannels(SOURCE, [{name: 'Fantôme'}])).toHaveLength(0);
  });

  it('range les chaînes sans catégorie dans « uncategorised »', () => {
    expect(mapLiveChannels(SOURCE, [{stream_id: 1, name: 'X'}])[0].categoryId).toBe(
      'uncategorised',
    );
  });
});

describe('mapMovies', () => {
  it('respecte le conteneur annoncé', () => {
    const [movie] = mapMovies(SOURCE, [
      {stream_id: 9, name: 'Film', container_extension: 'mkv', rating: '7.5'},
    ]);

    expect(movie.url).toBe('http://h:8080/movie/u/p/9.mkv');
    expect(movie.rating).toBe(7.5);
  });

  it('retombe sur mp4 sans conteneur', () => {
    expect(mapMovies(SOURCE, [{stream_id: 9, name: 'Film'}])[0].url).toBe(
      'http://h:8080/movie/u/p/9.mp4',
    );
  });
});

describe('mapSeries', () => {
  it('extrait l\'année de la date de sortie', () => {
    const [series] = mapSeries(SOURCE, [
      {series_id: 3, name: 'Série', releaseDate: '2019-04-01'},
    ]);

    expect(series.year).toBe('2019');
    expect(series.seriesId).toBe(3);
  });
});

describe('mapEpisodes', () => {
  it('aplatit et trie par saison puis épisode', () => {
    const episodes = mapEpisodes(SOURCE, {
      episodes: {
        '2': [{id: 21, episode_num: 1, title: 'S2E1'}],
        '1': [
          {id: 12, episode_num: 2, title: 'S1E2'},
          {id: 11, episode_num: 1, title: 'S1E1'},
        ],
      },
    });

    expect(episodes.map(episode => episode.title)).toEqual(['S1E1', 'S1E2', 'S2E1']);
    expect(episodes[0].season).toBe(1);
  });

  it('fait autorité sur la clé de saison plutôt que sur le champ episode.season', () => {
    const [episode] = mapEpisodes(SOURCE, {
      episodes: {'4': [{id: 1, episode_num: 1, title: 'X', season: 0}]},
    });

    expect(episode.season).toBe(4);
  });

  it('écarte les épisodes sans identifiant', () => {
    expect(
      mapEpisodes(SOURCE, {episodes: {'1': [{episode_num: 1, title: 'X'}]}}),
    ).toHaveLength(0);
  });

  it('rend une liste vide quand la série n\'a pas d\'épisodes', () => {
    expect(mapEpisodes(SOURCE, {})).toEqual([]);
  });
});

describe('buildCategories', () => {
  it('ne garde que les catégories réellement peuplées', () => {
    const names = mapCategories([
      {category_id: '1', category_name: 'Sport'},
      {category_id: '2', category_name: 'Vide'},
    ]);

    expect(buildCategories([{categoryId: '1'}, {categoryId: '1'}], names)).toEqual([
      {id: '1', name: 'Sport', count: 2},
    ]);
  });

  it('nomme « Non classé » le bucket sans catégorie', () => {
    expect(buildCategories([{categoryId: 'uncategorised'}], new Map())).toEqual([
      {id: 'uncategorised', name: 'Non classé', count: 1},
    ]);
  });
});

describe('mapAccount', () => {
  it('convertit exp_date en date', () => {
    const account = mapAccount({
      user_info: {
        username: 'u',
        status: 'Active',
        exp_date: '1800000000',
        max_connections: '2',
        active_cons: 1,
        is_trial: 0,
      },
    });

    expect(account?.expiresAt?.getTime()).toBe(1800000000 * 1000);
    expect(account?.maxConnections).toBe(2);
    expect(account?.trial).toBe(false);
  });

  it('traite un exp_date absent comme un compte illimité', () => {
    expect(mapAccount({user_info: {username: 'u', exp_date: null}})?.expiresAt).toBeNull();
  });

  it('rend null sans user_info', () => {
    expect(mapAccount({})).toBeNull();
  });
});

describe('mapShortEpg', () => {
  it('décode les titres base64 et trie chronologiquement', () => {
    const entries = mapShortEpg({
      epg_listings: [
        {
          title: encodeBase64Utf8('Second'),
          start_timestamp: 2000,
          stop_timestamp: 3000,
        },
        {
          title: encodeBase64Utf8('Premier'),
          description: encodeBase64Utf8('Résumé'),
          start_timestamp: '1000',
          stop_timestamp: '2000',
        },
      ],
    });

    expect(entries.map(entry => entry.title)).toEqual(['Premier', 'Second']);
    expect(entries[0].description).toBe('Résumé');
    expect(entries[0].start.getTime()).toBe(1000 * 1000);
  });

  it('écarte les programmes sans horodatage exploitable', () => {
    expect(mapShortEpg({epg_listings: [{title: 'X'}]})).toEqual([]);
  });
});
