// API.Bible client utilities
import { getCachedData, setCachedData } from "./storage";

const API_BASE = "https://rest.api.bible/v1";
const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY || "";

export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

export interface BibleBook {
  id: string;
  name: string;
  abbreviation: string;
}

export interface BibleChapter {
  id: string;
  number: string;
  reference: string;
}

export interface BibleVerseInfo {
  id: string;
  orgId: string;
  reference: string;
}

export interface BibleVerse {
  id: string;
  reference: string;
  content: string;
  copyright?: string;
}

export interface SearchResult {
  reference: string;
  text: string;
  verseId: string;
}

// Fetch available Bible translations
export async function fetchTranslations(): Promise<BibleTranslation[]> {
  const cacheKey = "translations";
  const cached = getCachedData<BibleTranslation[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/bible/translations`);
  if (!response.ok) throw new Error("Failed to fetch translations");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Fetch books for a translation
export async function fetchBooks(translationId: string): Promise<BibleBook[]> {
  const cacheKey = `books-${translationId}`;
  const cached = getCachedData<BibleBook[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/bible/books?translationId=${translationId}`);
  if (!response.ok) throw new Error("Failed to fetch books");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Search for a verse by reference (e.g., "John 3:16")
export async function searchVerse(
  query: string,
  translationId: string
): Promise<SearchResult[]> {
  const cacheKey = `search-${translationId}-${query}`;
  const cached = getCachedData<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `/api/bible/search?query=${encodeURIComponent(query)}&translationId=${translationId}`
  );
  if (!response.ok) throw new Error("Failed to search verse");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Fetch a specific verse by ID
export async function fetchVerse(
  verseId: string,
  translationId: string
): Promise<BibleVerse> {
  const cacheKey = `verse-${translationId}-${verseId}`;
  const cached = getCachedData<BibleVerse>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `/api/bible/verse?verseId=${verseId}&translationId=${translationId}`
  );
  if (!response.ok) throw new Error("Failed to fetch verse");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Fetch chapters for a book
export async function fetchChapters(
  translationId: string,
  bookId: string
): Promise<BibleChapter[]> {
  const cacheKey = `chapters-${translationId}-${bookId}`;
  const cached = getCachedData<BibleChapter[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `/api/bible/chapters?translationId=${translationId}&bookId=${bookId}`
  );
  if (!response.ok) throw new Error("Failed to fetch chapters");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Fetch verses for a chapter
export async function fetchVerses(
  translationId: string,
  chapterId: string
): Promise<BibleVerseInfo[]> {
  const cacheKey = `verses-${translationId}-${chapterId}`;
  const cached = getCachedData<BibleVerseInfo[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `/api/bible/verses?translationId=${translationId}&chapterId=${chapterId}`
  );
  if (!response.ok) throw new Error("Failed to fetch verses");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

// Fetch chapter text
export async function fetchChapter(
  chapterId: string,
  translationId: string
): Promise<{ content: string; reference: string }> {
  const cacheKey = `chapter-${translationId}-${chapterId}`;
  const cached = getCachedData<{ content: string; reference: string }>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `/api/bible/chapter?chapterId=${chapterId}&translationId=${translationId}`
  );
  if (!response.ok) throw new Error("Failed to fetch chapter");
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
}

export function groupVerses(verses: any[]): { label: string; verses: any[] }[] {
  if (verses.length === 0) return [];

  // Helper to parse verse ID: GEN.1.1 -> { book: GEN, chapter: 1, verse: 1 }
  const parseId = (id: string) => {
    // Remove translation prefix if present (e.g. "TRANS:GEN.1.1" -> "GEN.1.1")
    const cleanId = id.includes(':') ? id.split(':')[1] : id;
    const parts = cleanId.split('.');
    if (parts.length >= 3) {
      return {
        book: parts[0],
        chapter: parseInt(parts[1]),
        verse: parseInt(parts[2])
      };
    }
    return null;
  };

  // Sort verses
  const sortedVerses = [...verses].sort((a, b) => {
    const pa = parseId(a.id);
    const pb = parseId(b.id);
    if (!pa || !pb) return a.id.localeCompare(b.id);
    
    if (pa.book !== pb.book) return pa.book.localeCompare(pb.book);
    if (pa.chapter !== pb.chapter) return pa.chapter - pb.chapter;
    return pa.verse - pb.verse;
  });

  const groups: { label: string; verses: any[] }[] = [];
  let currentGroup: any[] = [];

  for (let i = 0; i < sortedVerses.length; i++) {
    const verse = sortedVerses[i];
    const parsed = parseId(verse.id);

    if (currentGroup.length === 0) {
      currentGroup.push(verse);
    } else {
      const lastVerse = currentGroup[currentGroup.length - 1];
      const lastParsed = parseId(lastVerse.id);

      // Check if contiguous: same book, same chapter, next verse number
      if (
        parsed && lastParsed &&
        parsed.book === lastParsed.book &&
        parsed.chapter === lastParsed.chapter &&
        parsed.verse === lastParsed.verse + 1
      ) {
        currentGroup.push(verse);
      } else {
        // Close current group
        groups.push(createGroup(currentGroup));
        currentGroup = [verse];
      }
    }
  }

  if (currentGroup.length > 0) {
    groups.push(createGroup(currentGroup));
  }

  return groups;
}

function createGroup(groupVerses: any[]): { label: string; verses: any[] } {
  const first = groupVerses[0];
  const last = groupVerses[groupVerses.length - 1];
  
  // Extract book name and chapter from reference (e.g. "John 3:16")
  // This is a heuristic. Better to have structured data.
  // Assuming reference is like "Book Chapter:Verse"
  
  let label = first.reference;
  if (groupVerses.length > 1) {
    // Try to construct range label: "John 3:16-18"
    const lastRefParts = last.reference.split(':');
    const lastVerseNum = lastRefParts.length > 1 ? lastRefParts[1] : '';
    
    if (lastVerseNum) {
       // Check if reference format allows simple appending
       // e.g. "John 3:16" -> "John 3:16-18"
       // But we need to be careful if the first reference doesn't have a colon (e.g. "John 3")
       if (first.reference.includes(':')) {
          label = `${first.reference}-${lastVerseNum}`;
       } else {
          label = `${first.reference} - ${last.reference}`;
       }
    } else {
       // Fallback
       label = `${first.reference} - ${last.reference}`;
    }
  }
  
  return { label, verses: groupVerses };
}
