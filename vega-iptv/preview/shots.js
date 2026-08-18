const path = require('path');
const {chromium} = require('playwright');

const OUT = path.resolve(__dirname, '../../.pr-assets');
const VIEWPORT = {width: 1920, height: 1080};

const shot = async (page, name) => {
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(OUT, `${name}.png`)});
  console.log('captured', name);
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: VIEWPORT, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));

  const card = id => page.getByTestId(`channel-${id}`);

  await page.goto(`file://${path.resolve(__dirname, 'out/index.html')}`);
  await page.waitForSelector('text=Vega IPTV');
  await shot(page, '01-source');

  await page.getByTestId('source-demo').click();
  await page.waitForSelector('text=Chaînes');
  await shot(page, '02-channels');

  // Focus clavier : prouve que l'indicateur de focus (bordure + échelle + couleur)
  // se déclenche, ce qui est la mécanique réutilisée par la D-PAD sur Fire TV.
  await card('m3u-0').focus();
  await shot(page, '03-channels-focus');

  await page.getByTestId('category-Démo · HLS').click();
  await page.waitForTimeout(300);
  await shot(page, '04-channels-category-hls');

  await page.getByTestId('category-__all__').click();
  await card('m3u-0').click();
  await page.waitForSelector('[data-testid="player-status"]');
  await shot(page, '05-player-url-mode');

  await page.getByTestId('player-back').click();
  await page.waitForSelector('text=Chaînes');
  await card('m3u-4').click();
  await page.waitForSelector('[data-testid="player-error"]');
  await shot(page, '06-player-mse-missing');

  await browser.close();

  if (errors.length > 0) {
    console.error('Erreurs console :\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('Aucune erreur console.');
})();
