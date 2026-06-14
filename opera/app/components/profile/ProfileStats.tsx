'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

interface ProfileStatsProps {
  totalSessions: number
  committedCount: number
  topTag: string | null
}

export default function ProfileStats({ totalSessions, committedCount, topTag }: ProfileStatsProps) {
  const t = useTranslations("Profile")

  const stats: { label: string; value: string }[] = [
    {
      label: t('sessions'),
      value: String(totalSessions),
    },
    {
      label: t('committed'),
      value: String(committedCount),
    },
    {
      label: t('topPattern'),
      value: topTag ?? t('noPattern'),
    },
  ]

  return (
    <div
      className="rounded-lg p-8 grid grid-cols-3 gap-6 bg-surface-soft"
    >
      {stats.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span
            className="text-muted font-medium uppercase tracking-[1.5px] text-[12px] leading-[1.4]"
          >
            {label}
          </span>
          <span
            className="text-ink font-medium text-[22px] leading-[1.3] font-serif"
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
