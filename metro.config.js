const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  // Regenerates the `className` autocomplete types on every Metro start.
  dtsFile: './uniwind-types.d.ts',
});
