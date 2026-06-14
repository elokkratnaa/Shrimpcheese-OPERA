'use client'

import React from 'react'

interface ProfileStatsProps {
  totalSessions: number
  committedCount: number
  topTag: string | null
}

/**
 * Stats summary block — surface-soft bg, rounded-lg.
 * Shows three key metrics derived from the user's session history.
 * @param totalSessions - Count of all user sessions
 * @param committedCount - Count of verdicts where is_committed = true
 * @param topTag - Most frequently occurring auto-tag across verdicts
 */
export default function ProfileStats({ totalSessions, committedCount, topTag }: ProfileStatsProps) {
  const stats: { label: string; value: string }[] = [
    {
      label: 'Total sessions',
      value: String(totalSessions),
    },
    {
      label: 'Decisions committed',
      value: String(committedCount),
    },
    {
      label: 'Top category',
      value: topTag ?? '—',
    },
  ]

  return (
    <div
      className="rounded-lg p-8 grid grid-cols-3 gap-6"
      style={{ backgroundColor: '#f5f0e8' }}
    >
      {stats.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span
            className="text-[#6c6a64] uppercase tracking-[1.5px]"
            style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.4 }}
          >
            {label}
          </span>
          <span
            className="text-[#141413]"
            style={{ fontSize: '22px', fontWeight: 500, lineHeight: 1.3, fontFamily: 'var(--font-manrope), sans-serif' }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
