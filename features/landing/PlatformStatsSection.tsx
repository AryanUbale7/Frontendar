"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMMUNITY_STATS } from "@/constants/landing-data";

interface AnimatedCounterProps {
  value: string;
}

function AnimatedCounter({ value }: AnimatedCounterProps) {
  const numericPart = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
  const suffix = value.replace(/[0-9]/g, "");
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = numericPart;
    if (start === end) return;

    const duration = 2000; // 2 seconds animation duration
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing: easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      const currentValue = Math.floor(easeProgress * (end - start) + start);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isInView, numericPart]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function PlatformStatsSection() {
  return (
    <section id="community-impact" className="py-16 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">
            Community Scale
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Our Community Impact
          </h2>
          <p className="text-base text-[#475569]">
            Growing a global network of ambitious developers, creators, and partner institutions.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {COMMUNITY_STATS.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="p-4 sm:p-6 text-center space-y-2 hover:border-[#FF006E]/40 hover:shadow-lg transition-all duration-300">
                <span className="font-heading text-3xl sm:text-5xl font-extrabold text-[#FF006E] block">
                  <AnimatedCounter value={stat.value} />
                </span>
                <h4 className="font-heading text-base font-bold text-[#0F172A]">
                  {stat.label}
                </h4>
                <p className="text-xs text-[#475569]">{stat.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
