# Icônes

PNG générés depuis les sources SVG de [Feather](https://feathericons.com)
(MIT, voir `LICENSE`) par `scripts/build-icons.py`.

Pourquoi des PNG et pas une librairie npm : `react-native-svg` compile un module
natif et `react-native-vector-icons` enregistre des polices côté plateforme —
Vega n'exécute ni l'un ni l'autre. `Image` est en revanche pris en charge
nativement, donc on rastérise en amont.

Ajouter une icône : compléter le dictionnaire `ICONS` du script avec un nom local
(le rôle dans l'app) et le nom Feather correspondant, puis relancer

```bash
npm run build:icons
```

Le nom local est celui utilisé dans le code : il décrit l'usage et non le dessin,
ce qui permet de changer d'icône sans toucher aux écrans.
