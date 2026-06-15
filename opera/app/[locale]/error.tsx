"use client";
import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || error.message
  const t = useTranslations("Error")
  const errorMessages: Record<string, string> = {
    profiler_failed: t("profiler_failed"),
    timeout: t("timeout"),
    not_found: t("not_found"),
  }
  const displayMessage = errorMessages[reason] || t("default")
  useEffect(() => {
    console.error('[ErrorPage]', error)
  }, [error])
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] bg-white/40 backdrop-blur-3xl py-12 px-8 sm:px-12 shadow-[0_20px_80px_rgba(99,102,241,0.1)] rounded-[2.5rem] border-[1.5px] border-white/80 text-center relative overflow-hidden"
      >
        {/* Subtle red inner gradient for error state */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.08)_0%,transparent_60%)] pointer-events-none"
        />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-rose-500 mb-4 block relative z-10">
          {t("title")}
        </span>
        <h1 className="text-3xl font-light font-serif text-slate-900 mb-6 leading-tight relative z-10">
          {displayMessage}
        </h1>
        <p className="text-sm text-slate-500 mb-10 leading-relaxed relative z-10 font-light">
          {t("sub")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)]"
          >
            {t("tryAgain")}
          </button>
          <Link href="/home" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 h-12 bg-white/50 backdrop-blur-md border border-white/60 text-slate-700 hover:bg-white/80 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5"
            >
              {t("goHome")}
            </button>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.45)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(112,195,255,0.35)_0%,transparent_60%)] blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.55)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,210,255,0.45)_0%,transparent_60%)] blur-[100px]" />
      </div>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ErrorContent error={error} reset={reset} />
      </Suspense>
    </div>
  )
}