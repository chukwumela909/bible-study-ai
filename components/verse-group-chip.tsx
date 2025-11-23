"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVerse } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";

interface VerseGroupChipProps {
  label: string;
  verses: BibleVerse[];
  onRemove: (ids: string[]) => void;
  className?: string;
}

export function VerseGroupChip({ label, verses, onRemove, className }: VerseGroupChipProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-lg bg-secondary border border-border text-sm group hover:border-ring/30 transition-all overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col text-left"
        >
          <span className="font-medium text-foreground flex items-center gap-1">
            {label}
            {verses.length > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                {verses.length}
              </span>
            )}
          </span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {verses[0].text} {verses.length > 1 ? "..." : ""}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-1 ml-2 border-l border-border/50 pl-2">
           <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onRemove(verses.map(v => v.id))}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-2 text-xs text-muted-foreground border-t border-border/50 bg-background/50"
          >
            {verses.map((verse, i) => (
              <div key={verse.id} className="mt-1 first:mt-2">
                <span className="font-medium text-foreground/70 mr-1">
                  {verse.reference.split(':').pop()}
                </span>
                {verse.text}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
