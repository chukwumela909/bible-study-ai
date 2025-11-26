import { createClient } from "@/lib/supabase/client";
import type { BibleVerse } from "@/lib/storage";

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  verses: BibleVerse[];
  created_at: string;
}

const supabase = createClient();

// Create a new chat thread
export async function createThread(title: string = "New Chat"): Promise<ChatThread | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) {
    console.error("Error creating thread:", error);
    return null;
  }

  return data;
}

// Get all threads for the current user
export async function getThreads(): Promise<ChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching threads:", error);
    return [];
  }

  return data || [];
}

// Get a single thread by ID
export async function getThread(threadId: string): Promise<ChatThread | null> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (error) {
    console.error("Error fetching thread:", error);
    return null;
  }

  return data;
}

// Update thread title
export async function updateThreadTitle(threadId: string, title: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_threads")
    .update({ title })
    .eq("id", threadId);

  if (error) {
    console.error("Error updating thread:", error);
    return false;
  }

  return true;
}

// Delete a thread
export async function deleteThread(threadId: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_threads")
    .delete()
    .eq("id", threadId);

  if (error) {
    console.error("Error deleting thread:", error);
    return false;
  }

  return true;
}

// Get messages for a thread
export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data || [];
}

// Add a message to a thread
export async function addMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string,
  verses: BibleVerse[] = []
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      role,
      content,
      verses,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return null;
  }

  return data;
}

// Generate a title from the first user message
export function generateTitleFromMessage(message: string): string {
  // Take first 50 characters or first sentence, whichever is shorter
  const firstSentence = message.split(/[.!?]/)[0];
  const title = firstSentence.length > 50 
    ? message.substring(0, 47) + "..." 
    : firstSentence;
  return title.trim() || "New Chat";
}
