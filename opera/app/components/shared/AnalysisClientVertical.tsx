"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Brain, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { getFriendlyName } from "@/shared/personas";

interface PersonalityAnalysis {
  emotional_core: { state: string; frequency: number }[];
  persona_affinity: { persona: string; count: number }[];
  key_themes: string[];
}

export default function AnalysisClientVertical() {
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Profile.analysis");

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch("/api/profile/analysis");
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (!analysis) return <div className="p-8 text-center text-slate-500 text-sm italic">{t("noData")}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8 relative overflow-hidden"
    >
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">{t("title")}</h3>
      
      <div className="flex flex-col gap-8">
        {/* Persona Affinity */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-500">
                <Brain className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{t("personaAffinity")}</span>
            </div>
            {analysis.persona_affinity.map((item) => (
                <div key={item.persona} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-700">{getFriendlyName(item.persona)}</span>
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${item.count * 20}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.count}</span>
                </div>
            ))}
        </div>

        {/* Themes */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-500">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{t("keyThemes")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {analysis.key_themes.map((theme) => (
                    <span key={theme} className="bg-white/80 border border-rose-100 text-rose-600 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
                        {theme}
                    </span>
                ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
