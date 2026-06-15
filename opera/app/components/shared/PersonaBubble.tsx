import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from "framer-motion";

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
    a: 'bg-slate-100',
    b: 'bg-orange-50',
    c: 'bg-orange-50',
  }
  const borderColors = {
    a: 'border-slate-200',
    b: 'border-orange-200',
    c: 'border-orange-200',
  }
  const textColors = {
    a: 'text-slate-600',
    b: 'text-orange-600',
    c: 'text-[#cc785c]',
  }

  const cleanContent = message_content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${bgColors[variant]} ${borderColors[variant]} rounded-lg border shadow-sm`}>
        <CardContent className="p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-bold tracking-[1.5px] uppercase ${textColors[variant]}`}>
              {persona_name}
            </span>
            {category && (
              <span className="text-[10px] font-medium uppercase tracking-[1px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                {category}
              </span>
            )}
          </div>
          <p className="text-slate-900 text-[15px] leading-[1.55] font-sans">
            {cleanContent}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-[#cc785c] ml-1 animate-pulse" />
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
