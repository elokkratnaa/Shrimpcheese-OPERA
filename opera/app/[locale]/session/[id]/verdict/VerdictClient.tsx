"use client";

import React, { useState, useEffect } from "react";
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
  "Default": "#cc785c"
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
        setClosingMessage(data.closing_message);
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
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between font-sans pb-32">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-12 md:py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
            {t("title")}
          </span>
        </div>

        <div className="text-[#3d3d3a] text-[16px] leading-[1.55] whitespace-pre-wrap font-sans">
          {summaryText}
        </div>

        <section className="flex flex-col gap-8 border-t border-[#e6dfd8] pt-8">
          <h2 className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
            {t("matrix")}
          </h2>

          <div className="flex flex-col gap-8">
            {proConMatrix.map((optionData, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-[#141413] font-sans">
                  {optionData.option}
                </h3>

                <div className="w-full h-1 bg-[#e6dfd8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5db8a6] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, optionData.weight * 100))}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                  <div className="flex flex-col gap-2.5">
                    {optionData.pros.map((pro, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-2 text-sm text-[#3d3d3a] font-sans">
                        <span className="w-2 h-2 rounded-full bg-[#5db872] shrink-0 mt-1.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {optionData.cons.map((con, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 text-sm text-[#3d3d3a] font-sans">
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
            <label className="text-xs font-bold tracking-widest text-[#71717a] uppercase">
              {t("favouritePersonaLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[...initialUniquePersonas, t("undecided")].map(name => (
                <button
                  key={name}
                  onClick={() => handleSelectPersona(name)}
                  disabled={isCommitted}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 ${
                    favouritePersona === name 
                      ? "bg-[#cc785c] text-white" 
                      : "bg-[#efe9de] border border-[#e6dfd8] text-[#141413] hover:bg-[#e8e0d2]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {(fetchingClosing || closingMessage) && favouritePersona !== t("undecided") && (
              <div 
                className="bg-[#efe9de] p-6 rounded-xl border-l-[3px] animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ borderLeftColor: getPersonaColor(favouritePersona) }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: getPersonaColor(favouritePersona) }}
                  >
                    {favouritePersona.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#141413] font-bold text-sm leading-none">{favouritePersona}</span>
                    <span className="text-[#6c6a64] text-[10px] font-bold uppercase tracking-widest mt-1">{t("closingMessage")}</span>
                  </div>
                </div>
                
                {fetchingClosing ? (
                  <div className="flex items-center gap-2 text-[#6c6a64] text-sm italic">
                    <Loader2 className="animate-spin h-3 w-3" />
                    <span>{t("typing")}</span>
                  </div>
                ) : (
                  <p className="text-[#3d3d3a] text-[15px] leading-relaxed italic">
                    "{closingMessage}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {recommendation && (
          <section className="bg-[#efe9de] rounded-lg p-8 border border-[#e6dfd8] flex flex-col gap-4">
            <span className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
              {t("recommendation")}
            </span>
            <p className="text-[22px] font-normal leading-tight tracking-normal text-[#141413] font-serif">
              {recommendation}
            </p>
          </section>
        )}

        {nextSteps.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
              {t("nextSteps")}
            </h2>

            <div className="flex flex-col gap-6">
              {nextSteps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-4">
                  <span className="text-[28px] font-normal leading-none tracking-tight text-[#cc785c] font-serif shrink-0">
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[#3d3d3a] text-[16px] leading-[1.55] pt-1 font-sans">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {verdict && (
          <div className="border-t border-[#e6dfd8] pt-8 flex flex-col gap-4">
            <CommitButton onCommit={handleCommit} isCommitted={isCommitted} />
          </div>
        )}
      </main>

      {/* QUICK START + ACTION ROW */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#faf9f5] border-t border-[#e6dfd8] px-6 py-4 z-50">
        <div className="max-w-[720px] mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-[1px] bg-[#e6dfd8] w-full mb-2" />
            <textarea
              aria-label={t("dilemmaPlaceholder")}
              value={newDilema}
              onChange={(e) => setNewDilema(e.target.value)}
              className="w-full bg-white border border-[#e6dfd8] rounded-lg p-4 text-sm text-[#141413] focus:outline-none focus:border-[#cc785c] transition-all resize-none"
              rows={2}
            />
            <button
              onClick={handleNewDilemma}
              disabled={!newDilema.trim()}
              className="w-full bg-[#cc785c] hover:bg-[#a9583e] text-white font-bold text-sm py-3 rounded-lg transition-all disabled:opacity-50"
            >
              {t("startGibah")}
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleNewDilemma} className="flex-1 bg-[#cc785c] hover:bg-[#a9583e] text-white font-bold text-sm py-3 rounded-lg transition-all">
              {t("newDilemma")}
            </button>
            <button onClick={handleCopy} className="flex-1 bg-[#e6dfd8] text-[#141413] font-medium text-sm py-3 rounded-lg hover:bg-[#dcd6ce]">
              {t("copyResult")}
            </button>
            <button onClick={handleShare} className="flex-1 bg-[#e6dfd8] text-[#141413] font-medium text-sm py-3 rounded-lg hover:bg-[#dcd6ce]">
              {t("shareResults")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
