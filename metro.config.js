const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Swap react-native-google-mobile-ads with a no-op mock in Expo Go
// (the native module isn't linked there, causing a hard crash on startup)
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-google-mobile-ads': path.resolve(
    __dirname,
    '__mocks__/react-native-google-mobile-ads.js'
  ),
  'react-native-worklets': path.resolve(
    __dirname,
    'node_modules/react-native-worklets/index.js'
  ),
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});
