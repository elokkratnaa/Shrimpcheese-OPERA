import React from "react";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase-server";
import OperaNav from "@/app/components/shared/OperaNav";
import { HomeHero } from "./homeclient"; // Pastikan ini mengarah ke file client component
import AnalysisClient from "@/app/components/shared/AnalysisClient";

export const revalidate = 0;

interface DbSession {
  session_id: string;
  raw_mind_dump: string;
  created_at: string;
  verdicts?: DbVerdict[];
}

interface DbVerdict {
  verdict_id: string;
  is_committed: boolean;
}

function formatDate(dateStr: string, locale: string) {
  const lang = locale.startsWith("id") ? "id-ID" : "en-US";
  return new Date(dateStr).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
}

// BUILT-IN LOCALIZATION
const dict = {
  en: {
    recentSessions: "Recent Sessions",
    patterns: "Your Patterns",
    noReflections: "No reflections yet.",
    noReflectionsSub: "Your conversations and insights will appear here.",
    clarity: "Clarity",
    exploring: "Exploring",
    resolved: "Resolved",
    continue: "Continue",
    mostFocus: "Most of your reflections focus on",
    oftenWeigh: "You often weigh decisions involving",
    allThemes: "All Tracked Themes",
    keepSharing: "Keep sharing. The council will start reading your thought patterns after a few sessions."
  },
  id: {
    recentSessions: "Sesi Terbaru",
    patterns: "Pola Anda",
    noReflections: "Belum ada refleksi.",
    noReflectionsSub: "Percakapan dan wawasan Anda akan muncul di sini.",
    clarity: "Kejelasan",
    exploring: "Eksplorasi",
    resolved: "Terpecahkan",
    continue: "Lanjutkan",
    mostFocus: "Sebagian besar refleksimu berfokus pada",
    oftenWeigh: "Kamu sering menimbang keputusan terkait",
    allThemes: "Semua Tema Tersimpan",
    keepSharing: "Teruslah bercerita. Council akan mulai membaca pola pemikiranmu setelah beberapa sesi."
  }
};

export default async function HomeDashboard({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // GET DISPLAY NAME
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Director";

  const { data: rawSessions } = await supabase
    .from("sessions")
    .select(
      `
      session_id,
      raw_mind_dump,
      created_at,
      verdicts (
        verdict_id,
        is_committed,
        tags
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const dbSessions = (rawSessions || []) as unknown as DbSession[];

  const sessions = dbSessions.map((s) => {
    const verdict = s.verdicts && s.verdicts[0] ? s.verdicts[0] : undefined;
    return {
      session_id: s.session_id,
      raw_mind_dump: s.raw_mind_dump,
      created_at: s.created_at,
      verdict: verdict
        ? {
            verdict_id: verdict.verdict_id,
            is_committed: verdict.is_committed,
            tags: [],
          }
        : undefined,
    };
  });

  const { data: userVerdicts } = await supabase
    .from("verdicts")
    .select("tags, session_id, sessions!inner(user_id)")
    .eq("sessions.user_id", user.id);

  const tagsMap: Record<string, number> = {};
  if (userVerdicts) {
    userVerdicts.forEach((v) => {
      let tagsList: string[] = [];
      if (Array.isArray(v.tags)) {
        tagsList = v.tags;
      } else if (typeof v.tags === "string") {
        try {
          tagsList = JSON.parse(v.tags);
        } catch {}
      }
      tagsList.forEach((tag) => {
        const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
        tagsMap[cleanTag] = (tagsMap[cleanTag] || 0) + 1;
      });
    });
  }

  const patterns = Object.keys(tagsMap).sort((a, b) => tagsMap[b] - tagsMap[a]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER, BLUE & SOFT PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-24 relative z-10 flex flex-col gap-24">
        
        {/* HERO SECTION */}
        <HomeHero displayName={displayName} />

        {/* DASHBOARD GRID (Sessions & Patterns) */}
        <div className="grid lg:grid-cols-3 gap-10 items-start">
          
          {/* RECENT SESSIONS */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                {t.recentSessions}
              </h2>
              <div className="h-px bg-slate-200/60 flex-1" />
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-serif text-slate-900 mb-2">{t.noReflections}</h3>
                <p className="text-sm font-light text-slate-500">{t.noReflectionsSub}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {sessions.map((session) => (
                  <div key={session.session_id} className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.08)] transition-all group relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-serif text-slate-900 mb-2 group-hover:text-[#6366F1] transition-colors leading-relaxed line-clamp-2">
                        {session.raw_mind_dump}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
                        <span>{formatDate(session.created_at, lang)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className={session.verdict?.is_committed ? "text-emerald-500" : "text-[#0EA5E9]"}>
                          {t.clarity}: {session.verdict?.is_committed ? t.resolved : t.exploring}
                        </span>
                      </div>
                    </div>
                    
                    <Link href={`/session/${session.session_id}`} className="w-full sm:w-auto relative z-10">
                      <button className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm">
                        {t.continue}
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YOUR PATTERNS */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                {t.patterns}
              </h2>
              <div className="h-px bg-slate-200/60 flex-1" />
            </div>

            <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-32">
              
              {patterns.length > 0 ? (
                <div className="space-y-6">
                  {/* Subtle Insight Cards */}
                  <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-white/30 backdrop-blur-sm rounded-[1.5rem] border border-indigo-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#6366F1]/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-[#6366F1]/20 transition-colors" />
                    <p className="text-sm text-slate-700 font-light leading-relaxed relative z-10">
                      {t.mostFocus} <span className="font-medium text-indigo-700">{patterns[0]}</span>.
                    </p>
                  </div>

                  {patterns.length > 1 && (
                    <div className="p-5 bg-gradient-to-br from-rose-50/50 to-white/30 backdrop-blur-sm rounded-[1.5rem] border border-rose-100/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-rose-400/20 transition-colors" />
                      <p className="text-sm text-slate-700 font-light leading-relaxed relative z-10">
                        {t.oftenWeigh} <span className="font-medium text-rose-700">{patterns[1]}</span>.
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                      {t.allThemes}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {patterns.map((tag) => (
                        <Link key={tag} href={`/history?tag=${encodeURIComponent(tag)}`}>
                          <span className="inline-block px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-medium text-slate-600 border border-white/80 hover:text-[#6366F1] transition-colors shadow-sm">
                            {tag}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <AnalysisClient />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-slate-100/50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    {t.keepSharing}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}