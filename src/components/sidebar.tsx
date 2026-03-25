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

export function Sidebar() {
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
    <div suppressHydrationWarning className="flex h-full w-64 flex-col bg-card border-r shadow-sm fixed left-0 top-0">
      <div className="flex h-16 items-center px-6 border-b">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Hostel Pro
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] ring-1 ring-primary/20">
            {userEmail[0].toUpperCase()}
          </div>
          <div className="flex flex-col max-w-[140px] truncate">
            <span className="text-xs font-bold truncate">Portal User</span>
            <span className="text-[10px] text-muted-foreground truncate">{userEmail}</span>
          </div>
        </div>
        <Button 
           variant="ghost" 
           onClick={handleLogout}
           className="w-full justify-start gap-3 h-9 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs"
        >
           <LogOut className="h-4 w-4" />
           Sign Out
        </Button>
      </div>
    </div>
  );
}
