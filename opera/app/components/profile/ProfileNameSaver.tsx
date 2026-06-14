'use client'

import React from 'react'
import InlineNameEditor from './InlineNameEditor'

interface ProfileNameSaverProps {
  initialName: string
}

/**
 * Thin client bridge that owns the PATCH /api/profile call for name updates.
 * Exists to keep ProfilePage a pure Server Component while InlineNameEditor
 * needs 'use client' for interactive editing.
 * @param initialName - Server-resolved full_name to hydrate the editor
 */
export default function ProfileNameSaver({ initialName }: ProfileNameSaverProps) {
  const persistName = async (newName: string) => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: newName }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? 'Failed to save name.')
    }
  }

  return <InlineNameEditor initialName={initialName} onSave={persistName} />
}
