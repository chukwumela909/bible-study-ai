"use client";

import * as React from "react";
import { X, Search, Book, Loader2, List, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AnimatePresence, motion } from "framer-motion";
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

// --- Custom Components ---

interface CustomComboboxProps {
  options: { id: string; name: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

function CustomCombobox({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  searchPlaceholder = "Search..." 
}: CustomComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="sticky top-0 bg-popover p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    value === option.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { id: string; label: string }[];
  placeholder?: string;
}

function CustomSelect({ options, placeholder, className, ...props }: CustomSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
}

// --- Main Component ---

export function VerseSearchModal({
  isOpen,
  onClose,
  onAddVerse,
}: VerseSearchModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
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
      onClose();
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
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add verses");
    } finally {
      setIsLoading(false);
    }
  };

  const translationOptions = translations.map(t => ({
    id: t.id,
    name: t.name,
    label: `${t.name} (${t.abbreviation})`
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95, y: "-50%", x: "-50%" } : { y: "100%" }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: "-50%", x: "-50%" } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95, y: "-50%", x: "-50%" } : { y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-background shadow-2xl flex flex-col overflow-hidden",
              isDesktop 
                ? "top-1/2 left-1/2 w-full max-w-2xl max-h-[85vh] rounded-xl border border-border" 
                : "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Book className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Add Bible Verse</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
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

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              {activeTab === "search" && (
                <>
                  <div className="p-4 space-y-3 shrink-0">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder='Search verse (e.g., "John 3:16")'
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
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

                    <CustomCombobox 
                      options={translationOptions}
                      value={selectedTranslation}
                      onChange={setSelectedTranslation}
                      placeholder="Select translation..."
                      searchPlaceholder="Search translations..."
                    />
                  </div>

                  <div className="flex-1 p-4 pt-0 space-y-2">
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
                                  <Check className="w-3 h-3 text-primary-foreground" />
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

              {activeTab === "browse" && (
                <>
                  <div className="p-4 space-y-4 shrink-0">
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

                    <CustomCombobox 
                      options={translationOptions}
                      value={selectedTranslation}
                      onChange={setSelectedTranslation}
                      placeholder="Select translation..."
                    />

                    <CustomSelect
                      value={selectedBook}
                      onChange={(e) => {
                        setSelectedBook(e.target.value);
                        setSelectedChapter("");
                        setBrowseStartVerse("");
                        setBrowseEndVerse("");
                      }}
                      disabled={books.length === 0}
                      options={books.map(b => ({ id: b.id, label: b.name }))}
                      placeholder="Select a book..."
                    />

                    <CustomSelect
                      value={selectedChapter}
                      onChange={(e) => {
                        setSelectedChapter(e.target.value);
                        setBrowseStartVerse("");
                        setBrowseEndVerse("");
                      }}
                      disabled={!selectedBook || chapters.length === 0}
                      options={chapters.map(c => ({ id: c.id, label: `Chapter ${c.number}` }))}
                      placeholder="Select a chapter..."
                    />

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Start Verse</label>
                      <CustomSelect
                        value={browseStartVerse}
                        onChange={(e) => setBrowseStartVerse(e.target.value)}
                        disabled={!selectedChapter || verses.length === 0}
                        options={verses.map(v => ({ id: v.id, label: v.reference }))}
                        placeholder="Select start verse..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">End Verse (optional)</label>
                      <CustomSelect
                        value={browseEndVerse}
                        onChange={(e) => setBrowseEndVerse(e.target.value)}
                        disabled={!browseStartVerse}
                        options={verses.map(v => ({ id: v.id, label: v.reference }))}
                        placeholder="Same as start verse"
                      />
                    </div>
                  </div>

                  <div className="flex-1 p-4 pt-0">
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
                  </div>
                </>
              )}
            </div>

            {/* Footer - Sticky */}
            {(selectedVerses.size > 0 || browseStartVerse) && (
              <div className="p-4 border-t border-border bg-background/95 backdrop-blur shrink-0">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
