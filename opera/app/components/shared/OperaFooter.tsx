"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function OperaFooter() {
  const currentYear = 2026; // As per specification
  const t = useTranslations("Footer");

  const productLinks = [
    { label: t("links.howItWorks"), href: "#how-it-works" },
    { label: t("links.mindDump"), href: "/dump" },
    { label: t("links.councilRoom"), href: "/session" },
    { label: t("links.verdicts"), href: "#" },
    { label: t("links.soloChat"), href: "/chat" },
  ];

  const companyLinks = [
    { label: t("links.about"), href: "#" },
    { label: t("links.theCouncil"), href: "#" },
    { label: t("links.manifesto"), href: "#" },
    { label: t("links.careers"), href: "#" },
  ];

  const legalLinks = [
    { label: t("links.privacy"), href: "#" },
    { label: t("links.terms"), href: "#" },
    { label: t("links.security"), href: "#" },
    { label: t("links.cookie"), href: "#" },
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
              {t("tagline")}
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <span className={titleClass}>{t("product")}</span>
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
            <span className={titleClass}>{t("company")}</span>
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
            <span className={titleClass}>{t("legal")}</span>
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
            {t("copyright")}
          </p>
          <div className="mt-4 md:mt-0">
            {/* Right side empty as per spec */}
          </div>
        </div>
      </div>
    </footer>
  );
}
