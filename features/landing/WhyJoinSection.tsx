"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  FolderGit2,
  Award,
  Trophy,
  Network,
  HeartHandshake,
  Layers,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WHY_JOIN_BENEFITS } from "@/constants/landing-data";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  FolderGit2,
  Award,
  Trophy,
  Network,
  HeartHandshake,
  Layers,
  Star,
};

export function WhyJoinSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(4);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swiping states for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setVisibleCards(4);
      } else if (window.innerWidth >= 768) {
        setVisibleCards(2);
      } else {
        setVisibleCards(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, WHY_JOIN_BENEFITS.length - visibleCards);

  // Auto-reset index if resized past bounds
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Auto-scroll logic with pause-on-hover
  useEffect(() => {
    if (maxIndex === 0 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [maxIndex, currentIndex, isHovered]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section id="why-join" className="py-16 md:py-24 bg-white border-t border-[#E2E8F0] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="default" size="sm">
            Developer Growth
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Why Join Frontend Arena
          </h2>
          <p className="text-base text-[#475569]">
            Everything you gain by participating in official Frontend Arena hackathons
            and developer challenges.
          </p>
        </div>

        {/* Carousel Slider Container */}
        <div
          className="relative px-2 md:px-10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#00E5FF] shadow-md hover:bg-[rgba(0,229,255,0.08)] hover:border-[#00E5FF]/40 transition-all duration-300 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#00E5FF] shadow-md hover:bg-[rgba(0,229,255,0.08)] hover:border-[#00E5FF]/40 transition-all duration-300 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Carousel Window */}
          <div
            className="overflow-hidden py-4 -my-4 touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <motion.div
              className="flex -mx-3"
              animate={{ x: `-${currentIndex * (100 / visibleCards)}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
            >
              {WHY_JOIN_BENEFITS.map((item) => {
                const Icon = ICON_MAP[item.iconName] || Trophy;

                return (
                  <div
                    key={item.id}
                    className="px-3 w-full md:w-1/2 lg:w-1/4 shrink-0 flex-grow-0"
                  >
                    <Card className="h-full p-6 space-y-4 hover:border-[#00E5FF]/40 hover:shadow-md transition-all duration-300 bg-white border border-[#E2E8F0]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#00E5FF]/10 text-[#00E5FF]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base font-bold text-[#0F172A]">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#475569] leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </Card>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Dot Indicators / Navigation dots */}
        {maxIndex > 0 && (
          <div className="flex justify-center gap-2 pt-2">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  currentIndex === idx
                    ? "bg-[#00E5FF] w-6"
                    : "bg-[#E2E8F0] hover:bg-[#00E5FF]/40 w-2"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
