"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/client/services/supabase";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AnalysisClient from "@/app/components/shared/AnalysisClient";

// ============================================================================
// BUILT-IN LOCALIZATION DICTIONARY
// ============================================================================
const dict = {
  en: {
    headerTitle: "Your Thinking Profile",
    headerSub:
      "Track your reflections, discover recurring patterns, and understand how your decision-making evolves over time.",
    identity: "Identity",
    statsLabel: "Your Journey",
    thinkingInsights: "Thinking Insights",
    management: "Danger Zone",
    totalSessions: "Total Sessions",
    resolutions: "Resolutions",
    topTheme: "Top Theme",
    alignedPersona: "Most Aligned Persona",
    streak: "Reflection Streak",
    clarityScore: "Avg. Clarity Score",
    none: "None",
    noReflections: "No reflections yet",
    startJourney: "Your journey starts here",
    startReflecting: "Start reflecting to discover your recurring themes.",
    stillLearning: "We're still learning about your decision-making patterns.",
    notEnough: "Not enough reflections yet.",
    save: "Save",
    saving: "Saving...",
    logout: "Log out",
    delete: "Delete Account",
    logoutConfirm: "Are you sure you want to log out?",
    deleteConfirm:
      "Account deletion must be processed by an administrator or through your old dashboard settings. Please confirm to log out.",
    editName: "Click name to edit",
    lunaDesc: "You tend to value emotional awareness when making decisions.",
    sageDesc: "You often resonate with strategic and analytical perspectives.",
    bazDesc: "You focus on fulfillment, intuition, and quality of life.",
    changePassword: "Change Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    passwordUpdated: "Password updated successfully.",
    passwordMismatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordError: "Failed to update password.",
    switchAccount: "Switch Account",
    switchAccountDesc: "Logged in via Google. Switch to another account?",
    cancel: "Cancel",
    confirm: "Confirm",
    logoutTitle: "Ready to leave?",
    deleteTitle: "Permanently delete account?",
  },
  id: {
    headerTitle: "Profil Pemikiranmu",
    headerSub:
      "Lacak refleksimu, temukan pola berulang, dan pahami bagaimana pengambilan keputusanmu berkembang seiring waktu.",
    identity: "Identitas",
    statsLabel: "Perjalananmu",
    thinkingInsights: "Wawasan Pemikiran",
    management: "Zona Bahaya",
    totalSessions: "Total Sesi",
    resolutions: "Resolusi",
    topTheme: "Tema Utama",
    alignedPersona: "Penasihat Paling Selaras",
    streak: "Runtutan Refleksi",
    clarityScore: "Rata-rata Kejelasan",
    none: "Belum ada",
    noReflections: "Belum ada refleksi",
    startJourney: "Perjalanan dimulai di sini",
    startReflecting: "Mulai sesi untuk menemukan tema berulangmu.",
    stillLearning: "Kami masih mempelajari pola pengambilan keputusanmu.",
    notEnough: "Belum cukup refleksi.",
    save: "Simpan",
    saving: "Menyimpan...",
    logout: "Keluar",
    delete: "Hapus Akun",
    logoutConfirm: "Apakah kamu yakin ingin keluar?",
    deleteConfirm:
      "Penghapusan akun saat ini memerlukan proses admin. Silakan logout atau hubungi dukungan.",
    editName: "Klik nama untuk mengubah",
    lunaDesc:
      "Kamu cenderung menghargai kesadaran emosional saat mengambil keputusan.",
    sageDesc:
      "Kamu sering sejalan dengan sudut pandang strategis dan analitis.",
    bazDesc: "Kamu fokus pada pemenuhan, intuisi, dan kualitas hidup.",
    changePassword: "Ubah Kata Sandi",
    newPassword: "Kata Sandi Baru",
    confirmPassword: "Konfirmasi Kata Sandi",
    updatePassword: "Perbarui Kata Sandi",
    passwordUpdated: "Kata sandi berhasil diperbarui.",
    passwordMismatch: "Kata sandi tidak cocok.",
    passwordTooShort: "Kata sandi minimal 8 karakter.",
    passwordError: "Gagal memperbarui kata sandi.",
    switchAccount: "Ganti Akun",
    switchAccountDesc: "Masuk melalui Google. Ganti ke akun lain?",
    cancel: "Batal",
    confirm: "Konfirmasi",
    logoutTitle: "Siap untuk keluar?",
    deleteTitle: "Hapus akun secara permanen?",
  },
};

interface ProfileProps {
  initialName: string;
  email: string;
  provider: string;
  stats: {
    totalSessions: number;
    committedCount: number;
    topTag: string | null;
  };
}

export default function ProfileClient({
  initialName,
  email,
  provider,
  stats,
}: ProfileProps) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();
  const lang = locale.startsWith("id") ? "id" : "en";
  const t = dict[lang];

  const hasData = stats.totalSessions > 0;

  const handleSave = async () => {
    if (!name.trim() || name === initialName) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: name } });
      router.refresh();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: t.passwordTooShort });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: t.passwordMismatch });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setPasswordMessage({ type: "success", text: t.passwordUpdated });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error.message || t.passwordError,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  const handleDelete = async () => {
    // Account deletion is currently not implemented on the client side
    // Just closing the dialog for now as per previous behavior
    setIsDeleteOpen(false);
    alert(t.deleteConfirm);
  };

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto flex flex-col gap-5 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-[3rem] font-light font-serif text-slate-900 tracking-tight leading-tight"
        >
          {t.headerTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 font-light text-base md:text-lg leading-relaxed"
        >
          {t.headerSub}
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* ================================================================= */}
        {/* IDENTITY CARD (Col 1) */}
        {/* ================================================================= */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-rose-100 flex items-center justify-center text-3xl font-serif italic text-indigo-900 border-[3px] border-white shadow-sm mb-6 relative z-10">
              {(name || email || "?").charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="w-full flex flex-col gap-3 animate-in zoom-in duration-200 relative z-10">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3 text-center focus:ring-2 focus:ring-[#6366F1]/50 outline-none text-sm font-medium shadow-inner"
                  autoFocus
                  placeholder="Your Name"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all shadow-md"
                >
                  {isSaving ? t.saving : t.save}
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col gap-1.5 items-center group cursor-pointer w-full p-2 rounded-2xl hover:bg-white/40 transition-colors relative z-10"
                onClick={() => setIsEditing(true)}
                title={t.editName}
              >
                <h2 className="text-2xl md:text-3xl font-serif text-slate-900 group-hover:text-[#6366F1] transition-colors flex items-center gap-2">
                  {name || "User"}
                  <svg
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </h2>
                <p className="text-sm text-slate-500 font-light">{email}</p>
              </div>
            )}
          </motion.div>

          {/* Change Password or Switch Account */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 relative overflow-hidden group"
          >
            {provider === "email" ? (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
                  {t.changePassword}
                </h3>

                <form
                  onSubmit={handleUpdatePassword}
                  className="flex flex-col gap-4 relative z-10"
                >
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6366F1]/50 outline-none shadow-inner"
                      placeholder={t.newPassword}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6366F1]/50 outline-none shadow-inner"
                      placeholder={t.confirmPassword}
                    />
                  </div>

                  {passwordMessage.text && (
                    <p
                      className={cn(
                        "text-xs font-medium px-4 py-2 rounded-xl text-center",
                        passwordMessage.type === "error"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-600",
                      )}
                    >
                      {passwordMessage.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isUpdatingPassword || !newPassword || !confirmPassword
                    }
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {isUpdatingPassword ? t.saving : t.updatePassword}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
                  {t.switchAccount}
                </h3>
                <div className="flex flex-col gap-6 relative z-10 text-center">
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    {t.switchAccountDesc}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#6366F1] transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {t.switchAccount}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* ================================================================= */}
        {/* YOUR JOURNEY (Col 2 & 3) */}
        {/* ================================================================= */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          {/* Total Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between group hover:shadow-[0_20px_80px_rgba(99,102,241,0.08)] transition-all h-[240px]"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              {hasData ? (
                <p className="text-5xl md:text-6xl font-light font-serif text-slate-900 mb-3 tracking-tight">
                  {stats.totalSessions}
                </p>
              ) : (
                <p className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-tight">
                  {t.startJourney}
                </p>
              )}
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {t.totalSessions}
              </p>
            </div>
          </motion.div>

          {/* Resolutions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between group hover:shadow-[0_20px_80px_rgba(16,185,129,0.08)] transition-all h-[240px]"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              {hasData ? (
                <p className="text-5xl md:text-6xl font-light font-serif text-slate-900 mb-3 tracking-tight">
                  {stats.committedCount}
                </p>
              ) : (
                <p className="text-xl md:text-2xl font-serif text-slate-900 mb-3 leading-tight">
                  {t.noReflections}
                </p>
              )}
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {t.resolutions}
              </p>
            </div>
          </motion.div>

          <div className="col-span-2">
            <AnalysisClient />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* THINKING INSIGHTS */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-6 pt-10 border-t border-slate-200/50">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center mb-4">
          {t.thinkingInsights}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Most Aligned Persona */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-white/60 to-slate-50/40 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.06)] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/10 transition-colors" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-teal-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                {hasData ? (
                  <>
                    <p className="text-3xl md:text-4xl font-light font-serif text-slate-900 mb-3 tracking-tight">
                      Sage
                    </p>
                    <p className="text-sm text-slate-500 font-light leading-relaxed mb-4">
                      {t.sageDesc}
                    </p>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl font-serif text-slate-900 mb-4 leading-tight">
                    {t.notEnough}
                  </p>
                )}
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {t.alignedPersona}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Top Theme */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-indigo-50/40 to-rose-50/40 backdrop-blur-3xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.06)] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-indigo-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
              </div>
              <div>
                {stats.topTag ? (
                  <p className="text-3xl md:text-4xl font-light font-serif text-slate-900 mb-3 tracking-tight capitalize leading-tight">
                    {stats.topTag}
                  </p>
                ) : (
                  <p className="text-xl md:text-2xl font-serif text-slate-900 mb-4 leading-tight">
                    {t.startReflecting}
                  </p>
                )}
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {t.topTheme}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DANGER ZONE (Moved to bottom) */}
      {/* ================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="pt-16 mt-8 border-t border-slate-200/50 flex flex-col items-center gap-6"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {t.management}
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="w-full py-4 px-6 bg-white/40 hover:bg-white text-slate-600 rounded-full text-[11px] font-bold uppercase tracking-widest border border-white/60 transition-all shadow-sm hover:shadow flex items-center justify-center gap-3"
          >
            {t.logout}
            <svg
              className="w-4 h-4 opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            className="w-full py-4 px-6 bg-transparent hover:bg-rose-50 text-rose-500 rounded-full text-[11px] font-bold uppercase tracking-widest border border-transparent hover:border-rose-100 transition-all flex items-center justify-center gap-3"
          >
            {t.delete}
          </button>
        </div>
      </motion.div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-[400px] border-none bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
          <DialogHeader className="gap-3">
            <DialogTitle className="text-2xl font-serif font-light text-slate-900">
              {t.logoutTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
              {t.logoutConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end border-none bg-transparent -mx-0 -mb-0 p-0">
            <Button
              variant="outline"
              onClick={() => setIsLogoutOpen(false)}
              className="rounded-full px-6 py-5 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleLogout}
              className="rounded-full px-8 py-5 bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#6366F1] transition-all shadow-lg hover:shadow-indigo-200"
            >
              {t.logout}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] border-none bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
          <DialogHeader className="gap-3">
            <DialogTitle className="text-2xl font-serif font-light text-rose-600">
              {t.deleteTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
              {t.deleteConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 sm:justify-end border-none bg-transparent -mx-0 -mb-0 p-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-full px-6 py-5 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50"
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-full px-8 py-5 bg-rose-500 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-100"
            >
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
