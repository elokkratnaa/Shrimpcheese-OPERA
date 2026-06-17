"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import { createClient } from "@/client/services/supabase";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocale } from "next-intl";
import { extractMessageText } from "@/shared/extractMessageText";
import { PERSONAS } from "@/shared/personas";
import { motion } from "framer-motion";
import { sanitizeApiError } from "@/client/services/error";

// ============================================================================
// BUILT-IN LOCALIZATION DICTIONARY
// ============================================================================
const dict = {
  en: {
    title: "Council Members",
    notSaved: "This is a temporary session. Conversations here are not saved to your history.",
    consult: "Consult with",
    intro: "Share what's on your mind. I'm here to provide a different perspective.",
    switchTitle: "Switch Advisor?",
    switchDescription: "Switching advisors will clear your current conversation. Are you sure you want to continue?",
    cancel: "Cancel",
    clearAndSwitch: "Clear & Switch",
    placeholder: "Type your thoughts...",
    errors: {
      failed: "Failed to send message.",
      connectionLost: "Connection lost. Please try again."
    },
    thinking: "is thinking..."
  },
  id: {
    title: "Anggota Dewan",
    notSaved: "Ini adalah sesi sementara. Percakapan di sini tidak disimpan ke riwayatmu.",
    consult: "Berkonsultasi dengan",
    intro: "Ceritakan apa yang sedang kamu pikirkan. Aku di sini untuk memberikan sudut pandang yang berbeda.",
    switchTitle: "Ganti Penasihat?",
    switchDescription: "Mengganti penasihat akan menghapus percakapan saat ini. Apakah kamu yakin ingin melanjutkan?",
    cancel: "Batal",
    clearAndSwitch: "Hapus & Ganti",
    placeholder: "Ketik pikiranmu...",
    errors: {
      failed: "Gagal mengirim pesan.",
      connectionLost: "Koneksi terputus. Silakan coba lagi."
    },
    thinking: "sedang berpikir..."
  }
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  variant: "a" | "b" | "c";
}

const variantStyles = {
  a: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-200",
    indicator: "bg-[#5db8a6]"
  },
  b: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    indicator: "bg-[#e8a55a]"
  },
  c: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
    indicator: "bg-[#6366F1]"
  }
};

export default function SoloChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const locale = useLocale();
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];

  async function consumeSSE(response: Response, onChunk: (text: string) => void) {
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
          const text =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.content?.[0]?.text ??
            parsed?.text ??
            '';
          if (text) onChunk(text);
        } catch {}
      }
    }
  }

  // Mengubah nama tampilan menjadi Luna, Sage, dan Baz sesuai Landing Page
  // Namun tetap mempertahankan 'id' asli agar tidak merusak sistem backend/API
  const ADVISORS: Persona[] = PERSONAS.map((p, idx) => {
    const friendlyNames = ["Luna", "Sage", "Baz"];
    return {
      id: p.name,
      name: friendlyNames[idx] || p.name,
      description: p.description,
      variant: (["a", "b", "c"][idx % 3]) as "a" | "b" | "c",
    };
  });

  const [authChecking, setAuthChecking] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(ADVISORS[0]);
  const [pendingPersona, setPendingPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (streamedResponse.length > displayedResponse.length) {
      const timer = setTimeout(() => {
        setDisplayedResponse(streamedResponse.substring(0, displayedResponse.length + 1));
      }, 20); // Adjust speed here
      return () => clearTimeout(timer);
    }
  }, [streamedResponse, displayedResponse]);

  // Reset display when streaming starts/ends
  useEffect(() => {
    if (streamedResponse === "") {
      setDisplayedResponse("");
    }
  }, [streamedResponse]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Warn on navigate away
  useEffect(() => {
    if (messages.length > 0) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = t.notSaved;
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [messages, t]);

  // Authenticate user client-side on mount
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

  // Scroll to bottom when message history or streaming changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedResponse]);

  const handleAdvisorSelect = (persona: Persona) => {
    if (persona.id === selectedPersona.id) return;

    if (messages.length > 0) {
      setPendingPersona(persona);
      setIsDialogOpen(true);
    } else {
      setSelectedPersona(persona);
    }
  };

  const confirmSwitchAdvisor = () => {
    if (pendingPersona) {
      setSelectedPersona(pendingPersona);
      setMessages([]);
      setStreamedResponse("");
    }
    setIsDialogOpen(false);
    setPendingPersona(null);
  };

  const handleSendMessage = async () => {
    if (!inputVal.trim() || isLoading) return;

    const userMsg = inputVal.trim();
    setInputVal("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    setStreamedResponse("");
    setDisplayedResponse(""); 

    try {
      const conversationHistory = [
        ...messages,
        { role: "user", content: userMsg },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: selectedPersona.id,
          message: userMsg,
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.errors.failed);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/event-stream")) {
        let fullResponse = "";
        await consumeSSE(response, (text) => {
          fullResponse += text;
          setStreamedResponse((prev) => prev + text);
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullResponse },
        ]);
        setStreamedResponse("");
        setDisplayedResponse("");
      } else {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      }
    } catch (err: unknown) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: sanitizeApiError(err),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
      </div>

      <OperaNav variant="authed" />

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-6 py-24 gap-8 relative z-10">
        
        {/* Left Advisor Sidebar */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-6 pt-2">
          <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
            {t.title}
          </span>

          <div className="flex flex-col gap-4">
            {ADVISORS.map((advisor) => {
              const isActive = advisor.id === selectedPersona.id;
              const vStyle = variantStyles[advisor.variant];
              
              return (
                <div
                  key={advisor.id}
                  onClick={() => handleAdvisorSelect(advisor)}
                  className={`p-5 cursor-pointer transition-all rounded-[1.5rem] border backdrop-blur-2xl group ${
                    isActive
                      ? "bg-white/80 border-[#6366F1] shadow-lg shadow-indigo-500/10"
                      : "bg-white/40 border-white/60 hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-2 h-2 rounded-full ${vStyle.indicator} ${isActive ? "animate-pulse" : ""}`} />
                    <h4 className="text-sm font-bold text-slate-900 tracking-wider uppercase">
                      {advisor.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-light line-clamp-2">
                    {advisor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Area Panel */}
        <main className="flex-1 bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[600px] md:h-[calc(100vh-160px)]">
          
          {/* Active Chat Header */}
          <div className="bg-white/40 backdrop-blur-xl border-b border-white/60 py-5 px-8 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${variantStyles[selectedPersona.variant].indicator} animate-pulse`} />
              <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                {selectedPersona.name}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 relative">
            {messages.length === 0 ? (
              <div className="my-auto text-center max-w-sm mx-auto flex flex-col gap-5 items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-serif italic ${variantStyles[selectedPersona.variant].bg} ${variantStyles[selectedPersona.variant].text} border ${variantStyles[selectedPersona.variant].border} shadow-inner`}>
                  {selectedPersona.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-light text-slate-900 font-serif">
                  {t.consult} <span className="font-medium">{selectedPersona.name}</span>
                </h3>
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  {t.intro}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const content = extractMessageText(msg.content);
                if (msg.role === "user") {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      key={index}
                      className="flex justify-end w-full"
                    >
                      <div className="bg-slate-900 text-white rounded-[1.5rem] rounded-tr-sm px-6 py-4 shadow-md max-w-[85%] md:max-w-[75%]">
                        <p className="text-sm font-medium leading-relaxed font-sans">{content}</p>
                      </div>
                    </motion.div>
                  );
                } else {
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      key={index} 
                      className="flex justify-start w-full"
                    >
                      <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-[1.5rem] rounded-tl-sm p-6 shadow-sm max-w-[85%] md:max-w-[75%]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-serif italic border ${variantStyles[selectedPersona.variant].bg} ${variantStyles[selectedPersona.variant].text} ${variantStyles[selectedPersona.variant].border}`}>
                            {selectedPersona.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{selectedPersona.name}</span>
                        </div>
                        <div className="text-sm font-serif text-slate-700 leading-relaxed space-y-4">
                          {content}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              })
            )}

            {/* Streaming Message block */}
            {displayedResponse && (
              <div className="flex justify-start w-full">
                <div className="bg-white/60 backdrop-blur-md border border-white/80 rounded-[1.5rem] rounded-tl-sm p-6 shadow-sm max-w-[85%] md:max-w-[75%]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-serif italic border ${variantStyles[selectedPersona.variant].bg} ${variantStyles[selectedPersona.variant].text} ${variantStyles[selectedPersona.variant].border}`}>
                      {selectedPersona.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{selectedPersona.name}</span>
                  </div>
                  <div className="text-sm font-serif text-slate-700 leading-relaxed">
                    {displayedResponse}<span className="animate-pulse ml-1 inline-block w-1.5 h-4 bg-slate-400 align-middle"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading / Thinking Indicator */}
            {isLoading && !displayedResponse && (
              <div className="flex gap-4 items-center">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold font-serif italic border shadow-sm ${variantStyles[selectedPersona.variant].bg} ${variantStyles[selectedPersona.variant].text} ${variantStyles[selectedPersona.variant].border}`}>
                  {selectedPersona.name.charAt(0)}
                </div>
                <div className="flex flex-col gap-1 justify-center">
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">
                    {selectedPersona.name} {t.thinking}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Bottom Input Area */}
          <div className="p-4 md:p-6 bg-white/40 backdrop-blur-xl border-t border-white/60 z-10">
            <div className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366F1]/20 to-[#0EA5E9]/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex items-center w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-full focus-within:ring-2 focus-within:ring-[#6366F1]/50 shadow-sm transition-all">
                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t.placeholder}
                  disabled={isLoading}
                  rows={1}
                  className="w-full bg-transparent text-slate-800 text-sm leading-relaxed py-4 pl-6 pr-14 resize-none focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputVal.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>
            </div>
            <div className="text-center mt-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t.notSaved}
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Switch Advisor Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/80 backdrop-blur-3xl border border-white/60 max-w-sm rounded-[2rem] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-medium text-slate-900">
              {t.switchTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
              {t.switchDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => {
                setIsDialogOpen(false);
                setPendingPersona(null);
              }}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
            >
              {t.cancel}
            </button>
            <button
              onClick={confirmSwitchAdvisor}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-colors"
            >
              {t.clearAndSwitch}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}