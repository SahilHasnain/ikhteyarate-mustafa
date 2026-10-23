import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return <Tabs><TabSlot style={styles.slot} /><TabList style={styles.tabList}><TabTrigger name="library" href="/(tabs)" asChild><TabButton>Library</TabButton></TabTrigger><TabTrigger name="browse" href="/(tabs)/explore" asChild><TabButton>Browse</TabButton></TabTrigger></TabList></Tabs>;
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();
  return <Pressable {...props} style={styles.tabPress}><ThemedView style={[styles.tabButton, { backgroundColor: isFocused ? theme.surfaceSelected : theme.surface }]}><ThemedText type="smallBold" style={{ color: isFocused ? theme.primary : theme.textSecondary }}>{children}</ThemedText></ThemedView></Pressable>;
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  tabList: { position: 'absolute', bottom: Spacing.three, alignSelf: 'center', flexDirection: 'row', padding: Spacing.one, borderRadius: Radii.pill, maxWidth: MaxContentWidth },
  tabPress: { minWidth: 120 },
  tabButton: { minHeight: 46, borderRadius: Radii.pill, paddingHorizontal: Spacing.four, justifyContent: 'center', alignItems: 'center' },
});
