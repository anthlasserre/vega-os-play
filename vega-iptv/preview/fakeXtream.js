/**
 * Faux portail Xtream pour la prévisualisation.
 *
 * Intercepte `fetch` et sert des réponses conformes à la forme réelle de
 * `player_api.php` — y compris les incohérences typiques (identifiants tantôt
 * numériques tantôt textuels, titres EPG en base64). Cela permet de capturer
 * les écrans VOD, séries et EPG sans exposer un vrai abonnement.
 */
const b64 = value => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const rest = bytes.length - i;
    const bits =
      (bytes[i] << 16) | ((rest > 1 ? bytes[i + 1] : 0) << 8) | (rest > 2 ? bytes[i + 2] : 0);
    out += alphabet[(bits >> 18) & 0x3f];
    out += alphabet[(bits >> 12) & 0x3f];
    out += rest > 1 ? alphabet[(bits >> 6) & 0x3f] : '=';
    out += rest > 2 ? alphabet[bits & 0x3f] : '=';
  }
  return out;
};

const LIVE_CATEGORIES = [
  {category_id: '1', category_name: 'Généralistes FR'},
  {category_id: '2', category_name: 'Sport'},
  {category_id: '3', category_name: 'Cinéma'},
  {category_id: '9', category_name: 'Catégorie vide'},
];

const LIVE = [
  {stream_id: 101, name: 'TF1 FHD', category_id: '1', tv_archive: 1, tv_archive_duration: 7},
  {stream_id: 102, name: 'France 2 FHD', category_id: '1', tv_archive: 1, tv_archive_duration: 3},
  {stream_id: 103, name: 'M6 HD', category_id: '1'},
  {stream_id: 104, name: 'Arte HD', category_id: '1'},
  {stream_id: 201, name: 'beIN SPORTS 1', category_id: '2', tv_archive: 1, tv_archive_duration: 7},
  {stream_id: 202, name: 'beIN SPORTS 2', category_id: '2'},
  {stream_id: 203, name: 'Canal+ Sport', category_id: '2'},
  {stream_id: 204, name: 'RMC Sport 1', category_id: '2'},
  {stream_id: 301, name: 'Canal+ Cinéma', category_id: '3'},
  {stream_id: 302, name: 'OCS Max', category_id: '3'},
  {stream_id: 303, name: 'TCM Cinéma', category_id: '3'},
  {stream_id: 999, name: 'Chaîne sans catégorie'},
];

const VOD_CATEGORIES = [
  {category_id: '10', category_name: 'Nouveautés'},
  {category_id: '11', category_name: 'Action'},
  {category_id: '12', category_name: 'Animation'},
];

const VOD = [
  {stream_id: 1001, name: 'Le Comte de Monte-Cristo', category_id: '10', rating: '8.2', container_extension: 'mkv'},
  {stream_id: 1002, name: 'Un p’tit truc en plus', category_id: '10', rating: 7.4},
  {stream_id: 1003, name: 'Anatomie d’une chute', category_id: '10', rating: '7.8'},
  {stream_id: 1004, name: 'Dune : Deuxième partie', category_id: '11', rating: '8.5'},
  {stream_id: 1005, name: 'Mission: Impossible', category_id: '11', rating: '7.7'},
  {stream_id: 1006, name: 'John Wick 4', category_id: '11', rating: '7.6'},
  {stream_id: 1007, name: 'Vice-versa 2', category_id: '12', rating: '7.5'},
  {stream_id: 1008, name: 'Le Robot sauvage', category_id: '12', rating: '8.2'},
];

const SERIES_CATEGORIES = [
  {category_id: '20', category_name: 'Séries FR'},
  {category_id: '21', category_name: 'Séries US'},
];

const SERIES = [
  {series_id: 2001, name: 'Engrenages', category_id: '20', rating: '8.4', releaseDate: '2005-12-13', genre: 'Policier', plot: 'Le quotidien d’une brigade criminelle parisienne, entre juges d’instruction et avocats.'},
  {series_id: 2002, name: 'Le Bureau des Légendes', category_id: '20', rating: '8.7', releaseDate: '2015-04-27', genre: 'Espionnage'},
  {series_id: 2003, name: 'HPI', category_id: '20', rating: '7.1', releaseDate: '2021-04-29', genre: 'Comédie policière'},
  {series_id: 2101, name: 'Severance', category_id: '21', rating: '8.7', releaseDate: '2022-02-18', genre: 'Thriller'},
  {series_id: 2102, name: 'The Bear', category_id: '21', rating: '8.6', releaseDate: '2022-06-23', genre: 'Drame'},
];

const EPISODES = {
  episodes: {
    '1': [
      {id: '30011', episode_num: 1, title: 'Le corps', container_extension: 'mkv', info: {duration_secs: 3120, plot: 'Une découverte macabre porte de Bagnolet.'}},
      {id: '30012', episode_num: 2, title: 'La garde à vue', container_extension: 'mkv', info: {duration_secs: 3060}},
      {id: '30013', episode_num: 3, title: 'Le juge', container_extension: 'mkv', info: {duration_secs: 3180}},
    ],
    '2': [
      {id: '30021', episode_num: 1, title: 'Retour de flamme', container_extension: 'mkv', info: {duration_secs: 3100}},
      {id: '30022', episode_num: 2, title: 'Filature', container_extension: 'mkv', info: {duration_secs: 3090}},
    ],
  },
};

const nowSeconds = Math.floor(Date.parse('2026-08-18T20:40:00Z') / 1000);

const SHORT_EPG = {
  epg_listings: [
    {
      title: b64('Journal de 20h'),
      description: b64('L’actualité nationale et internationale présentée en direct.'),
      start_timestamp: nowSeconds - 20 * 60,
      stop_timestamp: nowSeconds + 15 * 60,
    },
    {
      title: b64('Ligue 1 — Bordeaux / Bayonne'),
      description: b64('Multiplex de la 3e journée, coup d’envoi à 21h.'),
      start_timestamp: nowSeconds + 15 * 60,
      stop_timestamp: nowSeconds + 135 * 60,
    },
  ],
};

const ACCOUNT = {
  user_info: {
    username: 'demo-preview',
    status: 'Active',
    exp_date: String(Math.floor(Date.parse('2027-02-01T00:00:00Z') / 1000)),
    is_trial: '0',
    active_cons: '1',
    max_connections: '2',
    auth: 1,
  },
};

const respond = payload =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(payload)),
  });

export const installFakeXtream = () => {
  const original = window.fetch;
  window.fetch = (input, init) => {
    const url = String(input);
    if (!url.includes('player_api.php')) {
      return original(input, init);
    }
    if (url.includes('action=get_live_categories')) return respond(LIVE_CATEGORIES);
    if (url.includes('action=get_live_streams')) return respond(LIVE);
    if (url.includes('action=get_vod_categories')) return respond(VOD_CATEGORIES);
    if (url.includes('action=get_vod_streams')) return respond(VOD);
    // Ordre important : `get_series_info` contient `get_series` en sous-chaîne.
    if (url.includes('action=get_series_categories')) return respond(SERIES_CATEGORIES);
    if (url.includes('action=get_series_info')) return respond(EPISODES);
    if (url.includes('action=get_series')) return respond(SERIES);
    if (url.includes('action=get_short_epg')) return respond(SHORT_EPG);
    return respond(ACCOUNT);
  };
};
