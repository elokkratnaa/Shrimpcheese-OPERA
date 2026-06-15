import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface PersonaBubbleProps {
  persona_name: string
  message_content: string
  variant: 'a' | 'b' | 'c'
  isStreaming?: boolean
  category?: string
}

export default function PersonaBubble({
  persona_name,
  message_content,
  variant,
  isStreaming,
  category,
}: PersonaBubbleProps) {
  const bgColors = {
    a: 'bg-[rgba(93,184,166,0.10)]',
    b: 'bg-[rgba(232,165,90,0.10)]',
    c: 'bg-[rgba(204,120,92,0.10)]',
  }
  const borderColors = {
    a: 'border-[rgba(93,184,166,0.20)]',
    b: 'border-[rgba(232,165,90,0.20)]',
    c: 'border-[rgba(204,120,92,0.20)]',
  }
  const textColors = {
    a: 'text-accent-teal',
    b: 'text-accent-amber',
    c: 'text-primary',
  }

  const cleanContent = message_content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return (
    <Card className={`${bgColors[variant]} ${borderColors[variant]} rounded-lg border shadow-none ring-0`}>
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-medium tracking-[1.5px] uppercase ${textColors[variant]}`}>
            {persona_name}
          </span>
          {category && (
            <span className="text-[10px] font-medium uppercase tracking-[1px] px-2 py-0.5 rounded-full bg-glass border border-white/[0.12] text-muted-soft">
              {category}
            </span>
          )}
        </div>
        <p className="text-body text-[15px] leading-[1.55] font-sans">
          {cleanContent}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
          )}
        </p>
      </CardContent>
    </Card>
  )
}
