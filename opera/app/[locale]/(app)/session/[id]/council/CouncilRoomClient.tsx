"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface DebateUtterance {
  debate_id: string;
  persona_name: string;
  message_content: string;
  turn_sequence: number;
  round_number: number;
  target?: string;
}

interface Persona {
  name: string;
  avatar_color: string;
}

const PERSONA_ACCENTS = ["var(--color-accent-teal)", "var(--color-accent-amber)", "var(--color-primary)"];

const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-1">
    <motion.div className="size-1.5 rounded-full bg-muted" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} />
    <motion.div className="size-1.5 rounded-full bg-muted" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
    <motion.div className="size-1.5 rounded-full bg-muted" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
  </div>
);

export default function CouncilRoomClient({ initialSession }: { initialSession: any }) {
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Council");

  const [debates, setDebates] = useState<DebateUtterance[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [rebuttalPersona, setRebuttalPersona] = useState("All");
  const [rebuttalText, setRebuttalText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchInitial = async () => {
      const res = await fetch(`/api/sessions/${id}/council`);
      if (res.ok) {
        const data = await res.json();
        setDebates(data);
        const uniqueNames = Array.from(new Set(data.map((d: any) => d.persona_name))) as string[];
        setPersonas(uniqueNames.map((name, i) => ({
          name,
          avatar_color: PERSONA_ACCENTS[i % PERSONA_ACCENTS.length]
        })));
      }
    };
    fetchInitial();
  }, [id]);

  // SSE Stream
  useEffect(() => {
    const eventSource = new EventSource(`/api/sessions/${id}/stream`);

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") { setIsDone(true); setIsTyping(null); eventSource.close(); return; }
      try {
        const data = JSON.parse(event.data);
        if (data.type === "turn") { 
            setDebates(prev => [...prev, data]); 
            setIsTyping(null);
            setIsRoundComplete(false);
        } else if (data.type === "round_complete") {
            setIsRoundComplete(true);
        } else if (data.type === "typing") {
            setIsTyping(data.persona_name);
        }
      } catch (e) { console.error("SSE Error", e); }
    };

    return () => eventSource.close();
  }, [id]);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), [debates, isTyping]);

  const handleRebuttal = async (action: 'submit' | 'skip') => {
    if (action === 'submit' && (!rebuttalPersona || !rebuttalText)) return;
    setIsRoundComplete(false);
    
    // Add user message optimistically
    if (action === 'submit') {
        setDebates(prev => [...prev, { 
            debate_id: 'temp', 
            persona_name: 'User', 
            message_content: rebuttalPersona === 'All' ? rebuttalText : `@${rebuttalPersona} ${rebuttalText}`,
            turn_sequence: 999,
            round_number: debates[debates.length - 1]?.round_number || 1
        }]);
    }

    await fetch(`/api/sessions/${id}/rebuttal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action,
        target: rebuttalPersona, 
        content: rebuttalText 
      }),
    });
    setRebuttalText("");
  };

  const getPersonaColor = (name: string) => personas.find(p => p.name === name)?.avatar_color || "var(--color-primary)";

  const progress = Math.min((debates.length / 10) * 100, 100);

  let lastRound = 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-40">
      {/* Personas Strip */}
      <div className="flex flex-wrap gap-3 sticky top-0 bg-dark-nav/95 backdrop-blur py-4 z-20 border-b border-hairline">
        {personas.map((p) => (
          <div key={p.name} className="flex items-center gap-2 bg-surface-card px-3 py-1.5 rounded-full border border-hairline">
            <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.avatar_color }}>
              {p.name.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-ink">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted">
          <span>Overthinking level</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1 bg-surface-soft" />
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-8">
        {/* Mind Dump Entry */}
        <div className="flex gap-4">
          <Avatar className="size-8">
            <AvatarFallback className="text-white text-xs font-bold bg-muted">U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold uppercase text-muted tracking-wider">User</span>
            <div className="bg-surface-soft border border-hairline p-4 rounded-2xl rounded-tl-none text-sm text-ink leading-relaxed">
              {initialSession?.raw_mind_dump}
            </div>
          </div>
        </div>

        {debates.map((u, i) => {
            const showSeparator = u.round_number !== lastRound;
            if(showSeparator) lastRound = u.round_number;
            
            return (
              <React.Fragment key={i}>
                {showSeparator && (
                    <div className="text-center text-[10px] font-bold uppercase tracking-wider text-muted py-4">
                        Round {u.round_number}
                    </div>
                )}
                <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                    <Avatar className="size-8">
                    <AvatarFallback style={{ backgroundColor: u.persona_name === 'User' ? 'var(--color-muted)' : getPersonaColor(u.persona_name) }} className="text-white text-xs font-bold">
                        {u.persona_name.charAt(0)}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] font-bold uppercase text-muted tracking-wider">{u.persona_name}</span>
                    <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        u.persona_name === 'User' 
                            ? "bg-surface-soft border border-hairline rounded-tr-none text-ink"
                            : "bg-surface-card border border-hairline rounded-tl-none text-ink"
                    )}>
                        {u.message_content}
                    </div>
                    </div>
                </div>
              </React.Fragment>
            );
        })}
        {isTyping && (
           <div className="flex gap-4 animate-in slide-in-from-bottom-4">
            <Avatar className="size-8">
              <AvatarFallback style={{ backgroundColor: getPersonaColor(isTyping) }} className="text-white text-xs font-bold">
                {isTyping.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-bold uppercase text-muted tracking-wider">{isTyping}</span>
              <div className="bg-surface-card border border-hairline p-4 rounded-2xl rounded-tl-none text-sm text-muted">
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Rebuttal Panel */}
      {!isDone && isRoundComplete && initialSession?.rounds > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-dark-nav border-t border-hairline p-4 z-30">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="flex gap-2">
              <select 
                value={rebuttalPersona} 
                onChange={(e) => setRebuttalPersona(e.target.value)}
                className="bg-surface-card border border-hairline rounded-md text-ink text-sm px-3"
              >
                <option value="All">All</option>
                {personas.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <input 
                value={rebuttalText} 
                onChange={(e) => setRebuttalText(e.target.value)}
                className="flex-1 bg-surface-card border border-hairline rounded-md text-ink text-sm px-4"
                placeholder="Write your rebuttal..."
              />
              <Button onClick={() => handleRebuttal('submit')} className="bg-primary text-white"><Send className="size-4" /></Button>
            </div>
            <Button variant="ghost" onClick={() => handleRebuttal('skip')} className="w-full text-muted text-xs uppercase tracking-wider hover:text-white">
              Continue to next round (Skip rebuttal)
            </Button>
          </div>
        </div>
      )}

      {/* Verdict CTA */}
      {isDone && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
          <Link href={`/session/${id}/verdict`}>
            <Button className="bg-primary text-white font-bold h-12 px-10 rounded-full shadow-lg shadow-primary/20">View Verdict</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
