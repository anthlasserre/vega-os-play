import {extensionOf, streamKindOf} from '../src/player/streamKind';

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
