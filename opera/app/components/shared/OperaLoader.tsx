import React from 'react';

export default function OperaLoader() {
  const letters = ['O', 'P', 'E', 'R', 'A'];
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-canvas z-[9999]">
      <div className="flex space-x-2 mb-8">
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
      <div className="w-48 h-[2px] bg-surface-card overflow-hidden">
        <div 
          className="h-full bg-primary animate-progress-load origin-left" 
        />
      </div>
    </div>
  );
}
