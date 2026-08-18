module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Requis par @amazon-devices/react-native-w3cmedia, sinon le bundle lève
  // "ReferenceError: Property 'React' doesn't exist" au runtime.
  plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}]],
};
