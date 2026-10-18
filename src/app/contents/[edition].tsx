import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { getEditions, getSections, type BookEdition, type BookSection } from '@/data/book';
import { useTheme } from '@/hooks/use-theme';

export default function ContentsScreen() {
  const { edition } = useLocalSearchParams<{ edition: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [bookEdition, setBookEdition] = useState<BookEdition | null>(null);
  const [sections, setSections] = useState<BookSection[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getEditions(db), getSections(db, edition ?? '')]).then(([allEditions, loadedSections]) => {
      if (!active) return;
      setBookEdition(allEditions.find((item) => item.edition_key === edition) ?? null);
      setSections(loadedSections);
    }).catch(() => active && setSections([]));
    return () => { active = false; };
  }, [db, edition]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">IKHTEYARATE MUSTAFA</ThemedText>
        <ThemedText style={styles.title}>{bookEdition?.language ?? 'Contents'}</ThemedText>
        <ThemedText themeColor="textSecondary">{sections.length} sections</ThemedText>
        {sections.map((section) => {
          const preview = section.content.replace(/^#+\s*/gm, '').replace(/[>*_`]/g, '').replace(/\s+/g, ' ').trim();
          return <Pressable key={section.section_id} onPress={() => router.push({ pathname: '/reader/[edition]/[sectionId]', params: { edition: edition ?? '', sectionId: String(section.section_id) } })} style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
            <View style={[styles.number, { backgroundColor: theme.surfaceRaised }]}><ThemedText style={[styles.numberText, { color: theme.primary }]}>{String(section.ordinal + 1).padStart(2, '0')}</ThemedText></View>
            <View style={styles.copy}><ThemedText style={styles.rowTitle} numberOfLines={2}>{section.title}</ThemedText><ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{preview}</ThemedText></View>
            <ThemedText style={[styles.arrow, { color: theme.primary }]}>›</ThemedText>
          </Pressable>;
        })}
        {sections.length === 0 && <ThemedText themeColor="textSecondary">Loading contents…</ThemedText>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.seven, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radii.medium, borderWidth: 1 },
  number: { width: 42, height: 42, borderRadius: Radii.small, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '700' },
  copy: { flex: 1, gap: Spacing.one },
  rowTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  arrow: { fontSize: 28, lineHeight: 30 },
  pressed: { opacity: 0.72 },
});
