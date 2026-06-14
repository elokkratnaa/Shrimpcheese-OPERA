'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Danger zone — sign out + account deletion with typed "DELETE" confirmation.
 * Sign out via supabase.auth.signOut() → redirect /.
 * Delete requires user to type "DELETE" in a confirmation dialog before proceeding.
 */
export default function DangerZone() {
  const router = useRouter()
  const supabase = createClient()

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const confirmInputRef = useRef<HTMLInputElement>(null)

  const signOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: unknown) {
      console.error('[DangerZone] Sign out failed:', err)
      setIsSigningOut(false)
    }
  }

  const openDeleteDialog = () => {
    setDeleteConfirmInput('')
    setDeleteError(null)
    setShowDeleteDialog(true)
    setTimeout(() => confirmInputRef.current?.focus(), 100)
  }

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteConfirmInput('')
    setDeleteError(null)
  }

  const confirmDeleteAccount = async () => {
    if (deleteConfirmInput !== 'DELETE') return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Account deletion failed.')
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.'
      setDeleteError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const canConfirmDelete = deleteConfirmInput === 'DELETE'

  return (
    <>
      <div className="pt-8 border-t border-[#e6dfd8] flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2
            className="text-[#141413]"
            style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.4, fontFamily: 'var(--font-manrope), sans-serif' }}
          >
            Account
          </h2>
          <p
            className="text-[#6c6a64]"
            style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.55 }}
          >
            Manage your session or permanently remove your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Sign out button */}
          <button
            id="profile-sign-out-btn"
            onClick={signOut}
            disabled={isSigningOut}
            className="h-10 px-5 rounded-md border border-[#e6dfd8] bg-[#faf9f5] text-[#141413] hover:bg-[#efe9de] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>

          {/* Delete account link */}
          <button
            id="profile-delete-account-btn"
            onClick={openDeleteDialog}
            className="text-sm font-medium text-[#c64545] hover:underline bg-transparent border-none cursor-pointer h-10 flex items-center px-1"
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/40 backdrop-blur-sm px-4 animate-in fade-in duration-150"
        >
          <div className="bg-[#faf9f5] rounded-xl p-8 w-full max-w-sm flex flex-col gap-6 shadow-lg">
            <div className="flex flex-col gap-2">
              <h2
                id="delete-dialog-title"
                className="text-[#141413] font-serif"
                style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.3, letterSpacing: 0 }}
              >
                Delete your account?
              </h2>
              <p
                className="text-[#3d3d3a]"
                style={{ fontSize: '14px', lineHeight: 1.55 }}
              >
                This permanently deletes all your sessions and decisions. This cannot be undone.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="delete-confirm-input"
                className="text-[#6c6a64] uppercase tracking-[1.5px]"
                style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.4 }}
              >
                Type DELETE to confirm
              </label>
              <input
                id="delete-confirm-input"
                ref={confirmInputRef}
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canConfirmDelete) confirmDeleteAccount() }}
                placeholder="DELETE"
                disabled={isDeleting}
                className="h-10 rounded-md border border-[#e6dfd8] bg-[#faf9f5] text-[#141413] px-3.5 text-sm outline-none focus:border-[#cc785c] transition-colors disabled:opacity-50"
                aria-describedby={deleteError ? 'delete-error-msg' : undefined}
              />
              {deleteError && (
                <p id="delete-error-msg" className="text-xs text-[#c64545]" role="alert">
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="delete-cancel-btn"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="flex-1 h-10 rounded-md border border-[#e6dfd8] bg-[#faf9f5] text-[#141413] hover:bg-[#efe9de] text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Keep my account
              </button>
              <button
                id="delete-confirm-btn"
                onClick={confirmDeleteAccount}
                disabled={!canConfirmDelete || isDeleting}
                className="flex-1 h-10 rounded-md bg-[#c64545] text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#a63535]"
              >
                {isDeleting ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
