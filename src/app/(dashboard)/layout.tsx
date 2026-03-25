import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div suppressHydrationWarning className="flex min-h-screen bg-background font-sans antialiased text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
        {/* Desktop Sidebar (Fixed) */}
        <Sidebar className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-50 bg-background border-r border-border" />
        
        {/* Main Interface Wrapper */}
        <div className="flex flex-col flex-1 lg:ml-64 min-h-screen relative overflow-hidden">
          {/* Top Navigation (Fixed Height 64px / h-16) */}
          <Header className="h-16 fixed top-0 right-0 left-0 lg:left-64 z-40 bg-background/80" />
          
          {/* Content Area with Top Padding to account for fixed Header */}
          <main className="flex-1 pt-16 h-screen overflow-y-auto w-full custom-scrollbar scroll-smooth bg-background">
            <div className="mx-auto max-w-screen-xl w-full p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-in fade-in duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
