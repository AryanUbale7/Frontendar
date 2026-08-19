"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bot,
  Palette,
  Cloud,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WHAT_WE_ORGANIZE } from "@/constants/landing-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
};

const EXTRA_METRICS: Record<string, { label: string; icon: React.ElementType }> = {
  "org-1": { label: "50+ Web Sprints", icon: Zap },
  "org-2": { label: "Agentic LLM Pipelines", icon: Bot },
  "org-3": { label: "Pixel-Perfect Tokens", icon: Palette },
  "org-4": { label: "Cloud & API Infrastructure", icon: Cloud },
  "org-5": { label: "Cash Prize Bounties", icon: Trophy },
  "org-6": { label: "500+ Active Builders", icon: Users },
};

export function WhatWeOrganizeSection() {
  const [activeIndex, setActiveIndex] = useState(1);
  const isScrollingRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % WHAT_WE_ORGANIZE.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + WHAT_WE_ORGANIZE.length) % WHAT_WE_ORGANIZE.length);
  };

  // Mouse wheel scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    if (isScrollingRef.current) return;
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      isScrollingRef.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    }
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section id="what-we-organize" className="py-16 md:py-24 bg-[#F8FAFC] overflow-hidden select-none">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">
            Event Spectrum
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            What We Organize
          </h2>
          <p className="text-base text-[#475569]">
            From 48-hour hackathon sprints to month-long innovation challenges, explore
            our official developer competitions.
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium pt-1">
            <Zap className="h-3.5 w-3.5 text-[#0F172A]" />
            Use mouse wheel or drag to navigate cards
          </span>
        </div>

        {/* 3D Coverflow Carousel Container with Wheel & Touch Listeners */}
        <div
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full py-4 flex flex-col items-center justify-center min-h-[420px]"
        >
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous category"
            className="absolute left-2 md:left-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next category"
            className="absolute right-2 md:right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* 3D Cards Stage */}
          <div
            className="relative w-full max-w-5xl h-[360px] flex items-center justify-center"
            style={{ perspective: "1100px" }}
          >
            {WHAT_WE_ORGANIZE.map((item, idx) => {
              const Icon = ICON_MAP[item.iconName] || Code2;
              const metric = EXTRA_METRICS[item.id] || { label: "Official Arena Track", icon: ShieldCheck };
              const MetricIcon = metric.icon;

              // Calculate offset relative to activeIndex
              let offset = idx - activeIndex;
              const total = WHAT_WE_ORGANIZE.length;
              if (offset < -Math.floor(total / 2)) offset += total;
              if (offset > Math.floor(total / 2)) offset -= total;

              const isActive = offset === 0;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              // Transforms according to depth perspective
              const xOffset = offset * 230;
              const scale = isActive ? 1 : Math.abs(offset) === 1 ? 0.86 : 0.72;
              const rotateY = offset * -16;
              const zIndex = 30 - Math.abs(offset) * 10;
              const opacity = isActive ? 1 : Math.abs(offset) === 1 ? 0.85 : 0.55;

              return (
                <motion.div
                  key={item.id}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    x: xOffset,
                    scale: scale,
                    rotateY: rotateY,
                    zIndex: zIndex,
                    opacity: opacity,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                  }}
                  className={`absolute w-[290px] sm:w-[340px] cursor-pointer transition-shadow ${
                    isActive ? "drop-shadow-2xl" : "drop-shadow-md"
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  <Card
                    className={`h-[330px] flex flex-col justify-between rounded-3xl border overflow-hidden transition-all duration-300 ${
                      isActive
                        ? "border-[#0F172A] bg-white ring-4 ring-[#0F172A]/15 shadow-2xl"
                        : "border-[#E2E8F0] bg-white/95 hover:border-[#0F172A]/30"
                    }`}
                  >
                    {/* Top Decorative Gradient Line */}
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${
                        isActive
                          ? "from-[#0F172A] via-[#FF8A00] to-[#FFD60A]"
                          : "from-[#CBD5E1] to-[#E2E8F0]"
                      }`}
                    />

                    <CardHeader className="space-y-5 p-6 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#FFD60A] text-white shadow-lg transition-transform duration-300 ${
                            isActive ? "scale-105 shadow-[#0F172A]/30" : ""
                          }`}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <Badge
                          variant={isActive ? "solid" : "outline"}
                          size="sm"
                          className={isActive ? "bg-[#0F172A] text-white font-bold" : "text-[#475569]"}
                        >
                          {item.tag}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <CardTitle className="text-xl font-bold text-[#0F172A] tracking-tight">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-[#475569] line-clamp-3">
                          {item.description}
                        </CardDescription>
                      </div>

                      {/* Bottom Metric Badge with Lucide SVG Icon */}
                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                          <MetricIcon className="h-3.5 w-3.5 text-[#0F172A]" />
                          <span>{metric.label}</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                          {isActive ? "Active View" : "Click to view"}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Carousel Pagination Dots */}
          <div className="flex items-center gap-2 mt-8 z-40">
            {WHAT_WE_ORGANIZE.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? "w-8 bg-[#0F172A]"
                    : "w-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
