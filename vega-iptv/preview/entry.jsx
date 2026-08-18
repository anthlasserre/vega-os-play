import {AppRegistry} from 'react-native-web';
import {App} from '../src/App';
import {installFakeXtream} from './fakeXtream';

// Le portail Xtream est simulé côté fetch : les captures montrent les écrans
// VOD, séries et EPG sans exposer d'abonnement réel.
installFakeXtream();

AppRegistry.registerComponent('VegaIptv', () => App);
// runApplication (et pas getApplication + createRoot) : c'est lui qui dimensionne
// le root en plein écran, comme la surface applicative sur l'appareil.
AppRegistry.runApplication('VegaIptv', {
  rootTag: document.getElementById('root'),
});
