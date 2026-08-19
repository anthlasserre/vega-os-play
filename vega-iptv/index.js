import { AppRegistry, LogBox } from 'react-native';
import { App } from './src/App';
import { name as appName } from './app.json';
import { registerMseAdapterFactory } from './src/player/shaka';
import { createShakaAdapter } from './src/player/shaka/adapter';

// Temporary workaround for problem with nested text
// not working currently.
LogBox.ignoreAllLogs();

// Avant tout rendu : le lecteur interroge le registre dès la première lecture
// d'un flux adaptatif (HLS/DASH), c'est-à-dire de tout le direct Xtream.
registerMseAdapterFactory(createShakaAdapter);

AppRegistry.registerComponent(appName, () => App);
