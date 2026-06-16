"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import SessionCard from "@/app/components/shared/SessionCard";
import { createClient } from "@/client/services/supabase";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("History");

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center theme-new-primary">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans pb-16 theme-new-primary">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 md:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-slate-900 font-serif">
            {t("title")}
          </h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleTagClick("All")}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTag === "All"
                    ? "bg-primary text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t("all")}
              </button>
              {tags.map((tag) => {
                const isActive = tag.toLowerCase() === activeTag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {filteredSessions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {visibleSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}

            {showLoadMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 border border-slate-200 text-slate-900 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {t("loadMore", { count: 10 })}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl p-16 text-center flex flex-col items-center gap-6 bg-white my-8">
            <h3 className="text-[22px] font-normal leading-tight tracking-tight text-slate-500 font-serif">
              {t("empty")}
            </h3>
            <Link
              href="/dump"
              className="bg-primary text-white hover:bg-primary-active font-medium text-sm h-11 px-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            >
              {t("startFirst")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center theme-new-primary">
          <Loader2 className="animate-spin h-6 w-6 text-primary" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
