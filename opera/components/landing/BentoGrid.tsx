import React from "react";
import { Zap, Brain, ShieldCheck } from "lucide-react";

export default function BentoGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[250px_250px] gap-6">
        {/* Main Screenshot Card */}
        <div className="md:col-span-2 md:row-span-2 bg-glass border border-white/[0.08] rounded-2xl p-6">
           <div className="size-full bg-dark-nav rounded-xl flex items-center justify-center text-white/20">
             [Product Feature Screenshot]
           </div>
        </div>

        {/* Feature Cards */}
        {[
          { icon: Zap, title: "Fast Decisions" },
          { icon: Brain, title: "Cognitive Relief" },
          { icon: ShieldCheck, title: "Safe Thinking" },
        ].map((feat, i) => (
          <div key={i} className="bg-glass border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
            <feat.icon className="size-8 text-primary" />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-white">{feat.title}</h3>
              <ul className="text-xs text-white/60 space-y-0.5">
                <li>• Point one</li>
                <li>• Point two</li>
                <li>• Point three</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
