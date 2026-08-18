const path = require('path');
const esbuild = require('esbuild');

const shim = name => path.resolve(__dirname, 'shims', name);

esbuild
  .build({
    entryPoints: [path.resolve(__dirname, 'entry.jsx')],
    bundle: true,
    outfile: path.resolve(__dirname, 'out/bundle.js'),
    loader: {'.js': 'jsx', '.png': 'dataurl'},
    define: {
      'process.env.NODE_ENV': '"development"',
      __DEV__: 'true',
    },
    alias: {
      // Le dossier applicatif a son propre node_modules : sans ces alias,
      // esbuild embarque deux copies de React et tous les hooks explosent.
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-native': 'react-native-web',
      '@amazon-devices/react-native-kepler': shim('kepler.js'),
      '@amazon-devices/react-native-w3cmedia/dist/headless': shim(
        'w3cmedia-headless.js',
      ),
      '@amazon-devices/react-native-w3cmedia': shim('w3cmedia.js'),
    },
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
