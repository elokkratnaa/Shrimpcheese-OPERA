"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PERSONA_MAP } from "@/lib/personas";

export default function ProfilingClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [dynamicMessages, setDynamicMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
        try {
            const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
            if (!response.ok) return;
            const session = await response.json();
            
            const personaIds = session.detected_biases?.suggested_persona_archetypes || [];
            const chosenPersonas = personaIds.map((pid: string) => PERSONA_MAP[pid]).filter(Boolean);

            const personalizedMessages = [
                { name: chosenPersonas[0]?.name || "The Analyst", text: "Analyzing your thoughts for structural integrity...", color: chosenPersonas[0]?.avatar_color || "var(--color-primary)" },
                { name: chosenPersonas[1]?.name || "The Realist", text: "Cross-referencing constraints and dependencies.", color: chosenPersonas[1]?.avatar_color || "var(--color-primary)" },
                { name: chosenPersonas[2]?.name || "The Persona", text: "Council briefing is underway.", color: chosenPersonas[2]?.avatar_color || "var(--color-primary)" },
            ];
            setDynamicMessages(personalizedMessages);
        } catch (err) {
            console.error("Failed to fetch session for profiler briefing:", err);
        }
    };
    fetchSession();
  }, [id]);

  // Staged message animation
  useEffect(() => {
    if (dynamicMessages.length === 0) return;

    let timeouts: NodeJS.Timeout[] = [];
    
    dynamicMessages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages(prev => [...prev, msg]);
        if (i === dynamicMessages.length - 1) {
          setTimeout(() => setIsTyping(true), 800);
        }
      }, (i + 1) * 1000);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [dynamicMessages]);

  // Polling logic
  useEffect(() => {
    if (!id) return;

    const startTime = Date.now();
    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > 60000) {
        clearInterval(pollInterval);
        router.push("/error?reason=profiler_timeout");
        return;
      }

      try {
        const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
        if (!response.ok) return;

        const session = await response.json();
        const status = session.current_status ?? session.status;
        
        if (status === "council_ready" || status === "completed") {
          clearInterval(pollInterval);
          router.push(`/session/${id}/council`);
        } else if (status === "error" || status === "failed") {
          clearInterval(pollInterval);
          router.push("/error?reason=profiler_failed");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [id, router]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto p-6 animate-in fade-in duration-700 min-h-screen bg-canvas">
      {visibleMessages.map((msg, i) => (
        <div key={i} className="flex gap-4 animate-in slide-in-from-left-4 duration-500">
          <Avatar className="size-8 shrink-0 border border-hairline">
            <AvatarFallback style={{ backgroundColor: msg.color }} className="text-white text-xs font-bold">
              {msg.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{msg.name}</span>
            <div className="bg-surface-card border border-hairline p-4 rounded-md text-sm text-ink leading-relaxed">
              {msg.text}
            </div>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex gap-4 animate-pulse">
          <Avatar className="size-8 shrink-0 bg-surface-card border border-hairline" />
          <div className="flex flex-col gap-1 justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Council</span>
            <div className="text-sm text-muted">typing...</div>
          </div>
        </div>
      )}
    </div>
  );
}
