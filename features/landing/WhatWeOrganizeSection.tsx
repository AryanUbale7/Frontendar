"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WHAT_WE_ORGANIZE } from "@/constants/landing-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
};

export function WhatWeOrganizeSection() {
  const [activeIndex, setActiveIndex] = useState(1); // Center on 2nd card by default

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % WHAT_WE_ORGANIZE.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + WHAT_WE_ORGANIZE.length) % WHAT_WE_ORGANIZE.length);
  };

  return (
    <section id="what-we-organize" className="py-16 md:py-24 bg-[#F8FAFC] overflow-hidden">
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
        </div>

        {/* 3D Coverflow Carousel Container matching paper sketch */}
        <div className="relative w-full py-4 flex flex-col items-center justify-center min-h-[420px]">
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous category"
            className="absolute left-2 md:left-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next category"
            className="absolute right-2 md:right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* 3D Cards Stage */}
          <div
            className="relative w-full max-w-5xl h-[380px] flex items-center justify-center"
            style={{ perspective: "1100px" }}
          >
            {WHAT_WE_ORGANIZE.map((item, idx) => {
              const Icon = ICON_MAP[item.iconName] || Code2;
              
              // Calculate offset relative to activeIndex
              let offset = idx - activeIndex;
              const total = WHAT_WE_ORGANIZE.length;
              if (offset < -Math.floor(total / 2)) offset += total;
              if (offset > Math.floor(total / 2)) offset -= total;

              const isActive = offset === 0;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              // Transforms according to paper diagram depth perspective
              const xOffset = offset * 230; // Horizontal offset px
              const scale = isActive ? 1 : Math.abs(offset) === 1 ? 0.86 : 0.72;
              const rotateY = offset * -16; // 3D Y rotation
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
                  className={`absolute w-[290px] sm:w-[330px] cursor-pointer select-none transition-shadow ${
                    isActive ? "drop-shadow-2xl" : "drop-shadow-md"
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  <Card
                    className={`h-[350px] flex flex-col justify-between rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? "border-[#FF006E] bg-white ring-4 ring-[#FF006E]/15 shadow-xl"
                        : "border-[#E2E8F0] bg-white/95 hover:border-[#0F172A]/30"
                    }`}
                  >
                    <CardHeader className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#FF006E] to-[#FFD60A] text-white shadow-md">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge
                          variant={isActive ? "solid" : "outline"}
                          size="sm"
                          className={isActive ? "bg-[#FF006E] text-white" : ""}
                        >
                          {item.tag}
                        </Badge>
                      </div>

                      <CardTitle className="text-xl font-bold text-[#0F172A]">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-[#475569] line-clamp-3">
                        {item.description}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="p-6 pt-0">
                      <Button
                        asChild
                        variant={isActive ? "default" : "outline"}
                        className={`w-full ${
                          isActive
                            ? "bg-[#0F172A] hover:bg-[#FF006E] text-white"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <a
                          href="#featured-hackathons"
                          className="flex items-center justify-between w-full"
                        >
                          <span>Explore {item.title}</span>
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </CardFooter>
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
                    ? "w-8 bg-[#FF006E]"
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
