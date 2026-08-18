import {KeplerFileSystem} from '@amazon-devices/kepler-file-system';
import {PersistedState, defaultState, parseState} from './schema';

/** `/data` est le seul emplacement inscriptible persistant du bac à sable Vega. */
const STATE_PATH = '/data/vega-iptv-state.json';

/**
 * Sur le simulateur, en test, ou si le service fichier est indisponible, on
 * dégrade en mémoire plutôt que de faire planter l'app : perdre les favoris est
 * ennuyeux, ne pas démarrer l'est beaucoup plus.
 */
let memoryFallback: PersistedState | null = null;

export const readState = async (): Promise<PersistedState> => {
  try {
    const exists = await KeplerFileSystem.exists(STATE_PATH);
    if (!exists) {
      return memoryFallback ?? defaultState();
    }
    const raw = await KeplerFileSystem.readFileAsString(STATE_PATH, 'UTF-8');
    return parseState(JSON.parse(raw));
  } catch (cause) {
    console.warn('Lecture de l\'état impossible, retour aux valeurs par défaut', cause);
    return memoryFallback ?? defaultState();
  }
};

export const writeState = async (state: PersistedState): Promise<void> => {
  memoryFallback = state;
  try {
    await KeplerFileSystem.writeStringToFile(
      STATE_PATH,
      JSON.stringify(state),
      'UTF-8',
    );
  } catch (cause) {
    console.warn('Écriture de l\'état impossible, conservée en mémoire', cause);
  }
};
