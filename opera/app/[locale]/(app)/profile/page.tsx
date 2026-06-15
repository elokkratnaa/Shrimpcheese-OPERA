import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/app/[locale]/(app)/profile/ProfileClient";

export default async function ProfilePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Fetch stats
  const [sessionsRes, committedRes] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("verdicts").select("*, sessions!inner(user_id)", { count: "exact", head: true })
      .eq("sessions.user_id", user.id)
      .eq("is_committed", true)
  ]);

  const totalSessions = sessionsRes.count || 0;
  const committedCount = committedRes.count || 0;
  const commitRate = totalSessions > 0 ? Math.round((committedCount / totalSessions) * 100) : 0;

  // Placeholder for top persona logic
  const topPersona = "Stoic"; 

  return (
    <ProfileClient 
      user={{
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || ""
      }}
      stats={{
        total_sessions: totalSessions,
        commit_rate: commitRate,
        top_persona: topPersona
      }}
    />
  );
}
