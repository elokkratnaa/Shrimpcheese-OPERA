"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import { Loader2, CheckCircle2, Share2, Copy, Check } from "lucide-react";
import { getFriendlyName } from "@/shared/personas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils";

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
  "Luna": "#f59e0b",
  "Sage": "#0d9488",
  "Baz": "#8b5cf6",
  "Default": "var(--color-primary)"
};

export default function VerdictClient({ initialVerdict, initialUniquePersonas }: { initialVerdict: VerdictData, initialUniquePersonas: string[] }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  // BULLETPROOF LOCALE DETECTION: 
  // We read directly from the URL route (e.g. /id/session/...) instead of next-intl context.
  // This completely fixes the bug where switching language via the navbar didn't update the UI.
  const locale = (params?.locale as string) || "en";
  const isId = locale.startsWith("id");

  const [verdict, setVerdict] = useState<VerdictData>(initialVerdict);
  const [summaryText, setSummaryText] = useState(initialVerdict.verdict_summary || "");
  const [isCommitted, setIsCommitted] = useState(initialVerdict.is_committed);
  const [favouritePersona, setFavouritePersona] = useState<string>(initialVerdict.favourite_persona || "");
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const [fetchingClosing, setFetchingClosing] = useState(false);
  const [newDilema, setNewDilema] = useState("");

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const undecidedLabel = isId ? "Belum Yakin" : "Undecided";

  // Heavy-duty regex replacement to catch all possible AI variations of the persona names in the text
  const replacePersonaNames = (text: string | undefined | null) => {
    if (!text) return "";
    return text
      .replace(/The Pragmatic Stoic/gi, "Luna")
      .replace(/Pragmatic Stoic/gi, "Luna")
      .replace(/The Venture Capitalist/gi, "Sage")
      .replace(/Venture Capitalist/gi, "Sage")
      .replace(/The Creative Hedonist/gi, "Baz")
      .replace(/Creative Hedonist/gi, "Baz");
  };

  const getPersonaColor = (name: string) => {
    return PERSONA_COLORS[name] || PERSONA_COLORS.Default;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(replacePersonaNames(summaryText));
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: isId ? "Hasil OPERA" : "OPERA Verdict",
          text: replacePersonaNames(summaryText),
        });
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  };

  const handleNewDilemma = async () => {
    localStorage.setItem("opera_draft", newDilema);
    router.push(`/${locale}/dump`);
  };

  const handleSelectPersona = async (name: string) => {
    if (isCommitted || favouritePersona === name) return;
    setFavouritePersona(name);
    setClosingMessage(null);
    
    if (name === undecidedLabel) {
      try {
        await fetch(`/api/verdicts/${verdict.verdict_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favourite_persona: "Undecided" }),
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
        throw new Error(isId ? "Gagal menyimpan keputusan." : "Failed to commit decision.");
      }

      setIsCommitted(true);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const proConMatrix = verdict?.pro_con_matrix || [];
  const recommendation = replacePersonaNames(verdict?.recommendation);
  const nextSteps = verdict?.next_steps || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans theme-new-primary relative overflow-x-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 pt-32 pb-48 flex flex-col gap-16 relative z-10">
        
        {/* SUMMARY SECTION - Ultra Minimalist Text */}
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-700">
          <div className="flex justify-center">
            <span className="text-indigo-400 font-bold tracking-[0.2em] uppercase text-[10px]">
              {isId ? "Kesimpulan Akhir" : "Final Verdict"}
            </span>
          </div>
          <p className="text-xl md:text-[22px] font-light font-serif text-slate-800 leading-[1.85]">
            {replacePersonaNames(summaryText)}
          </p>
        </div>

        {/* MATRIX SECTION */}
        {proConMatrix.length > 0 && (
          <section className="flex flex-col gap-8 mt-8">
            <h2 className="text-center text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              {isId ? "Matriks Keputusan" : "Decision Matrix"}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {proConMatrix.map((optionData, idx) => (
                <div key={idx} className="bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl p-8 flex flex-col gap-8 shadow-sm hover:shadow-lg transition-all duration-500 group">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-serif font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {getFriendlyName(replacePersonaNames(optionData.option))}
                    </h3>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-400 transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(100, Math.max(0, optionData.weight * 100))}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">{isId ? "Pro" : "Pros"}</span>
                      {optionData.pros.map((pro, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-emerald-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed">{replacePersonaNames(pro)}</p>
                          </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-200/50">
                      <span className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">{isId ? "Kontra" : "Cons"}</span>
                      {optionData.cons.map((con, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-rose-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed">{replacePersonaNames(con)}</p>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDATION SECTION */}
        {recommendation && (
          <section className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-indigo-100/50 rounded-[2.5rem] p-10 md:p-14 flex flex-col items-center text-center gap-6 mt-6 relative overflow-hidden">
            <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-500 uppercase relative z-10">
              {isId ? "Rekomendasi Utama" : "Core Recommendation"}
            </span>
            <p className="text-xl md:text-2xl font-light font-serif text-slate-800 leading-[1.8] relative z-10 max-w-2xl">
              {recommendation}
            </p>
          </section>
        )}

        {/* NEXT STEPS SECTION */}
        {nextSteps.length > 0 && (
          <section className="flex flex-col gap-8 mt-8">
            <h2 className="text-center text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              {isId ? "Langkah Selanjutnya" : "Next Steps"}
            </h2>
            <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
               {nextSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-5 items-start group">
                     <span className="text-indigo-300 font-serif italic text-2xl group-hover:text-indigo-500 transition-colors mt-0.5 shrink-0">
                       {idx + 1}.
                     </span>
                     <p className="text-slate-700 text-base leading-[1.7]">
                       {replacePersonaNames(step)}
                     </p>
                  </div>
               ))}
            </div>
          </section>
        )}

        {/* PERSONA FEEDBACK SECTION */}
        <section className="flex flex-col items-center gap-6 mt-16 pt-16 border-t border-slate-200/50">
          <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center">
            {isId ? "Pilih Pendapat Favoritmu:" : "Choose Your Favorite Persona:"}
          </label>
          <div className="flex flex-wrap gap-3 justify-center">
            {[...initialUniquePersonas, undecidedLabel].map(backendName => {
              const friendlyName = backendName === undecidedLabel ? backendName : getFriendlyName(backendName);
              return (
                <button
                  key={backendName}
                  onClick={() => handleSelectPersona(backendName)}
                  disabled={isCommitted}
                  className={`rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
                    favouritePersona === backendName 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                      : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  {friendlyName}
                </button>
              )
            })}
          </div>

          {(fetchingClosing || closingMessage) && favouritePersona !== undecidedLabel && (
            <div 
              className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: getPersonaColor(favouritePersona) }} />
              
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-serif italic shadow-md"
                  style={{ backgroundColor: getPersonaColor(favouritePersona) }}
                >
                  {getFriendlyName(favouritePersona).charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold text-sm tracking-wide">{getFriendlyName(favouritePersona)}</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {isId ? "Pesan Penutup" : "Closing Message"}
                  </span>
                </div>
              </div>
              
              {fetchingClosing ? (
                <div className="flex items-center gap-3 text-slate-500 text-sm italic py-2">
                  <Loader2 className="animate-spin h-4 w-4 text-indigo-500" />
                  <span>{isId ? "Mengetik..." : "Typing..."}</span>
                </div>
              ) : (
                <p className="text-slate-700 text-[16px] leading-[1.8] italic font-serif">
                  "{replacePersonaNames(closingMessage)}"
                </p>
              )}
            </div>
          )}
        </section>

        {/* COMMIT BUTTON */}
        {verdict && (
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={handleCommit}
              disabled={isCommitted}
              className={`flex items-center justify-center gap-3 w-full md:w-auto md:min-w-[300px] px-8 py-4 rounded-full text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 ease-out shadow-lg ${
                isCommitted 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-95 cursor-default" 
                  : "bg-slate-900 text-white shadow-slate-900/20 hover:shadow-slate-900/40 hover:scale-[1.03] active:scale-[0.98]"
              }`}
            >
              {isCommitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isId ? "Keputusan Diambil" : "Decision Committed"}</span>
                </>
              ) : (
                <span>{isId ? "Ambil Keputusan Ini" : "Commit to this decision"}</span>
              )}
            </button>
          </div>
        )}
      </main>

      {/* ACTION ROW (Fixed Bottom Minimalist Panel) */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 px-4 py-4 md:py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-[800px] mx-auto flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newDilema}
                onChange={(e) => setNewDilema(e.target.value)}
                placeholder={isId ? "Ada pikiran baru? Ketik di sini..." : "Any new thoughts? Type here..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-full px-6 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <button
              onClick={handleNewDilemma}
              disabled={!newDilema.trim()}
              className="md:w-auto w-full px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-[11px] tracking-widest uppercase rounded-full transition-all duration-300 ease-out shadow-md hover:shadow-lg disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isId ? "Mulai Diskusi Baru" : "Start New Discussion"}
            </button>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button onClick={handleNewDilemma} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs uppercase tracking-widest py-3 rounded-full transition-all duration-300 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
              {t("newDilemma")}
            </button>
            <button onClick={handleCopy} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs uppercase tracking-widest py-3 rounded-full transition-all duration-300 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] flex items-center justify-center gap-2">
              {hasCopied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
              {hasCopied ? t("copied") : t("copyResult")}
            </button>
            <button onClick={() => setIsShareOpen(true)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] md:text-xs uppercase tracking-widest py-3 rounded-full transition-all duration-300 ease-out hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
              {t("shareResults")}
            </button>
          </div>
        </div>
      </div>

      {/* Share Verdict Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="sm:max-w-[460px] border-none bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
          <DialogHeader className="gap-3">
            <DialogTitle className="text-2xl font-serif font-light text-slate-900">
              {t("shareResults")}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
              {t("shareDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 mt-6">
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 max-h-[160px] overflow-y-auto">
              <p className="text-sm text-slate-600 leading-relaxed italic font-serif">
                "{replacePersonaNames(summaryText)}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCopy}
                className={cn(
                  "flex-1 rounded-full py-6 font-bold uppercase tracking-widest text-[10px] transition-all shadow-md flex items-center justify-center gap-2",
                  hasCopied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-900 hover:bg-[#6366F1] text-white"
                )}
              >
                {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {hasCopied ? t("copied") : t("copyToClipboard")}
              </Button>
              
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="flex-1 rounded-full py-6 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {t("shareViaSystem")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}