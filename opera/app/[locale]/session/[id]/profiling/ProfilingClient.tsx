"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import { useTranslations, useLocale } from "next-intl";
import { PERSONA_MAP, getFriendlyName } from "@/shared/personas";
import { motion } from "framer-motion";

export default function ProfilingClient() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Loading");
  const locale = useLocale();
  const isId = locale.startsWith("id");

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
          const name1 = getFriendlyName(chosen[0].name);
          const name2 = getFriendlyName(chosen[1].name);
          const name3 = chosen[2] ? getFriendlyName(chosen[2].name) : (isId ? "Tim" : "The Squad");

          setDynamicMessages([
            isId ? "Memahami kedalaman ceritamu..." : "Understanding the depth of your story...",
            isId ? `${name1} sedang merumuskan sudut pandang...` : `${name1} is formulating a perspective...`,
            isId ? `${name2} sedang memetakan jalur pikiranmu...` : `${name2} is mapping your thought process...`,
            isId ? `${name3} bersiap memasuki ruang diskusi...` : `${name3} is entering the discussion room...`
          ]);
        }
      } catch (e) {}
    }
    fetchPersonas();
  }, [id, isId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % dynamicMessages.length);
    }, 3000);
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
          router.push(`/${locale}/error?reason=timeout`);
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
            router.push(`/${locale}/session/${id}/council`);
          } else if (session.current_status === "failed") {
            clearInterval(pollInterval);
            router.push(`/${locale}/error?reason=profiler_failed`);
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
  }, [id, router, locale]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans overflow-hidden relative selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="flex flex-col items-center justify-center gap-12 max-w-lg text-center w-full">
          
          {/* Calming Visual Loader */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-indigo-300 blur-2xl"
            />
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-4 rounded-full bg-rose-200 blur-xl"
            />
            <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.8)] border border-white flex items-center justify-center z-10">
               <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-[1.5px] border-transparent border-t-indigo-400 border-r-rose-400 opacity-80"
               />
               <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute w-8 h-8 rounded-full border-[1.5px] border-transparent border-b-teal-400 border-l-orange-400 opacity-60"
               />
            </div>
          </div>

          <div className="flex flex-col gap-8 w-full animate-in fade-in duration-1000">
            <h2 className="text-3xl md:text-4xl font-light font-serif text-slate-800 tracking-tight">
              {isId ? "Menyiapkan ruangmu..." : "Preparing your space..."}
            </h2>
            
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.03)] relative overflow-hidden group w-full">
              
              <div className="flex flex-col gap-6 relative z-10 items-center">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {isId ? "Sedang Memproses" : "Processing"}
                  </span>
                </div>
                
                <div className="h-16 flex items-center justify-center w-full">
                  <motion.p 
                    key={messageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.5 }}
                    className="text-base md:text-lg text-slate-700 font-light leading-relaxed font-sans text-center"
                  >
                    {dynamicMessages[messageIndex]}
                  </motion.p>
                </div>
              </div>

              {/* Elegant Progress Bar */}
              <div className="mt-10 w-full h-1.5 bg-white/50 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-indigo-400 via-rose-400 to-orange-400 animate-[progress_15s_ease-out_forwards]" 
                     style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </main>

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