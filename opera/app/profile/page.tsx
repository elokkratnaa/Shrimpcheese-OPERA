import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import OperaNav from '@/app/components/shared/OperaNav'
import OperaFooter from '@/app/components/shared/OperaFooter'
import AvatarInitials from '@/app/components/profile/AvatarInitials'
import ProfileStats from '@/app/components/profile/ProfileStats'
import DangerZone from '@/app/components/profile/DangerZone'
import ProfileNameSaver from '@/app/components/profile/ProfileNameSaver'

export const metadata: Metadata = {
  title: 'Your profile — OPERA',
  description: 'Manage your OPERA account, review your decision stats, and control your data.',
}

interface ProfileStats {
  total_sessions: number
  committed_count: number
  top_tag: string | null
}

/**
 * Aggregates the user's most-used tag from their verdict tags.
 * @param verdicts - Array of verdict rows with tags JSONB field
 * @returns The most frequently occurring tag string, or null if none exist
 */
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

/**
 * Fetches profile stats directly from Supabase — avoids internal HTTP round-trip.
 * @param userId - Authenticated user's UUID
 * @returns Stats object with session counts and top tag
 */
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

/**
 * Profile page — auth required.
 * Fetches user + stats server-side via Supabase directly (no internal HTTP round-trip).
 * Delegates all mutations (name save, sign out, delete) to client sub-components.
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = await fetchProfileStats(user.id)

  const fullName: string = (user.user_metadata?.full_name as string) ?? ''
  const email: string = user.email ?? ''

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf9f5' }}>
      <OperaNav variant="authed" />

      <main className="flex-1 w-full max-w-[600px] mx-auto px-4 py-12 md:py-16 flex flex-col gap-10">

        {/* Identity block */}
        <section aria-label="Profile identity" className="flex flex-col items-center gap-4 text-center">
          <AvatarInitials fullName={fullName} email={email} />

          {/* Inline name editor — client island */}
          <ProfileNameSaver initialName={fullName} />

          {/* Email — body-md muted */}
          <p
            className="text-[#6c6a64]"
            style={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.55 }}
          >
            {email}
          </p>
        </section>

        {/* Stats block */}
        <section aria-label="Decision statistics">
          <ProfileStats
            totalSessions={stats.total_sessions}
            committedCount={stats.committed_count}
            topTag={stats.top_tag}
          />
        </section>

        {/* Danger zone — client island */}
        <section aria-label="Account management">
          <DangerZone />
        </section>

      </main>

      <OperaFooter />
    </div>
  )
}
