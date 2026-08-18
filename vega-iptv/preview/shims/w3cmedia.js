// Stub navigateur de @amazon-devices/react-native-w3cmedia.
// La surface native est remplacée par un aplat : la preuve visuelle porte sur
// l'OSD et la mise en page, pas sur le décodage vidéo.
import React from 'react';
import {View} from 'react-native-web';

export const KeplerVideoSurfaceView = ({style, onSurfaceViewCreated}) => {
  React.useEffect(() => {
    onSurfaceViewCreated?.('preview-surface');
  }, [onSurfaceViewCreated]);
  return <View style={[style, {backgroundColor: '#05070C'}]} />;
};
