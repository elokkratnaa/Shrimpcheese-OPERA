"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import { Loader2 } from "lucide-react";
import { createClient } from "@/client/services/supabase";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeApiError } from "@/client/services/error";

import { PERSONAS, PERSONA_MAP, getFriendlyName } from "@/shared/personas";

// ============================================================================
// LOCAL DICTIONARY
// ============================================================================
const dict = {
  en: {
    heroTitle: "What's on your mind today?",
    heroSub:
      "It doesn't need to be neat. It doesn't need to be perfect. Just pour out whatever is in your head.",
    textareaPlaceholder: "I've been thinking about...",
    minChar: "Keep writing... (minimum 50 characters)",
    ready: "Ready for reflection",
    overthinkingLabel: "Cognitive Load",
    overthinkingLevels: {
      relaxed: "Clear & Calm",
      warming: "A Bit Cluttered",
      hot: "Heavy Overthinking",
      overthinking: "Mental Overload",
    },
    contextSection: "Mind Context",
    contextSub: "Help us understand your current situation.",
    categoryLabel: "What is this related to?",
    emotionLabel: "How are you feeling?",
    roundsLabel: "Depth of Reflection",
    roundsSelect: "Rounds",
    roundsHelper: "Choose how deep you want the debate to go. More rounds yield more nuance.",
    councilSection: "Select Your Council",
    gacha: "Surprise Me",
    racik: "Handpick",
    submitLabel: "✨ Begin Reflection Session",
    loading: {
      reading: "Reading your thoughts...",
      finding: "Finding the right perspectives...",
      assembling: "Assembling your council...",
    },
    errors: {
      failed: "Failed to start session. Please try again.",
      unexpected: "An unexpected error occurred.",
    },
    categories: {
      Karir: "Career",
      Percintaan: "Romance",
      Keluarga: "Family",
      Keuangan: "Finance",
      Pendidikan: "Education",
      "Self-Growth": "Self-Growth",
      Lainnya: "Others",
    },
    emotions: {
      anxious: "Anxious",
      avoidant: "Avoidant",
      "risk-tolerant": "Risk Tolerant",
      fatigued: "Fatigued",
      hopeful: "Hopeful",
      bingung: "Confused",
    },
    personas: {
      "The Pragmatic Stoic": "Focuses on stability and long-term decisions.",
      "The Venture Capitalist": "Seeks the highest upside amidst uncertainty.",
      "The Creative Hedonist": "Prioritizes meaning, joy, and quality of life.",
      Luna: "Focuses on stability and long-term decisions.",
      Sage: "Seeks the highest upside amidst uncertainty.",
      Baz: "Prioritizes meaning, joy, and quality of life.",
    },
  },
  id: {
    heroTitle: "Apa yang sedang memenuhi pikiranmu hari ini?",
    heroSub:
      "Tidak perlu rapi. Tidak perlu sempurna. Tuliskan saja apa yang ada di kepalamu.",
    textareaPlaceholder: "Hari ini aku kepikiran tentang...",
    minChar: "Lanjutkan ceritamu... (minimal 50 karakter)",
    ready: "Sesi siap dimulai",
    overthinkingLabel: "Beban Pikiran",
    overthinkingLevels: {
      relaxed: "Tenang & Jernih",
      warming: "Mulai Penuh",
      hot: "Cukup Berat",
      overthinking: "Sangat Penuh",
    },
    contextSection: "Konteks Pikiran",
    contextSub: "Bantu kami memahami situasimu lebih dalam.",
    categoryLabel: "Kategori Cerita",
    emotionLabel: "Perasaanmu Saat Ini",
    roundsLabel: "Kedalaman Refleksi",
    roundsSelect: "Ronde",
    roundsHelper: "Pilih seberapa dalam diskusi yang kamu inginkan. Lebih banyak ronde berarti lebih banyak nuansa.",
    councilSection: "Pilih Dewan Penasihat",
    gacha: "Kejutkan Aku",
    racik: "Pilih Sendiri",
    submitLabel: "✨ Mulai Sesi Refleksi",
    loading: {
      reading: "Membaca pikiranmu...",
      finding: "Mencari sudut pandang terbaik...",
      assembling: "Mengumpulkan penasihatmu...",
    },
    errors: {
      failed: "Gagal memulai sesi. Silakan coba lagi.",
      unexpected: "Terjadi kesalahan yang tidak terduga.",
    },
    categories: {
      Karir: "Karir",
      Percintaan: "Percintaan",
      Keluarga: "Keluarga",
      Keuangan: "Keuangan",
      Pendidikan: "Pendidikan",
      "Self-Growth": "Self-Growth",
      Lainnya: "Lainnya",
    },
    emotions: {
      anxious: "Cemas",
      avoidant: "Menghindar",
      "risk-tolerant": "Berani",
      fatigued: "Lelah",
      hopeful: "Penuh Harap",
      bingung: "Bingung",
    },
    personas: {
      "The Pragmatic Stoic":
        "Fokus pada kestabilan dan keputusan jangka panjang.",
      "The Venture Capitalist":
        "Mencari peluang terbesar di tengah ketidakpastian.",
      "The Creative Hedonist":
        "Mengutamakan makna, kebahagiaan, dan kualitas hidup.",
      Luna: "Fokus pada kestabilan dan keputusan jangka panjang.",
      Sage: "Mencari peluang terbesar di tengah ketidakpastian.",
      Baz: "Mengutamakan makna, kebahagiaan, dan kualitas hidup.",
    },
  },
};

const CATEGORIES = [
  "Karir",
  "Percintaan",
  "Keluarga",
  "Keuangan",
  "Pendidikan",
  "Self-Growth",
  "Lainnya",
];
const EMOTIONS = [
  "anxious",
  "avoidant",
  "risk-tolerant",
  "fatigued",
  "hopeful",
  "bingung",
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function UnifiedDumpPage() {
  const router = useRouter();
  const supabase = createClient();
  const locale = useLocale();
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const LOADING_MESSAGES = [
    t.loading.reading,
    t.loading.finding,
    t.loading.assembling,
  ];

  const PERSONA_POOL = useMemo(() => Object.keys(PERSONA_MAP), []);

  const [mindDump, setMindDump] = useState("");
  const [rounds, setRounds] = useState(1);
  const [category, setCategory] = useState("Lainnya");
  const [emotion, setEmotion] = useState("bingung");
  const [squadMode, setSquadMode] = useState<"gacha" | "racik">("gacha");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  // Overthinking Bar calculation (Dynamic based on typing length)
  const getOverthinkingValue = () => {
    if (mindDump.length === 0) return 0;
    const base = Math.min((mindDump.length / 1000) * 80, 80);
    let bonus = 0;
    if (emotion === "anxious" || emotion === "fatigued") bonus = 20;
    else if (emotion === "bingung" || emotion === "avoidant") bonus = 10;
    return Math.min(base + bonus, 100);
  };

  const overthinkingValue = getOverthinkingValue();
  const getOverthinkingLabel = (val: number) => {
    if (val === 0) return t.overthinkingLevels.relaxed;
    if (val <= 30) return t.overthinkingLevels.relaxed;
    if (val <= 60) return t.overthinkingLevels.warming;
    if (val <= 85) return t.overthinkingLevels.hot;
    return t.overthinkingLevels.overthinking;
  };

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.push(`/login`);
      else setAuthChecking(false);
    }
    checkAuth();
  }, [router, supabase, locale]);

  useEffect(() => {
    if (authChecking) return;
    const draft = localStorage.getItem("opera_draft");
    if (draft) setMindDump(draft);
  }, [authChecking]);

  useEffect(() => {
    if (authChecking) return;
    const timer = setTimeout(() => {
      localStorage.setItem("opera_draft", mindDump);
    }, 500);
    return () => clearTimeout(timer);
  }, [mindDump, authChecking]);

  // Gacha logic
  useEffect(() => {
    if (squadMode === "gacha") {
      const shuffled = [...PERSONA_POOL].sort(() => 0.5 - Math.random());
      setSelectedPersonas(shuffled.slice(0, 3));
    }
  }, [squadMode, PERSONA_POOL]);

  const togglePersona = (key: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleMindDumpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMindDump(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    setIsLoading(true);
    setErrorMessage("");
    setLoadingMsgIndex(0);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-locale": locale 
        },
        body: JSON.stringify({
          dump_text: mindDump,
          debate_rounds: rounds,
          conversation_type: category,
          emotional_state: emotion,
          personas: squadMode === "racik" ? selectedPersonas : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.errors.failed);
      }

      const session = await response.json();
      localStorage.removeItem("opera_draft");
      router.push(`/session/${session.session_id}/council`);
    } catch (err: unknown) {
      setErrorMessage(sanitizeApiError(err));
      console.error(err);
    } finally {
      setIsLoading(false);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
  };

  const isSubmitDisabled =
    mindDump.length < 50 ||
    isLoading ||
    (squadMode === "racik" && selectedPersonas.length < 2);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );
  }

  // Helper UI Components
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">
      {children}
    </h3>
  );

  const Pill = ({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        selected
          ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(79,70,229,0.3)] border border-indigo-500"
          : "bg-white/50 backdrop-blur-md border border-white/80 text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-20 pt-24 md:pt-32 flex flex-col relative z-10">
        {/* ================================================================= */}
        {/* HERO AREA & TEXT INPUT */}
        {/* ================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5 text-center mb-12 mt-12"
        >
          <h1 className="text-4xl md:text-5xl font-light font-serif text-slate-900 tracking-tight leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-slate-500 font-light text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            {t.heroSub}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative w-full rounded-[2.5rem] bg-white/40 backdrop-blur-3xl border border-white/60 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:shadow-[0_20px_80px_rgba(99,102,241,0.08)] focus-within:bg-white/60 transition-all duration-500"
        >
          <textarea
            value={mindDump}
            onChange={handleMindDumpChange}
            placeholder={t.textareaPlaceholder}
            className="w-full bg-transparent outline-none resize-none text-xl md:text-2xl font-serif text-slate-800 placeholder:text-slate-400 placeholder:font-light min-h-[300px] leading-relaxed selection:bg-indigo-100"
            maxLength={4000}
            autoFocus
          />

          {/* Status Footer inside Input */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200/50">
            <span
              className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${mindDump.length >= 50 ? "text-emerald-500" : "text-slate-400"}`}
            >
              {mindDump.length < 50 ? t.minChar : t.ready}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">
              {mindDump.length} / 4000
            </span>
          </div>

          {/* Glowing Overthinking Line */}
          <div className="absolute bottom-0 left-10 right-10 h-[2px] bg-transparent rounded-full overflow-hidden transform translate-y-1/2">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-400 via-rose-400 to-orange-400 opacity-80"
              initial={{ width: 0 }}
              animate={{ width: `${overthinkingValue}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-end px-8 mt-4"
        >
          <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            {t.overthinkingLabel}
          </span>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
            {getOverthinkingLabel(overthinkingValue)}
          </span>
        </motion.div>

        {/* ================================================================= */}
        {/* CONTEXT SECTION */}
        {/* ================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-12 mt-16 pt-16 border-t border-slate-200/50"
        >
          <div className="text-center mb-2">
            <h2 className="text-3xl font-light font-serif text-slate-800">
              {t.contextSection}
            </h2>
            <p className="text-sm text-slate-500 font-light mt-3">
              {t.contextSub}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Category */}
            <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <SectionLabel>{t.categoryLabel}</SectionLabel>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {CATEGORIES.map((cat) => (
                  <Pill
                    key={cat}
                    label={
                      t.categories[cat as keyof typeof t.categories] || cat
                    }
                    selected={category === cat}
                    onClick={() => setCategory(cat)}
                  />
                ))}
              </div>
            </div>

            {/* Emotion */}
            <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <SectionLabel>{t.emotionLabel}</SectionLabel>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {EMOTIONS.map((emo) => (
                  <Pill
                    key={emo}
                    label={t.emotions[emo as keyof typeof t.emotions] || emo}
                    selected={emotion === emo}
                    onClick={() => setEmotion(emo)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Rounds */}
          <div className="flex flex-col gap-2 items-center mt-8 p-6 bg-white/30 backdrop-blur-sm rounded-3xl border border-white/50 shadow-inner">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
              {t.roundsLabel}
            </h3>
            <p className="text-xs text-slate-500 mb-2 max-w-xs text-center">
              {t.roundsHelper}
            </p>
            <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white/80 shadow-sm">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ease-out ${
                    rounds === r
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {r} {t.roundsSelect}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* COUNCIL SELECTION */}
        {/* ================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-10 mt-16 pt-16 border-t border-slate-200/50"
        >
          <div className="text-center">
            <h2 className="text-3xl font-light font-serif text-slate-800">
              {t.councilSection}
            </h2>
          </div>

          <div className="flex justify-center mb-2">
            <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-full border border-white/80 shadow-sm">
              {(["gacha", "racik"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSquadMode(mode)}
                  className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ease-out ${
                    squadMode === mode
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  {mode === "gacha" ? t.gacha : t.racik}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PERSONA_POOL.map((key) => {
              const persona = (PERSONA_MAP as any)[key];
              const isSelected = selectedPersonas.includes(key);
              const show = squadMode === "racik" || isSelected;

              if (!show) return null;

              const customDesc =
                t.personas[persona.name as keyof typeof t.personas] ||
                persona.description;
              const friendlyName = getFriendlyName(persona.name);

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={key}
                  onClick={() => squadMode === "racik" && togglePersona(key)}
                  className={`relative flex flex-col p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden group min-h-[200px] ${
                    isSelected
                      ? "bg-white/80 border-indigo-200 shadow-[0_8px_30px_rgba(99,102,241,0.12)]"
                      : "bg-white/30 border-white/60 hover:bg-white/70 shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                  )}

                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-serif italic border-2 border-white shadow-sm ${
                        isSelected
                          ? "bg-gradient-to-tr from-indigo-100 to-rose-100 text-indigo-700"
                          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors"
                      }`}
                    >
                      {friendlyName.charAt(0)}
                    </div>
                    {squadMode === "racik" && (
                      <div
                        className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-indigo-500 border-indigo-500"
                            : "border-slate-300 bg-white/50"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col justify-end">
                    <h4 className="text-lg font-serif text-slate-900 mb-2">
                      {friendlyName}
                    </h4>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      "{customDesc}"
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ================================================================= */}
        {/* SUBMIT ACTION */}
        {/* ================================================================= */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-xs font-bold tracking-widest text-rose-500 bg-rose-50 border border-rose-100 px-6 py-4 rounded-xl text-center uppercase"
          >
            {errorMessage}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-12 border-t border-slate-200/50 flex flex-col items-center"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full max-w-sm h-16 bg-slate-900 text-white font-bold text-xs tracking-[0.2em] uppercase rounded-full hover:bg-indigo-600 transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="animate-pulse">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </span>
              </>
            ) : (
              t.submitLabel
            )}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
