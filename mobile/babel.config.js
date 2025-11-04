// Keep a minimal, stable babel config for Expo + NativeWind
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
