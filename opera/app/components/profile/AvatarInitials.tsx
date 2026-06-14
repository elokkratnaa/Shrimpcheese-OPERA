'use client'

import React from 'react'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AvatarInitialsProps {
  fullName: string | null
  email: string | null
}

/**
 * Derives 1-2 uppercase initials from fullName, falling back to email prefix.
 * @param fullName - The user's full display name
 * @param email - The user's email address (fallback)
 * @returns Initials string (1–2 characters)
 */
function deriveInitials(fullName: string | null, email: string | null): string {
  if (fullName && fullName.trim().length > 0) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'OP'
}

export default function AvatarInitials({ fullName, email }: AvatarInitialsProps) {
  const initials = deriveInitials(fullName, email)

  return (
    <Avatar
      aria-label={`Avatar for ${fullName ?? email ?? 'user'}`}
      className="w-16 h-16 bg-[#efe9de] border-[#e6dfd8] after:hidden"
    >
      <AvatarFallback
        className="text-[#141413] font-medium font-heading bg-transparent"
        style={{ fontSize: '22px' }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
