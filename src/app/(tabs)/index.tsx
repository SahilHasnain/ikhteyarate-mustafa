import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { getBook, getEditionSection, getSections, getEditions, type Book, type BookEdition } from '@/data/book';
import { getReadingProgress } from '@/data/reading-progress';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const scheme = useColorScheme();
  const palette = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [book, setBook] = useState<Book | null>(null);
  const [editions, setEditions] = useState<BookEdition[]>([]);
  const [resumeTarget, setResumeTarget] = useState<{ editionKey: string; sectionId: number; language: string; title: string } | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadLibrary() {
      try {
        const [loadedBook, loadedEditions] = await Promise.all([getBook(db), getEditions(db)]);
        if (!active) return;
        setBook(loadedBook);
        setEditions(loadedEditions);
        const saved = await getReadingProgress();
        if (!saved || !active) return;
        const savedEdition = loadedEditions.find((item) => item.edition_key === saved.editionKey);
        if (!savedEdition) return;
        const savedSection = await getEditionSection(db, saved.editionKey, saved.sectionId);
        if (active && savedSection) setResumeTarget({ editionKey: saved.editionKey, sectionId: saved.sectionId, language: savedEdition.language, title: savedSection.title });
      } catch {
        if (active) setHasError(true);
      }
    }
    void loadLibrary();
    return () => { active = false; };
  }, [db]);

  const continueReading = async () => {
    if (resumeTarget) {
      router.push({ pathname: '/reader/[edition]/[sectionId]', params: { edition: resumeTarget.editionKey, sectionId: String(resumeTarget.sectionId) } });
      return;
    }
    const firstEdition = editions.find((item) => item.edition_key === 'english') ?? editions[0];
    if (!firstEdition) return;
    const firstSection = (await getSections(db, firstEdition.edition_key))[0];
    if (firstSection) router.push({ pathname: '/reader/[edition]/[sectionId]', params: { edition: firstEdition.edition_key, sectionId: String(firstSection.section_id) } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <View><ThemedText type="small" themeColor="textSecondary">YOUR READING LIBRARY</ThemedText><ThemedText style={styles.greeting}>Assalamu alaikum</ThemedText></View>
          <View style={[styles.profile, { backgroundColor: palette.surfaceRaised }]}><ThemedText style={{ color: palette.primary, fontWeight: '700' }}>م</ThemedText></View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <ThemedText style={[styles.eyebrow, { color: palette.primary }]}>A BOOK TO EXPLORE</ThemedText>
          <ThemedText style={styles.bookTitle}>{book?.title ?? 'Ikhteyarate Mustafa'}</ThemedText>
          <ThemedText themeColor="textSecondary">{book?.author ?? 'Imran Raza Attari'}</ThemedText>
          <View style={styles.bookMeta}><ThemedText type="small" themeColor="textSecondary">Three language editions</ThemedText><ThemedText type="small" themeColor="textSecondary">·</ThemedText><ThemedText type="small" themeColor="textSecondary">17 sections each</ThemedText></View>
          <Pressable accessibilityRole="button" disabled={editions.length === 0} onPress={() => void continueReading()} style={({ pressed }) => [styles.continueButton, { backgroundColor: palette.primary }, pressed && styles.pressed, editions.length === 0 && styles.disabled]}>
            <ThemedText style={[styles.continueButtonText, { color: palette.onPrimary }]}>{resumeTarget ? 'Continue reading' : 'Start reading'}</ThemedText>
            <ThemedText style={[styles.continueArrow, { color: palette.onPrimary }]}>›</ThemedText>
          </Pressable>
          <View style={[styles.ornament, { borderColor: palette.border }]}><ThemedText style={[styles.ornamentText, { color: palette.primary }]}>۞</ThemedText></View>
        </View>
        {resumeTarget && <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>Last read · {resumeTarget.language} · {resumeTarget.title}</ThemedText>}

        <View style={styles.sectionHeading}><View><ThemedText type="subtitle" style={styles.sectionTitle}>Choose an edition</ThemedText><ThemedText type="small" themeColor="textSecondary">Read in the language you prefer.</ThemedText></View></View>

        {hasError ? <ThemedText themeColor="error">The library could not be opened. Please restart the app.</ThemedText> : editions.length === 0 ? <ThemedText themeColor="textSecondary">Preparing your library…</ThemedText> : editions.map((edition) => (
          <Pressable key={edition.edition_id} onPress={() => router.push({ pathname: '/contents/[edition]', params: { edition: edition.edition_key } })} style={({ pressed }) => [styles.editionCard, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
            <View style={[styles.editionIcon, { backgroundColor: palette.surfaceRaised }]}><ThemedText style={[styles.editionIconText, { color: palette.primary }]}>{edition.language === 'Hindi' ? 'अ' : edition.language === 'English' ? 'En' : 'ع'}</ThemedText></View>
            <View style={styles.editionInfo}><ThemedText style={styles.editionTitle} numberOfLines={1}>{edition.language}</ThemedText><ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{edition.display_title} · {edition.section_count} sections</ThemedText></View>
            <ThemedText style={[styles.arrow, { color: palette.primary }]}>›</ThemedText>
          </Pressable>
        ))}

        <View style={[styles.note, { backgroundColor: palette.surface, borderColor: palette.border }]}><ThemedText style={[styles.noteIcon, { color: palette.primary }]}>✦</ThemedText><View style={styles.noteCopy}><ThemedText style={styles.noteTitle}>Read at your pace</ThemedText><ThemedText type="small" themeColor="textSecondary">Browse the sections, search for a topic, and adjust the text size while reading.</ThemedText></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.seven, gap: Spacing.three },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.one },
  greeting: { fontSize: 26, lineHeight: 34, fontWeight: '700', marginTop: Spacing.half },
  profile: { width: 42, height: 42, borderRadius: Radii.pill, justifyContent: 'center', alignItems: 'center' },
  featureCard: { minHeight: 232, borderRadius: Radii.large, borderWidth: 1, overflow: 'hidden', padding: Spacing.four, justifyContent: 'center', gap: Spacing.one },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700', marginBottom: Spacing.two },
  bookTitle: { fontSize: 30, lineHeight: 38, fontWeight: '700', maxWidth: '78%' },
  bookMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  continueButton: { minHeight: 44, maxWidth: '74%', borderRadius: Radii.pill, paddingHorizontal: Spacing.three, marginTop: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  continueButtonText: { fontSize: 14, fontWeight: '700' },
  continueArrow: { fontSize: 22, lineHeight: 24 },
  ornament: { position: 'absolute', right: 24, top: 40, width: 104, height: 126, borderRadius: Radii.large, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  ornamentText: { fontSize: 60, opacity: 0.55 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.two },
  sectionTitle: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  editionCard: { minHeight: 82, borderRadius: Radii.medium, borderWidth: 1, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  editionIcon: { width: 48, height: 48, borderRadius: Radii.small, justifyContent: 'center', alignItems: 'center' },
  editionIconText: { fontSize: 20, fontWeight: '700' },
  editionInfo: { flex: 1, gap: Spacing.one },
  editionTitle: { fontSize: 16, fontWeight: '700' },
  arrow: { fontSize: 30, lineHeight: 32 },
  note: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radii.medium, marginTop: Spacing.one },
  noteIcon: { fontSize: 21 },
  noteCopy: { flex: 1, gap: Spacing.one },
  noteTitle: { fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});
