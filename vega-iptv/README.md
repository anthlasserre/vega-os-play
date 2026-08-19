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

- **Accueil** : tuiles de navigation, rails « Reprendre » et « Récemment vu »,
  bandeau compte (expiration, connexions actives / maximum).
- **Direct** : catégories, **logos de chaînes**, panneau EPG *en cours / à suivre*
  avec barre de progression, badge de replay disponible.
- **Films** : catégories, grille d'affiches ou liste, fiche détaillée avec résumé,
  genre, durée et note chargés à l'ouverture, reprise de lecture.
- **Séries** : catégories, fiche, sélecteur de saison, liste d'épisodes avec
  avancement par épisode.
- **Favoris** : direct, films et séries dans une même liste.
- **Historique** : journal de ce qui a été lancé, direct compris, filtrable par
  type, avec relance en un appui. Distinct de « Reprendre », qui ne retient que
  ce qui est repris en cours de route.
- **Filtrage des catégories** : par source et par type, avec recherche et
  raccourcis « tout afficher / tout masquer ». Un bouquet réel annonce ici près
  de 200 catégories de direct pour 13 000 chaînes — sans filtre, la navigation
  est inutilisable.
- **Recherche** globale, insensible à la casse et aux accents, indépendante de
  l'ordre des mots.
- **Lecteur** : OSD compact, lecture/pause, saut ±10 s, timeline, sélection des
  pistes audio et des sous-titres, bascule favori, messages d'erreur lisibles.
- **Réglages** : source active, **tampon du direct** (2 à 30 s), disposition
  grille/liste, reprise automatique, catégories affichées, historique,
  rechargement du catalogue.
- **Navigation** : pile de retour réelle — le Retour depuis le lecteur ramène à
  l'écran d'où on est parti (fiche film, direct, recherche, reprise…).

### Tampon du direct

Le réglage arbitre entre stabilité et réactivité, et pilote `bufferingGoal`,
`rebufferingGoal` et `bufferBehind` de Shaka :

| Tampon | Effet |
|---|---|
| 2 s | zapping instantané, coupe sur un réseau irrégulier |
| 5 s | zapping rapide, peu de marge |
| **10 s** | équilibré (défaut) |
| 20 s | stable, démarrage plus lent |
| 30 s | très stable, zapping lent |

## Interface : l'échelle compte

Le Fire TV Stick 4K Select rend en 1080p à une **densité de 2** : la surface
React Native ne fait donc pas 1920×1080 mais **960×540 points**. Une largeur de
240 points occupe le quart de l'écran, pas le huitième.

Toute dimension qui dépend de la place disponible est dérivée des dimensions
réelles par `useLayout()` ([src/ui/layout.ts](src/ui/layout.ts)) et non écrite en
dur — la grille d'affiches calcule ses colonnes à partir d'une largeur d'affiche
visée, ce que `test/player/layout.spec.ts` verrouille.

Deux pièges de focus, tous deux corrigés dans
[`Focusable`](src/ui/components/Focusable.tsx) :

- **pas de `transform: scale()` au focus** — l'élément sortait de sa boîte de
  layout et son liseré se faisait rogner par la cellule de `FlatList` ;
- **pas de vue intermédiaire en `flex: 1`** autour des enfants — elle absorbait
  la hauteur et annulait le centrage vertical des libellés de boutons.

### Icônes

Tracés [Feather](https://feathericons.com) (MIT) rastérisés en PNG par
`npm run build:icons`, exposés par [`Icon`](src/ui/components/Icon.tsx).

Ni `react-native-svg` ni `react-native-vector-icons` ne conviennent : la première
compile un module natif, la seconde enregistre des polices côté plateforme, et
Vega n'exécute ni l'un ni l'autre. `Image` est en revanche pris en charge, d'où la
rastérisation en amont. Détails dans [src/ui/icons/README.md](src/ui/icons/README.md).

### Saisie de texte : déclarer le clavier

Un `TextInput` peut recevoir le focus D-PAD **sans qu'aucun clavier
n'apparaisse** — le champ paraît actif et rien ne s'y saisit. Deux conditions :

1. `manifest.toml` doit déclarer `com.amazon.inputmethod.service` et
   `com.amazon.inputmethod.client` en `[wants.service]` ;
2. le champ demande `showSoftInputOnFocus` explicitement.

Sans le premier point, le service existe sur l'appareil mais l'application n'a
pas le droit de s'y connecter, et l'échec est silencieux.

## Prérequis

- Machine de dev sous **macOS 10.15+ ou Ubuntu 20.04+**. Windows et WSL ne sont
  pas supportés par le SDK Vega.
- Node 20+.
- **JDK 21+** — Closure Compiler, utilisé pour construire le lecteur Shaka.
  Un JDK 17 échoue en fin de compilation sur un `UnsupportedClassVersionError`.
- Python 3 et Git, pour la même raison.
- Vega SDK :
  `curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env`

## Démarrer

```bash
npm install
npm run setup:shaka       # lecteur MSE (obligatoire, une seule fois)
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

## Lecture HLS / DASH : le lecteur MSE

Le lecteur Vega a deux modes :

| Mode | Contenus | Chemin |
|---|---|---|
| URL | `.mp4`, `.mkv`, `.mp3`, `.flv`, `.ogg`, `.flac` | `VideoPlayer.src` |
| MSE | HLS, DASH, DRM | Shaka Player pousse les segments |

Un flux live Xtream est servi en HLS : sans MSE, tout le direct échoue sur
`MSE_UNAVAILABLE`. Vega **refuse** les paquets `shaka-player` / `hls.js` publiés
en amont — il faut la version patchée par Amazon
([doc](https://developer.amazon.com/docs/vega/0.24/media-player-shaka-player.html)),
que `npm run setup:shaka` construit :

```bash
npm run setup:shaka
```

Le script télécharge `shaka-rel-v4.16.13-r1.2`, clone `shaka-player`, applique
les patches Vega, compile avec Closure, puis installe dans `src/` :

| Chemin | Origine | Versionné |
|---|---|---|
| `src/PlayerInterface.ts` | Amazon | non |
| `src/polyfills/*.ts` | Amazon | non |
| `src/shakaplayer/ShakaPlayer.ts` | Amazon | non |
| `src/shakaplayer/dist/shaka-player.compiled.debug.js` | build Closure | non |
| `src/PlayerBase.ts` | **nous** | oui |

Ces fichiers ne sont pas versionnés : les sources Amazon portent un en-tête
« AMAZON PROPRIETARY/CONFIDENTIAL » et le dist compilé pèse 1,5 Mo. La CI les
reconstruit et les met en cache.

`PlayerBase.ts` fait exception parce qu'il *manque* dans le paquet d'Amazon :
`ShakaPlayer.ts` fait `extends PlayerBase`, mais le tarball ne livre pas ce
fichier. On le reconstitue à partir des seuls membres que `ShakaPlayer` consomme.

Le branchement lui-même tient en trois fichiers à nous :

- `src/player/shaka/adapter.ts` — traduit l'interface `MseAdapter` de l'app
  (`load` / `unload` / `destroy`) vers `ShakaPlayer`, applique le tampon choisi
  dans les réglages, et pointe `global.gmedia` sur le `VideoPlayer` comme
  l'exigent les polyfills d'Amazon ;
- `src/player/shaka/polyfills.ts` — installe les polyfills W3C **avant** que le
  module Shaka ne soit évalué ;
- `index.js` — enregistre cet adaptateur avant `AppRegistry.registerComponent`.

Cette indirection sert aussi à Jest et à la prévisualisation navigateur, qui
n'exécutent pas `index.js` : ils n'ont donc pas besoin des fichiers Shaka.

## Films et séries en MKV : ce qui bloque

Mesuré sur appareil, sur un portail Xtream dont **tout le catalogue VOD est en
Matroska** :

| Ce qu'on observe | Valeur |
|---|---|
| Réponse du portail sur `…/12345.mkv` | `206 Partial Content` |
| `Content-Type` | `video/x-matroska` |
| Premiers octets | `1A 45 DF A3` — signature EBML, fichier valide |
| Résultat côté lecteur | `MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4) |

Le fichier est donc servi correctement : **c'est le lecteur qui refuse le
conteneur**, alors que le `README` de `@amazon-devices/react-native-w3cmedia`
annonce MKV parmi les formats du mode URL.

Aucun contournement côté URL sur ce portail : `.mp4`, `.m3u8` et `.ts` répondent
tous `551` avec une page HTML — il ne remuxe pas à la demande. Et le mode MSE
n'aide pas, Shaka faisant du HLS/DASH et non du Matroska.

L'application ne bloque pas pour autant la lecture : la mesure vient d'un appareil
virtuel, dont le décodeur logiciel est plus limité que celui d'un Fire TV, et
interdire l'essai serait pire que de laisser échouer. Elle **prévient** — puce
`MKV` orange et avertissement sur la fiche, message d'erreur qui nomme la cause —
et la liste des conteneurs à risque tient en une ligne dans
[`streamKind.ts`](src/player/streamKind.ts).

Les titres en `.mp4` du même portail se lisent, comme le MP4 de la playlist de
démo.

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
