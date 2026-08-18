const path = require('path');
const {chromium} = require('playwright');

const OUT = path.resolve(__dirname, '../../.pr-assets');
const VIEWPORT = {width: 1920, height: 1080};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: VIEWPORT, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));

  const id = name => page.getByTestId(name);
  const shot = async name => {
    await page.waitForTimeout(450);
    await page.screenshot({path: path.join(OUT, `${name}.png`)});
    console.log('captured', name);
  };

  await page.goto(`file://${path.resolve(__dirname, 'out/index.html')}`);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await page.waitForSelector('text=Vega IPTV');
  await shot('01-accueil-demo');

  // Ajout d'un portail Xtream depuis l'app elle-même.
  await id('tile-settings').click();
  await id('settings-sources').click();
  await id('draft-xtream').click();
  await id('field-label').fill('Mon abonnement');
  await id('field-host').fill('http://portail.exemple:8080');
  await id('field-username').fill('demo-preview');
  await id('field-password').fill('secret');
  await shot('02-sources-formulaire');

  await id('source-submit').click();
  await page.waitForTimeout(600);
  await shot('03-sources-liste');

  await id('sources-back').click();
  await page.waitForSelector('[data-testid="settings-account"]');
  await shot('04-reglages-compte');

  await id('settings-back').click();
  await page.waitForSelector('[data-testid="home-account"]');
  await shot('05-accueil-xtream');

  // Direct : la grille alimente le panneau EPG au survol.
  await id('tile-live').click();
  await page.waitForSelector('[data-testid="item-xtream-mon-abonnement:live:201"]');
  await id('item-xtream-mon-abonnement:live:201').focus();
  await page.waitForSelector('[data-testid="epg-panel"]');
  await page.waitForTimeout(900);
  await shot('06-direct-epg');

  await id('browser-back').click();
  await id('tile-movies').click();
  await page.waitForSelector('[data-testid="item-xtream-mon-abonnement:movie:1004"]');
  await shot('07-films-grille');

  await id('item-xtream-mon-abonnement:movie:1004').click();
  await page.waitForSelector('[data-testid="movie-play"]');
  await id('movie-favorite').click();
  await shot('08-film-fiche');

  await id('movie-play').click();
  await page.waitForSelector('[data-testid="player-status"]');
  await page.waitForTimeout(1400);
  await shot('09-lecteur');

  await id('player-audio').click();
  await page.waitForSelector('[data-testid="player-panel"]');
  await shot('10-lecteur-pistes-audio');

  // La pile ramène au bon écran : lecteur → fiche film → grille → accueil.
  await id('player-back').click();
  await page.waitForSelector('[data-testid="movie-play"]');
  await id('movie-back').click();
  await page.waitForSelector('[data-testid="browser-back"]');
  await id('browser-back').click();
  await id('tile-series').click();
  await page.waitForSelector('[data-testid="item-xtream-mon-abonnement:series:2001"]');
  await id('item-xtream-mon-abonnement:series:2001').click();
  await page.waitForSelector('[data-testid="episode-30011"]');
  await shot('11-serie-episodes');

  await id('series-back').click();
  await page.waitForSelector('[data-testid="browser-back"]');
  await id('browser-back').click();
  await id('tile-search').click();
  await id('search-input').fill('bein');
  await page.waitForTimeout(400);
  await shot('12-recherche');

  await id('search-back').click();
  await id('tile-favorites').click();
  await page.waitForTimeout(400);
  await shot('13-favoris');

  await browser.close();

  if (errors.length > 0) {
    console.error('Erreurs console :\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('Aucune erreur console.');
})();
