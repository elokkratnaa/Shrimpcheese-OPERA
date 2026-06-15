"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import PersonaBubble from "@/app/components/shared/PersonaBubble";
import { createClient } from "@/client/services/supabase";
import { Send, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { extractMessageText } from "@/shared/extractMessageText";
import { PERSONAS } from "@/shared/personas";

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

export default function SoloChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Chat");

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

  const ADVISORS: Persona[] = PERSONAS.map((p, idx) => ({
    id: p.name,
    name: p.name,
    description: p.description,
    variant: (["a", "b", "c"][idx % 3]) as "a" | "b" | "c",
  }));

  const [authChecking, setAuthChecking] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona>(ADVISORS[0]);
  const [pendingPersona, setPendingPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Warn on navigate away
  useEffect(() => {
    if (messages.length > 0) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = t("notSaved");
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
        throw new Error(t("errors.failed"));
      }

      // Check if response is streamable or plain json
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/event-stream")) {
        let fullResponse = "";
        await consumeSSE(response, (text) => {
          fullResponse += text;
          setStreamedResponse((prev) => prev + text);
        });

        // After stream completes
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullResponse },
        ]);
        setStreamedResponse("");
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
          content: t("errors.connectionLost"),
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
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans">
      <OperaNav variant="authed" />

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 py-8 md:px-8 gap-8">
        {/* Left Advisor Sidebar / Mobile Dropdown wrapper */}
        <aside className="w-full md:w-65 shrink-0 flex flex-col gap-4">
          <span className="text-[12px] font-semibold tracking-[1.5px] text-slate-500 uppercase font-sans">
            {t("title")}
          </span>

          {/* Persona selector list */}
          <div className="flex flex-col gap-3">
            {ADVISORS.map((advisor) => {
              const isActive = advisor.id === selectedPersona.id;
              return (
                <Card
                  key={advisor.id}
                  onClick={() => handleAdvisorSelect(advisor)}
                  className={`p-4 cursor-pointer transition-all rounded-lg border shadow-none ring-0 ${
                    isActive
                      ? "bg-slate-200 border-slate-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <h4 className="text-sm font-semibold text-slate-900 font-sans">
                    {advisor.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-sans">
                    {advisor.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </aside>

        {/* Right Chat Area Panel */}
        <main className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col justify-between overflow-hidden h-[calc(100vh-180px)]">
          {/* Active Chat Header */}
          <div className="bg-white border-b border-slate-200 py-4 px-6 flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                selectedPersona.variant === "a"
                  ? "bg-[#5db8a6]"
                  : selectedPersona.variant === "b"
                    ? "bg-[#e8a55a]"
                    : "bg-[#cc785c]"
              }`}
            />
            <span className="text-sm font-semibold text-slate-900 font-sans uppercase tracking-[0.5px]">
              {selectedPersona.name}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.length === 0 ? (
              <div className="my-auto text-center max-w-sm mx-auto flex flex-col gap-2">
                <h3 className="text-lg font-normal text-slate-900 font-serif">
                  {t("consult", { name: selectedPersona.name })}
                </h3>
                <p className="text-sm text-slate-600 font-sans leading-[1.55]">
                  {t("intro")}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const content = extractMessageText(msg.content);
                if (msg.role === "user") {
                  return (
                    <div
                      key={index}
                      className="flex justify-end w-full animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      <div className="bg-white text-slate-900 text-sm leading-[1.55] p-4 max-w-[85%] rounded-lg border border-slate-200 shadow-sm font-sans">
                        {content}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <PersonaBubble
                      key={index}
                      persona_name={selectedPersona.name}
                      message_content={content}
                      variant={selectedPersona.variant}
                    />
                  );
                }
              })
            )}

            {/* Streaming Message block */}
            {streamedResponse && (
              <PersonaBubble
                persona_name={selectedPersona.name}
                message_content={extractMessageText(streamedResponse)}
                variant={selectedPersona.variant}
                isStreaming={true}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area panel */}
          <div className="bg-white border-t border-slate-200 p-4 flex flex-col gap-2">
            <div className="relative flex items-center w-full bg-slate-50 border border-slate-200 rounded-md focus-within:border-[#cc785c] focus-within:ring-2 focus-within:ring-[#cc785c]/10 transition-all">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="..."
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent text-slate-900 text-base leading-[1.55] py-3 pl-4 pr-12 resize-none focus:outline-none md:text-sm font-sans"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputVal.trim()}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[#cc785c] hover:text-[#a9583e] disabled:text-slate-400 focus:outline-none transition-colors cursor-pointer"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <span className="text-[11px] text-slate-500 font-medium font-sans">
                {t("notSaved")}
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Switch Advisor Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border border-slate-200 max-w-sm rounded-lg p-6 shadow-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 font-sans">
              {t("switchTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-2 font-sans">
              {t("switchDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setIsDialogOpen(false);
                setPendingPersona(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-900 rounded-md text-sm hover:bg-slate-50 font-sans cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              onClick={confirmSwitchAdvisor}
              className="px-4 py-2 bg-[#cc785c] hover:bg-[#a9583e] text-white rounded-md text-sm font-sans cursor-pointer"
            >
              {t("clearAndSwitch")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
