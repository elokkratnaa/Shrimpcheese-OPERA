"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Marquee() {
  const statement = "Structurize your thoughts. Resolve paralysis. Commit with confidence.";
  return (
    <div className="bg-dark-nav py-6 overflow-hidden border-y border-white/[0.08]">
      <motion.div 
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
      >
        {Array(20).fill(0).map((_, i) => (
          <span key={i} className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] px-8">
            {statement}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
