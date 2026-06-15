import React from "react";

export default function HowItWorks() {
  const steps = [
    { num: "01", title: "Mind Dump", desc: "Unload your thoughts." },
    { num: "02", title: "Analyze", desc: "Let the AI map contradictions." },
    { num: "03", title: "Resolve", desc: "Commit to a verdict." },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col gap-4 relative">
            <span className="text-4xl font-bold text-white/20">{step.num}</span>
            <h3 className="text-xl font-bold text-white">{step.title}</h3>
            <p className="text-white/60">{step.desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-6 left-1/2 w-full border-t border-dashed border-white/20 -z-10" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
