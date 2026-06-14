import React from "react";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
            // tags: Array.isArray(verdict.tags) ? verdict.tags : [],
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
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant="authed" />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-70 shrink-0 flex flex-col gap-6">
          <Link
            href="/dump"
            className="w-full h-12 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-md flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            {t("newSession")}
          </Link>

          <Link
            href="/chat"
            className="w-full h-12 border border-[#e6dfd8] text-[#141413] bg-[#faf9f5] hover:bg-[#efe9de] font-medium text-sm rounded-md flex items-center justify-center transition-colors cursor-pointer"
          >
            {t("soloChat")}
          </Link>

          <nav className="flex flex-col gap-1.5 mt-2">
            <Link
              href="/home"
              className="flex items-center h-10 px-4 rounded-md text-[#141413] bg-[#efe9de] font-medium text-sm transition-colors"
            >
              {t("home")}
            </Link>
            <Link
              href="/history"
              className="flex items-center h-10 px-4 rounded-md text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8] font-medium text-sm transition-colors"
            >
              {t("history")}
            </Link>
            <Link
              href="/profile"
              className="flex items-center h-10 px-4 rounded-md text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8] font-medium text-sm transition-colors"
            >
              {t("profile")}
            </Link>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col gap-8">
          <div>
            <h1 className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif">
              {t("greeting", { name: displayName })}
            </h1>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-[#6c6a64] uppercase tracking-[1.5px]">
              {t("recentSessions")}
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

          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-[#6c6a64] uppercase tracking-[1.5px]">
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
                      className="bg-[#efe9de] text-[#141413] hover:bg-[#e8e0d2] text-[13px] font-medium px-3 py-1 rounded-full transition-colors border-transparent h-auto"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6c6a64] italic">
                {t("noPatterns")}
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
