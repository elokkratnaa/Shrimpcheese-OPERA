import React from "react";

export default function Stats() {
  const stats = [
    { value: "10k+", label: "Decisions Resolved" },
    { value: "40%", label: "Overthinking Reduced" },
    { value: "85%", label: "Commitment Rate" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 flex justify-between items-center">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col gap-1 text-center">
          <span className="text-5xl font-bold text-white">{stat.value}</span>
          <span className="text-sm text-white/60 font-medium">{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
