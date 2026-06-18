import { createClient } from '@/core/lib/supabase-server';
import { redirect } from 'next/navigation';
import VerdictClient from './VerdictClient';

export default async function VerdictPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string, locale: string }>,
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { id, locale } = await params;
  const { force } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: verdict, error } = await supabase
    .from('verdicts')
    .select('*, sessions!inner(session_id, current_status, user_id)')
    .eq('session_id', id)
    .eq('sessions.user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log(`[VerdictPage] DB Query Result:`, { verdict, error });
  
  const isCompleted = (verdict?.sessions as any)?.current_status === 'completed';

  console.log(`[VerdictPage] Session: ${id}, Verdict exists: ${!!verdict}, Status: ${(verdict?.sessions as any)?.current_status}, isCompleted: ${isCompleted}`)

  if (force !== 'true' && (error || !verdict || !isCompleted)) {
    console.warn(`[VerdictPage] Redirecting to council. Reason: ${error ? 'DB Error' : !verdict ? 'No verdict' : 'Not completed'}`)
    redirect(`/${locale}/session/${id}/council`);
  }

  // Fetch unique personas
  const { data: debates } = await supabase.from('council_debates').select('persona_name').eq('session_id', id);
  const personas = Array.from(new Set(debates?.map((d: any) => d.persona_name))).filter(p => p !== "Kamu") as string[];

  const actionSteps = (verdict?.action_steps as any) || {};

  const flattened = {
    verdict_id: verdict?.verdict_id || '',
    verdict_summary: verdict?.verdict_summary || 'Verdict is still being synthesized...',
    is_committed: verdict?.is_committed || false,
    favourite_persona: verdict?.favourite_persona || "",
    pro_con_matrix: actionSteps.pro_con_matrix || [],
    recommendation: actionSteps.recommendation || "",
    next_steps: actionSteps.next_steps || [],
  };

  return <VerdictClient initialVerdict={flattened} initialUniquePersonas={personas} />;
}
