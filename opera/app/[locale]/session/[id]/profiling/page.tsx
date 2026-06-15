import { redirect } from 'next/navigation';
import { createClient } from '@/core/lib/supabase-server';
import ProfilingClient from './ProfilingClient';

export default async function ProfilingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('current_status')
    .eq('session_id', id)
    .single();

  if (error || !['ingested', 'processing'].includes(session?.current_status)) {
    redirect('/dump');
  }

  return <ProfilingClient />;
}
