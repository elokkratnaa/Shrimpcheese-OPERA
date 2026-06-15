import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilingClient from "@/app/[locale]/(app)/session/[id]/profiling/ProfilingClient";

const VALID_STATUSES = [
  "ingested",
  "processing",
  "profiling",
  "council_ready",
  "completed",
  "error",
  "failed",
];

export default async function ProfilingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("current_status")
    .eq("session_id", id)
    .single();

  if (error || !VALID_STATUSES.includes(session?.current_status)) {
    redirect("/dump");
  }

  return <ProfilingClient />;
}
