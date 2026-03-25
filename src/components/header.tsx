"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Bell, Search, Settings, Menu, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useTheme } from "./theme-provider";

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = pathname.length > 1 
    ? pathname.slice(1).split('/').pop()?.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) 
    : "Overview";
    
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || "Account");
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.replace("/login");
  };

  return (
    <>
      <header suppressHydrationWarning className={cn("fixed top-0 right-0 left-0 lg:left-64 z-30 flex h-16 items-center border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-xl transition-colors duration-500", className)}>
        <div className="flex flex-1 items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden rounded-lg hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-sm md:text-base font-black tracking-tight text-foreground uppercase truncate">
            {pageTitle || "Overview"}
          </h1>
          
          <div className="relative ml-auto max-w-sm w-full sm:flex hidden group">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              type="search"
              placeholder="System search..."
              className="w-full bg-muted/20 pl-9 h-9 border border-border transition-all focus:bg-muted/40 focus:ring-1 focus:ring-primary/20 rounded-lg text-xs"
            />
          </div>
        </div>
        
        <div className="ml-4 flex items-center gap-2 md:gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted hidden sm:flex h-9 w-9">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              suppressHydrationWarning
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-none p-0 flex items-center justify-center font-black transition-all ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {userEmail?.charAt(0).toUpperCase()}
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-2xl shadow-premium border border-border z-50 p-2 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                  <div className="px-3 py-3 border-b border-border mb-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Signed in as</p>
                    <p className="text-sm font-bold text-foreground truncate">{userEmail}</p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors text-left group">
                      <Settings className="h-4 w-4 transition-transform group-hover:rotate-45" />
                      Edit Profile
                    </button>
                    
                    <button 
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors text-left"
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-800" />}
                      {theme === 'dark' ? "Light Mode" : "Dark Mode"}
                    </button>
                  </div>

                  <div className="mt-1 pt-1 border-t border-border">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden transition-all animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-card shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar className="w-full h-full static shadow-none border-none" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-[-48px] text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
