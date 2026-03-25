"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Mail, Lock, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
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
      
      <Card className="w-full max-w-[420px] border-none shadow-premium animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-sm mb-4 border border-primary/20">
             <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">Create Admin Portal</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground pt-1">
            Build your professional hostel management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Secure Email</label>
              <div className="relative">
                 <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                 <Input 
                   type="email" 
                   placeholder="e.g. manager@hostelpro.com" 
                   className="h-12 pl-10 bg-muted/20 border-muted-foreground/20 focus:bg-background transition-all" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required 
                 />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">Master Password</label>
              <div className="relative">
                 <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                 <Input 
                   type="password" 
                   className="h-12 pl-10 bg-muted/20 border-muted-foreground/20 focus:bg-background transition-all" 
                   placeholder="Min 6 secure characters"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required 
                 />
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold animate-in slide-in-from-top-2">
                 ⚠️ {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-12 font-black shadow-lg mt-2 group text-base" disabled={loading}>
              {loading ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Initialize My Portal
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-10 border-t bg-muted/10 pt-6 mt-4 text-center">
           <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              Already have a portal?{" "}
              <Link href="/login" className="text-primary font-black hover:underline cursor-pointer">Login to Access</Link>
           </div>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
         Powered by Supabase Auth Infrastructure
      </div>
    </div>
  );
}
