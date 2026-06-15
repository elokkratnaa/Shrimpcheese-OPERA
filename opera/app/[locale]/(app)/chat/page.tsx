"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, User } from "lucide-react";
import { cn } from "@/shared/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

import { PERSONAS } from "@/shared/personas";

export default function SoloChatPage() {
  const t = useTranslations("Chat");
  
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

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

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedPersona || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: selectedPersona.id,
          message: userMsg,
          history: messages
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!selectedPersona) {
    return (
      <div className="flex flex-col gap-10 animate-in fade-in duration-500">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {t("title")}
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(PERSONAS as any).map((advisor: any) => (
            <button
              key={advisor.id}
              onClick={() => setSelectedPersona(advisor)}
              className="flex flex-col text-left bg-surface-card border border-hairline border-l-4 rounded-md p-6 hover:bg-surface-soft transition-all"
              style={{ borderLeftColor: advisor.color }}
            >
              <h3 className="text-base font-bold text-ink mb-2">{advisor.name}</h3>
              <p className="text-xs text-muted leading-relaxed">
                {advisor.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500 relative">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-canvas/95 backdrop-blur-md py-4 z-10 border-b border-hairline flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback 
              className="text-xs font-bold text-white"
              style={{ backgroundColor: selectedPersona.color }}
            >
              {selectedPersona.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold text-ink">{selectedPersona.name}</span>
        </div>
        <button 
          onClick={() => setSelectedPersona(null)}
          className="text-xs font-bold uppercase tracking-wider text-muted hover:text-primary transition-colors"
        >
          Switch Advisor
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-8 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-muted text-sm italic">{t("intro")}</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={cn(
              "flex gap-4 animate-in fade-in duration-500",
              msg.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback 
                className={cn(
                  "text-xs font-bold text-white",
                  msg.role === "user" ? "bg-muted" : ""
                )}
                style={msg.role === "assistant" ? { backgroundColor: selectedPersona.color } : {}}
              >
                {msg.role === "user" ? <User className="size-4" /> : selectedPersona.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col gap-1.5 max-w-[80%]",
              msg.role === "user" ? "items-end" : ""
            )}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {msg.role === "user" ? "You" : selectedPersona.name}
              </span>
              <div className={cn(
                "p-4 rounded-md border border-hairline",
                msg.role === "user" ? "bg-surface-soft text-ink" : "bg-surface-card text-body"
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex gap-4 animate-pulse">
            <div 
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: selectedPersona.color }}
            >
              {selectedPersona.name.charAt(0)}
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{selectedPersona.name}</span>
              <div className="h-10 w-24 bg-surface-card rounded-md border border-hairline" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
        <div className="relative group">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            className="w-full bg-surface-soft border-hairline focus:border-primary focus:ring-0 text-ink leading-relaxed p-4 pr-12 resize-none rounded-md min-h-[56px] h-[56px]"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isStreaming}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary disabled:text-muted transition-colors"
          >
            <Send className="size-5" />
          </button>
        </div>
        <p className="text-center mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          {t("notSaved")}
        </p>
      </div>
    </div>
  );
}
