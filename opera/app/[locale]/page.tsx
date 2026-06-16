"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";

// ============================================================================
// BRAND IDENTITY & ICONS
// ============================================================================
function OperaLogo() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-dashed border-slate-400/60 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="w-3 h-3 border-[1.5px] border-slate-700 rounded-[40%] flex items-center justify-center"
      >
        <div className="w-1 h-1 bg-slate-500 rounded-full" />
      </motion.div>
    </div>
  );
}

// Minimalist Modern SVG Icons
const Icons = {
  Structure: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  Score: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Memory: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Career: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Relation: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
  Relocation: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Family: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Growth: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m8 14 4-4 4 4" />
    </svg>
  ),
  Finance: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

// ============================================================================
// ATMOSPHERIC THOUGHT FRAGMENTS
// ============================================================================
const fragmentsData = {
  EN: [
    { text: "What if I fail?", top: "15%", left: "5%", delay: 0 },
    { text: "Should I stay?", top: "60%", right: "8%", delay: 2 },
    { text: "What will my family think?", top: "80%", left: "15%", delay: 4 },
    { text: "Am I making a mistake?", top: "25%", right: "12%", delay: 1 },
    { text: "Is it too late?", top: "45%", left: "8%", delay: 3 },
  ],
  ID: [
    { text: "Bagaimana jika gagal?", top: "15%", left: "5%", delay: 0 },
    { text: "Haruskah aku bertahan?", top: "60%", right: "8%", delay: 2 },
    { text: "Apa kata mereka nanti?", top: "80%", left: "15%", delay: 4 },
    { text: "Apakah ini kesalahan?", top: "25%", right: "12%", delay: 1 },
    { text: "Apakah sudah terlambat?", top: "45%", left: "8%", delay: 3 },
  ],
};

function ThoughtFragments({ lang }: { lang: "EN" | "ID" }) {
  const fragments = fragmentsData[lang];
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {fragments.map((frag, i) => (
        <motion.div
          key={`${lang}-${i}`}
          animate={{
            y: [0, -20, 0],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: frag.delay,
          }}
          className="absolute text-2xl md:text-4xl font-serif text-[#4F46E5] blur-[8px] whitespace-nowrap"
          style={{ top: frag.top, left: frag.left, right: frag.right }}
        >
          {frag.text}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// LIVE DECISION SIMULATION
// ============================================================================
const simulationData = {
  EN: [
    {
      q: "Should I quit my job?",
      luna: "I understand why this feels difficult. What are you afraid of losing?",
      sage: "Let's look at the facts. What happens if nothing changes?",
      baz: "Are you solving the real problem, or just escaping?",
    },
    {
      q: "Should I move abroad?",
      luna: "It's natural to feel torn. What does 'home' mean to you right now?",
      sage: "Let's calculate the timeline and financial runway for this transition.",
      baz: "Are you running toward an opportunity, or away from a situation?",
    },
    {
      q: "Should I tell them how I feel?",
      luna: "Vulnerability is scary. What is your heart actually asking for?",
      sage: "Assess the structural impact on your dynamic if you speak up versus if you don't.",
      baz: "What unstated assumption are you making about their reaction?",
    },
    {
      q: "Should I start my own business?",
      luna: "I hear the excitement and the fear. Does this align with your core values?",
      sage: "Let's map out the asymmetric risk. What is your acceptable loss threshold?",
      baz: "Are you building a business, or are you just tired of having a boss?",
    },
  ],
  ID: [
    {
      q: "Haruskah aku resign dari pekerjaanku?",
      luna: "Aku paham ini sulit. Apa sebenarnya yang takut kamu hilangkan?",
      sage: "Mari lihat faktanya. Apa yang terjadi jika tidak ada yang berubah?",
      baz: "Apakah kamu sedang menyelesaikan masalah, atau sekadar melarikan diri?",
    },
    {
      q: "Haruskah aku pindah ke luar negeri?",
      luna: "Wajar merasa bimbang. Apa arti 'rumah' bagimu saat ini?",
      sage: "Mari kalkulasi linimasa dan landasan finansial untuk transisi ini.",
      baz: "Apakah kamu mengejar peluang, atau lari dari sebuah situasi?",
    },
    {
      q: "Haruskah aku menyatakan perasaanku?",
      luna: "Menjadi rentan memang menakutkan. Apa yang sebenarnya hatimu inginkan?",
      sage: "Nilai dampak struktural pada dinamikamu jika kamu bicara vs jika kamu diam.",
      baz: "Asumsi tak terucap apa yang kamu buat tentang reaksi mereka?",
    },
    {
      q: "Haruskah aku mulai bisnis sendiri?",
      luna: "Ada antusiasme sekaligus ketakutan. Apakah ini selaras dengan nilai utamamu?",
      sage: "Mari petakan risiko asimetrisnya. Berapa batas kerugian yang bisa kamu terima?",
      baz: "Apakah kamu ingin membangun bisnis, atau cuma lelah punya atasan?",
    },
  ],
};

function LiveDecisionSimulation({ lang }: { lang: "EN" | "ID" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const data = simulationData[lang];

  useEffect(() => {
    setCurrentIndex(0);
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 14000);
    return () => clearInterval(timer);
  }, [data.length]);

  const current = data[currentIndex];

  return (
    <div className="relative w-full max-w-[500px] h-[500px] md:h-[550px] flex flex-col justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${lang}-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          className="absolute inset-0 flex flex-col justify-center gap-5 md:gap-6"
        >
          {/* User Query */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="self-end bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl rounded-tr-sm px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] max-w-[85%]"
          >
            <p className="text-sm font-medium text-slate-800">"{current.q}"</p>
          </motion.div>

          {/* LUNA */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
            className="self-start bg-white/50 backdrop-blur-xl border border-white/40 rounded-[1.5rem] rounded-tl-sm p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] max-w-[90%]"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-[10px] font-serif italic text-purple-600 border border-purple-100/50">
                L
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase font-mono">
                Luna
              </span>
            </div>
            <p className="text-sm font-serif italic text-slate-700 leading-relaxed">
              "{current.luna}"
            </p>
          </motion.div>

          {/* SAGE */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 6.5, duration: 0.8, ease: "easeOut" }}
            className="self-start bg-white/50 backdrop-blur-xl border border-white/40 rounded-[1.5rem] rounded-tl-sm p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] max-w-[90%] md:ml-4"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-serif italic text-blue-600 border border-blue-100/50">
                S
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase font-mono">
                Sage
              </span>
            </div>
            <p className="text-sm font-serif italic text-slate-700 leading-relaxed">
              "{current.sage}"
            </p>
          </motion.div>

          {/* BAZ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 10, duration: 0.8, ease: "easeOut" }}
            className="self-start bg-white/50 backdrop-blur-xl border border-white/40 rounded-[1.5rem] rounded-tl-sm p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] max-w-[90%] md:ml-8"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center text-[10px] font-serif italic text-orange-600 border border-orange-100/50">
                B
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase font-mono">
                Baz
              </span>
            </div>
            <p className="text-sm font-serif italic text-slate-700 leading-relaxed">
              "{current.baz}"
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// PREMIUM ANTI-GRAVITY CARD
// ============================================================================
function PremiumCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className={`bg-white/50 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(147,197,253,0.15),0_0_40px_rgba(167,139,250,0.1)] transition-all duration-500 rounded-[2rem] overflow-hidden relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function UnifiedLandingPage() {
  const [lang, setLang] = useState<"EN" | "ID">("EN");

  const content = {
    EN: {
      nav: {
        features: "Features",
        howItWorks: "How it works",
        personas: "Personas",
        useCases: "Use cases",
        signIn: "Sign In",
        getStarted: "Get started",
      },
      hero: {
        label: "OPERA • Personal Decision Council",
        headlineStart: "Every decision deserves more than one ",
        headlineHighlight: "perspective.",
        subheadline:
          "When you're stuck between choices, OPERA brings together three distinct minds to help you think clearly—not tell you what to do.",
        ctaPrimary: "Start Thinking",
      },
      capabilities: {
        label: "CAPABILITIES",
        headlineStart: "Built for reflections that ",
        headlineHighlight: "matter.",
        subheadline:
          "OPERA is a deliberate practice partner designed around the way human psychology actually works, far beyond simple pros and cons.",
        dominant: {
          title: "Multiple Perspectives",
          desc: "A decision looks different from every angle. OPERA introduces you to your personal council—three distinct personas designed to break your echo chamber and illuminate emotional blind spots.",
        },
        items: [
          {
            title: "Structured Reflection",
            desc: "Turn an overwhelming web of thoughts into cleanly organized reasoning and actionable insights.",
            icon: <Icons.Structure />,
          },
          {
            title: "Decision Clarity Score",
            desc: "Measure quantitatively how your emotional state evolves throughout a session.",
            icon: <Icons.Score />,
          },
          {
            title: "Coaching Memory",
            desc: "Tracks your cognitive growth across sessions and surfaces behavioral patterns.",
            icon: <Icons.Memory />,
          },
        ],
      },
      howItWorks: {
        label: "ARCHITECTURE",
        headlineStart: "Three conversations. One clearer ",
        headlineHighlight: "decision.",
        subheadline:
          "OPERA guides you through an organic reflection process designed to uncover constraints you may have missed.",
        steps: [
          {
            num: "01",
            title: "Share what's on your mind",
            desc: "Describe the situation you're facing and the explicit decision parameters you're struggling to calculate.",
          },
          {
            num: "02",
            title: "Meet your council",
            desc: "LUNA, SAGE, and BAZ analyze the prompt asynchronously through completely independent psychological prisms.",
          },
          {
            num: "03",
            title: "Gain clarity",
            desc: "Receive a balanced overview structure, spot hidden friction points, and walk forward cleanly.",
          },
        ],
      },
      useCases: {
        label: "APPLICATIONS",
        headlineStart: "For the decisions that keep you ",
        headlineHighlight: "awake.",
        items: [
          {
            title: "Career Transitions",
            desc: "Should I shift roles or transition into venture independence?",
            icon: <Icons.Career />,
          },
          {
            title: "Relationships",
            desc: "Am I building on safety logic, or avoiding hard conversations?",
            icon: <Icons.Relation />,
          },
          {
            title: "Major Relocations",
            desc: "Is this the right time to move across the country for a new start?",
            icon: <Icons.Relocation />,
          },
          {
            title: "Family Dynamics",
            desc: "Navigating structural family expectations and emotional boundaries.",
            icon: <Icons.Family />,
          },
          {
            title: "Personal Growth",
            desc: "Breaking cyclical habits to find raw clarity on what truly matters.",
            icon: <Icons.Growth />,
          },
          {
            title: "Financial Strategy",
            desc: "Calibrating capital allocation against asymmetric risk and timeline.",
            icon: <Icons.Finance />,
          },
        ],
      },
      cta: {
        headline: "Your next decision deserves a better perspective.",
        subheadline:
          "Don't navigate structural parameters alone. Invoke your personal council before jumping.",
        button: "Start Thinking",
      },
    },
    ID: {
      nav: {
        features: "Fitur",
        howItWorks: "Cara Kerja",
        personas: "Persona",
        useCases: "Kasus Penggunaan",
        signIn: "Masuk",
        getStarted: "Mulai Sekarang",
      },
      hero: {
        label: "OPERA • Dewan Keputusan Personal",
        headlineStart: "Setiap keputusan layak mendapat berbagai ",
        headlineHighlight: "perspektif.",
        subheadline:
          "Saat Anda terjebak di antara pilihan, OPERA menyatukan tiga pemikiran berbeda untuk membantu Anda berpikir jernih—bukan mendikte apa yang harus dilakukan.",
        ctaPrimary: "Mulai Berpikir",
      },
      capabilities: {
        label: "KAPABILITAS",
        headlineStart: "Diciptakan untuk refleksi yang ",
        headlineHighlight: "berarti.",
        subheadline:
          "OPERA adalah partner berlatih yang dirancang menyesuaikan dengan cara kerja psikologi manusia, jauh melebihi daftar pro-kontra biasa.",
        dominant: {
          title: "Beragam Perspektif",
          desc: "Keputusan terlihat berbeda dari tiap sudut. OPERA menghadirkan dewan personal untuk memecah ruang gema pikiranmu dan mengungkap titik buta emosional.",
        },
        items: [
          {
            title: "Refleksi Terstruktur",
            desc: "Ubah jaring pikiran yang luar biasa rumit menjadi penalaran yang tertata rapi dan wawasan yang tajam.",
            icon: <Icons.Structure />,
          },
          {
            title: "Skor Kejelasan Keputusan",
            desc: "Ukur secara kuantitatif bagaimana kondisi emosionalmu berkembang sepanjang sesi refleksi.",
            icon: <Icons.Score />,
          },
          {
            title: "Memori Pelatihan",
            desc: "Melacak perkembangan kognitifmu dan memunculkan pola perilaku berulang yang terlewatkan.",
            icon: <Icons.Memory />,
          },
        ],
      },
      howItWorks: {
        label: "ARSITEKTUR",
        headlineStart: "Tiga percakapan. Satu keputusan yang lebih ",
        headlineHighlight: "jelas.",
        subheadline:
          "OPERA memandumu melalui proses refleksi organik yang dirancang untuk mengungkap perspektif yang tersembunyi.",
        steps: [
          {
            num: "01",
            title: "Bagikan isi pikiranmu",
            desc: "Deskripsikan situasi yang sedang kamu hadapi dan parameter keputusan yang membuatmu kesulitan.",
          },
          {
            num: "02",
            title: "Temui dewan personalmu",
            desc: "LUNA, SAGE, dan BAZ menganalisis ceritamu secara asinkron melalui prisma psikologis yang independen.",
          },
          {
            num: "03",
            title: "Dapatkan kejelasan",
            desc: "Terima gambaran struktur yang seimbang, temukan titik gesekan yang tersembunyi, dan melangkah maju.",
          },
        ],
      },
      useCases: {
        label: "APLIKASI",
        headlineStart: "Untuk keputusan yang membuatmu ",
        headlineHighlight: "terjaga.",
        items: [
          {
            title: "Transisi Karir",
            desc: "Haruskah aku pindah peran atau beralih menjadi pekerja independen?",
            icon: <Icons.Career />,
          },
          {
            title: "Hubungan",
            desc: "Apakah aku bertahan karena zona nyaman, atau menghindari percakapan sulit?",
            icon: <Icons.Relation />,
          },
          {
            title: "Relokasi Besar",
            desc: "Apakah ini waktu yang tepat untuk pindah ke luar kota demi awal yang baru?",
            icon: <Icons.Relocation />,
          },
          {
            title: "Dinamika Keluarga",
            desc: "Menavigasi ekspektasi struktural keluarga dan batasan-batasan emosional.",
            icon: <Icons.Family />,
          },
          {
            title: "Pertumbuhan Personal",
            desc: "Mematahkan kebiasaan siklis untuk menemukan kejelasan murni tentang diri sendiri.",
            icon: <Icons.Growth />,
          },
          {
            title: "Strategi Finansial",
            desc: "Mengkalibrasi alokasi modal terhadap risiko asimetris dan linimasa masa depan.",
            icon: <Icons.Finance />,
          },
        ],
      },
      cta: {
        headline:
          "Keputusanmu selanjutnya layak mendapat perspektif yang lebih baik.",
        subheadline:
          "Jangan menavigasi parameter struktural sendirian. Panggil dewan personalmu sebelum melompat.",
        button: "Mulai Berpikir",
      },
    },
  };

  const t = content[lang];

  // Deep, premium icy-purple gradients to match the background aesthetic
  const stepGradients = [
    "from-[#8B5CF6] to-[#6366F1]",
    "from-[#6366F1] to-[#3B82F6]",
    "from-[#3B82F6] to-[#0EA5E9]",
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans antialiased relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3] min-h-screen">
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Right Side - Bright Cyan/Blue */}
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.45)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(112,195,255,0.35)_0%,transparent_60%)] blur-[130px]" />

        {/* Left Side - Vibrant Lavender/Purple */}
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.55)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,210,255,0.45)_0%,transparent_60%)] blur-[100px]" />

        {/* Center subtle mix */}
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,215,255,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      {/* FLOATING PILL NAVBAR */}
      <header className="fixed top-6 inset-x-0 z-50 flex justify-center px-6">
        <div className="bg-white/40 backdrop-blur-3xl rounded-full px-6 py-3.5 flex items-center justify-between w-full max-w-5xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("hero")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-3 font-medium text-xs uppercase tracking-[0.2em] text-slate-900 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <OperaLogo />
            <span className="font-semibold tracking-[0.25em]">OPERA</span>
          </a>
          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors py-1"
            >
              {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors py-1"
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#use-cases"
              className="hover:text-slate-900 transition-colors py-1"
            >
              {t.nav.useCases}
            </a>
          </nav>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1 bg-white/40 backdrop-blur-md p-1 rounded-full border border-slate-200/50">
              <button
                onClick={() => setLang("EN")}
                className={`px-3 py-1.5 rounded-full transition-all ${lang === "EN" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ID")}
                className={`px-3 py-1.5 rounded-full transition-all ${lang === "ID" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                ID
              </button>
            </div>
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline-block"
            >
              {t.nav.signIn}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION: THINKING ENVIRONMENT */}
      <section
        id="hero"
        className="relative max-w-5xl mx-auto px-6 pt-40 pb-24 z-10 flex items-center min-h-[95vh]"
      >
        <ThoughtFragments lang={lang} />

        <div className="grid lg:grid-cols-2 gap-12 items-center w-full relative z-10">
          {/* LEFT TEXT (Fade + Rise) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-left space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/50 border border-white/60 backdrop-blur-xl px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6366F1] shadow-sm">
              <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-pulse" />
              {t.hero.label}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-light font-serif text-slate-900 tracking-tight leading-[1.1] max-w-xl">
              {t.hero.headlineStart}
              <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#0EA5E9] font-medium drop-shadow-sm">
                {t.hero.headlineHighlight}
              </span>
            </h1>

            <p className="text-slate-600 text-base font-light leading-relaxed max-w-md text-balance opacity-90">
              {t.hero.subheadline}
            </p>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block bg-slate-900/95 backdrop-blur-md text-white hover:bg-slate-800 font-medium rounded-full px-8 py-4 text-xs uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(99,102,241,0.2)]"
              >
                {t.hero.ctaPrimary}
              </Link>
            </div>
          </motion.div>

          {/* RIGHT LIVE SIMULATION */}
          <div className="flex justify-center lg:justify-end">
            <LiveDecisionSimulation lang={lang} />
          </div>
        </div>
      </section>

      {/* CAPABILITIES SECTION (Asymmetrical Anti-Gravity) */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-left mb-16"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 block">
              {t.capabilities.label}
            </span>
            <h2 className="text-3xl md:text-4xl font-light font-serif text-slate-900 mb-4">
              {t.capabilities.headlineStart}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] font-medium drop-shadow-sm">
                {t.capabilities.headlineHighlight}
              </span>
            </h2>
            <p className="text-slate-600 max-w-2xl text-base font-light leading-relaxed">
              {t.capabilities.subheadline}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dominant Feature Card */}
            <PremiumCard className="lg:col-span-3 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 space-y-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50/80 flex items-center justify-center text-indigo-500 mb-6 border border-indigo-100/50">
                  ✧
                </div>
                <h3 className="text-2xl font-serif text-slate-900">
                  {t.capabilities.dominant.title}
                </h3>
                <p className="text-base text-slate-600 font-light leading-relaxed max-w-md">
                  {t.capabilities.dominant.desc}
                </p>
              </div>

              <div className="flex-1 w-full relative h-[260px] flex items-center justify-center bg-white/40 rounded-3xl border border-white/60 overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.06)_0%,transparent_60%)] group-hover:opacity-100 opacity-50 transition-opacity duration-700" />
                <div className="space-y-4 w-full px-6 md:px-10 relative z-10">
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm shadow-sm border border-white max-w-[85%]"
                  >
                    <p className="text-xs font-serif italic text-slate-700">
                      "I understand. What feels most risky?"{" "}
                      <span className="text-[9px] font-mono uppercase text-slate-400 ml-2 block mt-1">
                        LUNA
                      </span>
                    </p>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm shadow-sm border border-white max-w-[85%] ml-auto"
                  >
                    <p className="text-xs font-serif italic text-slate-700">
                      "Let's analyze the failure modes."{" "}
                      <span className="text-[9px] font-mono uppercase text-slate-400 ml-2 block mt-1">
                        SAGE
                      </span>
                    </p>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm shadow-sm border border-white max-w-[85%] ml-6"
                  >
                    <p className="text-xs font-serif italic text-slate-700">
                      "Challenge that initial assumption."{" "}
                      <span className="text-[9px] font-mono uppercase text-slate-400 ml-2 block mt-1">
                        BAZ
                      </span>
                    </p>
                  </motion.div>
                </div>
              </div>
            </PremiumCard>

            {/* 3 Supporting Cards with SVG Icons */}
            {t.capabilities.items.map((item, i) => (
              <PremiumCard
                key={i}
                delay={0.2 * (i + 1)}
                className="p-8 flex flex-col justify-between min-h-[240px]"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="w-10 h-10 mt-6 rounded-2xl bg-white/60 flex items-center justify-center border border-white shadow-sm text-[#6366F1]">
                  {item.icon}
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (Flow Animation & Step Gradients) */}
      <section id="how-it-works" className="py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-left mb-16"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 block">
              {t.howItWorks.label}
            </span>
            <h2 className="text-3xl md:text-4xl font-light font-serif text-slate-900 mb-4">
              {t.howItWorks.headlineStart}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#3B82F6] font-medium drop-shadow-sm">
                {t.howItWorks.headlineHighlight}
              </span>
            </h2>
            <p className="text-slate-600 max-w-2xl text-base font-light leading-relaxed">
              {t.howItWorks.subheadline}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent z-0" />

            {t.howItWorks.steps.map((step, i) => (
              <PremiumCard
                key={i}
                delay={0.2 * i}
                className="p-8 z-10 group overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stepGradients[i]} opacity-80 group-hover:h-1.5 transition-all duration-300`}
                />

                <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-sm font-mono font-bold shadow-sm mb-6">
                  <span
                    className={`bg-clip-text text-transparent bg-gradient-to-br ${stepGradients[i]}`}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 font-light leading-relaxed">
                  {step.desc}
                </p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES (Soft Slides with SVG Icons) */}
      <section id="use-cases" className="py-32 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-left mb-16"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4 block">
              {t.useCases.label}
            </span>
            <h2 className="text-3xl md:text-4xl font-light font-serif text-slate-900 mb-4">
              {t.useCases.headlineStart}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] font-medium drop-shadow-sm">
                {t.useCases.headlineHighlight}
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.useCases.items.map((item, i) => (
              <PremiumCard
                key={i}
                delay={0.1 * i}
                className="p-8 min-h-[180px]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-[#8B5CF6]">{item.icon}</div>
                  <h4 className="text-[10px] font-semibold text-slate-900 uppercase tracking-widest opacity-80">
                    {item.title}
                  </h4>
                </div>
                <p className="text-sm font-light text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </PremiumCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="bg-white/40 backdrop-blur-3xl border-[1.5px] border-white/80 rounded-[3rem] p-16 md:p-24 text-center shadow-[0_20px_80px_rgba(99,102,241,0.1)] relative overflow-hidden group"
          >
            {/* Breathing Animated Gradients */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.2)_0%,transparent_60%)] pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(147,197,253,0.2)_0%,transparent_60%)] pointer-events-none"
            />

            <h2 className="text-3xl md:text-5xl font-light font-serif text-slate-900 mb-6 tracking-tight relative z-10 max-w-2xl mx-auto leading-tight">
              {t.cta.headline}
            </h2>
            <p className="text-slate-600 font-light max-w-md mx-auto mb-10 text-sm md:text-base relative z-10">
              {t.cta.subheadline}
            </p>
            <Link
              href="/login"
              className="inline-block bg-slate-900 text-white font-medium rounded-full px-10 py-5 text-xs uppercase tracking-widest transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(99,102,241,0.25)] relative z-10"
            >
              {t.cta.button}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SIMPLE ELEGANT FOOTER */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-10 border-t border-slate-300/50 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 pb-16">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("hero")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <OperaLogo />
          <span className="text-xs font-semibold tracking-widest text-slate-900 uppercase">
            OPERA{" "}
            <span className="text-slate-400 font-normal ml-2">© 2026</span>
          </span>
        </a>
        <nav className="flex items-center gap-8 text-[11px] font-medium text-slate-500">
          <a
            href="#features"
            className="hover:text-slate-900 transition-colors"
          >
            {t.nav.features}
          </a>
          <a
            href="#how-it-works"
            className="hover:text-slate-900 transition-colors"
          >
            {t.nav.howItWorks}
          </a>
          <a
            href="#use-cases"
            className="hover:text-slate-900 transition-colors"
          >
            {t.nav.useCases}
          </a>
          <Link
            href="/login"
            className="hover:text-slate-900 transition-colors text-slate-900 font-semibold"
          >
            {t.nav.getStarted}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
