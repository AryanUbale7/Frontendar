"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Heart,
  Globe,
  Cpu,
  Trophy,
  Grid,
  Zap,
  Users,
  Rocket,
} from "lucide-react";

const MARQUEE_ITEMS = [
  { text: "Innovation First", icon: Sparkles },
  { text: "Built for Developers", icon: Code2 },
  { text: "Crafted with Passion", icon: Heart },
  { text: "Open to Everyone", icon: Globe },
  { text: "Modern Frontend", icon: Cpu },
  { text: "Premium Experience", icon: Trophy },
  { text: "Pixel Perfect", icon: Grid },
  { text: "Lightning Fast", icon: Zap },
  { text: "Community Driven", icon: Users },
  { text: "Future Ready", icon: Rocket },
];

export function MarqueeBanner() {
  // Duplicate the array for a seamless loop
  const doubleItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative w-full bg-[#F8FAFC] py-4.5 overflow-hidden border-y border-[#E2E8F0] shadow-xs">
      {/* Light fading gradient overlays on the sides */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none" />

      <div className="flex w-max">
        <motion.div
          className="flex gap-16 pr-16 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 18,
            repeat: Infinity,
          }}
        >
          {doubleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3 shrink-0 select-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF006E]/10 border border-[#FF006E]/20 text-[#FF006E]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="font-code text-xs font-bold text-[#0F172A]">
                  {item.text}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
