export default {
  name: 'The Power of Al-Mustafa',
  slug: 'ikhteyarate-mustafa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ikhteyaratemustafa',
  userInterfaceStyle: 'automatic',
  ios: { icon: './assets/images/icon.png' },
  android: {
    package: 'com.mustafa',
    icon: './assets/images/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'static', favicon: './assets/images/icon.png' },
  plugins: [
    ['expo-router', { headers: { 'Cross-Origin-Embedder-Policy': 'credentialless', 'Cross-Origin-Opener-Policy': 'same-origin' } }],
    ['expo-splash-screen', { backgroundColor: '#FCFAF5', image: './assets/images/icon.png', imageWidth: 76 }],
    'expo-sqlite',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    eas: { projectId: 'f9b25a72-433c-4116-ba92-c1b451703d19' },
  },
};
