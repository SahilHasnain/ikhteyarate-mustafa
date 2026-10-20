export default {
  name: 'ikhteyarate-mustafa',
  slug: 'ikhteyarate-mustafa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ikhteyaratemustafa',
  userInterfaceStyle: 'automatic',
  ios: { icon: './assets/expo.icon' },
  android: {
    package: 'com.mustafa',
    adaptiveIcon: {
      backgroundColor: '#F4EFE4',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'static', favicon: './assets/images/favicon.png' },
  plugins: [
    ['expo-router', { headers: { 'Cross-Origin-Embedder-Policy': 'credentialless', 'Cross-Origin-Opener-Policy': 'same-origin' } }],
    ['expo-splash-screen', { backgroundColor: '#FCFAF5', image: './assets/images/splash-icon.png', imageWidth: 76 }],
    'expo-sqlite',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },

   "expo": {
    "extra": {
      "eas": {
        "projectId": "f9b25a72-433c-4116-ba92-c1b451703d19"
      }
    }
  }
};
