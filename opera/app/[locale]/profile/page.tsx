import { redirect } from 'next/navigation'
import { createClient } from '@/core/lib/supabase-server'
import type { Metadata } from 'next'
import OperaNav from '@/app/components/shared/OperaNav'
// 🧹 Import OperaFooter sudah dihapus dari sini!
import ProfileClient from './profileclient'

export const metadata: Metadata = {
  title: 'Profile | OPERA',
  description: 'Your Thinking Profile and Reflection Journey'
}

interface ProfileStats {
  total_sessions: number
  committed_count: number
  top_tag: string | null
}

function extractTopTag(verdicts: Array<{ tags: unknown }>): string | null {
  const tagCounts: Record<string, number> = {}

  verdicts.forEach((verdict) => {
    let tags = verdict.tags
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags) } catch { return }
    }
    if (!Array.isArray(tags)) return
    tags.forEach((tag: unknown) => {
      if (typeof tag === 'string') {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
      }
    })
  })

  let topTag: string | null = null
  let maxCount = 0
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > maxCount) {
      maxCount = count
      topTag = tag
    }
  }
  return topTag
}

async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient()

  const [sessionsResult, committedResult, verdictsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('verdicts')
      .select('*, sessions!inner(user_id)', { count: 'exact', head: true })
      .eq('sessions.user_id', userId)
      .eq('is_committed', true),
    supabase
      .from('verdicts')
      .select('tags, sessions!inner(user_id)')
      .eq('sessions.user_id', userId),
  ])

  return {
    total_sessions: sessionsResult.count ?? 0,
    committed_count: committedResult.count ?? 0,
    top_tag: verdictsResult.data ? extractTopTag(verdictsResult.data as Array<{ tags: unknown }>) : null,
  }
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const stats = await fetchProfileStats(user.id)

  const fullName: string = (user.user_metadata?.full_name as string) ?? ''
  const email: string = user.email ?? ''

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden selection:bg-[#E0E7FF] selection:text-[#3730A3]">
      
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.25)_0%,transparent_70%)] blur-[100px]" />
      </div>

      <OperaNav variant="authed" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 md:py-24 relative z-10 flex flex-col gap-12">
          <ProfileClient 
             initialName={fullName} 
             email={email} 
             stats={{
                totalSessions: stats.total_sessions,
                committedCount: stats.committed_count,
                topTag: stats.top_tag
             }} 
          />
      </main>

      {/* 🧹 Footer juga sudah dihilangkan dari sini! Halaman profil sekarang 100% melayang dan bebas footer */}
    </div>
  )
}