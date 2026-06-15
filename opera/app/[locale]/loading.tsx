"use client";
import React from "react";
import { motion } from "framer-motion";
export default function OperaLoader() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* ICY LAVENDER & BLUE FLUID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(165,224,255,0.45)_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(112,195,255,0.35)_0%,transparent_60%)] blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-15%] w-[65vw] h-[65vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,195,255,0.55)_0%,transparent_65%)] blur-[140px]" />
        <div className="absolute top-[15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(238,210,255,0.45)_0%,transparent_60%)] blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1.5px] border-dashed border-[#6366F1]/60 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-7 h-7 border-[2px] border-slate-700 rounded-[40%] flex items-center justify-center"
          >
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2.5 h-2.5 bg-[#0EA5E9] rounded-full" 
            />
          </motion.div>
        </div>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase font-sans"
        >
          Thinking
        </motion.p>
      </div>
    </div>
  );
}