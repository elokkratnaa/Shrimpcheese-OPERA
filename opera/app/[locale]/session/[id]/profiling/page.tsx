"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export default function ProfilingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  const t = useTranslations("Loading");

  const STATUS_MESSAGES = [
    t("reading"),
    t("finding"),
    t("assembling"),
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    if (authChecking) return;
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [authChecking, STATUS_MESSAGES.length]);

  useEffect(() => {
    if (authChecking || !id) return;

    let isSubscribed = true;
    const startTime = Date.now();

    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > 30000) {
        clearInterval(pollInterval);
        if (isSubscribed) {
          router.push("/error?reason=timeout");
        }
        return;
      }

      try {
        const response = await fetch(`/api/sessions/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch session status");
        }

        const session = await response.json();

        if (isSubscribed) {
          if (session.current_status === "completed") {
            clearInterval(pollInterval);
            router.push(`/session/${id}/council`);
          } else if (session.current_status === "failed") {
            clearInterval(pollInterval);
            router.push("/error?reason=profiler_failed");
          }
        }
      } catch (err: unknown) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [id, router, authChecking]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-t-[#cc785c] border-r-transparent border-b-[#cc785c] border-l-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between font-sans">
      <OperaNav variant="authed" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-8 max-w-sm text-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#cc785c] opacity-20 animate-ping duration-1000" />
            <div className="absolute w-16 h-16 rounded-full border border-[#cc785c] opacity-40 animate-pulse" />
            <div className="w-6 h-6 rounded-full bg-[#cc785c]" />
          </div>

          <div className="h-6 flex items-center justify-center">
            <p className="text-base text-[#6c6a64] font-normal transition-all duration-300 ease-in-out font-sans">
              {STATUS_MESSAGES[messageIndex]}
            </p>
          </div>
        </div>
      </main>

      <div className="h-16" />
    </div>
  );
}
