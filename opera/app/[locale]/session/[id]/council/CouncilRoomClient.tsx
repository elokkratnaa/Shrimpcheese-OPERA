"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import PersonaBubble from "@/app/components/shared/PersonaBubble";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERSONAS, PERSONA_MAP } from "@/shared/personas";

interface DebateUtterance {
  debate_id: string;
  persona_name: string;
  message_content: string;
  displayedContent?: string;
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

const PERSONA_COLORS = ["#f59e0b", "#0d9488", "#8b5cf6", "var(--color-primary)"];

export default function CouncilRoomClient({ initialSession }: { initialSession: SessionData }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Council");

  const [session, setSession] = useState<SessionData>(initialSession);
  const [debates, setDebates] = useState<DebateUtterance[]>([]);
  const [displayedDebates, setDisplayedDebates] = useState<DebateUtterance[]>([]);
  const [messageQueue, setMessageQueue] = useState<DebateUtterance[]>([]);
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

  const getPersonaVariant = (name: string): "a" | "b" | "c" => {
    const idx = uniquePersonas.indexOf(name);
    return (["a", "b", "c"][idx % 3]) as "a" | "b" | "c";
  };

  // Effect to process queue for staggered display and typewriter effect
  useEffect(() => {
    if (messageQueue.length > 0) {
      const currentMsg = { ...messageQueue[0] };
      
      if (currentMsg.displayedContent === undefined) {
        currentMsg.displayedContent = "";
      }

      if (currentMsg.displayedContent.length < currentMsg.message_content.length) {
        const timer = setTimeout(() => {
          setMessageQueue(prev => {
            const [first, ...rest] = prev;
            return [{
                ...first,
                displayedContent: first.message_content.substring(0, (first.displayedContent?.length || 0) + 1)
            }, ...rest];
          });
        }, 30); 
        return () => clearTimeout(timer);
      } else {
        setDisplayedDebates(prev => [...prev, { ...currentMsg, message_content: currentMsg.message_content || "" }]);
        setMessageQueue(prev => prev.slice(1));
      }
    }
  }, [messageQueue]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const debatesRes = await fetch(`/api/sessions/${id}/council`, { cache: "no-store" });
        if (debatesRes.ok) {
          const debatesData = await debatesRes.json();
          setDebates(debatesData);
          setDisplayedDebates(debatesData);
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
        if (!response.body) return;

        await consumeSSE(response, (event) => {
          if (controller.signal.aborted) return;

          if (event.type === "turn") {
            const newUtterance = {
              debate_id: `live-${Date.now()}-${Math.random()}`,
              persona_name: event.persona_name,
              message_content: event.message_content,
              turn_sequence: event.turn_sequence,
              round_number: event.round_number
            };
            
            setDebates(prev => [...prev, newUtterance]);
            setMessageQueue(prev => [...prev, newUtterance]);
          } else if (event.type === "typing") {
            // Typing indicator
          } else if (event.type === "round_complete") {
            setIsStreaming(false);
            setRoundCompleteEvent(prev => {
              if (prev && prev.round >= event.round) return prev;
              return { round: event.round, total: event.total };
            });
          } else if (event.type === "debate_complete") {
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
  }, [id, session.current_status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedDebates, isStreaming, roundCompleteEvent]);

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
        if (!line.trim().startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          onEvent(JSON.parse(payload));
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
        
        const userUtterance = {
          debate_id: `user-${Date.now()}`,
          persona_name: "Kamu",
          message_content: rebuttalContent,
          turn_sequence: (roundCompleteEvent?.round || 0) * 100 + 99,
          round_number: roundCompleteEvent?.round
        };
        setDebates(prev => [...prev, userUtterance]);
        setDisplayedDebates(prev => [...prev, userUtterance]);
      } else {
        await fetch(`/api/sessions/${id}/rebuttal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            content: "(Lanjut tanpa membalas)", 
            target: "Semua (Squad)",
            round_number: roundCompleteEvent?.round 
          })
        });
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center theme-new-primary">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    );
  }

  const totalRounds = session?.rounds || 1;
  const isComplete = session?.current_status === "completed";
  const categoryLabel = session?.category || "Analisis";
  const currentRound = roundCompleteEvent ? roundCompleteEvent.round : 1;
  const displayRound = Math.min(Math.max(currentRound, 1), totalRounds);
  const completedTurns = debates.filter(d => !d.debate_id.startsWith('streaming-')).length;
  const totalExpectedTurns = (uniquePersonas.length || 3) * 3 * totalRounds;
  const progressPercent = Math.min((completedTurns / totalExpectedTurns) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans theme-new-primary">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[16px] border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <OperaNav variant="authed" showHomeButton={true} />
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full pb-20"
      >
        {displayedDebates.map((utterance, idx) => {
          const color = utterance.persona_name === "Kamu" ? "var(--color-primary)" : getPersonaColor(utterance.persona_name);
          const showRoundDivider = idx === 0 || (utterance.round_number && utterance.round_number !== displayedDebates[idx - 1].round_number);

          return (
            <React.Fragment key={utterance.debate_id}>
              {showRoundDivider && utterance.round_number && (
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-[1px] bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    — {t("round")} {utterance.round_number} —
                  </span>
                  <div className="flex-1 h-[1px] bg-slate-200" />
                </div>
              )}
              <div className={`flex gap-3 ${utterance.persona_name === t("you") ? "flex-row-reverse" : ""}`}>
                <div 
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {utterance.persona_name === t("you") ? t("you").charAt(0) : utterance.persona_name.charAt(0)}
                </div>
                <div className={`flex flex-col gap-1 max-w-[85%] ${utterance.persona_name === t("you") ? "items-end" : ""}`}>
                  <span className="text-[11px] font-medium" style={{ color }}>
                    {utterance.persona_name}
                  </span>
                  <div className={`bg-white text-slate-900 rounded-2xl p-3 px-4 shadow-sm border border-slate-100 relative ${utterance.persona_name === t("you") ? "border-r-2 border-primary" : ""}`}>
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {utterance.message_content}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {messageQueue.length > 0 && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div 
               className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
               style={{ backgroundColor: getPersonaColor(messageQueue[0].persona_name) }}
             >
               {messageQueue[0].persona_name.charAt(0)}
             </div>
             <div className="flex flex-col gap-1">
                <p className="text-xs italic text-slate-500">{t("typing")}</p>
                <div className="flex gap-1 mt-1 px-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                </div>
             </div>
          </div>
        )}

        {messageQueue.length > 0 && messageQueue[0].displayedContent !== undefined && (
             <PersonaBubble
                persona_name={messageQueue[0].persona_name}
                message_content={messageQueue[0].displayedContent}
                variant={getPersonaVariant(messageQueue[0].persona_name)}
                isStreaming={true}
              />
        )}

        {showThinkingTooltip && isStreaming && (
            <div className="text-center text-xs text-slate-500 italic animate-pulse">
                {t("longAnalysis")}
            </div>
        )}

        {roundCompleteEvent && !isComplete && messageQueue.length === 0 && !isStreaming && (
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
                      rebuttalTarget === p ? "bg-primary text-white" : "bg-slate-100 border border-slate-200 text-slate-900"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <textarea
                value={rebuttalContent}
                onChange={(e) => setRebuttalContent(e.target.value)}
                className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-primary transition-all resize-none"
            />
            <button
                onClick={() => handleSendRebuttal()}
                disabled={!rebuttalContent.trim() || isSubmittingRebuttal}
                className="w-full h-11 bg-primary text-white font-bold rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
                {t("send")}
            </button>
          </div>
        )}

        {isComplete && messageQueue.length === 0 && !isStreaming && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => router.push(`/session/${id}/verdict`)}
              className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:scale-[1.01] transition-all"
            >
              {t("seeVerdict")}
            </button>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-40 bg-[#F8FAFC] border-t border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{categoryLabel}</span>
              <div className="bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-medium text-slate-900">
                Ronde {displayRound}/{totalRounds}
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-[width] duration-400 ease" style={{ width: `${progressPercent}%` }} />
            </div>
        </div>
      </footer>
    </div>
  );
}
