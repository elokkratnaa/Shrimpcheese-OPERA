import React from "react";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SessionCard from "@/app/components/shared/SessionCard";

export const revalidate = 0;

export default async function HomeDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations("Dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Director";

  // Fetch sessions
  // Fetch sessions
  const { data: rawSessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("session_id, raw_mind_dump, created_at, emotional_state, verdicts (verdict_id, verdict_summary, is_committed)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (sessionsError) {
      console.error("[Dashboard] Error fetching sessions:", sessionsError);
  }

  const sessions = rawSessions || [];
  console.log("[Dashboard] Fetched sessions:", sessions);

  // Calculate current mood: most frequent emotional state in last 5 sessions
  const moodCounts: Record<string, number> = {};
  sessions.forEach(s => {
      const mood = (s as any).emotional_state;
      if (mood) moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  const currentMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      {/* Overthinking Bar */}
      <section className="bg-surface-card border border-hairline rounded-lg p-6 flex flex-col gap-3">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted">
            <span>{t("overthinking")}</span>
            <span className="text-primary">47% - Warming up</span>
        </div>
        <Progress value={47} className="h-1 bg-surface-soft" />
      </section>

      <header className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {t("greeting", { name: displayName })}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted">
            <span>{t("currentMood")}:</span>
            <span className="font-semibold text-ink">{currentMood ? currentMood : t("noMood")}</span>
        </div>
        <Link href="/dump" className="w-fit">
          <Button className="bg-primary hover:bg-primary-active text-white rounded-md px-6 py-2 h-auto text-sm font-semibold">
            {t("newSession")}
          </Button>
        </Link>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
          {t("recentSessions")}
        </h2>

        {sessions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sessions.map((session: any) => (
              <SessionCard
                key={session.session_id}
                session={{
                  session_id: session.session_id,
                  raw_mind_dump: session.raw_mind_dump,
                  created_at: session.created_at,
                  verdict: session.verdicts?.[0],
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-start gap-6 border border-dashed border-hairline p-8 rounded-lg">
            <p className="text-body text-sm">
              No sessions yet. Start one when you're ready.
            </p>
            <Link href="/dump">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                {t("newSession")}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
