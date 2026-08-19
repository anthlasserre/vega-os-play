// @ts-nocheck
/**
 * Installe les polyfills W3C d'Amazon **avant** que le module Shaka ne soit
 * évalué.
 *
 * `ShakaPlayer.ts` appelle bien `MiscPolyfill.install()` à son propre
 * chargement, mais après `import shaka from './dist/…'` : les imports ES étant
 * hissés, le corps de Shaka s'exécute en premier. Or, dès son évaluation, le
 * détecteur d'appareil ajouté par le patch Vega fait
 * `navigator.userAgent.includes('AFT')` — et `userAgent`, que seul
 * `MiscPolyfill` renseigne, vaut alors `undefined`. L'app meurt sur un
 * « Cannot read property 'includes' of undefined » au premier flux adaptatif.
 *
 * Ce module n'a donc qu'un rôle : être importé avant `ShakaPlayer`. Les
 * réinstallations que fera ce dernier sont idempotentes.
 */
import Document from '../../polyfills/DocumentPolyfill';
import Element from '../../polyfills/ElementPolyfill';
import TextDecoderPolyfill from '../../polyfills/TextDecoderPolyfill';
import W3CMediaPolyfill from '../../polyfills/W3CMediaPolyfill';
import MiscPolyfill from '../../polyfills/MiscPolyfill';

Document.install();
Element.install();
TextDecoderPolyfill.install();
W3CMediaPolyfill.install();
MiscPolyfill.install();
