import { createClient } from '@/core/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function SessionPage({ 
  params 
}: { 
  params: Promise<{ id: string, locale: string }> 
}) {
  const { id, locale } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('current_status')
    .eq('session_id', id)
    .single();

  if (error || !session) {
    redirect(`/${locale}/error`);
  }

  // Route to the correct phase based on status
  switch (session.current_status) {
    case 'ingested':
    case 'processing':
      redirect(`/${locale}/session/${id}/profiling`);
    case 'council_ready':
      redirect(`/${locale}/session/${id}/council`);
    case 'completed':
      redirect(`/${locale}/session/${id}/verdict`);
    case 'failed':
      redirect(`/${locale}/error?reason=session_failed`);
    default:
      redirect(`/${locale}/session/${id}/council`);
  }
}
