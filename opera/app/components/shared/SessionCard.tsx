'use client'

import React from 'react'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocale, useTranslations } from 'next-intl'

interface Session {
  session_id: string
  raw_mind_dump: string
  created_at: string
}

interface Verdict {
  verdict_id: string
  is_committed: boolean
  tags?: string[]
}

interface SessionCardProps {
  session: Session & { verdict?: Verdict }
}

export default function SessionCard({ session }: SessionCardProps) {
  const locale = useLocale();
  const t = useTranslations("Session");

  const dateStr = session.created_at
    ? new Date(session.created_at).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric'
      })
    : ''

  const truncatedDump =
    session.raw_mind_dump.length > 100
      ? `${session.raw_mind_dump.substring(0, 100)}...`
      : session.raw_mind_dump

  // Parse tags safely
  let tagList: string[] = []
  if (session.verdict?.tags) {
    const rawTags = session.verdict.tags
    if (Array.isArray(rawTags)) {
      tagList = rawTags
    } else if (typeof rawTags === 'string') {
      try {
        tagList = JSON.parse(rawTags)
      } catch {
        // ignore
      }
    }
  }

  const firstTag = tagList[0]

  return (
    <Link href={`/session/${session.session_id}/verdict`} className="block w-full">
      <Card className="w-full bg-[#faf9f5] hover:bg-[#f5f0e8] border border-[#e6dfd8] rounded-md transition-all duration-150 shadow-none ring-0">
        <CardContent className="p-4 md:p-6 flex items-start justify-between gap-4">
          {/* Date and Dump */}
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#6c6a64]">{dateStr}</span>
            <p className="text-[#3d3d3a] text-sm leading-[1.55]">{truncatedDump}</p>

            {/* First tag as badge-pill */}
            {firstTag && (
              <div className="mt-2">
                <Badge variant="secondary" className="bg-[#efe9de] text-[#141413] text-[13px] font-medium px-3 py-1 hover:bg-[#efe9de]/80 border-transparent rounded-full h-auto">
                  {firstTag}
                </Badge>
              </div>
            )}
          </div>

          {/* Committed dot status */}
          <div className="flex items-center pt-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                session.verdict?.is_committed ? 'bg-[#5db872]' : 'bg-[#8e8b82]'
              }`}
              title={session.verdict?.is_committed ? t("committed") : t("notCommitted")}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
