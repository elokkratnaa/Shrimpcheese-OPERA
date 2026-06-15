'use client'

import React from 'react'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { useLocale, useTranslations } from 'next-intl'
import { CheckCircle, Clock } from 'lucide-react'

interface Verdict {
  verdict_id: string
  is_committed: boolean
  verdict_summary?: string
}

interface SessionCardProps {
  session: {
    session_id: string
    raw_mind_dump: string
    created_at: string
    verdict?: Verdict
  }
}

export default function SessionCard({ session }: SessionCardProps) {
  const locale = useLocale();
  const t = useTranslations("Session");

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return rtf.format(-diffInMinutes, 'minute');
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return rtf.format(-diffInHours, 'hour');
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return rtf.format(-diffInDays, 'day');
    
    return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncatedDump =
    session.raw_mind_dump.length > 120
      ? `${session.raw_mind_dump.substring(0, 120)}...`
      : session.raw_mind_dump

  const verdictSnippet = session.verdict?.verdict_summary
    ? (session.verdict.verdict_summary.length > 60
        ? `${session.verdict.verdict_summary.substring(0, 60)}...`
        : session.verdict.verdict_summary)
    : null;

  const isCommitted = session.verdict?.is_committed;

  return (
    <Link href={`/session/${session.session_id}/verdict`} className="block group">
      <Card className="bg-surface-card border-hairline rounded-md shadow-none hover:bg-surface-soft transition-colors overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-ink text-sm leading-relaxed font-semibold truncate">
                {truncatedDump}
              </p>
              {verdictSnippet && (
                <p className="text-body text-xs leading-relaxed truncate opacity-80">
                  {verdictSnippet}
                </p>
              )}
            </div>
            <div className="shrink-0 pt-0.5">
              {isCommitted ? (
                <div className="flex items-center gap-1.5 text-primary">
                  <CheckCircle className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t("committed")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted">
                  <Clock className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t("notCommitted")}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {getRelativeTime(session.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
