"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  IndianRupee,
  MessageSquare,
  LogOut
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Rent", href: "/rent", icon: IndianRupee },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("admin@hostelpro.com");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div suppressHydrationWarning className={cn("flex h-full w-64 flex-col bg-background border-r border-border fixed left-0 top-0 z-40", className)}>
      <div className="flex h-16 items-center px-6 border-b border-border shrink-0">
        <span className="text-xl font-black tracking-tighter text-foreground">
          Hostel Pro
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-none" 
                  : "text-muted-foreground hover:bg-muted font-medium"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground/70")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-4 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-black text-[10px] ring-1 ring-border">
            {userEmail[0].toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-black uppercase tracking-tight truncate text-foreground">Portal Manager</span>
            <span className="text-[10px] text-muted-foreground truncate leading-none">{userEmail}</span>
          </div>
        </div>
        <Button 
           variant="ghost" 
           onClick={handleLogout}
           className="w-full justify-start gap-3 h-9 px-4 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-bold text-xs transition-colors rounded-lg"
        >
           <LogOut className="h-4 w-4" />
           Sign Out
        </Button>
      </div>
    </div>
  );
}
