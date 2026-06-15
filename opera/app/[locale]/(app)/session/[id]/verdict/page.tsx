import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerdictClient from "@/app/[locale]/(app)/session/[id]/verdict/VerdictClient";

export default async function VerdictPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id } = await params;
  const { force } = await searchParams;
  const supabase = await createClient();

  const { data: verdict, error } = await supabase
    .from("verdicts")
    .select("*, sessions!inner(session_id, current_status)")
    .eq("session_id", id)
    .single();

  const isCompleted =
    (verdict?.sessions as any)?.current_status === "completed";

  if (force !== "true" && (error || !verdict || !isCompleted)) {
    redirect(`/session/${id}/council`);
  }

  const { data: debates } = await supabase
    .from("council_debates")
    .select("persona_name")
    .eq("session_id", id);
  const personas = Array.from(
    new Set(debates?.map((d: any) => d.persona_name)),
  ).filter((p) => p !== "Kamu") as string[];

  const actionSteps = (verdict?.action_steps as any) || {};

  const flattened = {
    verdict_id: verdict?.verdict_id || "",
    verdict_summary:
      verdict?.verdict_summary || "Verdict is still being synthesized...",
    is_committed: verdict?.is_committed || false,
    favourite_persona: verdict?.favourite_persona || "",
    pro_con_matrix: actionSteps.pro_con_matrix || [],
    recommendation: actionSteps.recommendation || "",
    next_steps: actionSteps.next_steps || [],
  };

  return (
    <VerdictClient
      initialVerdict={flattened}
      initialUniquePersonas={personas}
    />
  );
}
