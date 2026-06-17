"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/client/services/supabase";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const t = useTranslations("Auth");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setAuthError(t("errors.unexpected"));
      console.error(err);
    } finally {
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

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-light leading-tight tracking-tight text-slate-900 font-serif mb-3">
                    {t("forgotTitle")}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {t("forgotSubtitle")}
                  </p>
                </div>

                <div className="space-y-6">
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

                  <button
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-8 py-3.5 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin h-5 w-5 text-current" />
                    ) : (
                      t("sendResetLink")
                    )}
                  </button>

                  <div className="text-center mt-6">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] uppercase tracking-wider transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      {t("backToLogin")}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center py-4"
              >
                <div className="w-16 h-16 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MailCheck className="h-8 w-8 text-[#6366F1]" />
                </div>
                <h2 className="text-2xl font-light tracking-tight text-slate-900 font-serif mb-3">
                  {t("resetSuccessTitle")}
                </h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  {t("resetSuccessSubtitle")}
                </p>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-8 py-3.5 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                >
                  {t("backToLogin")}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
