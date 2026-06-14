import React from "react";
import { Link } from "@/i18n/routing";
import OperaNav from "@/app/components/shared/OperaNav";
import OperaFooter from "@/app/components/shared/OperaFooter";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const navVariant = session ? "authed" : "guest";
  const t = await getTranslations("Landing");

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant={navVariant} />

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-16 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Background Dot Grid */}
        <div
          className="absolute inset-0 z-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#e6dfd8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        <div className="relative z-10 lg:col-span-6 flex flex-col items-start text-left">
          <span className="text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-2">
            {t("hero.beta")}
          </span>
          <h1 className="text-[64px] font-normal leading-[1.05] tracking-[-1.5px] text-[#11110d] font-serif mb-8 whitespace-pre-line">
            {t("hero.headline")}
          </h1>
          <Link href="/register">
            <Button className="bg-[#cc785c] hover:bg-[#a9583e] text-white rounded-md h-12 px-8 text-[14px] font-medium cursor-pointer">
              {t("hero.cta")}
            </Button>
          </Link>
        </div>

        <div className="relative z-10 lg:col-span-6 h-175 flex items-center justify-center">
          <img
            src={"/images/coffee-plant.png"}
            className="object-contain size-full"
          />

          {/* Quote Card */}
          <div className="absolute -bottom-8 -right-8 w-80 bg-[#181715] text-[#faf9f5] rounded-lg p-6 shadow-md z-20">
            <p className="italic text-[16px] leading-[1.55] mb-4">
              "{t("hero.quote")}"
            </p>
            <span className="block text-[13px] font-medium text-[#a09d96]">
              ~ Alex P., Director
            </span>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="bg-[#efe9de] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] text-center mb-16">
            {t("process.title")}
          </h2>

          <div className="space-y-16">
            {[
              { title: t("process.step1.title"), desc: t("process.step1.desc") },
              {
                title: t("process.step2.title"),
                desc: t("process.step2.desc"),
              },
              { title: t("process.step3.title"), desc: t("process.step3.desc") },
            ].map((step, i) => (
              <div key={i} className="relative flex items-center gap-8">
                <span className="absolute -left-12 -top-6 text-[96px] font-normal text-[#141413] opacity-[0.08] select-none font-serif">
                  {i + 1}
                </span>
                <h3 className="text-[36px] font-normal leading-[1.15] tracking-[-0.5px] text-[#141413] font-serif flex-1">
                  {step.title}
                </h3>
                <div className="flex-1 text-[#3d3d3a] text-[16px] leading-[1.55] border-t border-[#e6dfd8] pt-2">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Problem Agitation */}
      <section className="bg-[#faf9f5] py-24 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h2 className="text-[36px] font-normal leading-[1.15] tracking-[-0.5px] text-[#141413] font-serif mb-16">
            {t("agitation.headline")}
          </h2>

          <div className="relative">
            {/* Soft background band */}
            <div className="absolute inset-y-8 -inset-x-20 bg-[#f5f0e8] z-0 rounded-3xl hidden md:block"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  num: "47",
                  label: t("agitation.card1.label"),
                  desc: t("agitation.card1.desc"),
                },
                {
                  num: "72",
                  label: t("agitation.card2.label"),
                  desc: t("agitation.card2.desc"),
                },
                {
                  num: "DF",
                  label: t("agitation.card3.label"),
                  desc: t("agitation.card3.desc"),
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-[#efe9de] border border-[#e6dfd8] rounded-lg p-8 text-left relative overflow-hidden h-full"
                >
                  <span className="absolute -right-4 -top-8 text-[120px] font-serif font-normal text-[#141413] opacity-[0.08] select-none">
                    {card.num}
                  </span>
                  <div className="relative z-10 h-full flex flex-col justify-end">
                    <h4 className="text-[18px] font-medium text-[#141413] mb-2">
                      {card.label}
                    </h4>
                    <p className="text-[#6c6a64] text-[14px] leading-[1.55]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Product Walkthrough */}
      <section className="bg-[#efe9de] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] text-center mb-16">
            {t("walkthrough.label")}
          </span>

          <div className="space-y-32">
            {/* Step 1: Dump */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-[#f5f0e8] border border-[#e6dfd8] rounded-lg p-8 shadow-sm">
                  <div className="h-40 w-full text-[#6c6a64] text-[16px] font-sans">
                    {t("walkthrough.step1.placeholder")}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <span className="absolute -left-8 -top-12 text-[96px] font-serif font-normal text-[#141413] opacity-[0.08] select-none">
                  01
                </span>
                <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4">
                  {t("walkthrough.step1.label")}
                </span>
                <h3 className="text-[28px] font-normal text-[#141413] font-serif mb-4">
                  {t("walkthrough.step1.title")}
                </h3>
                <p className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                  {t("walkthrough.step1.desc")}
                </p>
              </div>
            </div>

            {/* Step 2: Profiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <span className="absolute -right-8 -top-12 text-[96px] font-serif font-normal text-[#141413] opacity-[0.08] select-none">
                  02
                </span>
                <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4">
                  {t("walkthrough.step2.label")}
                </span>
                <h3 className="text-[28px] font-normal text-[#141413] font-serif mb-4">
                  {t("walkthrough.step2.title")}
                </h3>
                <p className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                  {t("walkthrough.step2.desc")}
                </p>
              </div>
              <div>
                <div className="bg-[#efe9de] border-l-4 border-[#d4a017] rounded-lg p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="flex h-5 w-5 items-center justify-center text-[#d4a017] shrink-0 pt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <circle cx="12" cy="12" r="6" />
                      </svg>
                    </span>
                    <p className="text-[#3d3d3a] text-sm font-medium">
                      {t("walkthrough.step2.conflict")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Council */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 space-y-4">
                <div className="bg-[rgba(93,184,166,0.10)] border border-[rgba(93,184,166,0.20)] rounded-lg p-6">
                  <span className="text-[12px] font-medium tracking-[1.5px] uppercase text-[#5db8a6] block mb-2">
                    THE STOIC
                  </span>
                  <p className="text-[#3d3d3a] text-[15px]">
                    {t("walkthrough.step3.stoic")}
                  </p>
                </div>
                <div className="bg-[rgba(232,165,90,0.10)] border border-[rgba(232,165,90,0.20)] rounded-lg p-6 ml-8">
                  <span className="text-[12px] font-medium tracking-[1.5px] uppercase text-[#e8a55a] block mb-2">
                    THE VENTURE CAPITALIST
                  </span>
                  <p className="text-[#3d3d3a] text-[15px]">
                    {t("walkthrough.step3.vc")}
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <span className="absolute -left-8 -top-12 text-[96px] font-serif font-normal text-[#141413] opacity-[0.08] select-none">
                  03
                </span>
                <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4">
                  {t("walkthrough.step3.label")}
                </span>
                <h3 className="text-[28px] font-normal text-[#141413] font-serif mb-4">
                  {t("walkthrough.step3.title")}
                </h3>
                <p className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                  {t("walkthrough.step3.desc")}
                </p>
              </div>
            </div>

            {/* Step 4: Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <span className="absolute -right-8 -top-12 text-[96px] font-serif font-normal text-[#141413] opacity-[0.08] select-none">
                  04
                </span>
                <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4">
                  {t("walkthrough.step4.label")}
                </span>
                <h3 className="text-[28px] font-normal text-[#141413] font-serif mb-4">
                  {t("walkthrough.step4.title")}
                </h3>
                <p className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                  {t("walkthrough.step4.desc")}
                </p>
              </div>
              <div>
                <div className="bg-[#f5f0e8] border border-[#e6dfd8] rounded-lg p-8 shadow-sm text-center">
                  <div className="mb-6 text-[#141413] font-serif text-[20px]">
                    {t("walkthrough.step4.recommendation")}
                  </div>
                  <button
                    disabled
                    className="w-full h-12 bg-[#cc785c] opacity-50 text-white rounded-md font-medium"
                  >
                    {t("walkthrough.step4.commit")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Social Proof */}
      <section className="bg-[#faf9f5] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <span className="block text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64] text-center mb-16">
            {t("social.label")}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: t("social.quote1"),
                name: "Farah M.",
                role: "Product Designer",
              },
              {
                quote: t("social.quote2"),
                name: "Rizky A.",
                role: "Freelance Dev",
              },
              {
                quote: t("social.quote3"),
                name: "Dana K.",
                role: "Grad Student",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#efe9de] rounded-lg p-8 flex flex-col justify-between"
              >
                <p className="text-[#141413] italic font-serif text-[18px] leading-[1.5] mb-6">
                  "{item.quote}"
                </p>
                <div>
                  <span className="block text-[14px] font-medium text-[#141413]">
                    {item.name}
                  </span>
                  <span className="block text-[12px] text-[#6c6a64]">
                    {item.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: Objection Handling */}
      <section className="bg-[#f5f0e8] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[28px] font-normal text-[#141413] font-serif mb-12 text-center">
            {t("faq.title")}
          </h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-[18px] font-medium text-[#141413]">
                {t("faq.q1")}
              </AccordionTrigger>
              <AccordionContent className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                {t("faq.a1")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-[18px] font-medium text-[#141413]">
                {t("faq.q2")}
              </AccordionTrigger>
              <AccordionContent className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                {t("faq.a2")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-[18px] font-medium text-[#141413]">
                {t("faq.q3")}
              </AccordionTrigger>
              <AccordionContent className="text-[#3d3d3a] text-[16px] leading-[1.55]">
                {t("faq.a3")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Band */}
      <section className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="bg-[#cc785c] text-white rounded-lg p-16 text-center">
          <h2 className="text-[28px] font-normal leading-[1.2] tracking-[-0.3px] mb-8 font-serif">
            {t("cta.headline")}
          </h2>
          <Link href="/register">
            <Button className="bg-[#faf9f5] hover:bg-[#f5f0e8] text-[#cc785c] rounded-md h-12 px-8 text-[14px] font-medium cursor-pointer">
              {t("cta.button")}
            </Button>
          </Link>
        </div>
      </section>

      <OperaFooter />
    </div>
  );
}
