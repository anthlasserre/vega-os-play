# Vega IPTV — POC

Application IPTV pour **Amazon Vega OS** (Fire TV), en React Native for Vega.
Objectif : valider en mode dev que la chaîne complète tient debout — playlist,
navigation D-PAD, lecteur média W3C, build `.vpkg`.

## Ce que fait l'app

- **Sources** : playlist de démo embarquée, playlist M3U distante, portail
  Xtream Codes. Les deux dernières se configurent dans `src/devConfig.ts`
  (pas de saisie à la télécommande : voir le commentaire du fichier).
- **Chaînes** : colonne de catégories + grille, entièrement navigable à la
  D-PAD, avec indicateur de focus bordure + échelle + couleur.
- **Lecteur** : `VideoPlayer` W3C (`@amazon-devices/react-native-w3cmedia`) et
  `KeplerVideoSurfaceView`, OSD titre / état / erreur, Lecture-Pause, Retour.

## Prérequis

- Vega SDK installé (`vega --version`).
  `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env`
- Node 20+.

## Démarrer

```bash
npm install
npm start                 # Metro (plateforme "kepler")
npm run build:debug       # .vpkg armv7 / aarch64 / x86_64 dans build/
```

Sur un appareil (physique ou Vega Virtual Device) :

```bash
vega device start-port-forwarding --port 8081 --forward false
vega run-app build/aarch64-debug/vega-iptv_aarch64.vpkg
```

## Qualité

```bash
npm run lint       # eslint + plugin @amazon-devices/kepler
npm run typecheck  # tsc --noEmit
npm test           # jest
```

## Prévisualisation navigateur

`preview/` rejoue les écrans dans Chromium via `react-native-web`, avec des
stubs pour les modules système Vega. C'est un outil de dev pour itérer sur la
mise en page sans appareil — **ce n'est pas une cible de production** et rien
n'en entre dans le bundle Vega.

```bash
cd preview && npm install && npm run build && npm run shots
```

## Lecture HLS / DASH : ce qui manque

Le lecteur Vega a deux modes (cf. la doc `media playback architecture`) :

| Mode | Contenus | État ici |
|---|---|---|
| URL | `.mp4`, `.mkv`, `.mp3`, `.flv`, `.ogg`, `.flac` | ✅ opérationnel |
| MSE | HLS, DASH, DRM | 🔌 point d'injection prêt, lecteur JS à déposer |

Vega **refuse** les paquets `shaka-player` / `hls.js` publiés en amont : il faut
le `dist` patché fourni dans la release Vega
(https://developer.amazon.com/docs/vega/latest/media-player-shaka-player.html),
généré hors du dépôt puis déposé dans `src/player/shaka/`. Tant qu'il n'est pas
là, `src/player/shaka/index.ts` renvoie `null` et l'app affiche un message
explicite au lieu d'un écran noir.

C'est la limite principale du POC : un vrai bouquet IPTV est majoritairement
HLS, donc dépendant de cette étape.
