import Storage from 'expo-sqlite/kv-store';

export type ReadingProgress = {
  editionKey: string;
  sectionId: number;
  scrollFraction: number;
};

const STORAGE_KEY = 'ikhteyarate-mustafa.continue-reading.v1';
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

export async function getReadingProgress(): Promise<ReadingProgress | null> {
  try {
    const serialized = await Storage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object') return null;
    const record = value as Partial<ReadingProgress>;
    if (typeof record.editionKey !== 'string' || !Number.isInteger(record.sectionId) || typeof record.scrollFraction !== 'number') return null;
    return { editionKey: record.editionKey, sectionId: record.sectionId!, scrollFraction: Math.min(1, Math.max(0, record.scrollFraction)) };
  } catch {
    return null;
  }
}

export async function saveReadingProgress(progress: ReadingProgress) {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = undefined;
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Reading still works if local resume data cannot be saved.
  }
}

export function queueReadingProgress(progress: ReadingProgress) {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = undefined;
    void Storage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => undefined);
  }, 350);
}
