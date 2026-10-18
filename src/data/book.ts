import type { SQLiteDatabase } from 'expo-sqlite';

export type Book = {
  book_id: number;
  slug: string;
  title: string;
  author: string;
};

export type BookEdition = {
  edition_id: number;
  edition_key: string;
  language: string;
  display_title: string;
  status: 'complete' | 'draft';
  section_count: number;
};

export type BookSection = {
  section_id: number;
  edition_id: number;
  ordinal: number;
  slug: string;
  title: string;
  content: string;
  content_format: 'text' | 'markdown';
};

export async function getBook(db: SQLiteDatabase) {
  return db.getFirstAsync<Book>('SELECT book_id, slug, title, author FROM book LIMIT 1');
}

export async function getEditions(db: SQLiteDatabase) {
  return db.getAllAsync<BookEdition>(`
    SELECT e.edition_id, e.edition_key, e.language, e.display_title, e.status,
      COUNT(CASE WHEN length(trim(s.content)) > 0 THEN 1 END) AS section_count
    FROM editions e
    LEFT JOIN sections s ON s.edition_id = e.edition_id
    GROUP BY e.edition_id
    ORDER BY CASE WHEN e.edition_key = 'english' THEN 0 ELSE 1 END, e.edition_id
  `);
}

export async function getSections(db: SQLiteDatabase, editionKey: string) {
  return db.getAllAsync<BookSection>(`
    SELECT s.section_id, s.edition_id, s.ordinal, s.slug, s.title, s.content, s.content_format
    FROM sections s
    JOIN editions e ON e.edition_id = s.edition_id
    WHERE e.edition_key = ? AND length(trim(s.content)) > 0
    ORDER BY s.ordinal
  `, editionKey);
}

export async function getEditionSection(db: SQLiteDatabase, editionKey: string, sectionId: number) {
  return db.getFirstAsync<BookSection>(`
    SELECT s.section_id, s.edition_id, s.ordinal, s.slug, s.title, s.content, s.content_format
    FROM sections s
    JOIN editions e ON e.edition_id = s.edition_id
    WHERE e.edition_key = ? AND s.section_id = ? AND length(trim(s.content)) > 0
  `, editionKey, sectionId);
}

export async function getSection(db: SQLiteDatabase, editionKey: string, sectionId: number) {
  return getEditionSection(db, editionKey, sectionId);
}
