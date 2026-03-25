"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Layers, 
  DoorOpen, 
  Users, 
  IndianRupee,
  Clock,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "Features", href: "#features" },
    { name: "Preview", href: "#preview" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-foreground selection:bg-primary/20 scroll-smooth">
      {/* Navigation */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 transition-all duration-300",
        scrolled ? "backdrop-blur-xl bg-neutral-950/80 border-b border-white/10" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
              <span className="text-primary font-black text-xl tracking-tighter italic">H</span>
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic">Hostel Pro</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex h-9 px-6 font-bold text-xs rounded-full border border-white/10 hover:bg-white/5">
              <Link href="/login">Portal Login</Link>
            </Button>
            
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute top-[100%] left-0 right-0 bg-neutral-950 border-b border-white/10 p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-5 duration-300">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className="text-sm font-black uppercase tracking-widest text-foreground py-2 border-b border-white/5"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Button className="w-full h-11 rounded-xl">
                 <Link href="/signup">Get Started</Link>
              </Button>
              <Button variant="ghost" className="w-full h-11 border border-white/10">
                 <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center py-20 md:py-32 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full opacity-50" />
          
          <div className="max-w-4xl mx-auto text-center relative w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <Zap className="h-3 w-3 animate-pulse" />
               Automating the 99%
            </div>
            
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Hostel Management, <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">Re-invented for Scale.</span>
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground font-medium mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700">
              Operational intelligence for the modern hostel owner. Track occupancy, automate rent billing, and manage students with a high-density clinical dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Button className="w-full sm:w-auto h-12 px-10 rounded-xl font-black text-sm shadow-xl group">
                <Link href="/signup" className="flex items-center justify-center">
                   Start Scaling Now
                   <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto h-12 px-10 rounded-xl font-black text-sm border border-white/10 hover:bg-white/5 transition-all">
                <Link href="#preview" className="flex items-center justify-center">View Showcase</Link>
              </Button>
            </div>
          </div>

          <Link href="#problem" className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/30 hover:text-primary transition-all animate-bounce hidden md:block">
             <ChevronDown className="h-8 w-8" />
          </Link>
        </section>

        {/* The Problem Section */}
        <section id="problem" className="py-24 px-6 border-y border-white/5 bg-neutral-900/10 relative">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
             <div className="space-y-6">
                <h2 className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">The Friction Point</h2>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-foreground">
                   Spreadsheets were never meant <br />
                   to run your business.
                </h3>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                   Manual tracking leads to over-filled rooms, missed payments, and zero visibility. 
                   Hostel Pro replaces the chaos with a single source of truth for your entire operation.
                </p>
                
                <ul className="space-y-3 pt-4">
                  {[
                    "No more room overallocation bugs",
                    "Automated monthly rent ledger generation",
                    "Real-time resource allocation intelligence",
                    "Secure multi-tenant data isolation"
                  ].map((p, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                      <div className="h-5 w-5 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                         <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      </div>
                      {p}
                    </li>
                  ))}
                </ul>
             </div>
             
             <div className="relative">
                <div className="absolute -inset-4 bg-primary/5 blur-2xl rounded-3xl" />
                <Card className="bg-card border border-white/10 shadow-2xl overflow-hidden relative group-hover:border-primary/20 transition-all">
                   <CardContent className="p-8 space-y-4">
                      <div className="h-2 w-1/3 bg-muted rounded-full" />
                      <div className="flex gap-2">
                         <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20" />
                         <div className="flex-1 space-y-2 py-1">
                            <div className="h-2 w-full bg-rose-500/10 rounded-full" />
                            <div className="h-2 w-2/3 bg-rose-500/5 rounded-full" />
                         </div>
                      </div>
                      <div className="h-32 w-full bg-neutral-950/50 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-center">
                         <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter max-w-[120px]">Complex Spreadsheet Logic (Traditional Way)</span>
                      </div>
                   </CardContent>
                </Card>
             </div>
          </div>

          <Link href="#features" className="absolute bottom-6 right-10 text-muted-foreground/20 hover:text-primary transition-all hidden md:flex items-center gap-2 group">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Key Features</span>
             <ChevronDown className="h-5 w-5" />
          </Link>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-20">
                <h2 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Core Infrastructure</h2>
                <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Built for Performance.</h3>
             </div>
             
             <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { 
                   title: "Occupancy Intelligence", 
                   desc: "Real-time bed allocation with automatic vacancy detection and overflow guards.",
                   icon: DoorOpen,
                   color: "text-blue-500",
                   bg: "bg-blue-500/5"
                 },
                 { 
                   title: "Automated Ledger", 
                   desc: "One-click monthly rent roll generation with instant AR/AP overview.",
                   icon: IndianRupee,
                   color: "text-emerald-500",
                   bg: "bg-emerald-500/5"
                 },
                 { 
                   title: "Secure Auth", 
                   desc: "Multi-tenant data isolation sitting on top of hardened Supabase infrastructure.",
                   icon: ShieldCheck,
                   color: "text-indigo-500",
                   bg: "bg-indigo-500/5"
                 },
                 { 
                   title: "Elite UI/UX", 
                   desc: "High-density Dark SaaS interface designed for distraction-free operations.",
                   icon: LayoutDashboard,
                   color: "text-amber-500",
                   bg: "bg-amber-500/5"
                 }
               ].map((f, i) => (
                 <Card key={i} className="bg-card border border-white/5 hover:border-primary/20 transition-all duration-300 group overflow-hidden">
                    <CardContent className="p-8">
                       <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 border border-white/5", f.bg, f.color)}>
                          <f.icon className="h-6 w-6" />
                       </div>
                       <h4 className="text-lg font-black text-foreground mb-3">{f.title}</h4>
                       <p className="text-sm text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                    </CardContent>
                 </Card>
               ))}
             </div>
          </div>
        </section>

        {/* Product Preview Section */}
        <section id="preview" className="py-32 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-6xl mx-auto space-y-16 relative">
             <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter mb-4 italic">Command your empire.</h3>
                <p className="text-muted-foreground font-medium text-sm md:text-base opacity-70">A clinical, high-density visualization engine for your hostel's health.</p>
             </div>
             
             {/* Futuristic Dashboard Illustration */}
             <div className="relative group max-w-5xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative bg-neutral-950/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 md:p-10 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-video flex flex-col gap-6 md:gap-10">
                   {/* Top Header Mockup */}
                   <div className="flex items-center justify-between border-b border-white/5 pb-6 md:pb-10">
                      <div className="flex gap-2">
                         <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50" />
                         <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                         <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                      </div>
                      <div className="flex gap-3">
                         <div className="h-2 w-16 md:w-32 bg-white/5 rounded-full" />
                         <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/20" />
                      </div>
                   </div>

                   <div className="grid grid-cols-12 gap-4 md:gap-8 flex-1">
                      {/* Sub-Panel: Analytics Visualization */}
                      <div className="col-span-12 md:col-span-8 flex flex-col gap-4 md:gap-8">
                         <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                               <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-3 hover:bg-white/10 transition-colors">
                                  <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
                                  <div className="h-4 md:h-6 w-3/4 bg-primary/40 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                               </div>
                            ))}
                         </div>
                         
                         <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 relative overflow-hidden group/chart">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8 opacity-40">Monthly Revenue Inflow Projection</div>
                            
                            {/* Stylized Chart Shapes */}
                            <div className="absolute bottom-10 left-10 right-10 h-32 md:h-48 flex items-end gap-2 md:gap-4">
                               {[40, 65, 45, 80, 55, 90, 70, 85, 40, 60, 75, 50].map((h, i) => (
                                  <div 
                                    key={i} 
                                    className="flex-1 bg-primary/20 rounded-t-lg transition-all duration-700 hover:bg-primary/60 group-hover/chart:translate-y-[-4px]" 
                                    style={{ height: `${h}%`, transitionDelay: `${i * 30}ms` }}
                                  />
                                ))}
                            </div>
                         </div>
                      </div>

                      {/* Sub-Panel: Occupancy Intel */}
                      <div className="hidden md:flex col-span-4 flex-col gap-8">
                         <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Live Occupancy Intel</div>
                            
                            <div className="space-y-6">
                               {[
                                 { label: "Wing Alpha", val: 88 },
                                 { label: "Wing Bravo", val: 42 },
                                 { label: "Wing Gamma", val: 76 },
                               ].map((wing, i) => (
                                 <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                       <span className="text-[10px] font-bold text-foreground/60 uppercase">{wing.label}</span>
                                       <span className="text-[10px] font-black text-primary">{wing.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                       <div className="h-full bg-primary/40 rounded-full" style={{ width: `${wing.val}%` }} />
                                    </div>
                                 </div>
                               ))}
                            </div>
                            
                            <div className="pt-8 flex flex-col gap-4">
                               <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                                  <div className="h-1.5 w-1/3 bg-primary/40 rounded-full" />
                                  <div className="h-3 w-2/3 bg-primary rounded-full" />
                               </div>
                               <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                  <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                
                {/* Floating Elements for 3D depth */}
                <div className="absolute -top-6 -right-6 h-24 w-24 bg-primary/20 blur-2xl rounded-full" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-primary/10 blur-3xl rounded-full" />
             </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-40 px-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full opacity-40" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative">
             <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-none mb-4">
                Scale your hostel <br /> with precision.
             </h2>
             <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                Stop managing infrastructure. Start managing growth. Join the waitlist for the most surgical hostel tool on the market.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button className="h-14 px-12 rounded-2xl font-black text-lg shadow-2xl group transition-all hover:scale-105 active:scale-95">
                   <Link href="/signup" className="flex items-center">
                      Deploy Your Portal
                      <Zap className="ml-2 h-5 w-5 fill-current" />
                   </Link>
                </Button>
             </div>
             
             <div className="pt-8 flex items-center justify-center gap-6">
                <div className="flex -space-x-2">
                   {[1, 2, 3, 4].map(idx => (
                     <div key={idx} className="h-8 w-8 rounded-full border-2 border-neutral-950 bg-neutral-800" />
                   ))}
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                   Trusted by 500+ managers
                </p>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tighter uppercase italic opacity-50">Hostel Pro</span>
           </div>
           
           <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
              © 2026 HOSTEL PRO // OPERATIONS-FIRST SAAS
           </p>
           
           <div className="flex items-center gap-6">
              <Link href="#" className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="#" className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Privacy</Link>
           </div>
        </div>
      </footer>
    </div>
  );
}
