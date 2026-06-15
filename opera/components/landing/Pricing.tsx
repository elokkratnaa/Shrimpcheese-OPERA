import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils";

export default function Pricing() {
  const tiers = [
    { name: "Basic", price: "$0", featured: false },
    { name: "Pro", price: "$29", featured: true },
    { name: "Enterprise", price: "Custom", featured: false },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, i) => (
          <div key={i} className={cn(
            "rounded-2xl p-8 flex flex-col gap-6 border backdrop-blur-sm",
            tier.featured 
              ? "bg-primary/10 border-primary" 
              : "bg-white/[0.04] border-white/[0.08]"
          )}>
            <h3 className="text-xl font-bold text-white">{tier.name}</h3>
            <span className="text-4xl font-bold text-white">{tier.price}</span>
            <Button className={cn("w-full", tier.featured ? "bg-primary hover:bg-primary-active" : "bg-white/[0.04]")}>
              Choose Plan
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
