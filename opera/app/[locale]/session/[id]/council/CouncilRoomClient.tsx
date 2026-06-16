"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERSONAS, PERSONA_MAP } from "@/shared/personas";

interface DebateUtterance {
  debate_id: string;
  persona_name: string;
  message_content: string;
  turn_sequence: number;
  round_number?: number;
}

interface SessionData {
  session_id: string;
  current_status: string;
  category?: string;
  rounds?: number;
  detected_biases: {
    core_decision_node?: string;
    suggested_persona_archetypes?: string[];
  } | null;
}

const PERSONA_COLORS = ["#f59e0b", "#0d9488", "#8b5cf6", "#cc785c"];

export default function CouncilRoomClient({ initialSession }: { initialSession: SessionData }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Council");

  const [session, setSession] = useState<SessionData>(initialSession);
  const [debates, setDebates] = useState<DebateUtterance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [roundCompleteEvent, setRoundCompleteEvent] = useState<{ round: number; total: number } | null>(null);
  const [rebuttalTarget, setRebuttalTarget] = useState("Semua (Squad)");
  const [rebuttalContent, setRebuttalContent] = useState("");
  const [isSubmittingRebuttal, setIsSubmittingRebuttal] = useState(false);
  const [showThinkingTooltip, setShowThinkingTooltip] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamAbortController = useRef<AbortController | null>(null);

  const uniquePersonas = useMemo(() => {
    const fromDebates = Array.from(new Set(debates.map((d) => d.persona_name)));
    const fromBiases = (session?.detected_biases?.suggested_persona_archetypes || [])
      .map(key => (PERSONA_MAP as any)[key]?.name || key);
    return Array.from(new Set([...fromDebates, ...fromBiases]));
  }, [debates, session]);

  const getPersonaColor = (name: string) => {
    const index = uniquePersonas.indexOf(name);
    return PERSONA_COLORS[index % PERSONA_COLORS.length] || PERSONA_COLORS[0];
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const debatesRes = await fetch(`/api/sessions/${id}/council`, { cache: "no-store" });
        if (debatesRes.ok) {
          const debatesData = await debatesRes.json();
          setDebates(debatesData);
        }
      } catch (err) {
        console.error("Failed to load council data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (!id || !session || session.current_status === "completed" || streamAbortController.current) return;

    const controller = new AbortController();
    streamAbortController.current = controller;

    async function startStream() {
      setIsStreaming(true);
      try {
        const response = await fetch(`/api/sessions/${id}/stream`, {
          signal: controller.signal,
        });
        if (!response.body) {
           console.error("[UI] Stream response has no body");
           return;
        }

        await consumeSSE(response, (event) => {
          if (controller.signal.aborted) return;
          console.log("[UI] Received SSE event:", event);

          if (event.type === "turn") {
            setDebates(prev => {
              if (prev.some(d => d.turn_sequence === event.turn_sequence && d.persona_name === event.persona_name)) {
                return prev;
              }
              return [
                ...prev,
                {
                  debate_id: `live-${Date.now()}-${Math.random()}`,
                  persona_name: event.persona_name,
                  message_content: event.message_content,
                  turn_sequence: event.turn_sequence,
                  round_number: event.round_number
                }
              ];
            });
          } else if (event.type === "typing") {
            console.log(`[UI] ${event.persona_name} is typing...`);
          } else if (event.type === "round_complete") {
            console.log("[UI] DEBUG: Received round_complete event for round", event.round, "from total", event.total);
            // Verify if we actually have enough turns for this round before showing the rebuttal box
            const turnCount = debates.filter(d => d.round_number === event.round).length;
            if (turnCount < uniquePersonas.length) {
                console.log("[UI] Ignoring round_complete; turn count too low", turnCount);
                return;
            }
            setIsStreaming(false); // Force stop typing indicator
            setRoundCompleteEvent(prev => {
              if (prev && prev.round >= event.round) return prev;
              return { round: event.round, total: event.total };
            });
          } else if (event.type === "debate_complete") {
            console.log("[UI] Debate complete received");
            setSession(prev => prev ? { ...prev, current_status: "completed" } : prev);
          }
        });
      } catch (err) {
        if (!controller.signal.aborted) console.error("SSE Error:", err);
      } finally {
        if (!controller.signal.aborted) setIsStreaming(false);
      }
    }

    startStream();

    return () => {
      // Don't abort on every re-render, only on unmount
    };
  }, [id, session.current_status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debates, isStreaming, roundCompleteEvent]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isStreaming) {
       timer = setTimeout(() => setShowThinkingTooltip(true), 30000);
    } else {
       setShowThinkingTooltip(false);
    }
    return () => clearTimeout(timer);
  }, [isStreaming]);

  async function consumeSSE(response: Response, onEvent: (data: any) => void) {
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload);
          onEvent(parsed);
        } catch {}
      }
    }
  }

  const handleSendRebuttal = async (skip = false) => {
    setIsSubmittingRebuttal(true);
    try {
      if (!skip) {
        const res = await fetch(`/api/sessions/${id}/rebuttal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: rebuttalContent, 
            target: rebuttalTarget,
            round_number: roundCompleteEvent?.round 
          })
        });
        if (!res.ok) throw new Error("Failed to send rebuttal");
        
        setDebates(prev => [...prev, {
          debate_id: `user-${Date.now()}`,
          persona_name: "Kamu",
          message_content: rebuttalContent,
          turn_sequence: (roundCompleteEvent?.round || 0) * 100 + 99,
          round_number: roundCompleteEvent?.round
        }]);
      } else {
        const res = await fetch(`/api/sessions/${id}/rebuttal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "(Lanjut tanpa membalas)", 
            target: "Semua (Squad)",
            round_number: roundCompleteEvent?.round 
          })
        });
        if (!res.ok) throw new Error("Failed to skip");
      }

      setRoundCompleteEvent(null);
      setRebuttalContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRebuttal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  const squadName = session?.detected_biases?.core_decision_node || "Council Squad";
  const personaSubtitle = uniquePersonas.join(", ") + " & Kamu";

  const totalRounds = session?.rounds || 1;
  const completedTurns = debates.filter(d => !d.debate_id.startsWith('streaming-')).length;
  const isComplete = session?.current_status === "completed";
  const categoryLabel = session?.category || "Analisis";
  const currentRound = roundCompleteEvent ? roundCompleteEvent.round : Math.min(Math.ceil(completedTurns / (uniquePersonas.length * 3)) || 1, totalRounds);
  const displayRound = Math.min(Math.max(currentRound, 1), totalRounds);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[16px] border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <OperaNav variant="authed" showHomeButton={true} />
      </header>

      {/* CHAT AREA */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full pb-20"
      >
        {debates.map((utterance, idx) => {
          const color = utterance.persona_name === "Kamu" ? "#cc785c" : getPersonaColor(utterance.persona_name);
          const lines = utterance.message_content.split("\n").filter(l => l.trim().length > 0);
          const lastLine = lines.length > 1 ? lines[lines.length - 1] : null;
          const bodyLines = lastLine ? lines.slice(0, -1) : lines;

          const showRoundDivider = idx === 0 || (utterance.round_number && utterance.round_number !== debates[idx - 1].round_number);

          return (
            <React.Fragment key={utterance.debate_id}>
              {showRoundDivider && utterance.round_number && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-[1px] bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    — Ronde {utterance.round_number} —
                  </span>
                  <div className="flex-1 h-[1px] bg-slate-200" />
                </div>
              )}
              <div className={`flex gap-3 ${utterance.persona_name === "Kamu" ? "flex-row-reverse" : ""}`}>
                <div 
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {utterance.persona_name.charAt(0)}
                </div>
                <div className={`flex flex-col gap-1 max-w-[85%] ${utterance.persona_name === "Kamu" ? "items-end" : ""}`}>
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {utterance.persona_name}
                  </span>
                  <div className={`bg-white text-slate-900 rounded-2xl p-3 px-4 shadow-sm border border-slate-100 relative ${utterance.persona_name === "Kamu" ? "border-r-2 border-[#cc785c]" : ""}`}>
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {bodyLines.join("\n")}
                      {lastLine && utterance.persona_name !== "Kamu" && (
                        <blockquote className="mt-3 border-l-[3px] border-slate-300 bg-slate-50 italic text-sm p-2 rounded-r-sm">
                          {lastLine}
                        </blockquote>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {showThinkingTooltip && isStreaming && (
            <div className="text-center text-xs text-slate-500 italic animate-pulse">
                {t("longAnalysis")}
            </div>
        )}

        {roundCompleteEvent && !isComplete && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                {t("target")}
              </span>
              <div className="flex flex-wrap gap-2">
                {["Semua (Squad)", ...uniquePersonas].filter(p => p !== "Kamu").map(p => (
                  <button
                    key={p}
                    onClick={() => setRebuttalTarget(p)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      rebuttalTarget === p ? "bg-[#cc785c] text-white" : "bg-slate-100 border border-slate-200 text-slate-900"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                aria-label={t("rebuttalPlaceholder")}
                value={rebuttalContent}
                onChange={(e) => setRebuttalContent(e.target.value)}
                className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-[#cc785c] transition-all resize-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSendRebuttal()}
                disabled={!rebuttalContent.trim() || isSubmittingRebuttal}
                className="w-full h-11 bg-[#cc785c] text-white font-bold rounded-lg shadow-lg shadow-[#cc785c]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isSubmittingRebuttal ? <Loader2 className="animate-spin mx-auto h-5 w-5 text-white" /> : t("send")}
              </button>
              <button
                onClick={() => handleSendRebuttal(true)}
                disabled={isSubmittingRebuttal}
                className="w-full h-11 bg-slate-200 text-slate-900 font-medium rounded-lg hover:bg-slate-300 transition-all"
              >
                {t("skip", { round: roundCompleteEvent.round + 1 })}
              </button>
            </div>
          </div>
        )}

        {isStreaming && !roundCompleteEvent && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div 
               className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
               style={{ backgroundColor: getPersonaColor(uniquePersonas[debates.length % uniquePersonas.length] || "") }}
             >
               {(uniquePersonas[debates.length % uniquePersonas.length] || "C").charAt(0)}
             </div>
             <div className="flex flex-col gap-1">
                <p className="text-xs italic text-slate-500">lagi mikir</p>
                <div className="flex gap-1 mt-1 px-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                </div>
             </div>
          </div>
        )}
      </main>

      {/* OVERTHINKING BOTTOM BAR */}
      <footer className="sticky bottom-0 z-40 bg-[#F8FAFC] border-t border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#cc785c] uppercase tracking-wider">
                {categoryLabel}
              </span>
              <div className="bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-medium text-slate-900">
                Ronde {displayRound}/{totalRounds}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-20 left-0 right-0 p-4 flex justify-center gap-2 z-30">
        <button
          onClick={() => router.push(`/session/${id}/verdict?force=true`)}
          className="bg-white text-[#cc785c] text-[12px] font-bold px-6 py-2 rounded-full border-2 border-[#cc785c] shadow-md hover:bg-[#cc785c] hover:text-white transition-all"
        >
          Force Verdict Access
        </button>
        {roundCompleteEvent && !isComplete && (
          <button
            onClick={() => handleSendRebuttal(true)}
            className="bg-[#cc785c]/10 backdrop-blur text-[#cc785c] text-[10px] font-bold px-3 py-1 rounded-full border border-[#cc785c]/20 hover:bg-[#cc785c]/20"
          >
            Force Next Round
          </button>
        )}
      </div>

      {isComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8FAFC] to-transparent z-30">
          <div className="max-w-2xl mx-auto w-full">
            <button
              onClick={() => router.push(`/session/${id}/verdict`)}
              className="w-full h-12 bg-[#cc785c] text-white font-bold rounded-xl shadow-lg shadow-[#cc785c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t("seeVerdict")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
