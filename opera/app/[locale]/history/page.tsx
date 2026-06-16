"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import { createClient } from "@/client/services/supabase";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";

// ============================================================================
// BUILT-IN LOCALIZATION DICTIONARY
// ============================================================================
const dict = {
  en: {
    title: "Reflection History",
    all: "All Themes",
    loadMore: "Load older reflections",
    empty: "Your theater is empty. Pour out your thoughts to hold your first cognitive debate.",
    startFirst: "Start My First Session",
    clarity: "Clarity",
    exploring: "Exploring",
    resolved: "Resolved",
    continue: "Continue"
  },
  id: {
    title: "Riwayat Refleksi",
    all: "Semua Tema",
    loadMore: "Muat refleksi sebelumnya",
    empty: "Theater Anda kosong. Tumpahkan pikiran Anda untuk mengadakan dewan debat kognitif pertama Anda.",
    startFirst: "Mulai Sesi Pertama Saya",
    clarity: "Kejelasan",
    exploring: "Eksplorasi",
    resolved: "Terpecahkan",
    continue: "Lanjutkan"
  }
};

function formatDate(dateStr: string, locale: string) {
  const lang = locale.startsWith("id") ? "id-ID" : "en-US";
  return new Date(dateStr).toLocaleDateString(lang, { month: 'long', day: 'numeric', year: 'numeric' });
}

interface Verdict {
  verdict_id: string;
  is_committed: boolean;
  tags?: string[];
}

interface Session {
  session_id: string;
  raw_mind_dump: string;
  created_at: string;
  verdict?: Verdict;
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const locale = useLocale();
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];

  const [authChecking, setAuthChecking] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const urlTag = searchParams?.get("tag");
    if (urlTag) {
      setActiveTag(urlTag);
    } else {
      setActiveTag("All");
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (authChecking) return;

    async function loadHistory() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

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
          .order("created_at", { ascending: false });

        if (rawSessions) {
          const formatted: Session[] = rawSessions.map(
            (s: {
              session_id: string;
              raw_mind_dump: string;
              created_at: string;
              verdicts?: Array<{
                verdict_id: string;
                is_committed: boolean;
                tags: unknown;
              }>;
            }) => {
              const verdict =
                s.verdicts && s.verdicts[0] ? s.verdicts[0] : undefined;

              let tagList: string[] = [];
              if (verdict?.tags) {
                if (Array.isArray(verdict.tags)) {
                  tagList = verdict.tags;
                } else if (typeof verdict.tags === "string") {
                  try {
                    tagList = JSON.parse(verdict.tags);
                  } catch {}
                }
              }

              return {
                session_id: s.session_id,
                raw_mind_dump: s.raw_mind_dump,
                created_at: s.created_at,
                verdict: verdict
                  ? {
                      verdict_id: verdict.verdict_id,
                      is_committed: verdict.is_committed,
                      tags: tagList,
                    }
                  : undefined,
              };
            },
          );

          setSessions(formatted);

          const allTags = new Set<string>();
          formatted.forEach((session) => {
            if (session.verdict?.tags) {
              session.verdict.tags.forEach((tag) => {
                const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
                allTags.add(cleanTag);
              });
            }
          });
          setTags(Array.from(allTags));
        }
      } catch (err: unknown) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [authChecking, supabase]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setLimit(10);

    const params = new URLSearchParams(window.location.search);
    if (tag === "All") {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    router.replace(`/history?${params.toString()}`);
  };

  const handleLoadMore = () => {
    setLimit((prevLimit) => prevLimit + 10);
  };

  if (authChecking || (loading && sessions.length === 0)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#6366F1]" />
      </div>
    );
  }

  const filteredSessions = sessions.filter((session) => {
    if (activeTag === "All") return true;

    const sessionTags = session.verdict?.tags || [];
    return sessionTags.some((tag) => {
      const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
      return cleanTag.toLowerCase() === activeTag.toLowerCase();
    });
  });

  const visibleSessions = filteredSessions.slice(0, limit);
  const showLoadMore = filteredSessions.length > limit;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER, BLUE & SOFT PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24 flex flex-col gap-12 relative z-10 mt-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-6 items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-[3rem] font-light font-serif text-slate-900 tracking-tight"
          >
            {t.title}
          </motion.h1>

          {/* TAG FILTERS */}
          {tags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex flex-wrap justify-center gap-3 pt-4 max-w-2xl"
            >
              <button
                onClick={() => handleTagClick("All")}
                className={`px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                  activeTag === "All"
                    ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/60 backdrop-blur-md border border-white/80 text-slate-600 hover:text-[#6366F1] hover:bg-white"
                }`}
              >
                {t.all}
              </button>
              {tags.map((tag) => {
                const isActive = tag.toLowerCase() === activeTag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                      isActive
                        ? "bg-[#6366F1] text-white shadow-md shadow-indigo-500/20"
                        : "bg-white/60 backdrop-blur-md border border-white/80 text-slate-600 hover:text-[#6366F1] hover:bg-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* CONTENT LIST */}
        {filteredSessions.length > 0 ? (
          <div className="flex flex-col gap-6">
            {visibleSessions.map((session, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + (i * 0.05) }}
                key={session.session_id} 
                className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.08)] transition-all group relative overflow-hidden flex flex-col gap-6"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                  <div className="flex-1 space-y-5">
                    {/* META DATA */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-slate-400">{formatDate(session.created_at, lang)}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className={session.verdict?.is_committed ? "text-emerald-500" : "text-[#0EA5E9]"}>
                        {t.clarity}: {session.verdict?.is_committed ? t.resolved : t.exploring}
                      </span>
                    </div>
                    
                    {/* MIND DUMP */}
                    <h3 className="text-xl md:text-2xl font-serif text-slate-900 leading-relaxed group-hover:text-[#6366F1] transition-colors line-clamp-3">
                      {session.raw_mind_dump}
                    </h3>
                    
                    {/* TAGS */}
                    {session.verdict?.tags && session.verdict.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {session.verdict.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 bg-white/60 border border-slate-200/50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* CONTINUE BUTTON */}
                  <Link href={`/session/${session.session_id}`} className="w-full md:w-auto relative z-10 shrink-0 mt-2 md:mt-0">
                    <button className="w-full md:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] transition-all whitespace-nowrap shadow-sm hover:shadow-md">
                      {t.continue}
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}

            {showLoadMore && (
              <div className="flex justify-center pt-10">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 bg-white/50 backdrop-blur-md border border-white/80 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  {t.loadMore}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* EMPTY STATE */
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-16 text-center flex flex-col items-center gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] my-8 max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center shadow-inner">
               <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-2xl font-light leading-relaxed text-slate-600 font-serif max-w-md">
              {t.empty}
            </h3>
            <Link
              href="/dump"
              className="bg-slate-900 text-white hover:bg-[#6366F1] font-medium text-sm h-12 px-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {t.startFirst}
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-[#6366F1]" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}