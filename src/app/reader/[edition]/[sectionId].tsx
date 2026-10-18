import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { getEditions, getSection, getSections, type BookEdition, type BookSection } from '@/data/book';
import { getReadingProgress, queueReadingProgress, saveReadingProgress } from '@/data/reading-progress';
import { useTheme } from '@/hooks/use-theme';

type ReaderBlock = { kind: 'paragraph' | 'heading' | 'quote'; text: string; level?: number };

function cleanInlineMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1');
}

function renderInlineMarkup(text: string, fontSize: number) {
  return text.split(/(<sup>[\s\S]*?<\/sup>)/gi).map((part, index) => {
    const superscript = part.match(/^<sup>([\s\S]*?)<\/sup>$/i);
    if (!superscript) return cleanInlineMarkdown(part);
    return <Text key={`sup-${index}`} style={[styles.superscript, { fontSize: Math.max(11, fontSize * 0.7), lineHeight: fontSize * 1.2 }]}>{cleanInlineMarkdown(superscript[1])}</Text>;
  });
}

function parseContent(content: string, format: BookSection['content_format']): ReaderBlock[] {
  const blocks: ReaderBlock[] = [];
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join('\n').trim();
    if (text) blocks.push({ kind: 'paragraph', text });
    lines = [];
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) { flush(); continue; }
    if (format === 'markdown') {
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) { flush(); blocks.push({ kind: 'heading', text: cleanInlineMarkdown(heading[2]), level: heading[1].length }); continue; }
      if (line.startsWith('>')) { flush(); blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') }); continue; }
    }
    lines.push(format === 'markdown' ? cleanInlineMarkdown(line.replace(/^[-*]\s+/, '')) : rawLine);
  }
  flush();
  return blocks;
}

export default function ReaderScreen() {
  const { edition, sectionId } = useLocalSearchParams<{ edition: string; sectionId: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [bookEdition, setBookEdition] = useState<BookEdition | null>(null);
  const [section, setSection] = useState<BookSection | null>(null);
  const [sections, setSections] = useState<BookSection[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [readProgress, setReadProgress] = useState<{ sectionId: number; value: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const restoreFractionRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const id = Number(sectionId);
    Promise.all([getEditions(db), getSection(db, edition ?? '', id), getSections(db, edition ?? ''), getReadingProgress()]).then(([allEditions, loadedSection, loadedSections, saved]) => {
      if (!active) return;
      const resumeFraction = saved?.editionKey === edition && saved.sectionId === id ? saved.scrollFraction : 0;
      contentHeightRef.current = 0;
      viewportHeightRef.current = 0;
      restoreFractionRef.current = resumeFraction;
      setReadProgress({ sectionId: id, value: resumeFraction });
      void saveReadingProgress({ editionKey: edition ?? '', sectionId: id, scrollFraction: resumeFraction });
      setBookEdition(allEditions.find((item) => item.edition_key === edition) ?? null);
      setSection(loadedSection);
      setSections(loadedSections);
    }).catch(() => active && setSection(null));
    return () => { active = false; };
  }, [db, edition, sectionId]);

  const index = sections.findIndex((item) => item.section_id === section?.section_id);
  const previous = index > 0 ? sections[index - 1] : null;
  const next = index >= 0 ? sections[index + 1] : null;
  const visibleProgress = readProgress && readProgress.sectionId === section?.section_id ? readProgress.value : 0;
  const blocks = section ? parseContent(section.content, section.content_format) : [];

  const updateReadingProgress = (event: NativeSyntheticEvent<NativeScrollEvent>, persist = false) => {
    if (!section) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxOffset = contentSize.height - layoutMeasurement.height;
    const value = maxOffset <= 0 ? 1 : Math.min(1, Math.max(0, contentOffset.y / maxOffset));
    setReadProgress({ sectionId: section.section_id, value });
    const progress = { editionKey: edition ?? '', sectionId: section.section_id, scrollFraction: value };
    if (persist) void saveReadingProgress(progress);
    else queueReadingProgress(progress);
  };

  const restoreScrollPosition = (currentSectionId: number) => {
    const fraction = restoreFractionRef.current;
    if (fraction === null || contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) return;
    const maxOffset = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
    scrollRef.current?.scrollTo({ y: maxOffset * fraction, animated: false });
    restoreFractionRef.current = null;
    setReadProgress({ sectionId: currentSectionId, value: fraction });
  };

  const openSection = (item: BookSection) => router.replace({ pathname: '/reader/[edition]/[sectionId]', params: { edition: edition ?? '', sectionId: String(item.section_id) } });
  const renderParagraph = (text: string, key: number) => {
    const isArabic = /[\u0600-\u06FF]/.test(text) && !/[A-Za-z]{3,}/.test(text);
    return <ThemedText key={key} style={[styles.paragraph, { color: theme.text, fontFamily: Fonts.serif, fontSize, lineHeight: fontSize * 1.8, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}>{renderInlineMarkup(text, fontSize)}</ThemedText>;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.surface }]}><ThemedText style={{ color: theme.primary, fontSize: 22 }}>‹</ThemedText></Pressable>
        <View style={styles.toolbarTitle}><ThemedText type="small" themeColor="textSecondary">{bookEdition?.language?.toLocaleUpperCase() ?? 'EDITION'}</ThemedText><ThemedText numberOfLines={1} style={styles.toolbarHeading}>{section?.title ?? 'Reading'}</ThemedText></View>
        <View style={[styles.fontControls, { backgroundColor: theme.surface }]}><Pressable accessibilityLabel="Decrease text size" onPress={() => setFontSize((size) => Math.max(15, size - 1))} style={styles.fontButton}><ThemedText style={{ color: theme.textSecondary }}>A−</ThemedText></Pressable><Pressable accessibilityLabel="Increase text size" onPress={() => setFontSize((size) => Math.min(25, size + 1))} style={styles.fontButton}><ThemedText style={{ color: theme.primary }}>A+</ThemedText></Pressable></View>
      </View>
      {section && <View style={[styles.progressTrack, { backgroundColor: theme.surfaceRaised }]} accessibilityLabel="Section reading progress" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(visibleProgress * 100) }}><View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${visibleProgress * 100}%` }]} /></View>}
      {section ? <ScrollView
        key={section.section_id}
        ref={scrollRef}
        onLayout={(event) => { viewportHeightRef.current = event.nativeEvent.layout.height; restoreScrollPosition(section.section_id); }}
        onContentSizeChange={(_width, height) => { contentHeightRef.current = height; restoreScrollPosition(section.section_id); }}
        onScroll={(event) => updateReadingProgress(event)}
        onScrollEndDrag={(event) => updateReadingProgress(event, true)}
        onMomentumScrollEnd={(event) => updateReadingProgress(event, true)}
        scrollEventThrottle={80}
        contentContainerStyle={styles.article}>
        <View style={[styles.articleHeader, { borderBottomColor: theme.border }]}><ThemedText type="small" themeColor="textSecondary">SECTION {section.ordinal + 1}</ThemedText><ThemedText style={[styles.articleTitle, { fontFamily: Fonts.serif }]}>{section.title}</ThemedText></View>
        {blocks.map((block, blockIndex) => block.kind === 'heading' ? <ThemedText key={blockIndex} style={[styles.contentHeading, { color: theme.text, fontFamily: Fonts.serif, fontSize: block.level === 1 ? 24 : block.level === 2 ? 21 : 18 }]}>{block.text}</ThemedText> : block.kind === 'quote' ? <View key={blockIndex} style={[styles.quote, { borderLeftColor: theme.accent, backgroundColor: theme.surface }]}>{renderParagraph(block.text, blockIndex)}</View> : renderParagraph(block.text, blockIndex))}
        <View style={styles.navigation}>
          <Pressable disabled={!previous} onPress={() => previous && openSection(previous)} style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, !previous && styles.disabled]}><ThemedText type="small" themeColor="textSecondary">PREVIOUS</ThemedText><ThemedText style={{ color: theme.text }} numberOfLines={1}>{previous?.title ?? 'Beginning'}</ThemedText></Pressable>
          <Pressable disabled={!next} onPress={() => next && openSection(next)} style={[styles.navButton, styles.nextButton, { backgroundColor: theme.primary, borderColor: theme.primary }, !next && styles.disabled]}><ThemedText type="small" style={{ color: theme.onPrimary }}>NEXT</ThemedText><ThemedText style={{ color: theme.onPrimary, fontWeight: '700' }} numberOfLines={1}>{next?.title ?? 'End of edition'}</ThemedText></Pressable>
        </View>
      </ScrollView> : <View style={styles.loading}><ThemedText themeColor="textSecondary">Loading this section…</ThemedText></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  toolbar: { minHeight: 68, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  backButton: { width: 42, height: 42, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center' },
  toolbarTitle: { flex: 1, gap: Spacing.half },
  toolbarHeading: { fontSize: 15, fontWeight: '700' },
  fontControls: { flexDirection: 'row', borderRadius: Radii.pill, padding: Spacing.half },
  fontButton: { minWidth: 40, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radii.pill },
  article: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.seven },
  articleHeader: { paddingBottom: Spacing.four, marginBottom: Spacing.four, borderBottomWidth: 1, gap: Spacing.two },
  articleTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  contentHeading: { fontWeight: '700', lineHeight: 30, marginTop: Spacing.four, marginBottom: Spacing.two },
  paragraph: { marginBottom: Spacing.three },
  superscript: { fontWeight: '500', ...Platform.select({ android: { verticalAlign: 'top' as const } }) },
  quote: { borderLeftWidth: 3, borderRadius: Radii.small, padding: Spacing.three, marginBottom: Spacing.three },
  navigation: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.five },
  navButton: { flex: 1, minHeight: 64, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderRadius: Radii.medium, justifyContent: 'center', gap: Spacing.one },
  nextButton: { alignItems: 'flex-end' },
  disabled: { opacity: 0.45 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
