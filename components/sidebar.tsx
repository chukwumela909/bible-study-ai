"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Compass, 
  Library, 
  Clock, 
  Settings, 
  Sun, 
  Moon, 
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquare,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { getThreads, deleteThread, type ChatThread } from "@/lib/chat";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  onNewThread?: () => void;
  onSelectThread?: (threadId: string) => void;
  currentThreadId?: string | null;
  refreshTrigger?: number;
}

export function Sidebar({ 
  className, 
  onClose, 
  onNewThread, 
  onSelectThread,
  currentThreadId,
  refreshTrigger = 0
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = React.useState(true);

  React.useEffect(() => {
    loadThreads();
  }, [refreshTrigger]);

  const loadThreads = async () => {
    setIsLoadingThreads(true);
    const data = await getThreads();
    setThreads(data);
    setIsLoadingThreads(false);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await deleteThread(threadId);
      loadThreads();
      if (currentThreadId === threadId && onNewThread) {
        onNewThread();
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full group",
        active 
          ? "bg-secondary text-foreground font-medium" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && <span className="text-sm truncate">{label}</span>}
    </button>
  );

  return (
    <aside 
      className={cn(
        "h-screen sticky top-0 border-r border-border bg-background flex flex-col transition-all duration-300 z-30",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header / Logo */}
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded flex items-center justify-center">
              <span className="text-xs">L</span>
            </div>
            <span>Lumina</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("ml-auto", isCollapsed && "mx-auto")}
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        >
          {onClose ? <PanelLeftClose className="w-4 h-4" /> : (isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />)}
        </Button>
      </div>

      {/* New Thread Button */}
      <div className="px-3 mb-4">
        <button 
          onClick={onNewThread}
          className={cn(
            "flex items-center gap-2 w-full rounded-full border border-border bg-background hover:bg-secondary/50 transition-all p-2 shadow-sm",
            isCollapsed ? "justify-center" : "px-3"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">New Thread</span>}
        </button>
      </div>

      {/* Chat History */}
      {!isCollapsed && (
        <div className="px-3 mb-4 flex-1 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Recent</div>
          <div className="space-y-1">
            {isLoadingThreads ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">No conversations yet</div>
            ) : (
              threads.slice(0, 20).map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread?.(thread.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group transition-colors",
                    currentThreadId === thread.id
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate flex-1">{thread.title}</span>
                  <button
                    onClick={(e) => handleDeleteThread(e, thread.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className={cn("px-3 space-y-1", isCollapsed && "flex-1")}>
        <NavItem icon={Home} label="Home" active={!currentThreadId} onClick={onNewThread} />
        <NavItem icon={Library} label="Library" />
        <NavItem icon={Settings} label="Settings" />
      </nav>

      {/* Footer Actions */}
      <div className="p-3 space-y-1 border-t border-border">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          {theme === "dark" ? <Moon className="w-5 h-5 shrink-0" /> : <Sun className="w-5 h-5 shrink-0" />}
          {!isCollapsed && <span className="text-sm">Theme</span>}
        </button>
        
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          <User className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Profile</span>}
        </button>
        
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
