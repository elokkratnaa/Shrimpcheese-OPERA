import React from "react";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/core/lib/supabase-server";
import OperaNav from "@/app/components/shared/OperaNav";
import SessionCard from "@/app/components/shared/SessionCard";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

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

export default async function HomeDashboard({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations("Dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 md:py-16">
        {/* Hero Section */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-normal leading-tight tracking-[-0.5px] text-slate-900 font-serif">
              {t("greeting", { name: displayName })}
            </h1>
            <p className="text-slate-600">
              What are we analyzing today?
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Link
              href="/chat"
              className="px-5 py-3 border border-slate-200 text-slate-900 bg-white hover:bg-slate-50 font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              {t("soloChat")}
            </Link>
            <Link
              href="/dump"
              className="px-5 py-3 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {t("newSession")}
            </Link>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {/* Main Column */}
          <div className="md:col-span-2 flex flex-col gap-10">
            <section className="flex flex-col gap-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-[1.5px]">
                {t("recentSessions")}
              </h2>

              {sessions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {sessions.map((session) => (
                    <SessionCard key={session.session_id} session={session} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center flex flex-col items-center gap-4 bg-white">
                  <p className="text-slate-600 text-sm leading-[1.55] max-w-sm">
                    {t("emptyTheater")}
                  </p>
                  <Link
                    href="/dump"
                    className="bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm h-10 px-5 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {t("startFirst")}
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Secondary Column */}
          <div className="md:col-span-1 flex flex-col gap-10">
            <section className="flex flex-col gap-6">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-[1.5px]">
                {t("patterns")}
              </h2>
              {patterns.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patterns.map((tag) => (
                    <Link
                      key={tag}
                      href={`/history?tag=${encodeURIComponent(tag)}`}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant="secondary"
                        className="bg-slate-200 text-slate-900 hover:bg-slate-300 text-[13px] font-medium px-3 py-1 rounded-full transition-colors border-transparent h-auto"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  {t("noPatterns")}
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
