"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { VerseSearchModal } from "@/components/verse-search-modal";
import { VerseGroupChip } from "@/components/verse-group-chip";
import { ChatMessage } from "@/components/chat-message";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { VoiceChatButton, MemoizedVoiceChatButton } from "@/components/voice-chat-button";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, MessageCircle, Sparkles, Search, Plus, Menu, LogOut, User } from "lucide-react";
import { getSelectedVerses, addVerse, removeVerse } from "@/lib/storage";
import { groupVerses } from "@/lib/bible";
import type { BibleVerse } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { 
  createThread, 
  getMessages, 
  addMessage, 
  updateThreadTitle,
  generateTitleFromMessage,
  type ChatMessage as ChatMessageType
} from "@/lib/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
  verses?: BibleVerse[];
}

export default function Home() {
  const [selectedVerses, setSelectedVerses] = React.useState<BibleVerse[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = React.useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = React.useState(false);
  const [currentThreadId, setCurrentThreadId] = React.useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = React.useState(0);
  const currentThreadIdRef = React.useRef<string | null>(null);
  const landingVoiceSlotRef = React.useRef<HTMLDivElement | null>(null);
  const chatVoiceSlotRef = React.useRef<HTMLDivElement | null>(null);
  const [voiceButtonContainer, setVoiceButtonContainer] = React.useState<HTMLElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  React.useEffect(() => {
    currentThreadIdRef.current = currentThreadId;
  }, [currentThreadId]);

  React.useLayoutEffect(() => {
    const target = messages.length > 0 ? chatVoiceSlotRef.current : landingVoiceSlotRef.current;
    setVoiceButtonContainer(target);
  }, [messages.length]);

  React.useEffect(() => {
    setSelectedVerses(getSelectedVerses());
    
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoadingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleAddVerse = (verse: BibleVerse) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    addVerse(verse);
    setSelectedVerses(getSelectedVerses());
    setIsModalOpen(false);
  };

  const handleRemoveVerses = (verseIds: string[]) => {
    verseIds.forEach(id => removeVerse(id));
    setSelectedVerses(getSelectedVerses());
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
    setMessages([]);
    setPrompt("");
  };

  const handleSelectThread = async (threadId: string) => {
    setCurrentThreadId(threadId);
    setIsChatLoading(true);
    
    const threadMessages = await getMessages(threadId);
    setMessages(threadMessages.map(m => ({
      role: m.role,
      content: m.content,
      verses: m.verses || []
    })));
    
    setIsChatLoading(false);
    setIsMobileMenuOpen(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    const currentVerses = [...selectedVerses];
    
    // Add user message to UI immediately
    const userMessage: Message = { role: "user", content: currentPrompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsChatLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Create thread if this is the first message
      let threadId = currentThreadId;
      if (!threadId) {
        const newThread = await createThread(generateTitleFromMessage(currentPrompt));
        if (newThread) {
          threadId = newThread.id;
          setCurrentThreadId(threadId);
          setSidebarRefresh(prev => prev + 1);
        }
      }

      // Save user message to database
      if (threadId) {
        await addMessage(threadId, "user", currentPrompt, currentVerses);
      }

      const res = await fetch("/api/ai/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          verses: currentVerses.map((v) => ({
            reference: v.reference,
            text: v.text,
            translation: v.translation,
          })),
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate study");
      }

      const data = await res.json();
      
      // Save assistant response to database
      if (threadId) {
        await addMessage(threadId, "assistant", data.response, currentVerses);
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        verses: currentVerses
      }]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  // Voice chat handlers - stable references via refs to prevent reconnects
  const handleVoiceChatStart = React.useCallback(async () => {
    if (!currentThreadIdRef.current) {
      const newThread = await createThread("Voice Conversation");
      if (newThread) {
        currentThreadIdRef.current = newThread.id;
        setCurrentThreadId(newThread.id);
        setSidebarRefresh(prev => prev + 1);
      }
    }
  }, []);

  const handleVoiceUserTranscript = React.useCallback((text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);

    setTimeout(async () => {
      const threadId = currentThreadIdRef.current;
      if (threadId) {
        await addMessage(threadId, "user", text, []);
        await updateThreadTitle(threadId, generateTitleFromMessage(text));
      }
    }, 0);
  }, []);

  const handleVoiceAIResponse = React.useCallback((text: string) => {
    setMessages(prev => [...prev, {
      role: "assistant",
      content: text,
      verses: []
    }]);

    setTimeout(async () => {
      const threadId = currentThreadIdRef.current;
      if (threadId) {
        await addMessage(threadId, "assistant", text, []);
      }
    }, 0);
  }, []);

  const handleVoiceError = React.useCallback((error: string) => {
    console.error("Voice chat error:", error);
  }, []);

  const verseGroups = React.useMemo(() => groupVerses(selectedVerses), [selectedVerses]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar 
        className="hidden md:flex" 
        onNewThread={handleNewThread}
        onSelectThread={handleSelectThread}
        currentThreadId={currentThreadId}
        refreshTrigger={sidebarRefresh}
      />

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
            onNewThread={() => { handleNewThread(); setIsMobileMenuOpen(false); }}
            onSelectThread={handleSelectThread}
            currentThreadId={currentThreadId}
            refreshTrigger={sidebarRefresh}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-screen">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20 shrink-0">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </Button>
             <span className="font-bold text-lg">Lumina</span>
           </div>
           {user && (
             <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
               <LogOut className="w-5 h-5" />
             </Button>
           )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-end p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20 shrink-0">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          )}
        </div>

        {isLoadingAuth ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          /* Chat Interface View */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="pb-80 pt-4">
                {messages.map((msg, idx) => (
                  <ChatMessage 
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    verses={msg.verses}
                  />
                ))}
                {isChatLoading && (
                  <ChatMessage role="assistant" content="" isLoading={true} />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Bottom Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-6 z-30">
              <div className="max-w-3xl mx-auto space-y-4">
                {/* Selected Verses (Compact) */}
                {verseGroups.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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

                <div className="relative group">
                  <div className="absolute inset-0 bg-muted rounded-2xl transform translate-y-1 transition-transform group-hover:translate-y-2" />
                  <div className="relative bg-card border border-border rounded-2xl p-2 flex items-end gap-3 shadow-sm transition-all duration-200 focus-within:shadow-md focus-within:border-ring/20">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="pl-2 text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-secondary rounded-lg mb-1"
                      title="Add verse to context"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <textarea 
                      ref={textareaRef}
                      placeholder="Ask a follow-up question..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg font-sans resize-none overflow-y-auto min-h-12 py-3 max-h-[150px]"
                      rows={1}
                      autoFocus
                    />
                    <div className="flex items-center gap-1 pr-2">
                      <div ref={chatVoiceSlotRef} className="flex-shrink-0 w-10 h-10" />
                      <Button 
                        size="icon" 
                        className="rounded-xl h-10 w-10 bg-primary text-primary-foreground hover:opacity-90 shadow-none"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isChatLoading}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Lumina can make mistakes. Verify important information.
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Landing Page View */
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
                <div className="relative bg-card border border-border rounded-2xl p-2 flex items-end gap-3 shadow-sm transition-all duration-200 focus-within:shadow-md focus-within:border-ring/20">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="pl-2 text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-secondary rounded-lg mb-1"
                    title="Add verse to context"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <textarea 
                    ref={textareaRef}
                    placeholder="Ask anything..." 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg font-sans resize-none overflow-y-auto min-h-12 py-3 max-h-[200px]"
                    rows={1}
                    autoFocus
                  />
                  <div className="flex items-center gap-1 pr-2">
                     <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground font-medium border border-border">
                        <span>Focus</span>
                     </div>
                    <div ref={landingVoiceSlotRef} className="flex-shrink-0 w-10 h-10" />
                    <Button 
                      size="icon" 
                      className="rounded-xl h-10 w-10 bg-primary text-primary-foreground hover:opacity-90 shadow-none"
                      onClick={handleSubmit}
                      disabled={!prompt.trim()}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Auth Notice for non-authenticated users */}
              {!user && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Want to use AI features?</span>
                  <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                    Sign up for free
                  </Link>
                </div>
              )}
            </motion.div>
            
            {/* Minimal Footer (only on landing) */}
            <footer className="w-full py-6 text-center text-xs text-muted-foreground mt-auto absolute bottom-0">
               <p>© 2025 Lumina. Press <span className="font-medium text-foreground">/</span> to search.</p>
            </footer>
          </div>
        )}
      </main>

      <MemoizedVoiceChatButton
        triggerContainer={voiceButtonContainer}
        onStart={handleVoiceChatStart}
        onUserTranscript={handleVoiceUserTranscript}
        onAIResponse={handleVoiceAIResponse}
        onError={handleVoiceError}
        disabled={!user}
      />

      {/* Verse Search Modal */}
      <VerseSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddVerse={handleAddVerse}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        message="Sign up to save verses and use AI-powered study features"
      />
    </div>
  );
}
