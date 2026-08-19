#!/usr/bin/env bash
#
# Installe le lecteur MSE Shaka patché pour Vega dans `src/`.
#
# Vega refuse les paquets shaka-player publiés en amont : Amazon distribue un
# jeu de patches (shaka-rel) qu'il faut appliquer sur le dépôt shaka-player
# officiel, puis compiler avec Closure. Le résultat n'est pas versionné — les
# sources Amazon portent un en-tête « AMAZON PROPRIETARY/CONFIDENTIAL » et le
# dist compilé pèse plusieurs mégaoctets. Ce script rejoue toute la chaîne.
#
# Prérequis : git, python3, node 18+, java 21+ (Closure Compiler).
#
# Doc de référence :
# https://developer.amazon.com/docs/vega/0.24/media-player-shaka-player.html

set -euo pipefail

SHAKA_VERSION="${SHAKA_VERSION:-4.16.13}"
SHAKA_RELEASE="${SHAKA_RELEASE:-r1.2}"
TARBALL="shaka-rel-v${SHAKA_VERSION}-${SHAKA_RELEASE}-devices_scope.tar.gz"
TARBALL_URL="https://amzndevresources.com/vega/media-player/${TARBALL}"

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${SHAKA_WORK_DIR:-${APP_ROOT}/.tmp/shaka}"

echo "Shaka pour Vega ${SHAKA_VERSION}-${SHAKA_RELEASE}"

# Closure Compiler est compilé pour Java 21+ : un JDK 17 échoue sur un
# UnsupportedClassVersionError au milieu du build, après plusieurs minutes.
if ! command -v java > /dev/null; then
  echo "Erreur : java introuvable. Closure Compiler exige un JDK 21+." >&2
  exit 1
fi
JAVA_MAJOR="$(java -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')"
if [ "${JAVA_MAJOR}" -lt 21 ]; then
  echo "Erreur : Java ${JAVA_MAJOR} détecté, Closure Compiler exige un JDK 21+." >&2
  echo "        Sur macOS : /usr/libexec/java_home -V pour lister les JDK," >&2
  echo "        puis JAVA_HOME=... PATH=\$JAVA_HOME/bin:\$PATH $0" >&2
  exit 1
fi

mkdir -p "${WORK_DIR}"
cd "${WORK_DIR}"

if [ ! -f "${TARBALL}" ]; then
  echo "Téléchargement de ${TARBALL}…"
  curl -fsSL -o "${TARBALL}" "${TARBALL_URL}"
fi

rm -rf shaka-rel
tar -xzf "${TARBALL}"

# On rejoue les étapes de shaka-rel/scripts/setup.sh à la main : le script
# d'Amazon suppose une identité git configurée pour `git am`, ce qui n'est pas
# le cas sur un runner CI.
cd shaka-rel/scripts
echo "Clonage de shaka-player…"
rm -rf shaka-player
git clone --quiet https://github.com/shaka-project/shaka-player.git
cd shaka-player
git checkout --quiet -b "amz_${SHAKA_VERSION}" "v${SHAKA_VERSION}"

echo "Application des patches Vega…"
git -c user.email=setup-shaka@local -c user.name="setup-shaka" \
  am ../../shaka-patch/*.patch -3 > /dev/null

echo "Compilation (plusieurs minutes)…"
python3 build/all.py

echo "Copie dans ${APP_ROOT}/src…"
SRC="${WORK_DIR}/shaka-rel/src"
DIST="${WORK_DIR}/shaka-rel/scripts/shaka-player/dist"

rm -rf "${APP_ROOT}/src/polyfills" "${APP_ROOT}/src/shakaplayer"
mkdir -p "${APP_ROOT}/src/polyfills" "${APP_ROOT}/src/shakaplayer/dist"

cp "${SRC}"/polyfills/*.ts "${APP_ROOT}/src/polyfills/"
cp "${SRC}/PlayerInterface.ts" "${APP_ROOT}/src/PlayerInterface.ts"
cp "${SRC}/shakaplayer/ShakaPlayer.ts" "${APP_ROOT}/src/shakaplayer/"

# Amazon documente la copie du `dist` entier (31 Mo, dont 15 Mo de source maps
# et trois variantes de build). Seule la bibliothèque complète en debug est
# importée par ShakaPlayer.ts ; on s'en tient là pour ne pas noyer Metro.
cp "${DIST}/shaka-player.compiled.debug.js" "${APP_ROOT}/src/shakaplayer/dist/"
cp "${DIST}/shaka-player.compiled.debug.d.ts" "${APP_ROOT}/src/shakaplayer/dist/"

echo
echo "Terminé. Fichiers installés (non versionnés) :"
echo "  src/PlayerInterface.ts"
echo "  src/polyfills/*.ts"
echo "  src/shakaplayer/ShakaPlayer.ts"
echo "  src/shakaplayer/dist/shaka-player.compiled.debug.js"
