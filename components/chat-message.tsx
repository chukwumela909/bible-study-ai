"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, Copy, Check, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BibleVerse } from "@/lib/storage";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  verses?: BibleVerse[];
  isLoading?: boolean;
}

export function ChatMessage({ role, content, verses, isLoading }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end w-full max-w-3xl mx-auto py-6 px-4">
        <div className="bg-muted/50 text-foreground px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-lg">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 border-b border-border/40 last:border-0">
      <div className="space-y-6">
        {/* Sources / Context Section */}
        {verses && verses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span>Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {verses.map((verse, idx) => (
                <div 
                  key={`${verse.reference}-${idx}`}
                  className="bg-card border border-border px-3 py-2 rounded-lg text-sm max-w-[200px] truncate hover:max-w-full transition-all cursor-default shadow-sm"
                  title={verse.text}
                >
                  <span className="font-medium text-primary block text-xs mb-0.5">{verse.reference}</span>
                  <span className="text-muted-foreground truncate block">{verse.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Answer</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold mt-6 mb-4 text-foreground" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-medium mt-4 mb-2 text-foreground" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-foreground/90" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-foreground/90" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-foreground/90" {...props} />,
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 italic text-muted-foreground bg-muted/30 rounded-r-lg" {...props} />
                  ),
                  code: ({ node, ...props }) => {
                    // @ts-ignore - inline is not in the types but is passed by react-markdown
                    const { inline, className, children } = props;
                    if (inline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />
                      );
                    }
                    return (
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto my-4 border border-border">
                        <code className="text-sm font-mono text-foreground" {...props} />
                      </pre>
                    );
                  },
                  strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                  a: ({ node, ...props }) => <a className="text-primary hover:underline underline-offset-4" {...props} />,
                  hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
