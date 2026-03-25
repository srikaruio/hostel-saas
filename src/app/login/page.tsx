"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-8 left-8">
         <span className="text-2xl font-black bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent tracking-tighter">
            Hostel Pro
         </span>
      </div>
      
      <Card className="w-full max-w-[400px] border-none shadow-premium animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pt-8 text-center">
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Sign in to your dashboard to manage your hostel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Email Address</label>
              <div className="relative">
                 <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                 <Input 
                   type="email" 
                   placeholder="admin@hostelpro.com" 
                   className="h-11 pl-10 bg-muted/20 border-muted-foreground/20 focus:bg-background transition-all" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required 
                 />
              </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Secret Password</label>
                  <Link href="#" className="text-[10px] font-bold text-primary hover:underline">Forgot?</Link>
               </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                 <Input 
                   type="password" 
                   className="h-11 pl-10 bg-muted/20 border-muted-foreground/20 focus:bg-background transition-all" 
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required 
                 />
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2">
                 ⚠️ {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-11 font-black shadow-lg mt-2 group" disabled={loading}>
              {loading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  Sign In to System
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8 border-t border-border bg-muted/5 pt-6 mt-4">
           <div className="text-xs font-medium text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline">Create Portal</Link>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
