'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function OperaLoader() {
  const letters = ['O', 'P', 'E', 'R', 'A'];
  const t = useTranslations("Loading");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const statuses = [
      t("reading"),
      t("finding"),
      t("assembling")
    ];
    // Pick a random status or cycle
    setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    
    const interval = setInterval(() => {
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [t]);
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-canvas z-[9999]">
      <div className="flex space-x-2 mb-4">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-5xl font-serif text-ink opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {letter}
          </span>
        ))}
      </div>
      
      <div className="w-48 h-[2px] bg-surface-card overflow-hidden mb-6">
        <div 
          className="h-full bg-primary animate-progress-load origin-left" 
        />
      </div>

      <p className="text-sm text-muted-soft font-sans tracking-wide animate-pulse h-5">
        {status}
      </p>
    </div>
  );
}
