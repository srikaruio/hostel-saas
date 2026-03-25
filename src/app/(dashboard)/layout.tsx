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
      <div suppressHydrationWarning className="flex min-h-screen bg-muted/20">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-64">
          <Header />
          <main className="flex-1 p-8 pt-24 transition-all animate-in fade-in duration-500">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
