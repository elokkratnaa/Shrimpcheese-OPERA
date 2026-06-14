'use client'

import React from 'react'
import InlineNameEditor from './InlineNameEditor'
import { useTranslations } from 'next-intl'

interface ProfileNameSaverProps {
  initialName: string
}

export default function ProfileNameSaver({ initialName }: ProfileNameSaverProps) {
  const t = useTranslations("Profile")

  const persistName = async (newName: string) => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: newName }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? t('errors.unexpected'))
    }
  }

  return <InlineNameEditor initialName={initialName} onSave={persistName} />
}
