'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import OperaNav from '@/app/components/shared/OperaNav'
import { Button } from '@/components/ui/button'

function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || error.message

  const errorMessages: Record<string, string> = {
    profiler_failed: "OPERA couldn't read your dump. Try again with more detail.",
    timeout: "This took too long. The council may be stuck.",
    not_found: "This session doesn't exist or isn't yours.",
  }

  const displayMessage = errorMessages[reason] || "Something broke backstage."

  useEffect(() => {
    console.error('[ErrorPage]', error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
      <div className="w-full max-w-[480px] text-center">
        <span className="text-xs font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4 block">
          SOMETHING WENT WRONG
        </span>
        <h1 className="text-[28px] font-serif font-normal text-[#141413] mb-6 leading-tight">
          {displayMessage}
        </h1>
        <p className="text-sm text-[#8e8b82] mb-12">
          Errors like this are logged. If it keeps happening, something's wrong on our end.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#cc785c] hover:bg-[#a9583e] text-white rounded-md h-12 px-8 font-medium cursor-pointer"
          >
            Try again
          </Button>
          <Link href="/home" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-[#e6dfd8] text-[#141413] hover:bg-[#f5f0e8] h-12 px-8 font-medium cursor-pointer"
            >
              Go back home
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
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant="guest" />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#faf9f5]" />}>
        <ErrorContent error={error} reset={reset} />
      </Suspense>
    </div>
  )
}
