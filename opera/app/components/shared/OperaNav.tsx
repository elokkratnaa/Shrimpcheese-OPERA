"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { createClient } from "@/client/services/supabase";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// BRAND LOGO
// ============================================================================
function OperaLogo() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-dashed border-slate-400/60 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-3 h-3 border-[1.5px] border-slate-700 rounded-[40%] flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-slate-500 rounded-full" />
      </motion.div>
    </div>
  );
}

// ============================================================================
// OPERA NAV (Floating Pill Version + User's Original Logic)
// ============================================================================
interface OperaNavProps {
  variant: "guest" | "authed";
  showHomeButton?: boolean;
}

export default function OperaNav({ variant, showHomeButton = false }: OperaNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initials, setInitials] = useState("ME");
  
  const router = useRouter();
  const pathname = usePathname() || "";
  const locale = useLocale();
  const t = useTranslations("Nav");
  
  // Uses the exact Supabase import from your original file
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (variant === "authed") {
      const fetchUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name;
          const email = user.email;

          if (fullName && fullName.trim().length > 0) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length >= 2) {
              setInitials(
                (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(),
              );
            } else {
              setInitials(parts[0].slice(0, 2).toUpperCase());
            }
          } else if (email) {
            setInitials(email.slice(0, 2).toUpperCase());
          }
        }
      };
      fetchUser();
    }
  }, [variant, supabase]);

  const handleAvatarClick = () => {
    router.push("/profile");
  };

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <>
      <header className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 md:px-6">
        <div className="bg-white/40 backdrop-blur-3xl rounded-full px-4 md:px-6 py-3.5 flex items-center justify-between w-full max-w-5xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 transition-all">
          
          {/* LOGO & HOME BACK BUTTON */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <OperaLogo />
              <span className="font-semibold tracking-[0.25em] text-slate-900 uppercase text-xs">OPERA</span>
            </Link>
            {showHomeButton && (
              <Link href="/home" className="hidden md:block text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                ← Home
              </Link>
            )}
          </div>

          {/* DESKTOP MIDDLE LINKS (AUTHED ONLY) */}
          {variant === "authed" && (
            <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium text-slate-600">
              <Link href="/home" className={`hover:text-slate-900 transition-colors py-1 ${pathname.includes('/home') ? 'text-slate-900 font-bold' : ''}`}>
                {t("home")}
              </Link>
              <Link href="/history" className={`hover:text-slate-900 transition-colors py-1 ${pathname.includes('/history') ? 'text-slate-900 font-bold' : ''}`}>
                {t("history")}
              </Link>
              <Link href="/chat" className={`hover:text-slate-900 transition-colors py-1 ${pathname.includes('/chat') ? 'text-slate-900 font-bold' : ''}`}>
                {t("chat")}
              </Link>
            </nav>
          )}

          {/* RIGHT SIDE (LANGUAGE + PROFILE + MOBILE TOGGLE) */}
          <div className="flex items-center gap-3 md:gap-4 text-[10px] font-bold uppercase tracking-widest">
            
            {/* LANG TOGGLE (Desktop) - Integrated so no external LanguageSwitcher needed */}
            <div className="hidden md:flex items-center gap-1 bg-white/40 backdrop-blur-md p-1 rounded-full border border-slate-200/50">
              <button 
                onClick={() => switchLocale('en')} 
                className={`px-3 py-1.5 rounded-full transition-all ${locale === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                EN
              </button>
              <button 
                onClick={() => switchLocale('id')} 
                className={`px-3 py-1.5 rounded-full transition-all ${locale === "id" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                ID
              </button>
            </div>

            {/* AUTH / PROFILE */}
            {variant === "authed" ? (
              <div 
                onClick={handleAvatarClick}
                className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
              >
                {initials}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login" className="text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  {t("signIn")}
                </Link>
                <button
                  onClick={() => router.push("/dump")}
                  className="bg-slate-900 text-white hover:bg-slate-800 font-medium h-9 px-5 rounded-full cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  {t("startThinking")}
                </button>
              </div>
            )}

            {/* MOBILE MENU TRIGGER */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-full bg-white/50 text-slate-900 focus:outline-none"
            >
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-4 top-24 z-40 bg-white/70 backdrop-blur-3xl border border-white/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
          >
            {/* Mobile Lang Toggle */}
            <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-full self-start">
              <button onClick={() => switchLocale('en')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${locale === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>EN</button>
              <button onClick={() => switchLocale('id')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${locale === "id" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>ID</button>
            </div>

            {variant === "guest" ? (
              <div className="flex flex-col gap-4">
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-sm font-medium text-slate-900 px-2">
                  {t("signIn")}
                </Link>
                <button
                  onClick={() => { setIsOpen(false); router.push("/dump"); }}
                  className="bg-slate-900 text-white h-12 w-full text-sm font-medium rounded-xl shadow-md"
                >
                  {t("startThinking")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Link href="/home" onClick={() => setIsOpen(false)} className="text-sm font-medium text-slate-600 px-2 py-1">
                  {t("home")}
                </Link>
                <Link href="/history" onClick={() => setIsOpen(false)} className="text-sm font-medium text-slate-600 px-2 py-1">
                  {t("history")}
                </Link>
                <Link href="/chat" onClick={() => setIsOpen(false)} className="text-sm font-medium text-slate-600 px-2 py-1">
                  {t("chat")}
                </Link>
                <div className="h-px bg-slate-200/50 my-1" />
                <Link href="/profile" onClick={() => setIsOpen(false)} className="text-sm font-bold text-slate-900 px-2 py-1">
                  {t("profile")}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}