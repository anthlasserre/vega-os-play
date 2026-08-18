// Stub navigateur de @amazon-devices/kepler-file-system.
// L'état persiste en localStorage : suffisant pour rejouer favoris et historique
// dans le navigateur, sans jamais toucher au bac à sable Vega.
const KEY = 'vega-iptv-preview-state';

export const KeplerFileSystem = {
  exists: async () => window.localStorage.getItem(KEY) !== null,
  readFileAsString: async () => window.localStorage.getItem(KEY) ?? '',
  writeStringToFile: async (_path, contents) => {
    window.localStorage.setItem(KEY, contents);
  },
};
