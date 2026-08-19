#!/usr/bin/env python3
"""Génère les icônes PNG de l'app à partir des sources SVG de Feather.

Pourquoi ce détour plutôt qu'une librairie d'icônes du registre npm : les deux
candidates habituelles embarquent du code natif — `react-native-svg` compile un
module Android/iOS, `react-native-vector-icons` enregistre des polices côté
plateforme. Vega n'exécute ni l'un ni l'autre. Restent les `Image`, que le
runtime gère nativement : on rastérise donc les tracés en amont, une fois.

Feather (https://feathericons.com) est sous licence MIT, reproduite dans
`src/ui/icons/LICENSE`.

Le rendu se fait en suréchantillonnage ×8 puis réduction : c'est ce qui donne des
bords lisses sans dépendre d'un moteur de rastérisation externe (aucun n'est
disponible ici, et en imposer un comme prérequis de build serait pire).

    python3 scripts/build-icons.py            # icônes manquantes seulement
    python3 scripts/build-icons.py --force    # tout régénérer
"""

import math
import os
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw

FEATHER_BASE = "https://raw.githubusercontent.com/feathericons/feather/main/icons"

# Taille finale, en pixels. L'app affiche ces icônes entre 14 et 26 points sur un
# écran de densité 2, soit 28 à 52 pixels : 96 laisse de la marge sans peser.
SIZE = 96
SUPERSAMPLE = 8
# Feather dessine sur une grille 24×24 avec un trait de 2 : conservé à l'échelle.
VIEWBOX = 24.0
STROKE = 2.0

OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "src", "ui", "icons"
)

# Nom local -> nom Feather. Le nom local est celui qu'utilise le code de l'app :
# il décrit le rôle, pas le dessin, ce qui permet de changer d'icône sans toucher
# aux écrans.
ICONS = {
    "play": "play",
    "pause": "pause",
    "rewind": "rotate-ccw",
    "forward": "rotate-cw",
    "back": "arrow-left",
    "star": "star",
    "search": "search",
    "settings": "settings",
    "grid": "grid",
    "list": "list",
    "filter": "filter",
    "history": "clock",
    "trash": "trash-2",
    "audio": "volume-2",
    "subtitles": "type",
    "live": "tv",
    "movie": "film",
    "series": "layers",
    "favorite": "heart",
    "reload": "refresh-cw",
    "checked": "check-square",
    "unchecked": "square",
    "close": "x",
    "next": "chevron-right",
    "previous": "chevron-left",
    "source": "server",
    "buffer": "activity",
    "info": "info",
    "eye": "eye",
    "eye-off": "eye-off",
}


# --- Analyse des tracés SVG -------------------------------------------------

NUMBER = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")
COMMAND = re.compile(r"([MmZzLlHhVvCcSsQqTtAa])")


def _numbers(text):
    return [float(value) for value in NUMBER.findall(text)]


def _bezier3(p0, p1, p2, p3, steps=24):
    points = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        points.append(
            (
                u * u * u * p0[0]
                + 3 * u * u * t * p1[0]
                + 3 * u * t * t * p2[0]
                + t * t * t * p3[0],
                u * u * u * p0[1]
                + 3 * u * u * t * p1[1]
                + 3 * u * t * t * p2[1]
                + t * t * t * p3[1],
            )
        )
    return points


def _bezier2(p0, p1, p2, steps=18):
    points = []
    for i in range(1, steps + 1):
        t = i / steps
        u = 1 - t
        points.append(
            (
                u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
            )
        )
    return points


def _arc(start, rx, ry, rotation, large_arc, sweep, end, steps=24):
    """Arc elliptique SVG, converti en polyligne.

    Suit l'annexe F.6 de la spécification SVG. Nécessaire : plusieurs icônes
    Feather — dont l'engrenage des réglages — sont entièrement décrites par des
    commandes `a`.
    """
    x1, y1 = start
    x2, y2 = end
    if rx == 0 or ry == 0 or (x1 == x2 and y1 == y2):
        return [end]

    rx, ry = abs(rx), abs(ry)
    phi = math.radians(rotation)
    cos_phi, sin_phi = math.cos(phi), math.sin(phi)

    dx2, dy2 = (x1 - x2) / 2.0, (y1 - y2) / 2.0
    x1p = cos_phi * dx2 + sin_phi * dy2
    y1p = -sin_phi * dx2 + cos_phi * dy2

    # Agrandit les rayons s'ils sont trop petits pour joindre les deux points.
    lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lam > 1:
        scale = math.sqrt(lam)
        rx, ry = rx * scale, ry * scale

    denom = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    num = rx * rx * ry * ry - denom
    factor = math.sqrt(max(0.0, num / denom)) if denom else 0.0
    if large_arc == sweep:
        factor = -factor

    cxp = factor * rx * y1p / ry
    cyp = -factor * ry * x1p / rx
    cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2.0
    cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2.0

    def angle_of(x, y):
        return math.atan2((y - cyp) / ry, (x - cxp) / rx)

    theta1 = angle_of(x1p, y1p)
    theta2 = angle_of(-x1p, -y1p)
    delta = theta2 - theta1
    if sweep and delta < 0:
        delta += 2 * math.pi
    elif not sweep and delta > 0:
        delta -= 2 * math.pi

    points = []
    for i in range(1, steps + 1):
        theta = theta1 + delta * i / steps
        px = rx * math.cos(theta)
        py = ry * math.sin(theta)
        points.append(
            (cos_phi * px - sin_phi * py + cx, sin_phi * px + cos_phi * py + cy)
        )
    return points


def parse_path(data):
    """Rend une liste de sous-tracés, chacun `(points, closed)`."""
    tokens = [t for t in COMMAND.split(data) if t.strip()]
    subpaths = []
    current = []
    closed = False
    point = (0.0, 0.0)
    start = (0.0, 0.0)
    previous_control = None
    command = None

    def flush():
        nonlocal current, closed
        if len(current) > 1:
            subpaths.append((current, closed))
        current = []
        closed = False

    index = 0
    while index < len(tokens):
        token = tokens[index]
        if COMMAND.fullmatch(token):
            command = token
            index += 1
            args = _numbers(tokens[index]) if index < len(tokens) and not COMMAND.fullmatch(tokens[index]) else []
            if args:
                index += 1
        else:
            args = _numbers(token)
            index += 1

        relative = command.islower()
        upper = command.upper()

        if upper == "M":
            # Une commande `M` répétée équivaut à des `L` après le premier point.
            for i in range(0, len(args) - 1, 2):
                x, y = args[i], args[i + 1]
                target = (point[0] + x, point[1] + y) if relative else (x, y)
                if i == 0:
                    flush()
                    start = target
                    current = [target]
                else:
                    current.append(target)
                point = target
            previous_control = None

        elif upper == "L":
            for i in range(0, len(args) - 1, 2):
                x, y = args[i], args[i + 1]
                point = (point[0] + x, point[1] + y) if relative else (x, y)
                current.append(point)
            previous_control = None

        elif upper == "H":
            for x in args:
                point = (point[0] + x, point[1]) if relative else (x, point[1])
                current.append(point)
            previous_control = None

        elif upper == "V":
            for y in args:
                point = (point[0], point[1] + y) if relative else (point[0], y)
                current.append(point)
            previous_control = None

        elif upper == "C":
            for i in range(0, len(args) - 5, 6):
                values = args[i : i + 6]
                if relative:
                    c1 = (point[0] + values[0], point[1] + values[1])
                    c2 = (point[0] + values[2], point[1] + values[3])
                    end = (point[0] + values[4], point[1] + values[5])
                else:
                    c1 = (values[0], values[1])
                    c2 = (values[2], values[3])
                    end = (values[4], values[5])
                current.extend(_bezier3(point, c1, c2, end))
                previous_control = c2
                point = end

        elif upper == "S":
            for i in range(0, len(args) - 3, 4):
                values = args[i : i + 4]
                if relative:
                    c2 = (point[0] + values[0], point[1] + values[1])
                    end = (point[0] + values[2], point[1] + values[3])
                else:
                    c2 = (values[0], values[1])
                    end = (values[2], values[3])
                c1 = (
                    2 * point[0] - previous_control[0],
                    2 * point[1] - previous_control[1],
                ) if previous_control else point
                current.extend(_bezier3(point, c1, c2, end))
                previous_control = c2
                point = end

        elif upper == "Q":
            for i in range(0, len(args) - 3, 4):
                values = args[i : i + 4]
                if relative:
                    c = (point[0] + values[0], point[1] + values[1])
                    end = (point[0] + values[2], point[1] + values[3])
                else:
                    c = (values[0], values[1])
                    end = (values[2], values[3])
                current.extend(_bezier2(point, c, end))
                previous_control = c
                point = end

        elif upper == "T":
            for i in range(0, len(args) - 1, 2):
                values = args[i : i + 2]
                end = (
                    (point[0] + values[0], point[1] + values[1])
                    if relative
                    else (values[0], values[1])
                )
                c = (
                    2 * point[0] - previous_control[0],
                    2 * point[1] - previous_control[1],
                ) if previous_control else point
                current.extend(_bezier2(point, c, end))
                previous_control = c
                point = end

        elif upper == "A":
            for i in range(0, len(args) - 6, 7):
                rx, ry, rot, large, sweep, x, y = args[i : i + 7]
                end = (point[0] + x, point[1] + y) if relative else (x, y)
                current.extend(
                    _arc(point, rx, ry, rot, int(large), int(sweep), end)
                )
                point = end
            previous_control = None

        elif upper == "Z":
            closed = True
            if current:
                current.append(start)
            flush()
            point = start
            previous_control = None

    flush()
    return subpaths


def shape_to_subpaths(element):
    """Convertit une primitive SVG en sous-tracés `(points, closed)`."""
    tag = element.tag.split("}")[-1]
    get = lambda name, default="0": element.get(name, default)

    if tag == "line":
        return [
            (
                [
                    (float(get("x1")), float(get("y1"))),
                    (float(get("x2")), float(get("y2"))),
                ],
                False,
            )
        ]

    if tag == "polyline":
        values = _numbers(get("points", ""))
        return [(list(zip(values[0::2], values[1::2])), False)]

    if tag == "polygon":
        values = _numbers(get("points", ""))
        points = list(zip(values[0::2], values[1::2]))
        return [(points + points[:1], True)]

    if tag == "circle":
        cx, cy, r = float(get("cx")), float(get("cy")), float(get("r"))
        steps = 64
        points = [
            (
                cx + r * math.cos(2 * math.pi * i / steps),
                cy + r * math.sin(2 * math.pi * i / steps),
            )
            for i in range(steps + 1)
        ]
        return [(points, True)]

    if tag == "ellipse":
        cx, cy = float(get("cx")), float(get("cy"))
        rx, ry = float(get("rx")), float(get("ry"))
        steps = 64
        points = [
            (
                cx + rx * math.cos(2 * math.pi * i / steps),
                cy + ry * math.sin(2 * math.pi * i / steps),
            )
            for i in range(steps + 1)
        ]
        return [(points, True)]

    if tag == "rect":
        x, y = float(get("x")), float(get("y"))
        w, h = float(get("width")), float(get("height"))
        rx = float(get("rx", "0"))
        if rx <= 0:
            points = [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]
            return [(points, True)]
        # Coins arrondis : un quart d'arc par angle.
        rx = min(rx, w / 2, h / 2)
        points = []
        corners = [
            ((x + w - rx, y + rx), 270),
            ((x + w - rx, y + h - rx), 0),
            ((x + rx, y + h - rx), 90),
            ((x + rx, y + rx), 180),
        ]
        for (ccx, ccy), start_angle in corners:
            for i in range(17):
                angle = math.radians(start_angle + 90 * i / 16)
                points.append((ccx + rx * math.cos(angle), ccy + rx * math.sin(angle)))
        points.append(points[0])
        return [(points, True)]

    if tag == "path":
        return parse_path(get("d", ""))

    return []


# --- Rendu -------------------------------------------------------------------


def render(svg_text):
    """Rastérise un SVG Feather en image RGBA blanche sur fond transparent."""
    root = ET.fromstring(svg_text)
    canvas = SIZE * SUPERSAMPLE
    scale = canvas / VIEWBOX
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    width = STROKE * scale
    radius = width / 2.0
    white = (255, 255, 255, 255)

    for element in root.iter():
        for points, _closed in shape_to_subpaths(element):
            if len(points) < 2:
                continue
            scaled = [(x * scale, y * scale) for x, y in points]
            draw.line(scaled, fill=white, width=int(round(width)), joint="curve")
            # `joint="curve"` ne traite pas les extrémités : Feather les veut
            # arrondies (`stroke-linecap="round"`), d'où ces deux disques.
            for x, y in (scaled[0], scaled[-1]):
                draw.ellipse(
                    (x - radius, y - radius, x + radius, y + radius), fill=white
                )

    return image.resize((SIZE, SIZE), Image.LANCZOS)


def fetch(name):
    """Récupère un SVG Feather.

    `urllib` d'abord, `curl` en repli : selon l'installation de Python sur macOS,
    le magasin de certificats n'est pas renseigné et la connexion TLS échoue,
    alors que `curl` — présent partout — s'en sort.
    """
    url = f"{FEATHER_BASE}/{name}.svg"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.read().decode("utf-8")
    except Exception:
        return subprocess.run(
            ["curl", "-fsSL", url], check=True, capture_output=True, text=True
        ).stdout


def main():
    force = "--force" in sys.argv
    os.makedirs(OUT_DIR, exist_ok=True)

    written = 0
    for local, feather in sorted(ICONS.items()):
        target = os.path.join(OUT_DIR, f"{local}.png")
        if os.path.exists(target) and not force:
            continue
        render(fetch(feather)).save(target, optimize=True)
        print(f"  {local}.png  ({feather})")
        written += 1

    print(f"{written} icône(s) générée(s) dans src/ui/icons/")


if __name__ == "__main__":
    main()
