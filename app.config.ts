import { Colors } from './src/constants/palette';

const light = Colors.light;

export default {
  name: 'ikhteyarate-mustafa',
  slug: 'ikhteyarate-mustafa',
  version: '1.0.0',
  orientation: 'portrait' as const,
  icon: './assets/images/icon.png',
  scheme: 'ikhteyaratemustafa',
  userInterfaceStyle: 'automatic' as const,
  ios: { icon: './assets/expo.icon' },
  android: {
    adaptiveIcon: {
      backgroundColor: light.surfaceRaised,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'static' as const, favicon: './assets/images/favicon.png' },
  plugins: [
    ['expo-router', { headers: { 'Cross-Origin-Embedder-Policy': 'credentialless', 'Cross-Origin-Opener-Policy': 'same-origin' } }],
    ['expo-splash-screen', { backgroundColor: light.background, image: './assets/images/splash-icon.png', imageWidth: 76 }],
    'expo-sqlite',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};
