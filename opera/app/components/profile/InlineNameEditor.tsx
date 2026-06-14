'use client'

import React, { useState, useRef } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface InlineNameEditorProps {
  initialName: string
  onSave: (newName: string) => Promise<void>
}

export default function InlineNameEditor({ initialName, onSave }: InlineNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(initialName)
  const [displayName, setDisplayName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations("Profile")

  const enterEditMode = () => {
    setDraft(displayName)
    setSaveError(null)
    setIsEditing(true)
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const persistName = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === displayName) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(trimmed)
      setDisplayName(trimmed)
      setIsEditing(false)
    } catch {
      setSaveError(t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      persistName()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setDraft(displayName)
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <input
            id="profile-name-input"
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={persistName}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            maxLength={80}
            className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-ink font-serif bg-transparent border-b-2 border-primary outline-none w-full max-w-xs focus:border-primary-active transition-colors disabled:opacity-50"
            aria-label={t("editLabel")}
          />
          {isSaving && (
            <Loader2 className="animate-spin h-4 w-4 text-primary shrink-0" />
          )}
        </div>
        {saveError && (
          <p className="text-xs text-error" role="alert">{saveError}</p>
        )}
        <p className="text-xs text-muted">{t("pressEnter")}</p>
      </div>
    )
  }

  return (
    <button
      id="profile-name-edit-trigger"
      onClick={enterEditMode}
      className="group flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
      aria-label={t("clickToEdit")}
    >
      <span
        className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-ink font-serif"
      >
        {displayName || t('addName')}
      </span>
      <Pencil
        className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
        aria-hidden="true"
      />
    </button>
  )
}
