"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import CommitButton from "@/app/components/shared/CommitButton";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ProConOption {
  option: string;
  pros: string[];
  cons: string[];
  weight: number;
}

interface VerdictData {
  verdict_id: string;
  verdict_summary: string;
  pro_con_matrix: ProConOption[];
  recommendation: string;
  next_steps: string[];
  is_committed: boolean;
}

export default function VerdictPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const sseConnected = useRef(false);

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
    if (authChecking || !id) return;

    async function loadVerdict() {
      try {
        const response = await fetch(`/api/verdicts/${id}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setVerdict(data);
          setIsCommitted(data.is_committed);
          setSummaryText(data.verdict_summary || "");
          setLoading(false);
        } else {
          startStreaming();
        }
      } catch (err: unknown) {
        console.error("Error loading verdict:", err);
        startStreaming();
      }
    }

    function startStreaming() {
      if (sseConnected.current) return;
      sseConnected.current = true;
      setIsStreaming(true);
      setLoading(false);

      const eventSource = new EventSource(`/api/sessions/${id}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.token) {
            setSummaryText((prev) => prev + parsed.token);
          }

          if (parsed.verdict) {
            const fullVerdict = parsed.verdict;
            setVerdict(fullVerdict);
            setIsCommitted(fullVerdict.is_committed);
            setSummaryText(fullVerdict.verdict_summary);
            setIsStreaming(false);
            eventSource.close();
          }
        } catch (err: unknown) {
          console.error("Error parsing stream token:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE stream error:", err);
        setIsStreaming(false);
        eventSource.close();
        setErrorMessage("Failed to stream verdict. Please refresh or try again.");
      };

      return () => {
        eventSource.close();
      };
    }

    loadVerdict();
  }, [id, authChecking]);

  const handleCommit = async () => {
    if (!verdict) return;
    setErrorMessage("");

    try {
      const response = await fetch(`/api/verdicts/${verdict.verdict_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_committed: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to commit decision. Please try again.");
      }

      setIsCommitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      setErrorMessage(message);
      console.error(err);
    }
  };

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  const proConMatrix = verdict?.pro_con_matrix || [];
  const recommendation = verdict?.recommendation;
  const nextSteps = verdict?.next_steps || [];

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between font-sans pb-16">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-12 md:py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
            THE VERDICT
          </span>
        </div>

        <div className="text-[#3d3d3a] text-[16px] leading-[1.55] whitespace-pre-wrap font-sans">
          {summaryText}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[#cc785c] ml-1 animate-pulse">|</span>
          )}
        </div>

        {!isStreaming && proConMatrix.length > 0 && (
          <section className="flex flex-col gap-8 border-t border-[#e6dfd8] pt-8">
            <h2 className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
              PRO/CON MATRIX
            </h2>

            <div className="flex flex-col gap-8">
              {proConMatrix.map((optionData, idx) => (
                <div key={idx} className="flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-[#141413] font-sans">
                    {optionData.option}
                  </h3>

                  <div className="w-full h-1 bg-[#e6dfd8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5db8a6] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, optionData.weight * 100))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                    <div className="flex flex-col gap-2.5">
                      {optionData.pros.map((pro, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-sm text-[#3d3d3a] font-sans">
                          <span className="w-2 h-2 rounded-full bg-[#5db872] shrink-0 mt-1.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {optionData.cons.map((con, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2 text-sm text-[#3d3d3a] font-sans">
                          <span className="w-2 h-2 rounded-full bg-[#c64545] shrink-0 mt-1.5" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isStreaming && recommendation && (
          <section className="bg-[#efe9de] rounded-lg p-8 border border-[#e6dfd8] flex flex-col gap-4">
            <span className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
              WHAT OPERA RECOMMENDS
            </span>
            <p className="text-[22px] font-normal leading-tight tracking-normal text-[#141413] font-serif">
              {recommendation}
            </p>
          </section>
        )}

        {!isStreaming && nextSteps.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
              NEXT STEPS
            </h2>

            <div className="flex flex-col gap-6">
              {nextSteps.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-4">
                  <span className="text-[28px] font-normal leading-none tracking-tight text-[#cc785c] font-serif shrink-0">
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[#3d3d3a] text-[16px] leading-[1.55] pt-1 font-sans">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isStreaming && verdict && (
          <div className="border-t border-[#e6dfd8] pt-8 flex flex-col gap-4">
            {errorMessage && (
              <div className="text-xs font-medium text-[#c64545] border-l-2 border-[#c64545] pl-3 py-1 bg-[rgba(198,69,69,0.05)] rounded-r font-sans">
                {errorMessage}
              </div>
            )}
            <CommitButton onCommit={handleCommit} isCommitted={isCommitted} />
          </div>
        )}
      </main>
    </div>
  );
}
