"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  const pathname = usePathname();
  const pageTitle = pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);

  return (
    <header suppressHydrationWarning className="fixed top-0 right-0 left-64 z-30 flex h-16 items-center border-b bg-card px-8 backdrop-blur-md opacity-95">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {pageTitle || "Dashboard"}
        </h1>
        <div className="relative ml-auto max-w-sm w-full md:flex hidden">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search everything..."
            className="w-full bg-muted/30 pl-9 transition-all focus:bg-background"
          />
        </div>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
