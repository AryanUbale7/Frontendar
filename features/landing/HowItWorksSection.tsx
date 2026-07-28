"use client";

import React from "react";
import { motion } from "framer-motion";
import { Timeline } from "@/components/design-system/Timeline";
import { Badge } from "@/components/ui/badge";
import { SIX_STEP_TIMELINE } from "@/constants/landing-data";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">
            Participant Journey
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            How It Works
          </h2>
          <p className="text-base text-[#475569]">
            From registration to live winner reveals — six simple steps to compete in any
            Frontend Arena hackathon.
          </p>
        </div>

        {/* Timeline Component Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl rounded-[16px] border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-xs"
        >
          <Timeline events={SIX_STEP_TIMELINE} />
        </motion.div>
      </div>
    </section>
  );
}
