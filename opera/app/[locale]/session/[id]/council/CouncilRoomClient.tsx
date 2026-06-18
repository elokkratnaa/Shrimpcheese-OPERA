"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import { Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { PERSONA_MAP, getFriendlyName } from "@/shared/personas";

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

export default function CouncilRoomClient({
  initialSession,
}: {
  initialSession: SessionData;
}) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Council");
  const locale = useLocale();
  const isId = locale.startsWith("id");
  const YOU_NAME = t("you") || (isId ? "Kamu" : "You");

  const [session, setSession] = useState<SessionData>(initialSession);
  const [debates, setDebates] = useState<DebateUtterance[]>([]);
  const [displayedDebates, setDisplayedDebates] = useState<DebateUtterance[]>(
    [],
  );
  const [messageQueue, setMessageQueue] = useState<DebateUtterance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVerdictReady, setIsVerdictReady] = useState(false);
  const [roundCompleteEvent, setRoundCompleteEvent] = useState<{
    round: number;
    total: number;
    isRoundDone: boolean;
  } | null>(() => {
      if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(`round_${id}`);
          return cached ? JSON.parse(cached) : null;
      }
      return null;
  });

  // Persist only round progress metadata
  useEffect(() => {
    sessionStorage.setItem(`round_${id}`, JSON.stringify(roundCompleteEvent));
  }, [roundCompleteEvent, id]);

  const squadLabel = isId ? "Semua (Squad)" : "All (Squad)";
  const [rebuttalTarget, setRebuttalTarget] = useState(squadLabel);
  const [rebuttalContent, setRebuttalContent] = useState("");
  const [isSubmittingRebuttal, setIsSubmittingRebuttal] = useState(false);
  const [showThinkingTooltip, setShowThinkingTooltip] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const streamAbortController = useRef<AbortController | null>(null);

  async function consumeSSE(
    response: Response,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEvent: (data: any) => void,
  ) {
    console.log(`[CouncilRoomClient] consumeSSE started, body:`, !!response.body);
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    console.log(`[CouncilRoomClient] SSE reader initialized`);
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`[CouncilRoomClient] SSE reader done`);
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim().startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        console.log(`[CouncilRoomClient] SSE payload received:`, payload);
        if (payload === "[DONE]") return;
        try {
          onEvent(JSON.parse(payload));
        } catch (e) {
            console.error(`[CouncilRoomClient] SSE Parse Error:`, e);
        }
      }
    }
  }

  // Extract unique friendly names to avoid duplicates in the UI
  const uniqueFriendlyPersonas = useMemo(() => {
    const rawPersonas: string[] = [];
    debates.forEach((d) => rawPersonas.push(d.persona_name));
    (session?.detected_biases?.suggested_persona_archetypes || []).forEach(
      (key) => {
        rawPersonas.push((PERSONA_MAP as any)[key]?.name || key);
      },
    );

    // Convert to friendly names immediately and put in a Set to eliminate duplicates like "The Pragmatic Stoic" vs "pragmatic-stoic"
    const friendlySet = new Set(
      rawPersonas.map((name) => getFriendlyName(name)),
    );
    return Array.from(friendlySet);
  }, [debates, session]);

  const AVATAR_COLORS = [
    "text-orange-600 bg-orange-100 border-orange-200",
    "text-teal-600 bg-teal-100 border-teal-200",
    "text-indigo-600 bg-indigo-100 border-indigo-200",
    "text-rose-600 bg-rose-100 border-rose-200",
    "text-emerald-600 bg-emerald-100 border-emerald-200",
  ];

  const getAvatarStyle = (friendlyName: string) => {
    const index = uniqueFriendlyPersonas.indexOf(friendlyName);
    return AVATAR_COLORS[Math.max(0, index % AVATAR_COLORS.length)];
  };

  // Effect to process queue for FAST staggered display
  useEffect(() => {
    if (messageQueue.length > 0) {
      const currentMsg = { ...messageQueue[0] };

      if (currentMsg.displayedContent === undefined) {
        currentMsg.displayedContent = "";
      }

      if (
        currentMsg.displayedContent.length < currentMsg.message_content.length
      ) {
        const timer = setTimeout(() => {
          setMessageQueue((prev) => {
            const [first, ...rest] = prev;
            return [
              {
                ...first,
                displayedContent: first.message_content.substring(
                  0,
                  (first.displayedContent?.length || 0) + 2,
                ),
              },
              ...rest,
            ];
          });
        }, 60);
        return () => clearTimeout(timer);
      } else {
        setDisplayedDebates((prev) => [
          ...prev,
          { ...currentMsg, message_content: currentMsg.message_content || "" },
        ]);
        setMessageQueue((prev) => prev.slice(1));
      }
    }
  }, [messageQueue]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const debatesRes = await fetch(`/api/sessions/${id}/council`, {
          cache: "no-store",
        });
        if (debatesRes.ok) {
          const debatesData = await debatesRes.json();
          setDebates(debatesData);
          setDisplayedDebates(debatesData);
          setMessageQueue([]);

          if (debatesData.length > 0) {
            // Infer round progress
            const maxRound = Math.max(...debatesData.map((d: DebateUtterance) => d.round_number || 1));
            const maxTurnSequence = Math.max(...debatesData.map((d: DebateUtterance) => d.turn_sequence));
            const lastTurn = Math.floor((maxTurnSequence % 100) / 10);

            setRoundCompleteEvent({ 
              round: maxRound, 
              total: session.rounds || 1, 
              isRoundDone: lastTurn === 3 
            });
          }
        }

        // Check if verdict already exists
        const sessionRes = await fetch(`/api/sessions/${id}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.current_status === "completed") {
            const verdictRes = await fetch(`/api/verdicts/${id}`);
            if (verdictRes.ok) {
              setIsVerdictReady(true);
            }
          }
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
    if (
      !id ||
      !session ||
      (session.current_status === "completed" && isVerdictReady) ||
      streamAbortController.current
    )
      return;

    const controller = new AbortController();
    streamAbortController.current = controller;

    // Flag to prevent double-firing
    let isMounted = true;

    async function startStream() {
      // Don't mark as streaming until we actually open the connection
      console.log(`[CouncilRoomClient] Starting stream for session: ${id}`);
      try {
        const response = await fetch(`/api/sessions/${id}/stream`, {
          signal: controller.signal,
        });
        
        if (!isMounted) return; // Cleanup check
        
        setIsStreaming(true); // Now we are actively receiving
        console.log(`[CouncilRoomClient] Stream response status: ${response.status}`);
        if (!response.body) {
            console.error(`[CouncilRoomClient] No response body`);
            return;
        }

        await consumeSSE(response, (event) => {
          if (!isMounted || controller.signal.aborted) return;
          // ... (sse handling logic remains same)

          if (event.type === "turn") {
            const newUtterance = {
              debate_id: `live-${Date.now()}-${Math.random()}`,
              persona_name: event.persona_name,
              message_content: event.message_content,
              turn_sequence: event.turn_sequence,
              round_number: event.round_number,
            };

            console.log(`[CouncilRoomClient] Adding to queue:`, newUtterance);
            setDebates((prev) => [...prev, newUtterance]);
            setMessageQueue((prev) => [...prev, newUtterance]);
          }
 else if (event.type === "typing") {
            // Typing indicator handled visually when queue is processing
          } else if (event.type === "round_complete") {
            setIsStreaming(false);
            setRoundCompleteEvent((prev) => {
              // We want to know if the round IS done.
              return { round: event.round, total: event.total, isRoundDone: true };
            });
          } else if (event.type === "debate_complete") {
            setSession((prev) =>
              prev ? { ...prev, current_status: "completed" } : prev,
            );
          } else if (event.verdict) {
            setIsVerdictReady(true);
            setIsStreaming(false);
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
      isMounted = false; // Mark unmounted
      if (streamAbortController.current) {
        streamAbortController.current.abort();
        streamAbortController.current = null;
      }
    };
  }, [id, session?.current_status, isVerdictReady]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedDebates, messageQueue, isStreaming, roundCompleteEvent]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isStreaming) {
      timer = setTimeout(() => setShowThinkingTooltip(true), 30000);
    } else {
      setShowThinkingTooltip(false);
    }
    return () => clearTimeout(timer);
  }, [isStreaming]);

  const handleSendRebuttal = async (skip = false) => {
    setIsSubmittingRebuttal(true);
    try {
      const roundNumber = roundCompleteEvent?.round || 1;
      if (!skip) {
        const res = await fetch(`/api/sessions/${id}/rebuttal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: rebuttalContent,
            target: rebuttalTarget,
            round_number: roundNumber,
          }),
        });
        if (!res.ok) throw new Error("Failed to send rebuttal");

        const userUtterance = {
          debate_id: `user-${Date.now()}`,
          persona_name: YOU_NAME,
          message_content: rebuttalContent,
          turn_sequence: roundNumber * 100 + 99,
          round_number: roundNumber,
        };
        setDebates((prev) => [...prev, userUtterance]);
        setDisplayedDebates((prev) => [...prev, userUtterance]);
      } else {
        await fetch(`/api/sessions/${id}/rebuttal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: isId
              ? "(Lanjut tanpa membalas)"
              : "(Continue without replying)",
            target: "Semua (Squad)",
            round_number: roundNumber,
          }),
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
        <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );
  }

  const totalRounds = session?.rounds || 1;
  const isComplete = session?.current_status === "completed";

  const categoryLabel = session?.category || "Analisis";
  const currentRound = roundCompleteEvent ? roundCompleteEvent.round : 1;
  const displayRound = Math.min(Math.max(currentRound, 1), totalRounds);
  const completedTurns = debates.filter(
    (d) => !d.debate_id.startsWith("streaming-"),
  ).length;
  const totalExpectedTurns =
    (uniqueFriendlyPersonas.length || 3) * 3 * totalRounds;
  const progressPercent = Math.min(
    (completedTurns / totalExpectedTurns) * 100,
    100,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans theme-new-primary relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" showHomeButton={false} />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 pt-24 flex flex-col gap-8 max-w-2xl mx-auto w-full pb-48 relative z-10 scroll-smooth"
      >
        {/* INITIAL WAITING STATE (Before AI says anything) */}
        {displayedDebates.length === 0 &&
          messageQueue.length === 0 &&
          isStreaming && (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-white/60 border border-white flex items-center justify-center shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-500">
                {isId
                  ? "Menunggu respon pertama..."
                  : "Waiting for first response..."}
              </p>
            </div>
          )}

        {displayedDebates.map((utterance, idx) => {
          const isUser =
            utterance.persona_name === YOU_NAME ||
            utterance.persona_name === "Kamu" ||
            utterance.persona_name === "You";
          const showRoundDivider =
            idx === 0 ||
            (utterance.round_number &&
              utterance.round_number !==
                displayedDebates[idx - 1].round_number);

          return (
            <React.Fragment key={utterance.debate_id}>
              {showRoundDivider && utterance.round_number && (
                <div className="flex justify-center my-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] bg-white/40 px-4 py-1.5 rounded-full border border-white">
                    — {isId ? "Ronde" : "Round"} {utterance.round_number} —
                  </span>
                </div>
              )}

              {isUser ? (
                <div className="flex gap-4 flex-row-reverse w-full group animate-in slide-in-from-right-4 duration-500">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center text-white font-serif text-sm shadow-md shrink-0 border-2 border-white/80">
                    {YOU_NAME.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {YOU_NAME}
                    </span>
                    <div className="bg-slate-900 text-white rounded-[2rem] rounded-tr-sm p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-light">
                        {utterance.message_content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 w-full animate-in slide-in-from-left-4 duration-500">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm border-2 shadow-sm shrink-0 ${getAvatarStyle(getFriendlyName(utterance.persona_name))}`}
                  >
                    {getFriendlyName(utterance.persona_name).charAt(0)}
                  </div>
                  <div className="flex flex-col items-start gap-1.5 max-w-[85%]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">
                      {getFriendlyName(utterance.persona_name)}
                    </span>
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 text-slate-800 rounded-[2rem] rounded-tl-sm p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                      <p className="text-[15px] md:text-base leading-relaxed whitespace-pre-wrap">
                        {utterance.message_content}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* TYPING INDICATOR (Before text flows) */}
        {messageQueue.length > 0 &&
          messageQueue[0].displayedContent === undefined && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm border-2 shadow-sm shrink-0 ${getAvatarStyle(getFriendlyName(messageQueue[0].persona_name))}`}
              >
                {getFriendlyName(messageQueue[0].persona_name).charAt(0)}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2">
                  {getFriendlyName(messageQueue[0].persona_name)}
                </span>
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] rounded-tl-sm px-5 py-4 flex gap-1.5 w-fit shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            </div>
          )}

        {/* STREAMING BUBBLE (Typewriter Effect) */}
        {messageQueue.length > 0 &&
          messageQueue[0].displayedContent !== undefined && (
            <div className="flex gap-4 w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm border-2 shadow-sm shrink-0 ${getAvatarStyle(getFriendlyName(messageQueue[0].persona_name))}`}
              >
                {getFriendlyName(messageQueue[0].persona_name).charAt(0)}
              </div>
              <div className="flex flex-col items-start gap-1.5 max-w-[85%] w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-2">
                  {getFriendlyName(messageQueue[0].persona_name)}
                </span>
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 text-slate-800 rounded-[2rem] rounded-tl-sm p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-w-[60px]">
                  <p className="text-[15px] md:text-base leading-relaxed whitespace-pre-wrap inline">
                    {messageQueue[0].displayedContent}
                  </p>
                  <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle rounded-full" />
                </div>
              </div>
            </div>
          )}

        {showThinkingTooltip && isStreaming && (
          <div className="text-center text-xs text-slate-500 italic animate-pulse">
            {isId
              ? "Persona sedang merenungkan balasan mendalam..."
              : "Persona is formulating a deep response..."}
          </div>
        )}

        {/* REBUTTAL FORM */}
        {roundCompleteEvent &&
          !isComplete &&
          roundCompleteEvent.isRoundDone &&
          !isStreaming &&
          messageQueue.length === 0 && (
            <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300 shadow-[0_20px_80px_rgba(0,0,0,0.05)] mt-4">

              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {isId ? "Tujukan Balasan Kepada:" : "Direct response to:"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[squadLabel, ...uniqueFriendlyPersonas]
                    .filter(
                      (p) => p !== "Kamu" && p !== YOU_NAME && p !== "You",
                    )
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setRebuttalTarget(p)}
                        className={`rounded-full px-5 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
                          rebuttalTarget === p
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 border border-slate-900 scale-105"
                            : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm hover:scale-105"
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
                placeholder={
                  isId
                    ? "Ketik tanggapanmu di sini..."
                    : "Type your response here..."
                }
                className="w-full min-h-[120px] bg-white border border-slate-200 rounded-2xl p-5 text-slate-800 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner"
              />
              <div className="flex flex-col md:flex-row gap-3 justify-end mt-2">
                <button
                  onClick={() => handleSendRebuttal()}
                  disabled={!rebuttalContent.trim() || isSubmittingRebuttal}
                  className="w-full md:w-auto px-10 h-12 bg-slate-900 text-white font-bold text-xs tracking-widest uppercase rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_5px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center"
                >
                  {isSubmittingRebuttal ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : isId ? (
                    "Kirim Balasan"
                  ) : (
                    "Send Response"
                  )}
                </button>
              </div>
            </div>
          )}

        {isComplete && messageQueue.length === 0 && (
          <div className="flex justify-center mt-12 mb-12">
            {isVerdictReady ? (
              <button
                onClick={() => router.push(`/session/${id}/verdict`)}
                className="px-12 h-14 bg-emerald-500 text-white font-bold text-xs tracking-[0.2em] uppercase rounded-full hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-3"
              >
                {isId ? "Lihat Kesimpulan" : "See Verdict"}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 text-emerald-600 font-bold text-xs tracking-[0.2em] uppercase animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isId ? "Menyusun Kesimpulan..." : "Synthesizing Verdict..."}
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {isId ? "Hampir Selesai" : "Almost there"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-40 bg-white/60 backdrop-blur-3xl border-t border-slate-200/50 px-4 py-4 md:py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {categoryLabel}
            </span>
            <div className="bg-white border border-slate-200 shadow-sm rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700">
              {isId ? "Ronde" : "Round"} {displayRound}/{totalRounds}
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-indigo-500 transition-[width] duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
