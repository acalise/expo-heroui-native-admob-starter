module.exports = function (api) {
  api.cache(true);
  return {
    // `babel-preset-expo` already includes the Reanimated 4 / Worklets plugin.
    // Adding 'react-native-reanimated/plugin' by hand (required on Reanimated 2
    // and 3) now double-transforms worklets and breaks the build.
    presets: ['babel-preset-expo'],
  };
};
