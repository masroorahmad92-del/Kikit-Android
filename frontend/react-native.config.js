// react-native.config.js
module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    // react-native-nitro-sound is optional for stream-chat; it conflicts with
    // react-native-sound because both register a class named SoundPackage.
    'react-native-nitro-sound': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
   