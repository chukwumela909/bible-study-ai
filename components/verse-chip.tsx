"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVerse } from "@/lib/storage";

interface VerseChipProps {
  verse: BibleVerse;
  onRemove: (id: string) => void;
  className?: string;
}

export function VerseChip({ verse, onRemove, className }: VerseChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm group hover:border-ring/30 transition-all",
        className
      )}
    >
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{verse.reference}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {verse.text}
        </span>
      </div>
      <button
        onClick={() => onRemove(verse.id)}
        className="ml-1 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Remove verse"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
