"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide preloader after 1.8 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    
    // Prevent scrolling while preloader is active
    document.body.style.overflow = "hidden";
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.03,
            transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black select-none pointer-events-auto"
        >
          {/* Central Logo & Progress Block */}
          <div className="relative flex flex-col items-center">
            
            {/* Pulsing Logo Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-black p-1 shadow-lg border border-slate-900"
            >
              <img
                src="/logo.png"
                alt="Frontend Arena Logo"
                className="h-full w-full object-contain"
              />
            </motion.div>

            {/* Brand Title Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <h2 className="font-heading text-lg font-black text-white tracking-[0.2em] leading-none">
                FRONTEND ARENA
              </h2>
              <p className="text-[9px] font-bold text-slate-500 tracking-[0.25em] uppercase mt-2.5">
                BUILD • COMPETE • INNOVATE
              </p>
            </motion.div>

            {/* Sliding Monochrome Progress Line */}
            <div className="mt-8 w-28 h-[1px] bg-slate-900 overflow-hidden relative rounded-full">
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut"
                }}
                className="absolute top-0 bottom-0 w-1/2 bg-white rounded-full"
              />
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
