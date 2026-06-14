'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

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
          <h2 className="text-base font-medium text-[#141413] font-heading">
            Account
          </h2>
          <p className="text-sm text-[#6c6a64] leading-[1.55]">
            Manage your session or permanently remove your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Sign out button */}
          <Button
            variant="outline"
            onClick={signOut}
            disabled={isSigningOut}
            className="h-10 px-5 rounded-md border-[#e6dfd8] bg-[#faf9f5] text-[#141413] hover:bg-[#efe9de] text-sm font-medium cursor-pointer"
          >
            {isSigningOut ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out…
              </span>
            ) : (
              'Sign out'
            )}
          </Button>

          {/* Delete account link */}
          <Button
            variant="ghost"
            onClick={openDeleteDialog}
            className="text-sm font-medium text-[#c64545] hover:text-[#a63535] hover:bg-transparent h-10 px-1 cursor-pointer"
          >
            Delete my account
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#faf9f5] border-[#e6dfd8] max-w-sm rounded-xl p-8 shadow-lg">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-[22px] font-normal leading-tight text-[#141413] font-serif">
              Delete your account?
            </DialogTitle>
            <DialogDescription className="text-sm text-[#3d3d3a] leading-[1.55]">
              This permanently deletes all your sessions and decisions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 my-4">
            <label
              htmlFor="delete-confirm-input"
              className="text-[12px] font-medium text-[#6c6a64] uppercase tracking-[1.5px]"
            >
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirm-input"
              ref={confirmInputRef}
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirmDelete) confirmDeleteAccount()
              }}
              placeholder="DELETE"
              disabled={isDeleting}
              className="h-10 rounded-md border border-[#e6dfd8] bg-[#faf9f5] text-[#141413] px-3.5 text-sm outline-none focus:border-[#cc785c] focus:ring-2 focus:ring-[#cc785c]/10 transition-colors disabled:opacity-50"
              aria-describedby={deleteError ? 'delete-error-msg' : undefined}
            />
            {deleteError && (
              <p id="delete-error-msg" className="text-xs text-[#c64545]" role="alert">
                {deleteError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-2 flex gap-3 sm:justify-between border-none bg-transparent p-0 -mx-0 -mb-0 rounded-none">
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-md border-[#e6dfd8] bg-[#faf9f5] text-[#141413] hover:bg-[#efe9de] text-sm font-medium cursor-pointer"
            >
              Keep my account
            </Button>
            <Button
              onClick={confirmDeleteAccount}
              disabled={!canConfirmDelete || isDeleting}
              className="flex-1 h-10 rounded-md bg-[#c64545] text-white hover:bg-[#a63535] text-sm font-medium cursor-pointer disabled:opacity-40"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                'Delete everything'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
