import { redirect } from 'next/navigation'
import { createClient } from '@/core/lib/supabase-server'
import type { Metadata } from 'next'
import OperaNav from '@/app/components/shared/OperaNav'
import OperaFooter from '@/app/components/shared/OperaFooter'
import AvatarInitials from '@/app/components/profile/AvatarInitials'
import ProfileStats from '@/app/components/profile/ProfileStats'
import DangerZone from '@/app/components/profile/DangerZone'
import ProfileNameSaver from '@/app/components/profile/ProfileNameSaver'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Profile'});
 
  return {
    title: t('title'),
    description: t('description')
  };
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
  const t = await getTranslations('Profile')

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const stats = await fetchProfileStats(user.id)

  const fullName: string = (user.user_metadata?.full_name as string) ?? ''
  const email: string = user.email ?? ''

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <OperaNav variant="authed" />

      <main className="flex-1 w-full max-w-[600px] mx-auto px-4 py-12 md:py-16 flex flex-col gap-10">

        {/* Identity block */}
        <section aria-label={t("identity")} className="flex flex-col items-center gap-4 text-center">
          <AvatarInitials fullName={fullName} email={email} />

          {/* Inline name editor — client island */}
          <ProfileNameSaver initialName={fullName} />

          {/* Email — body-md muted */}
          <p
            className="text-muted"
            style={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.55 }}
          >
            {email}
          </p>
        </section>

        {/* Stats block */}
        <section aria-label={t("statsLabel")}>
          <ProfileStats
            totalSessions={stats.total_sessions}
            committedCount={stats.committed_count}
            topTag={stats.top_tag}
          />
        </section>

        {/* Danger zone — client island */}
        <section aria-label={t("management")}>
          <DangerZone />
        </section>

      </main>

      <OperaFooter />
    </div>
  )
}
