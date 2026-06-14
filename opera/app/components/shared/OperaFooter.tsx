"use client";

import React, { useState, useEffect } from "react";

export default function OperaFooter() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-[#181715] text-[#a09d96] py-16 px-6 md:px-12 border-t border-[#252320]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Left col: wordmark */}
        <div className="flex flex-col justify-between md:col-span-1">
          <span className="text-2xl font-bold font-serif tracking-wider text-[#faf9f5]">
            OPERA
          </span>
          <p className="text-xs text-[#6c6a64] mt-4">
            © {year ?? ""} OPERA. Structured decision orchestration.
          </p>
        </div>
        ...
        {/* 3 link cols */}
        <div>
          <h4 className="text-sm font-semibold text-[#faf9f5] mb-4 uppercase tracking-wider">
            Product
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                The Mind Dump
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Council Room
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Verdicts
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#faf9f5] mb-4 uppercase tracking-wider">
            Company
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Performers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Research
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#faf9f5] mb-4 uppercase tracking-wider">
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#faf9f5] transition-colors">
                Security
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
