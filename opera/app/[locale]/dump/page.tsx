"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import OperaInput from "@/app/components/shared/OperaInput";
import { Loader2 } from "lucide-react";
import { createClient } from "@/client/services/supabase";
import { useTranslations } from "next-intl";

import { PERSONAS, PERSONA_MAP } from "@/shared/personas";

export default function MindDumpPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("MindDump");
  const tLoading = useTranslations("Loading");
  
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const LOADING_MESSAGES = [
    tLoading("reading"),
    tLoading("finding"),
    tLoading("assembling"),
  ];

  const CATEGORIES = ["Karir", "Percintaan", "Keluarga", "Keuangan", "Pendidikan", "Self-Growth", "Lainnya"];
  const EMOTIONS = ["anxious", "avoidant", "risk-tolerant", "fatigued", "hopeful", "bingung"];
  
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

  // Overthinking Bar calculation
  const getOverthinkingValue = () => {
    let base = (mindDump.length / 4000) * 100;
    let bonus = 0;
    if (emotion === "anxious" || emotion === "fatigued") bonus = 20;
    else if (emotion === "bingung") bonus = 10;
    return Math.min(base + bonus, 100);
  };

  const overthinkingValue = getOverthinkingValue();
  const getOverthinkingLabel = (val: number) => {
    if (val <= 30) return t("overthinkingLabels.relaxed");
    if (val <= 50) return t("overthinkingLabels.warming");
    if (val <= 75) return t("overthinkingLabels.hot");
    return t("overthinkingLabels.overthinking");
  };

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (authChecking) return;
    const draft = localStorage.getItem("opera_draft");
    if (draft) {
      setMindDump(draft);
    }
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
    setSelectedPersonas(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleMindDumpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMindDump(e.target.value);
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  const handleSubmit = async () => {
    console.log("[Dump] handleSubmit clicked", { mindDumpLength: mindDump.length, isSubmitDisabled });
    if (mindDump.length < 50) return;
    if (isSubmitDisabled) {
        console.log("[Dump] handleSubmit blocked by isSubmitDisabled");
        return;
    }

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
        },
        body: JSON.stringify({ 
          dump_text: mindDump, 
          debate_rounds: rounds,
          conversation_type: category,
          emotional_state: emotion,
          personas: squadMode === "racik" ? selectedPersonas : []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("errors.failed"));
      }

      const session = await response.json();
      localStorage.removeItem("opera_draft");
      router.push(`/session/${session.session_id}/council`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errors.unexpected");
      setErrorMessage(message);
      console.error(err);
    } finally {
      setIsLoading(false);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
  };

  const isSubmitDisabled = mindDump.length < 50 || isLoading || (squadMode === "racik" && selectedPersonas.length < 2);
  console.log("[Dump] isSubmitDisabled re-calculated:", { isSubmitDisabled, mindDumpLength: mindDump.length, selectedPersonasLength: selectedPersonas.length, squadMode, isLoading });

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
      {children}
    </h3>
  );

  const Pill = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        selected 
          ? "bg-[#cc785c] text-white shadow-md shadow-[#cc785c]/20" 
          : "bg-white border border-slate-200 text-slate-700 hover:border-[#cc785c]/50 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-24 flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            {t("title")}
          </h1>
          <p className="text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <OperaInput
            value={mindDump}
            onChange={handleMindDumpChange}
            placeholder="..."
            minHeight={240}
            maxLength={4000}
            showCounter={true}
          />
          <span className="text-xs text-slate-500 font-sans px-1">
            {t("minCharMessage", { count: Math.max(0, 50 - mindDump.length) })}
          </span>
        </div>

        {/* OVERTHINKING BAR */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              {t("overthinking")}
            </span>
            <span className="text-slate-900 font-bold text-right">
              {getOverthinkingLabel(overthinkingValue)}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#cc785c] transition-[width] duration-400 ease"
              style={{ width: `${overthinkingValue}%` }}
            />
          </div>
        </div>

        {/* SECTION 1: CATEGORY */}
        <section>
          <SectionLabel>{t("categoryLabel")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Pill 
                key={cat} 
                label={t(`categories.${cat}`)}
                selected={category === cat} 
                onClick={() => setCategory(cat)} 
              />
            ))}
          </div>
        </section>

        {/* NEW SECTION: ROUNDS */}
        <section>
          <SectionLabel>{t("rounds")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map(r => (
              <Pill 
                key={r} 
                label={`${r} Ronde`} 
                selected={rounds === r} 
                onClick={() => setRounds(r)} 
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: EMOTION */}
        <section>
          <SectionLabel>{t("emotionLabel")}</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(emo => (
              <Pill 
                key={emo} 
                label={t(`emotions.${emo}`)} 
                selected={emotion === emo} 
                onClick={() => setEmotion(emo)} 
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: PERSONAS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>{t("personaLabel")}</SectionLabel>
            <div className="flex bg-slate-100 rounded-full p-1 shadow-inner">
              {(["gacha", "racik"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSquadMode(mode)}
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 ease-out ${
                    squadMode === mode 
                      ? "bg-[#cc785c] text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {mode === "gacha" ? t("gacha") : t("racik")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {PERSONA_POOL.map(key => {
              const persona = (PERSONA_MAP as any)[key];
              const isSelected = selectedPersonas.includes(key);
              const show = squadMode === "racik" || isSelected;

              if (!show) return null;

              return (
                <div 
                  key={key}
                  onClick={() => squadMode === "racik" && togglePersona(key)}
                  className={`bg-white border transition-all p-4 rounded-xl flex items-center gap-4 cursor-pointer ${
                    isSelected && squadMode === "racik" ? "border-[#cc785c]" : "border-slate-200"
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: isSelected ? "#cc785c" : "#94a3b8" }}
                  >
                    {persona.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{persona.name}</p>
                    <p className="text-xs text-slate-500 truncate">{persona.description}</p>
                  </div>
                  {squadMode === "racik" && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-[#cc785c] border-[#cc785c]" : "border-slate-200"
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {errorMessage && (
          <div className="text-xs font-medium text-[#c64545] border-l-2 border-[#c64545] pl-3 py-2 bg-[rgba(198,69,69,0.05)] rounded-r">
            {errorMessage}
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full h-14 bg-[#cc785c] text-white hover:bg-[#a9583e] font-bold text-lg rounded-full transition-all duration-300 ease-out shadow-lg shadow-[#cc785c]/20 hover:shadow-[#cc785c]/40 hover:scale-[1.01] active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin h-5 w-5" />
                <span className="animate-pulse">{LOADING_MESSAGES[loadingMsgIndex]}</span>
              </span>
            ) : (
              t("submit")
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
