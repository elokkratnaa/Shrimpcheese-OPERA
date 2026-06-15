import React from "react";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="relative py-24 px-6 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[300px] bg-primary/20 blur-[100px] rounded-full -z-10" />
      <h2 className="text-4xl font-bold text-white mb-8">Ready to decide?</h2>
      <Button className="bg-primary hover:bg-primary-active text-white font-semibold h-14 px-8 rounded-md text-base">
        Get Started
      </Button>
    </section>
  );
}
