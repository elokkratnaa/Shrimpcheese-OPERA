"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import { Pencil, Loader2, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/client/services/supabase";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  stats: {
    total_sessions: number;
    commit_rate: number;
    top_persona: string;
  };
}

export default function ProfileClient({ user, stats }: ProfileClientProps) {
  const t = useTranslations("Profile");
  const supabase = createClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.full_name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSaveName = async () => {
    if (displayName === user.full_name) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName }
    });
    
    if (!error) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await fetch('/api/profile', { method: 'DELETE' });
    if (res.ok) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    setIsDeleting(false);
  };

  const initials = user.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-500 max-w-2xl">
      <header className="flex items-center gap-6">
        <Avatar className="size-16">
          <AvatarFallback className="text-xl font-bold bg-surface-card text-ink">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="text-2xl font-bold text-ink bg-transparent border-b border-primary outline-none"
              />
              {isSaving && <Loader2 className="size-4 animate-spin text-primary" />}
            </div>
          ) : (
            <div className="group flex items-center gap-2 text-2xl font-bold text-ink">
              {displayName || "Add Name"}
              <button onClick={() => setIsEditing(true)}>
                <Pencil className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </header>

      {/* Stats Row */}
      <div className="flex gap-12 py-8 border-y border-hairline">
        <div className="flex flex-col gap-1">
          <span className="text-4xl font-bold text-ink">{stats.total_sessions}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Sessions</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl font-bold text-ink">{stats.commit_rate}%</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Commit Rate</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-4xl font-bold text-ink truncate">
            {stats.top_persona || "N/A"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Most Used</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
          <Button variant="outline" className="w-fit flex gap-2" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="size-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
      </div>

      {/* Danger Zone */}
      <section className="flex flex-col gap-6 border-t border-hairline pt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Danger Zone</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-fit border-error text-error hover:bg-error/10">
              <Trash2 className="mr-2 size-4" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-canvas border-hairline">
            <DialogHeader>
              <DialogTitle className="text-ink">Delete account?</DialogTitle>
              <DialogDescription className="text-body">
                This will permanently delete your account and all session data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" className="text-muted">Cancel</Button>
              <Button 
                variant="destructive" 
                className="bg-error hover:bg-error/90"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Delete account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
