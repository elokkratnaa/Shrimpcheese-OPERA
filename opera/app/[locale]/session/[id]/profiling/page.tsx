import { redirect } from 'next/navigation';
import { createClient } from '@/core/lib/supabase-server';
import ProfilingClient from './ProfilingClient';

export default async function ProfilingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfilingClient />;
}
