'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CommitButtonProps {
  onCommit: () => Promise<void>
  isCommitted: boolean
}

export default function CommitButton({ onCommit, isCommitted }: CommitButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCommit = async () => {
    if (isLoading || isCommitted) return
    setIsLoading(true)
    try {
      await onCommit()
    } catch (err: unknown) {
      console.error('[CommitButton] Failed to commit decision:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isCommitted) {
    return (
      <div className="flex items-center justify-center max-w-xs mx-auto animate-in fade-in zoom-in duration-200">
        <Badge className="bg-[#5db872] text-white hover:bg-[#5db872]/85 text-base font-semibold px-6 py-3 rounded-full border-transparent h-auto shadow-sm">
          Decision committed.
        </Badge>
      </div>
    )
  }

  return (
    <Button
      onClick={handleCommit}
      disabled={isLoading}
      className={`relative flex h-12 w-full items-center justify-center rounded-md bg-[#cc785c] hover:bg-[#a9583e] text-base font-medium text-white shadow-sm transition-all duration-150 border-transparent cursor-pointer ${
        isLoading ? 'opacity-80 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {/* Spinner */}
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Commiting...
        </span>
      ) : (
        'Commit to this decision'
      )}
    </Button>
  )
}
