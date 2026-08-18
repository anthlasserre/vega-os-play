import {DEMO_M3U} from '../src/iptv/demoPlaylist';
import {parseM3U} from '../src/iptv/m3u';
import {streamKindOf} from '../src/player/streamKind';

describe('playlist de démo', () => {
  const channels = parseM3U(DEMO_M3U);

  it('expose des chaînes lisibles sans lecteur MSE', () => {
    const urlMode = channels.filter(c => streamKindOf(c.url) === 'url');

    expect(urlMode.length).toBeGreaterThanOrEqual(3);
  });

  it("n'a que des URLs absolues en https", () => {
    expect(channels.every(c => c.url.startsWith('https://'))).toBe(true);
  });
});
