"use client";

import * as React from "react";
import { X, Search, Book, Loader2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  searchVerse, 
  fetchTranslations, 
  fetchBooks, 
  fetchChapters, 
  fetchVerses,
  fetchVerse 
} from "@/lib/bible";
import type { BibleVerse } from "@/lib/storage";

interface VerseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVerse: (verse: BibleVerse) => void;
}

export function VerseSearchModal({
  isOpen,
  onClose,
  onAddVerse,
}: VerseSearchModalProps) {
  const [activeTab, setActiveTab] = React.useState<"search" | "browse">("search");
  const [query, setQuery] = React.useState("");
  const [selectedTranslation, setSelectedTranslation] = React.useState("de4e12af7f28f599-02"); // KJV default
  const [translations, setTranslations] = React.useState<any[]>([]);
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedVerses, setSelectedVerses] = React.useState<Set<string>>(new Set());

  // Browse mode state
  const [books, setBooks] = React.useState<any[]>([]);
  const [selectedBook, setSelectedBook] = React.useState("");
  const [chapters, setChapters] = React.useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = React.useState("");
  const [verses, setVerses] = React.useState<any[]>([]);
  const [browseStartVerse, setBrowseStartVerse] = React.useState("");
  const [browseEndVerse, setBrowseEndVerse] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      fetchTranslations()
        .then(setTranslations)
        .catch(() => setError("Failed to load translations"));
    }
  }, [isOpen]);

  // Fetch books when translation changes in browse mode
  React.useEffect(() => {
    if (activeTab === "browse" && selectedTranslation) {
      setIsLoading(true);
      fetchBooks(selectedTranslation)
        .then((data) => {
          setBooks(data);
          setSelectedBook("");
          setChapters([]);
          setSelectedChapter("");
          setVerses([]);
          setBrowseStartVerse("");
          setBrowseEndVerse("");
        })
        .catch(() => setError("Failed to load books"))
        .finally(() => setIsLoading(false));
    }
  }, [activeTab, selectedTranslation]);

  // Fetch chapters when book changes
  React.useEffect(() => {
    if (selectedBook) {
      setIsLoading(true);
      fetchChapters(selectedTranslation, selectedBook)
        .then((data) => {
          setChapters(data);
          setSelectedChapter("");
          setVerses([]);
          setBrowseStartVerse("");
          setBrowseEndVerse("");
        })
        .catch(() => setError("Failed to load chapters"))
        .finally(() => setIsLoading(false));
    }
  }, [selectedBook, selectedTranslation]);

  // Fetch verses when chapter changes
  React.useEffect(() => {
    if (selectedChapter) {
      setIsLoading(true);
      fetchVerses(selectedTranslation, selectedChapter)
        .then((data) => {
          setVerses(data);
          setBrowseStartVerse("");
          setBrowseEndVerse("");
        })
        .catch(() => setError("Failed to load verses"))
        .finally(() => setIsLoading(false));
    }
  }, [selectedChapter, selectedTranslation]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const searchResults = await searchVerse(query, selectedTranslation);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleVerseSelection = (verseId: string) => {
    setSelectedVerses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(verseId)) {
        newSet.delete(verseId);
      } else {
        newSet.add(verseId);
      }
      return newSet;
    });
  };

  const handleAddSelectedVerses = async () => {
    if (selectedVerses.size === 0) return;
    
    setIsLoading(true);
    setError("");
    try {
      // Add each selected verse
      for (const verseId of selectedVerses) {
        const result = results.find((r) => r.verseId === verseId);
        if (result) {
          const verse: BibleVerse = {
            id: result.verseId,
            reference: result.reference,
            text: result.text,
            translation: selectedTranslation,
            bookId: "",
            chapterId: "",
            verseId: result.verseId,
          };
          onAddVerse(verse);
        }
      }
      setSelectedVerses(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to add verses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVerseRangeFromBrowse = async () => {
    if (!browseStartVerse) return;
    
    const endVerse = browseEndVerse || browseStartVerse;
    const startIndex = verses.findIndex((v) => v.id === browseStartVerse);
    const endIndex = verses.findIndex((v) => v.id === endVerse);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const versesToAdd = verses.slice(
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex) + 1
    );
    
    setIsLoading(true);
    setError("");
    try {
      for (const verseInfo of versesToAdd) {
        const verseData = await fetchVerse(verseInfo.id, selectedTranslation);
        const verse: BibleVerse = {
          id: verseData.id,
          reference: verseData.reference,
          text: verseData.content,
          translation: selectedTranslation,
          bookId: selectedBook,
          chapterId: selectedChapter,
          verseId: verseInfo.id,
        };
        onAddVerse(verse);
      }
      // Reset selections after adding
      setBrowseStartVerse("");
      setBrowseEndVerse("");
    } catch (err: any) {
      setError(err.message || "Failed to add verses");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
      <div className="relative w-full md:max-w-2xl bg-card border-t md:border border-border rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden h-[90vh] md:h-auto md:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Add Bible Verse</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "search"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </div>
            {activeTab === "search" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "browse"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <List className="w-4 h-4" />
              Browse
            </div>
            {activeTab === "browse" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Search Tab Content */}
        {activeTab === "search" && (
          <>
            {/* Search Input */}
            <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder='Search verse (e.g., "John 3:16" or "faith")'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                autoFocus
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Translation Selector */}
          <select
            value={selectedTranslation}
            onChange={(e) => setSelectedTranslation(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.abbreviation})
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {results.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Search for a verse by reference or keyword
              </p>
            </div>
          )}

          {results.map((result, index) => {
            const isSelected = selectedVerses.has(result.verseId);
            return (
              <div
                key={index}
                onClick={() => toggleVerseSelection(result.verseId)}
                className={cn(
                  "p-3 border rounded-lg transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-secondary/50 hover:bg-secondary border-border"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-border bg-background"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground mb-1">
                      {result.reference}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}

        {/* Browse Tab Content */}
        {activeTab === "browse" && (
          <>
            {/* Browse Controls */}
            <div className="p-4 space-y-4">
              {/* Step Indicators */}
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2 px-1">
                <span className={cn(selectedTranslation ? "text-primary" : "")}>Translation</span>
                <span className="w-4 h-px bg-border" />
                <span className={cn(selectedBook ? "text-primary" : "")}>Book</span>
                <span className="w-4 h-px bg-border" />
                <span className={cn(selectedChapter ? "text-primary" : "")}>Chapter</span>
                <span className="w-4 h-px bg-border" />
                <span className={cn(browseStartVerse ? "text-primary" : "")}>Verse</span>
              </div>

              {/* Translation Selector */}
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                {translations.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.abbreviation})
                  </option>
                ))}
              </select>

              {/* Book Selector */}
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter("");
                  setBrowseStartVerse("");
                  setBrowseEndVerse("");
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                disabled={books.length === 0}
              >
                <option value="">Select a book...</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>

              {/* Chapter Selector */}
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(e.target.value);
                  setBrowseStartVerse("");
                  setBrowseEndVerse("");
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                disabled={!selectedBook || chapters.length === 0}
              >
                <option value="">Select a chapter...</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    Chapter {chapter.number}
                  </option>
                ))}
              </select>

              {/* Verse Range Selectors */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Start Verse</label>
                <select
                  value={browseStartVerse}
                  onChange={(e) => setBrowseStartVerse(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  disabled={!selectedChapter || verses.length === 0}
                >
                  <option value="">Select start verse...</option>
                  {verses.map((verse) => (
                    <option key={verse.id} value={verse.id}>
                      {verse.reference}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">End Verse (optional)</label>
                <select
                  value={browseEndVerse}
                  onChange={(e) => setBrowseEndVerse(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  disabled={!browseStartVerse}
                >
                  <option value="">Same as start verse</option>
                  {verses.map((verse) => (
                    <option key={verse.id} value={verse.id}>
                      {verse.reference}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Browse Results / Preview */}
            <div className="flex-1 overflow-y-auto p-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {!selectedBook && !error && (
                <div className="text-center py-12 text-muted-foreground">
                  <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    Select a book to start browsing
                  </p>
                </div>
              )}

              {selectedBook && !selectedChapter && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">
                    Select a chapter to continue
                  </p>
                </div>
              )}

              {selectedChapter && !browseStartVerse && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">
                    Select a verse to preview
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sticky Footer */}
        {(selectedVerses.size > 0 || browseStartVerse) && (
          <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            {activeTab === "search" && selectedVerses.size > 0 && (
              <Button
                onClick={handleAddSelectedVerses}
                disabled={isLoading}
                className="w-full shadow-lg"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Book className="w-4 h-4 mr-2" />
                )}
                Add {selectedVerses.size} Selected Verse{selectedVerses.size > 1 ? 's' : ''}
              </Button>
            )}

            {activeTab === "browse" && browseStartVerse && (
              <Button
                onClick={handleAddVerseRangeFromBrowse}
                disabled={isLoading}
                className="w-full shadow-lg"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Book className="w-4 h-4 mr-2" />
                )}
                Add Verse{browseEndVerse && browseEndVerse !== browseStartVerse ? 's' : ''}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
