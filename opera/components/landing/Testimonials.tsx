import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    { quote: "OPERA turned my decision paralysis into a clear roadmap.", name: "Sarah K.", role: "Founder" },
    { quote: "The persona-based feedback is surprisingly insightful.", name: "Marcus T.", role: "Strategist" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 flex flex-col gap-12">
      <div className="flex justify-between items-end">
        <h2 className="text-4xl font-bold text-white tracking-tight">Trusted by thinkers</h2>
        <div className="flex gap-2">
           <button className="p-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"><ChevronLeft /></button>
           <button className="p-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]"><ChevronRight /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm flex flex-col gap-6">
            <p className="text-xl text-white font-medium italic">"{t.quote}"</p>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-white/10" />
              <div>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-white/60">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
