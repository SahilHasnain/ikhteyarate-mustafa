import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { getEditions, getSections, type BookEdition, type BookSection } from '@/data/book';
import { useTheme } from '@/hooks/use-theme';

export default function BrowseScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [editions, setEditions] = useState<BookEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState('english');
  const [sections, setSections] = useState<BookSection[]>([]);
  const [loadedEdition, setLoadedEdition] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    getEditions(db).then((result) => active && setEditions(result)).catch(() => active && setEditions([]));
    return () => { active = false; };
  }, [db]);

  useEffect(() => {
    let active = true;
    getSections(db, selectedEdition).then((result) => {
      if (active) { setSections(result); setLoadedEdition(selectedEdition); }
    }).catch(() => {
      if (active) { setSections([]); setLoadedEdition(selectedEdition); }
    });
    return () => { active = false; };
  }, [db, selectedEdition]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return term ? sections.filter((section) => section.title.toLocaleLowerCase().includes(term) || section.content.toLocaleLowerCase().includes(term)) : sections;
  }, [sections, query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">THE POWER OF AL-MUSTAFA</ThemedText>
        <ThemedText style={styles.title}>Browse sections</ThemedText>
        <ThemedText themeColor="textSecondary">Choose an edition and find a passage.</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editionPicker}>
          {editions.map((edition) => {
            const active = selectedEdition === edition.edition_key;
            return <Pressable key={edition.edition_id} onPress={() => setSelectedEdition(edition.edition_key)} style={[styles.editionChip, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.border }]}><ThemedText style={{ color: active ? theme.onPrimary : theme.text, fontWeight: '700' }}>{edition.language}</ThemedText></Pressable>;
          })}
        </ScrollView>
        <TextInput accessibilityLabel="Search this edition" onChangeText={setQuery} placeholder="Search section titles and text" placeholderTextColor={theme.textSecondary} returnKeyType="search" style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]} value={query} />
        <ThemedText style={styles.resultHeading}>{query.trim() ? `${filtered.length} results` : `${filtered.length} sections`}</ThemedText>
        {loadedEdition !== selectedEdition ? <ThemedText themeColor="textSecondary">Loading sections…</ThemedText> : filtered.length === 0 ? <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText style={styles.emptyTitle}>No matching sections</ThemedText><ThemedText type="small" themeColor="textSecondary">Try a different search or edition.</ThemedText></View> : filtered.map((section) => {
          const preview = section.content.replace(/^#+\s*/gm, '').replace(/[>*_`]/g, '').replace(/\s+/g, ' ').trim();
          return <Pressable key={section.section_id} onPress={() => router.push({ pathname: '/reader/[edition]/[sectionId]', params: { edition: selectedEdition, sectionId: String(section.section_id) } })} style={({ pressed }) => [styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
            <View style={[styles.ordinal, { backgroundColor: theme.surfaceRaised }]}><ThemedText style={[styles.ordinalText, { color: theme.primary }]}>{String(section.ordinal + 1).padStart(2, '0')}</ThemedText></View>
            <View style={styles.sectionCopy}><ThemedText style={styles.sectionTitle} numberOfLines={2}>{section.title}</ThemedText><ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{preview}</ThemedText></View>
            <ThemedText style={[styles.arrow, { color: theme.primary }]}>›</ThemedText>
          </Pressable>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.seven, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  editionPicker: { flexDirection: 'row', gap: Spacing.two },
  editionChip: { minHeight: 42, paddingHorizontal: Spacing.three, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: Radii.pill },
  search: { minHeight: 50, borderWidth: 1, borderRadius: Radii.medium, paddingHorizontal: Spacing.three, fontSize: 16 },
  resultHeading: { fontSize: 16, fontWeight: '700', marginTop: Spacing.one },
  sectionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radii.medium },
  ordinal: { width: 42, height: 42, borderRadius: Radii.small, justifyContent: 'center', alignItems: 'center' },
  ordinalText: { fontSize: 13, fontWeight: '700' },
  sectionCopy: { flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  arrow: { fontSize: 28, lineHeight: 30 },
  empty: { padding: Spacing.four, borderWidth: 1, borderRadius: Radii.medium, gap: Spacing.two },
  emptyTitle: { fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
