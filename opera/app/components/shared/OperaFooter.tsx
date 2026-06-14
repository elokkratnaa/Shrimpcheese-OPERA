"use client";

import React from "react";
import Link from "next/link";

export default function OperaFooter() {
  const currentYear = 2026; // As per specification

  const productLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "The Mind Dump", href: "/dump" },
    { label: "Council Room", href: "/session" },
    { label: "Verdicts", href: "#" },
    { label: "Solo Chat", href: "/chat" },
  ];

  const companyLinks = [
    { label: "About OPERA", href: "#" },
    { label: "The Council", href: "#" },
    { label: "Manifesto", href: "#" },
    { label: "Careers", href: "#" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ];

  const linkClass = "text-sm text-on-dark-soft hover:text-on-dark transition-colors duration-200";
  const titleClass = "text-[12px] font-medium tracking-[1.5px] uppercase text-on-dark mb-6 block";

  return (
    <footer className="w-full bg-surface-dark py-24 px-6 md:px-12 border-t border-surface-dark-elevated">
      <div className="max-w-7xl mx-auto">
        {/* Row 1: Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Col 1: Wordmark + Tagline */}
          <div className="flex flex-col items-start">
            <span className="text-2xl font-bold font-serif tracking-tight text-on-dark mb-4">
              OPERA
            </span>
            <p className="text-sm text-on-dark-soft leading-relaxed max-w-[200px]">
              Structured decision orchestration.
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <span className={titleClass}>Product</span>
            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <span className={titleClass}>Company</span>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <span className={titleClass}>Legal</span>
            <ul className="space-y-4">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 2: Copyright */}
        <div className="pt-8 border-t border-surface-dark-elevated flex flex-col md:flex-row justify-between items-start md:items-center">
          <p className="text-sm text-on-dark-soft">
            © {currentYear} OPERA. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            {/* Right side empty as per spec */}
          </div>
        </div>
      </div>
    </footer>
  );
}
