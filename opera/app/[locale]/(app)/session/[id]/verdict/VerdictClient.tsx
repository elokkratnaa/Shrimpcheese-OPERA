"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProConOption {
  option: string;
  pros: string[];
  cons: string[];
}

interface VerdictData {
  verdict_id: string;
  verdict_summary: string;
  pro_con_matrix: ProConOption[];
  recommendation: string;
  next_steps: string[];
  is_committed: boolean;
  favourite_persona?: string;
}

const PERSONA_ACCENTS = ["var(--color-accent-teal)", "var(--color-accent-amber)", "var(--color-primary)"];

export default function VerdictClient({ 
  initialVerdict, 
  initialUniquePersonas 
}: { 
  initialVerdict: VerdictData, 
  initialUniquePersonas: string[] 
}) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations("Verdict");

  const [isCommitted, setIsCommitted] = useState(initialVerdict.is_committed);
  const [isCommitting, setIsCommitting] = useState(false);
  const [selectedFavourite, setSelectedFavourite] = useState(initialVerdict.favourite_persona);

  const handleCommit = async () => {
    setIsCommitting(true);
    setIsCommitted(true);
    
    try {
      const response = await fetch(`/api/verdicts/${initialVerdict.verdict_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_committed: true, favourite_persona: selectedFavourite }),
      });

      if (!response.ok) throw new Error("Commit failed");
    } catch (err) {
      console.error(err);
      setIsCommitted(false);
    } finally {
      setIsCommitting(false);
    }
  };

  const proConMatrix = initialVerdict.pro_con_matrix || [];
  const recommendation = initialVerdict.recommendation;
  const nextSteps = initialVerdict.next_steps || [];

  const getPersonaFeedback = (personaName: string) => {
      if (personaName === "Undecided") return "A wise choice. Sometimes clarity takes time.";
      return `Kamu pilih ${personaName}? Pilihan yang cerdas.`;
  };

  return (
    <div className="flex flex-col gap-12 animate-in fade-in duration-700 pb-20 p-6 max-w-3xl mx-auto">
      {/* Pro/Con Matrix */}
      <section className="flex flex-col gap-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t("matrix")}</h2>
        <div className="flex flex-col gap-10">
          {proConMatrix.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-ink">{item.option}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  {item.pros.map((pro, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle className="size-4 text-success shrink-0 mt-0.5" />
                      <span className="text-sm text-body">{pro}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {item.cons.map((con, i) => (
                    <div key={i} className="flex gap-2">
                      <XCircle className="size-4 text-muted shrink-0 mt-0.5" />
                      <span className="text-sm text-body">{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation */}
      <section className="flex flex-col gap-4 py-8 border-y border-hairline">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t("recommendation")}</h2>
        <p className="text-2xl font-bold text-primary leading-tight">
          {recommendation}
        </p>
      </section>

      {/* Next Steps */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t("nextSteps")}</h2>
        <div className="flex flex-col gap-6">
          {nextSteps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-2xl font-bold text-ink/40 leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-base text-ink font-medium pt-1">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Favourite Persona Selection (Inspiration style) */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t("favouritePersonaLabel")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {initialUniquePersonas.map((name) => (
                <button
                    key={name}
                    onClick={() => setSelectedFavourite(name)}
                    className={cn(
                        "p-3 rounded-lg border text-sm font-bold transition-all",
                        selectedFavourite === name
                            ? "bg-primary text-white border-primary"
                            : "bg-surface-card border-hairline text-muted hover:bg-surface-soft"
                    )}
                >
                    {name}
                </button>
            ))}
            <button
                onClick={() => setSelectedFavourite("Undecided")}
                className={cn(
                    "p-3 rounded-lg border text-sm font-bold transition-all",
                    selectedFavourite === "Undecided"
                        ? "bg-muted text-white border-muted"
                        : "bg-surface-card border-hairline text-muted hover:bg-surface-soft"
                )}
            >
                {t("undecided")}
            </button>
        </div>
        
        {/* Personalized Feedback Display */}
        {selectedFavourite && (
            <div className="bg-surface-card border border-hairline rounded-lg p-6 animate-in slide-in-from-top-2">
                <p className="text-sm text-ink italic">"{getPersonaFeedback(selectedFavourite)}"</p>
            </div>
        )}
      </section>

      {/* Commitment Area */}
      <div className="flex flex-col gap-6 pt-8 border-t border-hairline">
        {isCommitted ? (
          <div className="flex items-center gap-2 text-ink font-bold animate-in zoom-in duration-300">
            <CheckCircle className="size-5 text-success" />
            Committed
          </div>
        ) : (
          <Button 
            onClick={handleCommit}
            disabled={isCommitting || !selectedFavourite}
            className="h-12 bg-primary hover:bg-primary-active text-white font-bold rounded-md px-10"
          >
            Commit to this decision
          </Button>
        )}
        
        <Link 
          href="/dump" 
          className="text-sm font-semibold text-muted hover:text-primary transition-colors flex items-center gap-2"
        >
          Start a new session
        </Link>
      </div>
    </div>
  );
}
