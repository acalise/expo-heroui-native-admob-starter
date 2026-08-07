const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'ios/*', 'android/*', '.expo/*', 'uniwind-types.d.ts'],
  },
  {
    // Node scripts, not app code: they legitimately use CommonJS globals.
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', module: 'writable', require: 'readonly' },
    },
  },
]);
