"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { VerseSearchModal } from "@/components/verse-search-modal";
import { VerseGroupChip } from "@/components/verse-group-chip";
import { AiStudyPanel } from "@/components/ai-study-panel";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, MessageCircle, Sparkles, Search, Plus, Menu } from "lucide-react";
import { getSelectedVerses, addVerse, removeVerse } from "@/lib/storage";
import { groupVerses } from "@/lib/bible";
import type { BibleVerse } from "@/lib/storage";

export default function Home() {
  const [selectedVerses, setSelectedVerses] = React.useState<BibleVerse[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [showResults, setShowResults] = React.useState(false);

  React.useEffect(() => {
    setSelectedVerses(getSelectedVerses());
  }, []);

  const handleAddVerse = (verse: BibleVerse) => {
    addVerse(verse);
    setSelectedVerses(getSelectedVerses());
    setIsModalOpen(false);
  };

  const handleRemoveVerses = (verseIds: string[]) => {
    verseIds.forEach(id => removeVerse(id));
    setSelectedVerses(getSelectedVerses());
  };

  const handleSubmit = () => {
    if (prompt.trim() && selectedVerses.length > 0) {
      setShowResults(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const verseGroups = React.useMemo(() => groupVerses(selectedVerses), [selectedVerses]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <Sidebar 
            className="absolute left-0 top-0 h-full w-64 shadow-xl" 
            onClose={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Mobile Header (only visible on small screens) */}
        <div className="md:hidden p-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </Button>
             <span className="font-bold text-lg">Lumina</span>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-3xl mx-auto w-full -mt-10 md:mt-0">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full space-y-8 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground px-4">
              Where faith meets intelligence.
            </h1>

            {/* Selected Verses */}
            {verseGroups.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {verseGroups.map((group, index) => (
                  <VerseGroupChip
                    key={`${group.label}-${index}`}
                    label={group.label}
                    verses={group.verses}
                    onRemove={handleRemoveVerses}
                  />
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full max-w-2xl mx-auto group">
              <div className="absolute inset-0 bg-muted rounded-2xl transform translate-y-1 transition-transform group-hover:translate-y-2" />
              <div className="relative bg-card border border-border rounded-2xl p-2 flex items-center gap-3 shadow-sm transition-all duration-200 focus-within:shadow-md focus-within:border-ring/20">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="pl-2 text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-secondary rounded-lg"
                  title="Add verse to context"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <div className="pl-2 text-muted-foreground">
                  <Search className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ask anything..." 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground h-12 text-lg font-sans"
                  autoFocus
                />
                <div className="flex items-center gap-1 pr-2">
                   <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground font-medium border border-border">
                      <span>Focus</span>
                   </div>
                  <Button 
                    size="icon" 
                    className="rounded-xl h-10 w-10 bg-primary text-primary-foreground hover:opacity-90 shadow-none"
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || selectedVerses.length === 0}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Study Results */}
            {showResults && (
              <div className="w-full max-w-2xl mx-auto">
                <AiStudyPanel
                  verses={selectedVerses}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                />
              </div>
            )}

            {/* Quick Actions / Suggestions */}
            {!showResults && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto w-full pt-4">
               <button className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all text-left group">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                     <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-foreground">Daily Reading</span>
                     <span className="text-xs text-muted-foreground">Continue where you left off</span>
                  </div>
               </button>

               <button className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all text-left group">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                     <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-foreground">AI Insight</span>
                     <span className="text-xs text-muted-foreground">Deep dive into a topic</span>
                  </div>
               </button>

               <button className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all text-left group">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                     <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-foreground">Community</span>
                     <span className="text-xs text-muted-foreground">See trending discussions</span>
                  </div>
               </button>
              </div>
            )}

          </motion.div>
        </div>

        {/* Minimal Footer */}
        <footer className="w-full py-6 text-center text-xs text-muted-foreground mt-auto">
           <p>© 2025 Lumina. Press <span className="font-medium text-foreground">/</span> to search.</p>
        </footer>
      </main>

      {/* Verse Search Modal */}
      <VerseSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddVerse={handleAddVerse}
      />
    </div>
  );
}
