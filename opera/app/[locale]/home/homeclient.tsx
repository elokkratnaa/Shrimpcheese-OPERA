"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

const dict = {
  en: {
    heroTitle: "What has been occupying your mind lately?",
    heroSub: "Describe a situation, dilemma, or decision you'd like to think through. Your council will help you explore it from different perspectives.",
    placeholder: "Tell your council what's on your mind...",
    startSession: "Start New Session",
    soloChat: "Solo Chat",
    greetings: {
      morning: "Welcome",
      afternoon: "Welcome",
      evening: "Welcome"
    }
  },
  id: {
    heroTitle: "Apa yang sedang memenuhi pikiranmu hari ini?",
    heroSub: "Ceritakan situasi, dilema, atau keputusan yang sedang kamu hadapi. Dewan personalmu akan membantu melihatnya dari berbagai sudut pandang.",
    placeholder: "Ceritakan apa yang sedang kamu pikirkan...",
    startSession: "Mulai Sesi Baru",
    soloChat: "Obrolan Solo",
    greetings: {
      morning: "Selamat pagi",
      afternoon: "Selamat siang",
      evening: "Selamat malam"
    }
  }
};

export function HomeHero({ displayName }: { displayName: string }) {
  const [prompt, setPrompt] = useState("");
  const [greeting, setGreeting] = useState("");
  
  const router = useRouter();
  const locale = useLocale();
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];

  // Logic sapaan berdasarkan waktu lokal user + nama akun user
  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = t.greetings.evening;
    
    if (lang === "id") {
      if (hour < 11) timeGreeting = t.greetings.morning;
      else if (hour < 15) timeGreeting = t.greetings.afternoon;
      else if (hour < 18) timeGreeting = "Selamat sore"; // extra for indo
    } else {
      if (hour < 12) timeGreeting = t.greetings.morning;
      else if (hour < 18) timeGreeting = t.greetings.afternoon;
    }
    
    setGreeting(`${timeGreeting}, ${displayName}.`);
  }, [lang, displayName, t.greetings]);

  const handleStartSession = () => {
    if (prompt.trim()) {
      router.push(`/dump?q=${encodeURIComponent(prompt)}`);
    } else {
      router.push("/dump");
    }
  };

  const handleSoloChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto text-center items-center mt-4">
      
      {/* GREETING WITH USER'S NAME & LOCAL TIME */}
      <motion.span 
        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} 
        className="text-xs font-bold tracking-[0.2em] uppercase text-[#6366F1] mb-6 block min-h-[20px]"
      >
        {greeting}
      </motion.span>
      
      {/* HEADLINE */}
      <motion.h1 
        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} 
        className="text-4xl md:text-[3.5rem] font-light font-serif text-slate-900 leading-[1.1] mb-6 tracking-tight"
      >
        {t.heroTitle}
      </motion.h1>

      <motion.p 
        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.15}}
        className="text-slate-500 font-light text-base md:text-lg max-w-2xl mb-12 leading-relaxed"
      >
        {t.heroSub}
      </motion.p>

      {/* LARGE INPUT AREA */}
      <motion.div 
        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} 
        className="w-full relative group mb-10"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-[#6366F1]/20 to-[#0EA5E9]/20 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-70 transition duration-700"></div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               handleStartSession();
             }
          }}
          className="relative w-full bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2rem] p-8 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] resize-none h-40 font-sans text-xl text-left"
          placeholder={t.placeholder}
        />
      </motion.div>

      {/* CALL TO ACTIONS */}
      <motion.div 
        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} 
        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
      >
        <button 
          onClick={handleStartSession}
          className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-full font-medium text-sm hover:bg-slate-800 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 flex items-center justify-center gap-3"
        >
          {t.startSession}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
        
        <button 
          onClick={handleSoloChat}
          className="w-full sm:w-auto px-10 py-4 bg-white/40 backdrop-blur-md border border-white/60 text-slate-600 rounded-full font-medium text-sm hover:bg-white hover:text-slate-900 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
        >
          {t.soloChat}
        </button>
      </motion.div>
    </div>
  );
}