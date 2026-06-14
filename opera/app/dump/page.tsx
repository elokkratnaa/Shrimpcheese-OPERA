"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import OperaInput from "@/app/components/shared/OperaInput";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const LOADING_MESSAGES = [
  "Reading between the lines...",
  "Finding the real question...",
  "Spotting the contradictions...",
  "Assembling your council...",
  "Preparing the council room...",
];

export default function MindDumpPage() {
  const router = useRouter();
  const supabase = createClient();
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mindDump, setMindDump] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
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
    const draft = localStorage.getItem("opera_draft");
    if (draft) {
      setMindDump(draft);
    }
  }, [authChecking]);

  useEffect(() => {
    if (authChecking) return;
    const timer = setTimeout(() => {
      localStorage.setItem("opera_draft", mindDump);
    }, 500);
    return () => clearTimeout(timer);
  }, [mindDump, authChecking]);

  const handleSubmit = async () => {
    if (mindDump.length < 50) return;

    setIsLoading(true);
    setErrorMessage("");
    setLoadingMsgIndex(0);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw_mind_dump: mindDump }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start session.");
      }

      const session = await response.json();
      
      localStorage.removeItem("opera_draft");
      
      router.push(`/session/${session.session_id}/council`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      console.error(err);
    } finally {
      setIsLoading(false);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
  };

  const isSubmitDisabled = mindDump.length < 50 || isLoading;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-24 md:py-32 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-normal leading-tight tracking-[-0.5px] text-[#141413] font-serif">
            What's going on?
          </h1>
          <p className="text-sm text-[#6c6a64] font-sans">
            No format needed. Write like you think.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <OperaInput
            value={mindDump}
            onChange={(e) => setMindDump(e.target.value)}
            placeholder="..."
            minHeight={320}
            maxLength={4000}
            showCounter={true}
          />
        </div>

        {errorMessage && (
          <div className="text-xs font-medium text-[#c64545] border-l-2 border-[#c64545] pl-3 py-1 bg-[rgba(198,69,69,0.05)] rounded-r font-sans">
            {errorMessage}
          </div>
        )}

        <div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="px-8 py-3.5 h-12 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cc785c] focus:ring-offset-2 disabled:bg-[#e6dfd8] disabled:text-[#6c6a64] disabled:cursor-not-allowed cursor-pointer font-sans"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4 text-current" />
                {LOADING_MESSAGES[loadingMsgIndex]}
              </span>
            ) : (
              "Start my session"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
