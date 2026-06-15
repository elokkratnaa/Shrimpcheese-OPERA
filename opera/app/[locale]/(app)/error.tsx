'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import OperaNav from '@/app/components/shared/OperaNav'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || error.message
  const t = useTranslations("Error")

  const errorMessages: Record<string, string> = {
    profiler_failed: t("profiler_failed"),
    timeout: t("timeout"),
    not_found: t("not_found"),
  }

  const displayMessage = errorMessages[reason] || t("default")

  useEffect(() => {
    console.error('[ErrorPage]', error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
      <div className="w-full max-w-[480px] text-center">
        <span className="text-xs font-medium tracking-[1.5px] uppercase text-muted mb-4 block">
          {t("title")}
        </span>
        <h1 className="text-[28px] font-serif font-normal text-ink mb-6 leading-tight">
          {displayMessage}
        </h1>
        <p className="text-sm text-muted-soft mb-12">
          {t("sub")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary hover:bg-primary-active text-white rounded-md h-12 px-8 font-medium cursor-pointer"
          >
            {t("tryAgain")}
          </Button>
          <Link href="/home" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-hairline text-ink hover:bg-surface-soft h-12 px-8 font-medium cursor-pointer"
            >
              {t("goHome")}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      <OperaNav variant="guest" />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-canvas" />}>
        <ErrorContent error={error} reset={reset} />
      </Suspense>
    </div>
  )
}
