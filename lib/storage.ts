// Bible verse context storage and types
export interface BibleVerse {
  id: string;
  reference: string; // e.g., "John 3:16"
  text: string;
  translation: string; // e.g., "KJV", "ESV"
  bookId: string;
  chapterId: string;
  verseId: string;
}

const STORAGE_KEY = "lumina.bibleContext";
const CACHE_KEY_PREFIX = "lumina.bibleCache";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSelectedVerses(): BibleVerse[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveSelectedVerses(verses: BibleVerse[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verses));
}

export function addVerse(verse: BibleVerse): void {
  const verses = getSelectedVerses();
  if (!verses.find((v) => v.id === verse.id)) {
    verses.push(verse);
    saveSelectedVerses(verses);
  }
}

export function removeVerse(verseId: string): void {
  const verses = getSelectedVerses().filter((v) => v.id !== verseId);
  saveSelectedVerses(verses);
}

export function clearSelectedVerses(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Cache management
export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}.${key}`);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}.${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  const cacheEntry = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(`${CACHE_KEY_PREFIX}.${key}`, JSON.stringify(cacheEntry));
}
