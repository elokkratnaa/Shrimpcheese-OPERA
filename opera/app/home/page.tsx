import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OperaNav from "@/app/components/shared/OperaNav";
import SessionCard from "@/app/components/shared/SessionCard";

export const revalidate = 0; // equivalent to force-dynamic, cache: 'no-store'

interface DbSession {
  session_id: string;
  raw_mind_dump: string;
  created_at: string;
  verdicts?: DbVerdict[];
}

interface DbVerdict {
  verdict_id: string;
  is_committed: boolean;
  tags?: string[] | null; // JSONB array of auto-tags
}

export default async function HomeDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile name or fall back to email prefix
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Director";

  // Fetch recent 5 sessions with their verdicts
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

  // Format sessions for SessionCard
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
            tags: Array.isArray(verdict.tags) ? verdict.tags : [],
          }
        : undefined,
    };
  });

  // Fetch verdicts through join or filter
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
        } catch {
          // ignore
        }
      }
      tagsList.forEach((tag) => {
        const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
        tagsMap[cleanTag] = (tagsMap[cleanTag] || 0) + 1;
      });
    });
  }

  // Sort tags by frequency and get unique tag list
  const patterns = Object.keys(tagsMap).sort((a, b) => tagsMap[b] - tagsMap[a]);

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant="authed" />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-70 shrink-0 flex flex-col gap-6">
          {/* New Session main visual priority */}
          <Link
            href="/dump"
            className="w-full h-12 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-md flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            New session
          </Link>

          {/* Solo Chat button */}
          <Link
            href="/chat"
            className="w-full h-12 border border-[#e6dfd8] text-[#141413] bg-[#faf9f5] hover:bg-[#efe9de] font-medium text-sm rounded-md flex items-center justify-center transition-colors cursor-pointer"
          >
            Solo chat
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 mt-2">
            <Link
              href="/home"
              className="flex items-center h-10 px-4 rounded-md text-[#141413] bg-[#efe9de] font-medium text-sm transition-colors"
            >
              Home
            </Link>
            <Link
              href="/history"
              className="flex items-center h-10 px-4 rounded-md text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8] font-medium text-sm transition-colors"
            >
              History
            </Link>
            <Link
              href="/profile"
              className="flex items-center h-10 px-4 rounded-md text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8] font-medium text-sm transition-colors"
            >
              Profile
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Greeting */}
          <div>
            <h1 className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif">
              What's on your mind, {displayName}?
            </h1>
          </div>

          {/* Recent Sessions */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-[#6c6a64] uppercase tracking-[1.5px]">
              Recent sessions
            </h2>

            {sessions.length > 0 ? (
              <div className="flex flex-col gap-4">
                {sessions.map((session) => (
                  <SessionCard key={session.session_id} session={session} />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#e6dfd8] rounded-lg p-12 text-center flex flex-col items-center gap-4 bg-[#f5f0e8]/30">
                <p className="text-[#3d3d3a] text-sm leading-[1.55] max-w-sm">
                  Your theater is empty. Pour your thoughts out to host your
                  first cognitive debate council.
                </p>
                <Link
                  href="/dump"
                  className="bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm h-10 px-5 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                >
                  Start your first session
                </Link>
              </div>
            )}
          </section>

          {/* Your Patterns */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-[#6c6a64] uppercase tracking-[1.5px]">
              Your patterns
            </h2>
            {patterns.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patterns.map((tag) => (
                  <Link
                    key={tag}
                    href={`/history?tag=${encodeURIComponent(tag)}`}
                    className="bg-[#efe9de] text-[#141413] hover:bg-[#f5f0e8] text-[13px] font-medium px-3 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6c6a64] italic">
                Commit to decisions to discover tags and track your cognitive
                patterns.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
