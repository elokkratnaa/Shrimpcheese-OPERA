"use client";
import React from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
export default function NotFound() {
  const t = useTranslations("Error.notFound")
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden">
      
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.45)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(112,195,255,0.35)_0%,transparent_60%)] blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.55)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,210,255,0.45)_0%,transparent_60%)] blur-[100px]" />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px] bg-white/40 backdrop-blur-3xl py-12 px-8 sm:px-12 shadow-[0_20px_80px_rgba(99,102,241,0.1)] rounded-[2.5rem] border-[1.5px] border-white/80 text-center relative overflow-hidden"
        >
          {/* Subtle inner gradient breathing */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none"
          />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6366F1] mb-4 block relative z-10">
            {t("title")}
          </span>
          <h1 className="text-4xl font-light font-serif text-slate-900 mb-6 leading-tight relative z-10">
            {t("message")}
          </h1>
          <p className="text-sm text-slate-500 mb-10 leading-relaxed relative z-10 font-light">
            {t("sub")}
          </p>
          <div className="flex justify-center relative z-10">
            <Link href="/home">
              <button className="flex items-center justify-center px-8 py-3.5 h-12 bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)]">
                {t("cta")}
              </button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}