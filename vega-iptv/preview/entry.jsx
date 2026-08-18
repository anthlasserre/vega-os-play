import {AppRegistry} from 'react-native-web';
import {App} from '../src/App';

AppRegistry.registerComponent('VegaIptv', () => App);
// runApplication (et pas getApplication + createRoot) : c'est lui qui dimensionne
// le root en plein écran, comme la surface applicative sur l'appareil.
AppRegistry.runApplication('VegaIptv', {
  rootTag: document.getElementById('root'),
});
