import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CouncilRoomClient from '@/app/[locale]/(app)/session/[id]/council/CouncilRoomClient';

export default async function CouncilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('session_id, current_status, category, rounds, detected_biases, raw_mind_dump')
    .eq('session_id', id)
    .single();

  if (error || !session) redirect('/error');
  if (session.current_status === 'failed') redirect('/error');
  if (session.current_status === 'ingested') redirect(`/session/${id}/profiling`);
  
  // Allow verdict access even if stuck if marked completed in logic,
  // or allow council access.
  
  return <CouncilRoomClient initialSession={session} />;
}
