# vega-os-play

Bac à sable Fire TV / Vega OS. Le dépôt contient deux applications distinctes.

## `vega-iptv/` — application IPTV (courante)

Application IPTV React Native for Vega : sources **Xtream Codes** (direct, VOD,
séries, EPG, compte, catch-up) et **playlists M3U**, favoris, reprise de lecture,
recherche globale, sélection des pistes audio et sous-titres.

- React Native 0.83 / `@amazon-devices/react-native-kepler` 4, Vega OS 1.2
- Se construit avec le SDK Vega courant (`react-native build-vega`) en `.vpkg`
  armv7 / aarch64 / x86_64
- 126 tests, `tsc` et eslint propres

→ **[vega-iptv/README.md](vega-iptv/README.md)** — fonctionnalités, architecture, limites
→ **[vega-iptv/DEPLOY.md](vega-iptv/DEPLOY.md)** — déploiement sur un Fire TV

```bash
cd vega-iptv
npm install
npm run build:debug
vega device install-app --dir . -b Debug && vega device launch-app --dir .
```

> Vega OS ne tourne aujourd'hui que sur le **Fire TV Stick 4K Select**. Les
> autres Fire TV sont sous Fire OS (Android) et n'installent pas de `.vpkg`.
> La machine de dev doit être sous **macOS ou Linux** (Windows et WSL non
> supportés par le SDK Vega).

## Racine du dépôt — application d'origine (héritée)

L'application initiale (`index.js`, `src/App.tsx`, `manifest.toml` à la racine)
est conservée en l'état à titre de référence. Elle vise React Native 0.72 et une
génération antérieure de l'outillage : commande `react-native build-kepler`,
`runtime-module` KeplerScript 2.0, pas de section `[os.version]`. Ces éléments
n'existent plus dans le SDK Vega actuel, donc elle ne se construit pas tel quel
avec la CLI installée aujourd'hui.

Elle n'est pas maintenue. Tout nouveau développement va dans `vega-iptv/`.
