"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-dark-shell/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          OPERA
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        <Link href="/login">
          <Button className="bg-primary hover:bg-primary-active text-white font-semibold h-10 px-6 rounded-md">
            Get Started
          </Button>
        </Link>
      </div>
    </nav>
  );
}
