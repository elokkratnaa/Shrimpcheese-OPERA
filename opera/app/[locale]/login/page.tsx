"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/client/services/supabase";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// BRAND LOGO
// ============================================================================
function OperaLogo() {
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-dashed border-slate-400/60 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-3.5 h-3.5 border-[1.5px] border-slate-700 rounded-[40%] flex items-center justify-center"
      >
        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [authError, setAuthError] = useState("");

  const validateInputs = (): boolean => {
    setValidationError("");
    setAuthError("");

    if (!email) {
      setValidationError(t("errors.emailRequired"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(t("errors.emailInvalid"));
      return false;
    }

    if (!password) {
      setValidationError(t("errors.passwordRequired"));
      return false;
    }

    return true;
  };

  const handleEmailSignIn = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("different provider")) {
          setAuthError(t("errors.differentProvider"));
        } else {
          setAuthError(error.message);
        }
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch (err: unknown) {
      setAuthError(t("errors.unexpected"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setAuthError(t("errors.googleFailed"));
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans antialiased relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3] min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Right Side - Bright Cyan/Blue */}
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.45)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(112,195,255,0.35)_0%,transparent_60%)] blur-[130px]" />
        
        {/* Left Side - Vibrant Lavender/Purple */}
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.55)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,210,255,0.45)_0%,transparent_60%)] blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center mb-8"
      >
        <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <OperaLogo />
          <span className="text-sm font-semibold tracking-[0.25em] text-slate-900 uppercase">
            OPERA
          </span>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10"
      >
        <div className="bg-white/40 backdrop-blur-3xl py-10 px-6 sm:px-10 shadow-[0_20px_80px_rgba(99,102,241,0.1)] rounded-[2.5rem] border-[1.5px] border-white/80 relative overflow-hidden group">
          
          {/* Subtle inner gradient breathing */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none"
          />

          <div className="mb-8 text-center relative z-10">
            <h2 className="text-3xl font-light leading-tight tracking-tight text-slate-900 font-serif">
              {t("welcome")}
            </h2>
          </div>

          <div className="space-y-6 relative z-10">
            {/* GOOGLE SIGN IN */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 h-12 border border-white/60 rounded-xl bg-white/50 backdrop-blur-md text-sm font-medium text-slate-700 hover:bg-white/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 disabled:opacity-50 transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            >
              <SiGoogle className="h-4 w-4 text-[#4285F4]" />
              <span>{t("google")}</span>
            </button>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-300/50" />
              </div>
              <div className="relative px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-transparent backdrop-blur-none">
                {t("or")}
              </div>
            </div>

            {/* FORM */}
            <div className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  disabled={isLoading}
                  className="w-full bg-white/60 backdrop-blur-md text-slate-900 text-sm px-4 py-3 h-12 border border-white/60 rounded-xl focus:border-[#6366F1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6366F1]/10 transition-all disabled:opacity-50 placeholder:text-slate-400 shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t("password")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest hover:text-[#4F46E5] transition-colors"
                  >
                    {t("forgot")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-white/60 backdrop-blur-md text-slate-900 text-sm pl-4 pr-12 py-3 h-12 border border-white/60 rounded-xl focus:border-[#6366F1]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6366F1]/10 transition-all disabled:opacity-50 placeholder:text-slate-400 shadow-inner"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            <AnimatePresence>
              {(validationError || authError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-medium text-rose-600 border-l-2 border-rose-500 pl-3 py-2 bg-rose-50/50 backdrop-blur-sm rounded-r-md overflow-hidden"
                >
                  {validationError || authError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleEmailSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-8 py-3.5 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-current" />
              ) : (
                t("signIn")
              )}
            </button>

            {/* REGISTER LINK */}
            <div className="text-center text-xs font-medium text-slate-500 mt-6 pt-5 border-t border-slate-200/50">
              {t("noAccount")}{" "}
              <Link href="/register" className="font-bold text-[#6366F1] hover:text-[#4F46E5] uppercase tracking-wider transition-colors ml-1">
                {t("createOne")}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}