import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const routerTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SQLiteProvider databaseName="ikhteyarate-mustafa-v2.db" assetSource={{ assetId: require('@/assets/db/ikhteyarate-mustafa-mobile.db') }}>
      <ThemeProvider value={{ ...routerTheme, colors: { ...routerTheme.colors, background: palette.background, card: palette.surface, text: palette.text, border: palette.border, primary: palette.primary } }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="contents/[edition]" options={{ headerShown: true, title: 'Contents', headerBackTitle: 'Back' }} />
          <Stack.Screen name="reader/[edition]/[sectionId]" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
