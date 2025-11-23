"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Book, Lightbulb, Link2, Target, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BibleVerse } from "@/lib/storage";

interface StudyResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AiStudyPanelProps {
  verses: BibleVerse[];
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export function AiStudyPanel({ verses, prompt, onPromptChange }: AiStudyPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  // Auto-submit on mount
  React.useEffect(() => {
    if (prompt.trim() && verses.length > 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || verses.length === 0) return;

    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/ai/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          verses: verses.map((v) => ({
            reference: v.reference,
            text: v.text,
            translation: v.translation,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate study");
      }

      const data: StudyResponse = await res.json();
      setResponse(data.response);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("AI Study error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseResponse = (text: string) => {
    // Simple parser to split response into sections
    const sections: Array<{ title: string; content: string; icon: any }> = [];
    const lines = text.split("\n");
    let currentSection: { title: string; content: string; icon: any } | null = null;

    const iconMap: Record<string, any> = {
      summary: Book,
      themes: Sparkles,
      "word study": Lightbulb,
      "cross references": Link2,
      application: Target,
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if line is a section header
      const headerMatch = trimmed.match(/^#+\s*(.+)$/i) || trimmed.match(/^(.+):$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const title = headerMatch[1].trim();
        const iconKey = title.toLowerCase();
        currentSection = {
          title,
          content: "",
          icon: iconMap[iconKey] || Book,
        };
      } else if (currentSection && trimmed) {
        currentSection.content += line + "\n";
      } else if (!currentSection && trimmed) {
        // Content before any section header
        if (sections.length === 0) {
          sections.push({
            title: "Response",
            content: line + "\n",
            icon: Book,
          });
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ title: "Response", content: text, icon: Book }];
  };

  const sections = response ? parseResponse(response) : [];

  return (
    <div className="w-full space-y-4">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating insights...</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {!isLoading && !error && response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>AI Study</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Response Sections */}
            <div className="space-y-3">
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-secondary/30 border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {section.content.trim()}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Follow-up Input */}
            <div className="pt-4 border-t border-border">
              <input
                type="text"
                placeholder="Ask a follow-up question..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
