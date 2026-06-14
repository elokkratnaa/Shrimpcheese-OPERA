import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ConflictFlagProps {
  message: string
}

export default function ConflictFlag({ message }: ConflictFlagProps) {
  return (
    <Card className="bg-[#f5f0e8] border-l-3 border-[#d4a017] rounded-md shadow-sm w-full border-y-0 border-r-0 ring-0">
      <CardContent className="p-4 flex items-start gap-3">
        {/* Amber dot icon */}
        <span className="flex h-5 w-5 items-center justify-center text-[#d4a017] shrink-0 pt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </span>
        <p className="text-[#3d3d3a] text-sm leading-[1.55]">{message}</p>
      </CardContent>
    </Card>
  )
}
