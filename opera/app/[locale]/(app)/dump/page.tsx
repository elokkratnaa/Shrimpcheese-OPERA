"use client";

import React, { useState, useEffect } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, BrainCircuit, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LanguageSwitcher from "@/app/components/shared/LanguageSwitcher";

const EMOTIONS = ["Calm", "Anxious", "Overwhelmed", "Excited"] as const;
const ROUNDS = [1, 2, 3] as const;
const CONVERSATION_TYPES = ["Personal", "Professional", "Creative"] as const;
const PERSONA_CONFIG = [
  { id: "Stoic", desc: "Rational, risk-averse, logical.", icon: ShieldAlert },
  { id: "VC", desc: "Growth-focused, opportunistic.", icon: BrainCircuit },
  { id: "Hedonist", desc: "Experience-driven, joy-seeking.", icon: User },
] as const;

export default function MindDumpPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("MindDump");

  const [mindDump, setMindDump] = useState("");
  const [emotionalState, setEmotionalState] = useState<
    (typeof EMOTIONS)[number] | null
  >(null);
  const [debateRounds, setDebateRounds] = useState<number>(1);
  const [convType, setConvType] = useState<
    (typeof CONVERSATION_TYPES)[number] | null
  >(null);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [initials, setInitials] = useState("OP");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          setInitials(
            fullName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          );
        } else if (user.email) {
          setInitials(user.email.slice(0, 2).toUpperCase());
        }
      }
    };
    fetchUser();

    const draft = localStorage.getItem("opera_draft");
    if (draft) {
      setMindDump(draft);
    }
  }, [supabase]);

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("opera_draft", mindDump);
      if (mindDump.length > 0) {
        setShowDraftSaved(true);
        const hideTimer = setTimeout(() => setShowDraftSaved(false), 2000);
        return () => clearTimeout(hideTimer);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mindDump]);

  const handleSubmit = async () => {
    if (
      mindDump.length < 50 ||
      !emotionalState ||
      !convType ||
      selectedPersonas.length === 0
    )
      return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dump_text: mindDump,
          emotional_state: emotionalState,
          debate_rounds: debateRounds,
          conversation_type: convType,
          personas: selectedPersonas,
        }),
      });

      if (!response.ok) throw new Error("Failed to start session");

      const { session_id } = await response.json();
      localStorage.removeItem("opera_draft");
      router.push(`/session/${session_id}/profiling`);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const isSubmitDisabled =
    mindDump.length < 50 ||
    !emotionalState ||
    !convType ||
    selectedPersonas.length === 0 ||
    isLoading;

  const togglePersona = (p: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-body">
      <header className="h-16 border-b border-hairline flex items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-bold font-serif tracking-tight text-ink"
        >
          OPERA
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Avatar
            className="cursor-pointer size-8 hover:ring-2 hover:ring-primary transition-all"
            onClick={() => router.push("/profile")}
          >
            <AvatarFallback className="font-semibold bg-surface-card text-ink">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-col gap-12 animate-in fade-in duration-500 max-w-3xl mx-auto pb-20 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {t("title")}
          </h1>
        </header>

        <div className="flex flex-col gap-8">
          {/* Textarea Area */}
          <div className="relative">
            <Textarea
              value={mindDump}
              onChange={(e) => setMindDump(e.target.value)}
              placeholder="..."
              className="min-h-[300px] w-full bg-surface-soft border-hairline focus:border-primary focus:ring-0 text-ink leading-relaxed p-6 resize-none rounded-md"
              maxLength={4000}
            />
            <div className="absolute bottom-4 right-6 flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-muted">
                {mindDump.length} / 4000
              </span>
            </div>
            {mindDump.length < 50 && (
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">
                {t("minCharMessage", { count: 50 - mindDump.length })}
              </p>
            )}
            {showDraftSaved && (
              <div className="absolute -bottom-6 left-0 text-[10px] font-bold uppercase tracking-wider text-muted animate-in fade-in slide-in-from-bottom-1 duration-300">
                Draft saved
              </div>
            )}
          </div>

          {/* Conversation Type */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Conversation Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {CONVERSATION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setConvType(type)}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold rounded-md border transition-all",
                    convType === type
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-card text-body border-hairline hover:bg-surface-soft",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Selector */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Select Personas (min 1)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PERSONA_CONFIG.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePersona(p.id)}
                    className={cn(
                      "p-4 rounded-md border transition-all text-left flex flex-col gap-2",
                      selectedPersonas.includes(p.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-card text-body border-hairline hover:bg-surface-soft",
                    )}
                  >
                    <Icon className="size-6" />
                    <span className="font-bold">{p.id}</span>
                    <span className="text-xs opacity-80">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotional State & Rounds */}
          <div className="flex gap-12">
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("emotionLabel")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emo) => (
                  <button
                    key={emo}
                    onClick={() => setEmotionalState(emo)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-md border transition-all",
                      emotionalState === emo
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-card text-body border-hairline hover:bg-surface-soft",
                    )}
                  >
                    {t(`emotions.${emo}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("rounds")}
              </h3>
              <div className="flex gap-2">
                {ROUNDS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setDebateRounds(r)}
                    className={cn(
                      "size-10 flex items-center justify-center text-sm font-semibold rounded-md border transition-all",
                      debateRounds === r
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-card text-body border-hairline hover:bg-surface-soft",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full h-12 bg-primary hover:bg-primary-active text-white font-bold rounded-md disabled:opacity-50"
            >
              {isLoading ? "Starting..." : t("submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
