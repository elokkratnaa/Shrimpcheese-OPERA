import React from 'react';

export default function SessionLoader() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
      
      {/* ICY LAVENDER & PEACH FLUID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.4)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.4)_0%,transparent_65%)] blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 bg-white/40 backdrop-blur-2xl border border-white/60 px-10 py-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
        
        {/* Soft Elegant Spinner */}
        <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Base subtle ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-white" />
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-indigo-400 border-r-rose-400 animate-spin" />
            {/* Center pulsing core */}
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
        </div>
        
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em] animate-pulse">
          Menyiapkan...
        </p>
        
      </div>
    </div>
  );
}