import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24">
      <h2 className="text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full space-y-4">
        {["How does it work?", "Is my data safe?", "Can I cancel anytime?"].map((q, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-white/[0.04] border-white/[0.08] rounded-xl px-6">
            <AccordionTrigger className="text-white font-medium">{q}</AccordionTrigger>
            <AccordionContent className="text-white/60">
              This is the answer to the question.
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
