"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface DebateTurn {
  persona_name: string;
  message_content: string;
}

export default function LiveDebatePanel({ sessionId }: { sessionId: string }) {
  const [turns, setTurns] = useState<DebateTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Council");

  useEffect(() => {
    const eventSource = new EventSource(`/api/sessions/${sessionId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Assuming the stream sends debate turns
        if (data.persona_name && data.message_content) {
          setTurns((prev) => [
            ...prev,
            {
              persona_name: data.persona_name,
              message_content: data.message_content,
            },
          ]);
        }
      } catch (e) {
        console.error("Error parsing stream data:", e);
      }
    };

    return () => eventSource.close();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <div className="bg-glass rounded-lg p-6 h-full flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
        {t("title")}
      </h3>
      <div className="flex-1 overflow-y-auto space-y-4" ref={scrollRef}>
        {turns.map((turn, i) => (
          <div key={i} className="text-sm">
            <span className="font-semibold text-primary">
              {turn.persona_name}:
            </span>{" "}
            <span className="text-ink">{turn.message_content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
