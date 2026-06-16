"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import CommitButton from "@/app/components/shared/CommitButton";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERSONAS } from "@/shared/personas";

interface ProConOption {
  option: string;
  pros: string[];
  cons: string[];
  weight: number;
}

interface VerdictData {
  verdict_id: string;
  verdict_summary: string;
  pro_con_matrix: ProConOption[];
  recommendation: string;
  next_steps: string[];
  is_committed: boolean;
  favourite_persona?: string;
}

const PERSONA_COLORS: Record<string, string> = {
  "The Pragmatic Stoic": "#f59e0b",
  "The Venture Capitalist": "#0d9488",
  "The Creative Hedonist": "#8b5cf6",
  "Default": "var(--color-primary)"
};

export default function VerdictClient({ initialVerdict, initialUniquePersonas }: { initialVerdict: VerdictData, initialUniquePersonas: string[] }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Verdict");

  const [verdict, setVerdict] = useState<VerdictData>(initialVerdict);
  const [summaryText, setSummaryText] = useState(initialVerdict.verdict_summary || "");
  const [isCommitted, setIsCommitted] = useState(initialVerdict.is_committed);
  const [favouritePersona, setFavouritePersona] = useState<string>(initialVerdict.favourite_persona || "");
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const [fetchingClosing, setFetchingClosing] = useState(false);
  const [newDilema, setNewDilema] = useState("");

  const getPersonaColor = (name: string) => {
    return PERSONA_COLORS[name] || PERSONA_COLORS.Default;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    alert(t("copied"));
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "OPERA Verdict",
          text: summaryText,
        });
      } else {
        handleCopy();
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const handleNewDilemma = async () => {
    localStorage.setItem("opera_draft", newDilema);
    router.push("/dump");
  };

  const handleSelectPersona = async (name: string) => {
    if (isCommitted || favouritePersona === name) return;
    setFavouritePersona(name);
    setClosingMessage(null);
    
    if (name === t("undecided")) {
      try {
        await fetch(`/api/verdicts/${verdict.verdict_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favourite_persona: "Masih Ragu" }),
        });
      } catch (e) {}
      return;
    }

    setFetchingClosing(true);
    try {
      const response = await fetch(`/api/verdicts/${verdict.verdict_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favourite_persona: name }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Feedback response:", data);
        setClosingMessage(data.closing_message);
      } else {
        console.error("Feedback fetch failed", await response.text());
      }
    } catch (err: unknown) {
      console.error("Error updating favourite persona:", err);
    } finally {
      setFetchingClosing(false);
    }
  };

  const handleCommit = async () => {
    try {
      const response = await fetch(`/api/verdicts/${verdict.verdict_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_committed: true, favourite_persona: favouritePersona }),
      });

      if (!response.ok) {
        throw new Error(t("errors.commit"));
      }

      setIsCommitted(true);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const proConMatrix = verdict?.pro_con_matrix || [];
  const recommendation = verdict?.recommendation;
  const nextSteps = verdict?.next_steps || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans theme-new-primary">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-12 md:py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold tracking-[1.5px] text-slate-500 uppercase font-sans">
            {t("title")}
          </span>
        </div>

        <div className="text-slate-900 text-[16px] leading-[1.55] whitespace-pre-wrap font-sans">
          {summaryText}
        </div>

        <section className="flex flex-col gap-8 border-t border-slate-200 pt-8">
          <h2 className="text-[12px] font-semibold tracking-[1.5px] text-slate-500 uppercase font-sans">
            {t("matrix")}
          </h2>

          <div className="flex flex-col gap-8">
            {proConMatrix.map((optionData, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-slate-900 font-sans">
                  {optionData.option}
                </h3>

                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5db8a6] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, optionData.weight * 100))}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                  <div className="flex flex-col gap-2.5">
                    {optionData.pros.map((pro, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-sm text-slate-700 font-sans">
                        <span className="w-2 h-2 rounded-full bg-[#5db872] shrink-0 mt-1.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {optionData.cons.map((con, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 text-sm text-slate-700 font-sans">
                        <span className="w-2 h-2 rounded-full bg-[#c64545] shrink-0 mt-1.5" />
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PERSONA SELECTION SECTION */}
          <div className="flex flex-col gap-4 mt-4">
            <label className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              {t("favouritePersonaLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[...initialUniquePersonas, t("undecided")].map(name => (
                <button
                  key={name}
                  onClick={() => handleSelectPersona(name)}
                  disabled={isCommitted}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
                    favouritePersona === name 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-white border border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-slate-50"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {(fetchingClosing || closingMessage) && favouritePersona !== t("undecided") && (
              <div 
                className="bg-white p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ borderLeftWidth: "3px", borderLeftColor: getPersonaColor(favouritePersona) }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: getPersonaColor(favouritePersona) }}
                  >
                    {favouritePersona.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold text-sm leading-none">{favouritePersona}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{t("closingMessage")}</span>
                  </div>
                </div>
                
                {fetchingClosing ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                    <Loader2 className="animate-spin h-3 w-3" />
                    <span>{t("typing")}</span>
                  </div>
                ) : (
                  <p className="text-slate-700 text-[15px] leading-relaxed italic">
                    "{closingMessage}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {recommendation && (
          <section className="bg-white rounded-lg p-8 border border-slate-200 flex flex-col gap-4">
            <span className="text-[12px] font-semibold tracking-[1.5px] text-slate-500 uppercase font-sans">
              {t("recommendation")}
            </span>
            <p className="text-[22px] font-normal leading-tight tracking-normal text-slate-900 font-serif">
              {recommendation}
            </p>
          </section>
        )}

        {nextSteps.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="text-[12px] font-semibold tracking-[1.5px] text-slate-500 uppercase font-sans">
              {t("nextSteps")}
            </h2>

            <div className="flex flex-col gap-6">
              {nextSteps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-4">
                  <span className="text-[28px] font-normal leading-none tracking-tight text-primary font-serif shrink-0">
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-slate-700 text-[16px] leading-[1.55] pt-1 font-sans">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {verdict && (
          <div className="border-t border-slate-200 pt-8 flex flex-col gap-4">
            <CommitButton onCommit={handleCommit} isCommitted={isCommitted} />
          </div>
        )}
      </main>

      {/* QUICK START + ACTION ROW - Relative now */}
      <div className="bg-[#F8FAFC] border-t border-slate-200 px-6 py-8 mt-10">
        <div className="max-w-[720px] mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-[1px] bg-slate-200 w-full mb-2" />
            <textarea
              aria-label={t("dilemmaPlaceholder")}
              value={newDilema}
              onChange={(e) => setNewDilema(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-900 focus:outline-none focus:border-[#cc785c] transition-all resize-none"
              rows={2}
            />
            <button
              onClick={handleNewDilemma}
              disabled={!newDilema.trim()}
              className="w-full bg-[#cc785c] hover:bg-[#a9583e] text-white font-bold text-sm py-4 rounded-full transition-all duration-300 ease-out shadow-lg shadow-[#cc785c]/20 hover:shadow-[#cc785c]/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {t("startGibah")}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleNewDilemma} className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white font-bold text-sm py-3 rounded-full transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98]">
              {t("newDilemma")}
            </button>
            <button onClick={handleCopy} className="flex-1 bg-slate-200 text-slate-900 font-medium text-sm py-3 rounded-full transition-all duration-300 ease-out hover:bg-slate-300 hover:scale-[1.02] active:scale-[0.98]">
              {t("copyResult")}
            </button>
            <button onClick={handleShare} className="flex-1 bg-slate-200 text-slate-900 font-medium text-sm py-3 rounded-full transition-all duration-300 ease-out hover:bg-slate-300 hover:scale-[1.02] active:scale-[0.98]">
              {t("shareResults")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
