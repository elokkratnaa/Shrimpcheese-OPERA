'use client'

import React, { useState, useRef } from 'react'
import { Pencil } from 'lucide-react'

interface InlineNameEditorProps {
  initialName: string
  onSave: (newName: string) => Promise<void>
}

/**
 * Displays the user's display name with an inline pencil-to-input edit flow.
 * Saves on blur or Enter keypress.
 * @param initialName - Current display name
 * @param onSave - Async persist handler — called with trimmed new name
 */
export default function InlineNameEditor({ initialName, onSave }: InlineNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(initialName)
  const [displayName, setDisplayName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      setSaveError('Could not save — try again.')
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
            className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif bg-transparent border-b-2 border-[#cc785c] outline-none w-full max-w-xs focus:border-[#a9583e] transition-colors disabled:opacity-50"
            aria-label="Edit your display name"
          />
          {isSaving && (
            <svg className="animate-spin h-4 w-4 text-[#cc785c] shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
        {saveError && (
          <p className="text-xs text-[#c64545]" role="alert">{saveError}</p>
        )}
        <p className="text-xs text-[#6c6a64]">Press Enter to save · Esc to cancel</p>
      </div>
    )
  }

  return (
    <button
      id="profile-name-edit-trigger"
      onClick={enterEditMode}
      className="group flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
      aria-label="Click to edit your display name"
    >
      <span
        className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif"
      >
        {displayName || 'Add your name'}
      </span>
      <Pencil
        className="h-4 w-4 text-[#6c6a64] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
        aria-hidden="true"
      />
    </button>
  )
}
