"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Auth");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/home");
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
      <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
        <Button 
          onClick={handleGoogleSignIn}
          variant="outline" 
          className="w-full h-12 bg-white/[0.02] border-white/[0.1] hover:bg-white/[0.05] text-white font-semibold rounded-md flex items-center justify-center gap-3 transition-all"
        >
          <svg className="size-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Button>

        <div className="relative flex items-center gap-4">
          <div className="h-px bg-white/[0.08] flex-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">or</span>
          <div className="h-px bg-white/[0.08] flex-1" />
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="h-12 bg-white/[0.02] border-white/[0.1] focus:border-primary/50 text-white rounded-md px-4"
            required
          />
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-12 bg-white/[0.02] border-white/[0.1] focus:border-primary/50 text-white rounded-md px-4"
            required
          />
          <Input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-12 bg-white/[0.02] border-white/[0.1] focus:border-primary/50 text-white rounded-md px-4"
            required
            minLength={8}
          />

          {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-12 bg-primary hover:bg-primary-active text-white font-bold rounded-md"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
          </Button>
        </form>

        <Link href="/login" className="text-sm text-center text-white/40 hover:text-white transition-colors">
          Already have an account? <span className="font-semibold text-primary">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
