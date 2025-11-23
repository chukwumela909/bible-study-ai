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
  Plus
} from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <button
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
      <div className="px-3 mb-6">
        <button className={cn(
          "flex items-center gap-2 w-full rounded-full border border-border bg-background hover:bg-secondary/50 transition-all p-2 shadow-sm",
          isCollapsed ? "justify-center" : "px-3"
        )}>
          <Plus className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">New Thread</span>}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem icon={Home} label="Home" active />
        <NavItem icon={Compass} label="Discover" />
        <NavItem icon={Library} label="Library" />
        <NavItem icon={Clock} label="History" />
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
