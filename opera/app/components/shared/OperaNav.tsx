"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/client/services/supabase";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

interface OperaNavProps {
  variant: "guest" | "authed";
}

export default function OperaNav({ variant }: OperaNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initials, setInitials] = useState("OP");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("Nav");

  useEffect(() => {
    if (variant === "authed") {
      const fetchUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name;
          const email = user.email;

          if (fullName && fullName.trim().length > 0) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length >= 2) {
              setInitials(
                (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(),
              );
            } else {
              setInitials(parts[0].slice(0, 2).toUpperCase());
            }
          } else if (email) {
            setInitials(email.slice(0, 2).toUpperCase());
          }
        }
      };
      fetchUser();
    }
  }, [variant, supabase]);

  const handleAvatarClick = () => {
    router.push("/profile");
  };

  return (
    <nav className="sticky top-0 z-50 h-16 w-full bg-canvas border-b border-hairline px-4 md:px-8">
      <div className="flex h-full items-center justify-between max-w-7xl mx-auto">
        {/* Logo left */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold font-serif tracking-tight text-ink">
            OPERA
          </span>
        </Link>

        {/* Desktop navigation */}
        {variant === "guest" ? (
          <div className="hidden md:flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-ink hover:text-primary transition-colors"
              >
                {t("signIn")}
              </Link>
              <Button
                onClick={() => router.push("/dump")}
                className="bg-primary text-white hover:bg-primary-active border-transparent font-medium h-10 px-5 rounded-md cursor-pointer"
              >
                {t("startThinking")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="/home"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                {t("home")}
              </Link>
              <Link
                href="/history"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                {t("history")}
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                {t("chat")}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <Avatar
                onClick={handleAvatarClick}
                className="cursor-pointer size-9 hover:ring-2 hover:ring-primary transition-all bg-surface-card text-ink"
              >
                <AvatarFallback className="font-semibold bg-surface-card text-ink">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </>
        )}

        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden h-10 w-10 items-center justify-center rounded-md text-ink focus:outline-none"
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile cream sheet menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 w-full bg-canvas border-t border-hairline px-6 py-8 flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex justify-start mb-2">
            <LanguageSwitcher />
          </div>
          {variant === "guest" ? (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-ink"
              >
                {t("signIn")}
              </Link>
              <Button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dump");
                }}
                className="bg-primary text-white hover:bg-primary-active h-12 w-full text-base font-medium rounded-md cursor-pointer"
              >
                {t("startThinking")}
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/home"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-muted"
              >
                {t("home")}
              </Link>
              <Link
                href="/history"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-muted"
              >
                {t("history")}
              </Link>
              <Link
                href="/chat"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-muted"
              >
                {t("chat")}
              </Link>
              <div className="h-px bg-hairline my-2" />
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-ink"
              >
                {t("profile")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
