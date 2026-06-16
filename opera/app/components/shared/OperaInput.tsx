'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'

interface OperaInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  minHeight?: number
  maxLength?: number
  showCounter?: boolean
}

export default function OperaInput({
  value,
  onChange,
  placeholder = '',
  minHeight = 160,
  maxLength = 4000,
  showCounter = false
}: OperaInputProps) {
  const currentLength = value.length
  const isWarning = showCounter && maxLength && currentLength >= maxLength * 0.95

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ minHeight: `${minHeight}px` }}
        className="w-full bg-surface-soft text-ink text-base leading-[1.55] p-5 border border-hairline rounded-lg focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-[rgba(204,120,92,0.12)] transition-all resize-none shadow-inner md:text-base"
      />
      {showCounter && maxLength && (
        <div className="flex justify-end">
          <span
            className={`text-xs font-medium transition-colors ${
              isWarning ? 'text-error font-bold' : 'text-muted'
            }`}
          >
            {currentLength} / {maxLength}
          </span>
        </div>
      )}
    </div>
  )
}
