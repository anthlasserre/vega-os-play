# Déployer sur un Fire TV

## 0. Prérequis matériel — à vérifier en premier

**Vega OS ne tourne aujourd'hui que sur le Fire TV Stick 4K Select.** Tous les
autres Fire TV (Stick 4K, 4K Max, Cube, téléviseurs intégrés) tournent sous
Fire OS, qui est de l'Android : ils installent des `.apk`, pas des `.vpkg`. Le
paquet produit ici ne s'y installera pas.

Vérification rapide sur l'appareil : `Paramètres > My Fire TV > À propos`.

Il faut aussi un **compte développeur Amazon** avec un **profil vendeur**
(vendor) configuré sur [developer.amazon.com](https://developer.amazon.com) —
sans lui, l'activation du mode développeur échoue avec « no vendors found ».

## 1. Activer le mode développeur (une fois par appareil)

Sur le Fire TV :

1. `Paramètres > My Fire TV > À propos`
2. Appuyer **7 fois** sur le nom de l'appareil → le menu `Options développeur` apparaît
3. `Options développeur > Mode développeur > Continuer`
4. L'écran affiche un **code à 6 caractères, valable 5 minutes**

Sur la machine de dev :

```bash
source ~/vega/env
vega devmode login          # ouvre le navigateur, connexion compte développeur
vega devmode list-vendors   # récupère l'id vendeur (MXXXXXXXXXX)
vega devmode enable-device --code <CODE> --vendor <VENDOR_ID>
```

L'appareil redémarre tout seul. Compter 30 à 60 s.

> Le code expire vite. S'il est refusé, refaire `Options développeur > Mode
> développeur > Continuer` pour en obtenir un neuf.

## 2. Connecter l'appareil

Machine de dev et Fire TV **sur le même réseau**.

```bash
vega device list
```

L'appareil doit apparaître, du type `GXX2A1234567890A : armv7 - OS - amazon-12345`.

S'il n'apparaît pas, le connecter explicitement par son IP (visible dans
`Paramètres > Réseau` sur le Fire TV) :

```bash
vega exec vda connect <IP_DU_FIRE_TV>
vega device list
```

## 3. Construire

```bash
npm install
npm run build:debug     # itération quotidienne
npm run build:release   # build de distribution
```

Le build produit les trois architectures d'un coup :

```
build/armv7-debug/vega-iptv_armv7.vpkg
build/aarch64-debug/vega-iptv_aarch64.vpkg
build/x86_64-debug/vega-iptv_x86_64.vpkg
```

## 4. Installer et lancer

Laisser la CLI choisir l'architecture — c'est le mode le plus sûr, il évite
l'erreur classique de mauvais `.vpkg` :

```bash
vega device install-app --dir . -b Debug
vega device launch-app --dir .
```

Vérifier :

```bash
vega device running-apps
vega device is-app-running --appName com.dkl.vegaiptv.main
```

En une commande, avec un paquet explicite :

```bash
vega run-app build/armv7-debug/vega-iptv_armv7.vpkg com.dkl.vegaiptv.main
```

## 5. Itérer sans reconstruire (Fast Refresh)

Une fois un build **Debug** installé, les modifications `.tsx` se rechargent à
chaud. Trois choses doivent tourner en même temps.

Terminal 1 — redirection de port (une fois par session, persiste jusqu'au
redémarrage de l'appareil) :

```bash
vega device start-port-forwarding --port 8081 --forward false
```

Terminal 2 — Metro :

```bash
npm start
```

Puis relancer l'app :

```bash
vega device launch-app --dir .
```

> `--forward false` signifie redirection **inverse** : c'est l'appareil qui se
> connecte au Metro de la machine de dev. Ne pas réutiliser le terminal de Metro
> pour la redirection de port.

## 6. Diagnostiquer

```bash
vega device start-log-stream          # logs en direct
vega device stop-log-stream
vega device doctor                    # logs et rapports de crash
vega device installed-apps
vega device uninstall-app --appName com.dkl.vegaiptv.main
```

## Ce qui marchera — et ce qui ne marchera pas encore

Au premier lancement, l'app démarre sur la playlist de démo. Ajouter un portail
Xtream depuis `Réglages > Gérer les sources`.

**Les chaînes en direct ne se liront pas.** Un flux live Xtream est servi en
HLS, et le mode MSE attend le `dist` Shaka patché Vega (voir la section dédiée
du README). L'app affiche un message explicite plutôt qu'un écran noir.
En revanche, les **films et épisodes en `.mp4` / `.mkv`** passent par le mode
URL et se lisent dès maintenant : c'est le bon chemin pour valider le déploiement.

## Problèmes courants

| Symptôme | Cause probable |
|---|---|
| `vega device list` vide | Appareil sur un autre réseau, mode développeur non activé, ou pare-feu bloquant la découverte locale |
| `no vendors found` | Pas de profil vendeur sur le compte développeur Amazon |
| Code OTP refusé | Expiré (5 min) — en regénérer un sur l'appareil |
| `Can't find a VPKG file for architecture …` | Build manquant pour ce type — relancer `npm run build:debug` (ou `:release`) |
| `Unknown argument: vpkg` | Utiliser `--packagePath`, pas `--vpkg` |
| L'app s'installe mais ne démarre pas | Vérifier le nom : `com.dkl.vegaiptv.main` (cf. `app.json`) |
| Fast Refresh inactif | Metro doit tourner **avant** le lancement ; vérifier `vega device is-port-forwarded --port 8081` |
