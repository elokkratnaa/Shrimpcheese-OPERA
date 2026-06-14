"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PersonaBubbleProps {
  persona_name: string;
  message_content: string;
  variant: "a" | "b" | "c";
  isStreaming?: boolean;
}

export default function PersonaBubble({
  persona_name,
  message_content,
  variant,
  isStreaming = false,
}: PersonaBubbleProps) {
  // Styles based on variants mapped to design specs
  const bubbleStyles = {
    a: {
      bg: "bg-[rgba(93,184,166,0.10)]",
      border: "border-[rgba(93,184,166,0.20)]",
      textAccent: "text-[#5db8a6]",
    },
    b: {
      bg: "bg-[rgba(232,165,90,0.10)]",
      border: "border-[rgba(232,165,90,0.20)]",
      textAccent: "text-[#e8a55a]",
    },
    c: {
      bg: "bg-[rgba(204,120,92,0.10)]",
      border: "border-[rgba(204,120,92,0.20)]",
      textAccent: "text-[#cc785c]",
    },
  };

  const activeStyle = bubbleStyles[variant];

  return (
    <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* persona name in caption-uppercase */}
      <span
        className={`text-[12px] font-medium tracking-[1.5px] uppercase px-1 ${activeStyle.textAccent}`}
      >
        {persona_name}
      </span>

      {/* message bubble using shadcn Card */}
      <Card
        className={`rounded-lg border shadow-sm ring-0 ${activeStyle.bg} ${activeStyle.border}`}
      >
        <CardContent className="p-6">
          <p className="text-[#3d3d3a] text-[16px] leading-[1.55] whitespace-pre-wrap">
            {message_content}
            {isStreaming && (
              <span className="inline-block w-0.75 h-3.75 bg-[#cc785c] ml-1 animate-pulse" />
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
