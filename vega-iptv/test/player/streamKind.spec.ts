import {
  containerOf,
  extensionOf,
  isRiskyContainer,
  streamKindOf,
} from '../../src/player/streamKind';

describe('extensionOf', () => {
  it('ignore la query string et le fragment', () => {
    expect(extensionOf('http://h/a/b.mp4?token=1#t=10')).toBe('mp4');
  });

  it('renvoie une chaîne vide sans extension', () => {
    expect(extensionOf('http://h/live/42')).toBe('');
  });

  it('ne confond pas un point du chemin avec une extension', () => {
    expect(extensionOf('http://h/v1.2/stream')).toBe('');
  });
});

describe('streamKindOf', () => {
  it.each(['http://h/a.mp4', 'http://h/a.MKV', 'http://h/a.mp3'])(
    'route %s vers le mode URL',
    url => expect(streamKindOf(url)).toBe('url'),
  );

  it.each(['http://h/a.m3u8', 'http://h/a.mpd', 'http://h/a.ts', 'http://h/live/42'])(
    'route %s vers le mode MSE',
    url => expect(streamKindOf(url)).toBe('mse'),
  );
});

describe('containerOf', () => {
  it('rend le conteneur en majuscules', () => {
    expect(containerOf('http://h/movie/u/p/12.mkv')).toBe('MKV');
    expect(containerOf('http://h/movie/u/p/12.MP4')).toBe('MP4');
  });

  it('rend une chaîne vide sans extension', () => {
    expect(containerOf('http://h/live/u/p/12')).toBe('');
  });
});

describe('isRiskyContainer', () => {
  it('signale le Matroska', () => {
    // Mesuré sur appareil : réponse 206 en video/x-matroska, signature EBML
    // correcte, et pourtant MEDIA_ERR_SRC_NOT_SUPPORTED côté lecteur.
    expect(isRiskyContainer('http://h/movie/u/p/12.mkv')).toBe(true);
    expect(isRiskyContainer('http://h/movie/u/p/12.MKV')).toBe(true);
  });

  it('laisse passer ce qui se lit', () => {
    expect(isRiskyContainer('http://h/movie/u/p/12.mp4')).toBe(false);
    expect(isRiskyContainer('http://h/live/u/p/12.m3u8')).toBe(false);
  });

  it('garde le MKV en mode URL malgré le risque', () => {
    // On prévient sans interdire : la mesure vient d'un appareil virtuel, et
    // bloquer l'essai serait plus dommageable que de laisser échouer.
    expect(streamKindOf('http://h/movie/u/p/12.mkv')).toBe('url');
  });
});
