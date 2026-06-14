"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import OperaNav from "@/app/components/shared/OperaNav";
import PersonaBubble from "@/app/components/shared/PersonaBubble";
import ConflictFlag from "@/app/components/shared/ConflictFlag";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface DebateUtterance {
  debate_id: string;
  persona_name: string;
  message_content: string;
  turn_sequence: number;
}

interface SessionData {
  session_id: string;
  current_status: string;
  detected_biases: {
    core_decision_node?: string;
    contradictions?: string[];
    constraints?: string[];
    dependencies?: string[];
  } | null;
}

export default function CouncilRoomPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();

  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [debates, setDebates] = useState<DebateUtterance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

    async function loadInitialData() {
      try {
        const [sessionRes, debatesRes] = await Promise.all([
          fetch(`/api/sessions/${id}`, { cache: "no-store" }),
          fetch(`/api/sessions/${id}/council`, { cache: "no-store" }),
        ]);

        if (!sessionRes.ok || !debatesRes.ok) {
          throw new Error("Failed to load council room data");
        }

        const sessionData = await sessionRes.json();
        const debatesData = await debatesRes.json();

        setSession(sessionData);
        setDebates(debatesData);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [id, authChecking]);

  useEffect(() => {
    if (
      authChecking ||
      !id ||
      !session ||
      session.current_status === "completed" ||
      session.current_status === "failed"
    ) {
      return;
    }

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const [sessionRes, debatesRes] = await Promise.all([
          fetch(`/api/sessions/${id}`, { cache: "no-store" }),
          fetch(`/api/sessions/${id}/council`, { cache: "no-store" }),
        ]);

        if (!sessionRes.ok || !debatesRes.ok) return;

        const sessionData = await sessionRes.json();
        const debatesData = await debatesRes.json();

        if (isSubscribed) {
          setSession(sessionData);
          setDebates(debatesData);

          if (
            sessionData.current_status === "completed" ||
            sessionData.current_status === "failed"
          ) {
            clearInterval(interval);
          }
        }
      } catch (err: unknown) {
        console.error("Polling error in council room:", err);
      }
    }, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [id, authChecking, session]);

  if (authChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-[#cc785c]" />
      </div>
    );
  }

  let contradictions: string[] = [];
  let coreDecisionNode = "Analyzing decision...";

  if (session?.detected_biases) {
    const biases =
      typeof session.detected_biases === "string"
        ? JSON.parse(session.detected_biases)
        : session.detected_biases;

    if (biases.contradictions && Array.isArray(biases.contradictions)) {
      contradictions = biases.contradictions;
    }
    if (biases.core_decision_node) {
      coreDecisionNode = biases.core_decision_node;
    }
  }

  const uniquePersonas = Array.from(
    new Set(debates.map((d) => d.persona_name)),
  );
  const getPersonaVariant = (name: string): "a" | "b" | "c" => {
    const index = uniquePersonas.indexOf(name);
    if (index === 0) return "a";
    if (index === 1) return "b";
    return "c";
  };

  const isDebateFinished = session?.current_status === "completed";

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between font-sans relative pb-24">
      <OperaNav variant="authed" />

      <main className="flex-1 max-w-200 mx-auto w-full px-4 py-12 md:py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <span className="text-[12px] font-semibold tracking-[1.5px] text-[#6c6a64] uppercase font-sans">
            THE COUNCIL ROOM
          </span>
          <h1 className="text-[28px] font-normal leading-tight tracking-[-0.3px] text-[#141413] font-serif">
            {coreDecisionNode}
          </h1>

          {contradictions.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              {contradictions.map((message, i) => (
                <ConflictFlag key={i} message={message} />
              ))}
            </div>
          )}
        </div>

        <section className="flex flex-col gap-6">
          {debates.map((utterance, index) => {
            const variant = getPersonaVariant(utterance.persona_name);
            return (
              <div
                key={utterance.debate_id}
                className="transition-all duration-300"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: "both",
                }}
              >
                <PersonaBubble
                  persona_name={utterance.persona_name}
                  message_content={utterance.message_content}
                  variant={variant}
                />
              </div>
            );
          })}

          {session?.current_status === "processing" && debates.length === 0 && (
            <div className="flex justify-center items-center py-12 gap-3 text-sm text-[#6c6a64]">
              <Loader2 className="animate-spin h-5 w-5 text-[#cc785c]" />
              <span>Personas are preparing to enter the Council Room...</span>
            </div>
          )}
        </section>
      </main>

      {isDebateFinished && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#f5f0e8] border-t border-[#e6dfd8] py-4 px-6 z-40">
          <div className="max-w-200 mx-auto flex justify-end">
            <button
              onClick={() => router.push(`/session/${id}/verdict`)}
              className="px-8 py-3.5 h-12 bg-[#cc785c] text-white hover:bg-[#a9583e] font-medium text-sm rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[#cc785c] focus:ring-offset-2 cursor-pointer font-sans"
            >
              See the verdict
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
