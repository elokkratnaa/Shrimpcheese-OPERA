"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SessionCard from "@/app/components/shared/SessionCard";
import { cn } from "@/lib/utils";

interface Session {
  session_id: string;
  raw_mind_dump: string;
  created_at: string;
  emotional_state: string;
  current_status: string;
  verdicts?: {
    verdict_id: string;
    verdict_summary: string;
    is_committed: boolean;
  }[];
}

const EMOTIONS = ["all", "calm", "anxious", "overwhelmed", "excited"] as const;
const COMMITMENT = ["all", "committed", "pending"] as const;

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("History");
  const tDump = useTranslations("MindDump");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const activeEmotion = searchParams.get("emotion") || "all";
  const activeCommitment = searchParams.get("commitment") || "all";

  const fetchSessions = async (pageNum: number, append = false) => {
    const res = await fetch(`/api/sessions?page=${pageNum}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      if (data.length < 20) setHasMore(false);
      setSessions(prev => append ? [...prev, ...data] : data);
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    fetchSessions(1);
  }, []);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSessions(nextPage, true);
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/history?${params.toString()}`);
  };

  const filteredSessions = sessions.filter(s => {
    const emotionMatch = activeEmotion === "all" || s.emotional_state?.toLowerCase() === activeEmotion;
    const isCommitted = s.verdicts?.[0]?.is_committed;
    const commitmentMatch = activeCommitment === "all" || 
      (activeCommitment === "committed" ? isCommitted : !isCommitted);
    return emotionMatch && commitmentMatch;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-white mb-6">Your decisions</h1>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-4">
        {EMOTIONS.map(emo => (
          <button
            key={emo}
            onClick={() => updateFilter("emotion", emo)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all",
              activeEmotion === emo
                ? "bg-primary text-white border-primary"
                : "bg-surface-card text-body border-hairline"
            )}
          >
            {emo}
          </button>
        ))}
      </div>

      {filteredSessions.length > 0 ? (
        <div className="flex flex-col">
          {filteredSessions.map((session) => (
            <Link key={session.session_id} href={`/session/${session.session_id}/verdict`} className="group flex items-center justify-between p-4 border-b border-hairline hover:bg-surface-soft">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-white">{session.raw_mind_dump.substring(0, 60)}...</span>
                    <span className="text-[10px] text-muted-soft uppercase">{session.emotional_state || 'Uncategorized'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-muted">{(new Date(session.created_at)).toLocaleDateString()}</span>
                    {session.verdicts?.[0]?.is_committed && <CheckCircle className="size-4 text-success" />}
                </div>
            </Link>
          ))}
          {/* ... Load more ... */}
        </div>
      ) : (
        <p className="text-muted text-sm">Nothing here yet.</p>
      )}
    </div>
  );

}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="size-4 animate-spin text-primary" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}
