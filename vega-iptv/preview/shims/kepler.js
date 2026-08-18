// Stub navigateur de @amazon-devices/react-native-kepler.
// TVFocusGuideView n'est qu'un conteneur de focus : une View suffit pour le rendu.
import {View} from 'react-native-web';

export const TVFocusGuideView = View;

export const useKeplerBackHandler = () => ({
  exitApp: () => {},
  addEventListener: () => ({remove: () => {}}),
});
