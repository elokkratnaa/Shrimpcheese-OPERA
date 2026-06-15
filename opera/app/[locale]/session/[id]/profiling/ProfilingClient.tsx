"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import { useTranslations } from "next-intl";
import { PERSONA_MAP } from "@/shared/personas";
import { Loader2 } from "lucide-react";

export default function ProfilingClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Loading");

  const STATUS_MESSAGES = [
    t("reading"),
    t("finding"),
    t("assembling"),
  ];

  const [dynamicMessages, setDynamicMessages] = useState<string[]>(STATUS_MESSAGES);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    async function fetchPersonas() {
      try {
        const response = await fetch(`/api/sessions/${id}`, { cache: 'no-store' });
        if (!response.ok) return;
        const session = await response.json();
        const personaIds = session.detected_biases?.suggested_persona_archetypes || [];
        const chosen = personaIds.map((pid: string) => (PERSONA_MAP as any)[pid]).filter(Boolean);
        
        if (chosen.length >= 2) {
          setDynamicMessages([
            `${chosen[0].name}: Analyzing structural integrity...`,
            `${chosen[1].name}: Mapping constraints and contradictions...`,
            `${chosen[2]?.name || "The Squad"}: Preparing the Council Room...`
          ]);
        }
      } catch (e) {}
    }
    fetchPersonas();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % dynamicMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [dynamicMessages.length]);

  useEffect(() => {
    if (!id) return;

    let isSubscribed = true;
    const startTime = Date.now();

    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > 45000) {
        clearInterval(pollInterval);
        if (isSubscribed) {
          router.push("/error?reason=timeout");
        }
        return;
      }

      try {
        const response = await fetch(`/api/sessions/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch session status");
        }

        const session = await response.json();

        if (isSubscribed) {
          if (session.current_status === "completed" || session.current_status === "council_ready") {
            clearInterval(pollInterval);
            router.push(`/session/${id}/council`);
          } else if (session.current_status === "failed") {
            clearInterval(pollInterval);
            router.push("/error?reason=profiler_failed");
          }
        }
      } catch (err: unknown) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(204,120,92,0.15),transparent_70%)]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
      </div>
      
      {/* Grid Overlay Texture */}
      <div 
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px' 
        }} 
      />

      <OperaNav variant="authed" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="flex flex-col items-center justify-center gap-12 max-w-lg text-center">
          
          {/* Visual Loader - Animated Orb */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_infinite] opacity-30" />
            <div className="absolute inset-4 rounded-full border border-primary/40 animate-pulse opacity-50 shadow-[0_0_40px_rgba(204,120,92,0.2)]" />
            
            {/* Spinning Orbiters */}
            <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-primary animate-[spin_2s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full border-b-2 border-l-2 border-primary/60 animate-[spin_3s_linear_infinite_reverse]" />
            
            {/* Core Orb */}
            <div className="w-12 h-12 rounded-full bg-primary shadow-[0_0_30px_rgba(204,120,92,0.6)] relative z-20 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>

          <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-white font-sans">
              Profiling in Progress
            </h2>
            
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl min-w-[320px] md:min-w-[440px] relative overflow-hidden group">
              {/* Subtle glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
              
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(204,120,92,0.8)]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Neural Bridge Active
                  </span>
                </div>
                
                <div className="h-12 flex items-center">
                  <p className="text-lg md:text-xl text-white/90 font-medium tracking-tight leading-snug animate-in slide-in-from-bottom-2 duration-300 font-sans">
                    {dynamicMessages[messageIndex]}
                  </p>
                </div>
              </div>

              {/* Progress Bar Skeleton */}
              <div className="mt-8 w-full h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-[0_0_10px_rgba(204,120,92,0.5)] animate-[progress_15s_ease-out_forwards]" 
                     style={{ width: '85%' }} />
              </div>
            </div>
            
            <p className="text-xs text-white/40 font-medium uppercase tracking-[0.15em] mt-4">
              Estimated time: ~10 seconds
            </p>
          </div>
        </div>
      </main>

      <div className="h-20" />
      
      <style jsx global>{`
        @keyframes progress {
          0% { width: 5%; }
          30% { width: 40%; }
          60% { width: 75%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
}
