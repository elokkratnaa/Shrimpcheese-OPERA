import React from "react";

export default function ProductOverview() {
  const rows = [
    { title: "Structured Analysis", desc: "Break down complex decisions into manageable steps." },
    { title: "Persona-based Insights", desc: "Get feedback from diverse archetypes." },
    { title: "Commit with Confidence", desc: "Move from analysis to action." },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 flex flex-col gap-24">
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl font-bold text-white tracking-tight">{row.title}</h2>
            <p className="text-xl text-white/60">{row.desc}</p>
          </div>
          <div className="aspect-video bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center text-white/20">
            [Product Feature Screenshot]
          </div>
        </div>
      ))}
    </section>
  );
}
