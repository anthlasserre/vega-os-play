# Vega IPTV

Application IPTV pour **Amazon Vega OS** (Fire TV), en React Native for Vega.

## Sources

| Type | Direct | Films | Séries | EPG | Compte | Replay |
|---|---|---|---|---|---|---|
| **Xtream Codes** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (URL construite) |
| **Playlist M3U** | ✅ | — | — | — | — | — |
| **Démo embarquée** | ✅ | ✅ | — | — | — | — |

Plusieurs sources coexistent, se configurent depuis l'app (Réglages → Gérer les
sources) et sont persistées dans `/data` via `@amazon-devices/kepler-file-system`.

Le protocole Xtream ne définit ni VOD ni séries pour une playlist M3U : ces
sections restent vides pour une source M3U, ce n'est pas un manque de l'app.

## Fonctionnalités

- **Accueil** : rail « Reprendre », compteurs, bandeau compte (expiration,
  connexions actives / maximum).
- **Direct** : catégories, grille D-PAD, panneau EPG *en cours / à suivre* avec
  barre de progression, badge de replay disponible.
- **Films** : catégories, grille ou liste, fiche détaillée, reprise de lecture.
- **Séries** : catégories, fiche, sélecteur de saison, liste d'épisodes avec
  avancement par épisode.
- **Favoris** : direct, films et séries dans une même liste.
- **Recherche** globale, insensible à la casse et aux accents, indépendante de
  l'ordre des mots.
- **Lecteur** : OSD, lecture/pause, saut ±10 s, timeline, sélection des pistes
  audio et des sous-titres, bascule favori.
- **Réglages** : source active, disposition grille/liste, reprise automatique,
  rechargement du catalogue, purge de l'historique.
- **Navigation** : pile de retour réelle — le Retour depuis le lecteur ramène à
  l'écran d'où on est parti (fiche film, direct, recherche, reprise…).

## Prérequis

- Machine de dev sous **macOS 10.15+ ou Ubuntu 20.04+**. Windows et WSL ne sont
  pas supportés par le SDK Vega.
- Node 20+.
- Vega SDK :
  `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env`

## Démarrer

```bash
npm install
npm start                 # Metro (plateforme "kepler")
npm run build:debug       # .vpkg armv7 / aarch64 / x86_64 dans build/
```

## Déployer sur un Fire TV

> **Attention** : Vega OS ne tourne aujourd'hui que sur le **Fire TV Stick 4K
> Select**. Les autres Fire TV sont sous Fire OS (Android) et n'installent pas
> de `.vpkg`.

Mode développeur déjà activé et appareil visible dans `vega device list` :

```bash
npm run build:debug
vega device install-app --dir . -b Debug     # laisse la CLI choisir l'archi
vega device launch-app --dir .
vega device running-apps                     # vérification
```

Itérer sans reconstruire (Fast Refresh), dans deux terminaux séparés :

```bash
vega device start-port-forwarding --port 8081 --forward false   # terminal 1
npm start                                                        # terminal 2
vega device launch-app --dir .
```

Première fois sur un appareil neuf — activation du mode développeur, profil
vendeur, connexion VDA, diagnostic et erreurs courantes : **[DEPLOY.md](DEPLOY.md)**.

## Qualité

```bash
npm run lint       # eslint + plugin @amazon-devices/kepler
npm run typecheck  # tsc --noEmit
npm test           # jest
```

## Prévisualisation navigateur

`preview/` rejoue les écrans dans Chromium via `react-native-web`, avec des stubs
pour les modules système Vega et un **faux portail Xtream** (`fakeXtream.js`) qui
sert des réponses conformes à `player_api.php`. C'est un outil de dev pour itérer
sur la mise en page sans appareil ni abonnement — **ce n'est pas une cible de
production** et rien n'en entre dans le bundle Vega.

```bash
cd preview && npm install && npm run build && npm run shots
```

## Lecture HLS / DASH : ce qui manque

Le lecteur Vega a deux modes :

| Mode | Contenus | État ici |
|---|---|---|
| URL | `.mp4`, `.mkv`, `.mp3`, `.flv`, `.ogg`, `.flac` | ✅ opérationnel |
| MSE | HLS, DASH, DRM | 🔌 point d'injection prêt, lecteur JS à déposer |

Vega **refuse** les paquets `shaka-player` / `hls.js` publiés en amont : il faut
le `dist` patché fourni dans la release Vega
(https://developer.amazon.com/docs/vega/latest/media-player-shaka-player.html),
généré hors du dépôt puis déposé dans `src/player/shaka/`. Tant qu'il n'est pas
là, l'app affiche un message explicite au lieu d'un écran noir.

C'est la limite structurante : un flux live Xtream est servi en HLS, donc le
direct dépend de cette étape. Les films et épisodes en `.mkv` / `.mp4`, eux,
passent par le mode URL et se lisent dès maintenant.

## Hors périmètre sur Vega

Certaines fonctions de l'app iOS de référence n'ont pas d'équivalent ici :

| Fonction | Pourquoi |
|---|---|
| Synchronisation iCloud | Écosystème Apple ; il faudrait un backend dédié. |
| AirPlay / Chromecast | Le Fire TV est la cible de diffusion, pas la source. |
| Choix VLCKit / KSPlayer / MPV | Vega impose son pipeline W3C MSE/EME. |
| Picture-in-Picture | Pas d'API applicative Vega. |
| Téléchargement hors ligne | Faisable via `kepler-file-system`, non traité ici. |
| Real Debrid | Intégration de compte tiers, non traitée. |
| Dolby Vision / HDR10 / Atmos | Dépend de l'appareil et du pipeline natif ; non vérifiable sans matériel. |
