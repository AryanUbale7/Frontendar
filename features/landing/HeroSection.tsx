"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Gauge,
  GitPullRequest,
  Zap,
  Sparkles,
  Award,
  Users,
  Code2,
  Terminal,
  Activity,
  Check,
  CheckCircle,
  FileCheck,
  Cpu,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// Count up animation component for stats
function CountUp({
  end,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out cubic function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * end);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#FCFCFD]"
    >
      {/* Background Ambient Glowing Orbs & Radial Gradients */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-[#2563EB]/10 via-[#6366F1]/05 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[650px] h-[650px] bg-gradient-to-bl from-[#8B5CF6]/10 via-[#F97316]/08 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-gradient-to-t from-[#2563EB]/08 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Grid & Dot Patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Grid Layout: Left 45% / Right 55% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT CONTENT (45% -> 5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col space-y-8 text-left">
            
            {/* Enterprise Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E2E8F0] shadow-xs text-xs font-semibold text-[#0F172A] backdrop-blur-md hover:border-[#2563EB]/40 transition-colors">
                <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-sm">✨</span>
                <span className="font-heading text-[#0F172A] tracking-tight">
                  Enterprise Hackathon Platform
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-[#64748B]" />
              </div>
            </motion.div>

            {/* Headline with animated gradient text only on "Compete." and "Automatically." */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-1"
            >
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.1]">
                Build.
              </h1>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                <span className="animate-hero-gradient-text">Compete.</span>
              </h1>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.1]">
                Get Evaluated.
              </h1>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                <span className="animate-hero-gradient-text">Automatically.</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl font-normal"
            >
              Frontend Arena is a next-generation hackathon platform featuring
              automated code evaluation, AI-assisted problem alignment, transparent
              scoring, enterprise-grade reports, and real-time leaderboards.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              {/* Primary CTA */}
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#featured-hackathons"
                  className="relative group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#8B5CF6] text-white font-heading font-bold text-sm shadow-lg shadow-[#2563EB]/25 overflow-hidden transition-all"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">Explore Hackathons</span>
                  <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>

              {/* Secondary CTA */}
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/80 border border-[#E2E8F0] text-[#0F172A] font-heading font-semibold text-sm shadow-sm backdrop-blur-md hover:bg-white hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                    <Play className="h-3 w-3 fill-current ml-0.5" />
                  </div>
                  <span>Watch Demo</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Trust Indicators / Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 flex items-center gap-4 border-t border-[#E2E8F0]/60"
            >
              {/* Developer Avatars Stack */}
              <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-[#2563EB] to-[#6366F1] text-white text-[10px] font-bold flex items-center justify-center">
                  JD
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-[#8B5CF6] to-[#F97316] text-white text-[10px] font-bold flex items-center justify-center">
                  AK
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-[#22C55E] to-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                  SL
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-[#F59E0B] to-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                  +5K
                </div>
              </div>

              <div className="text-xs text-[#64748B]">
                <span className="font-bold text-[#0F172A]">5,000+ developers</span> &{" "}
                <span className="font-bold text-[#0F172A]">100+ organizations</span> trust Frontend Arena.
              </div>
            </motion.div>
          </div>

          {/* RIGHT CONTENT (55% -> 7 cols on lg) */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[520px] md:min-h-[620px] mt-8 lg:mt-0">
            
            {/* Ambient Multi-color Radial Glow Backdrop */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-[75%] rounded-full bg-gradient-to-tr from-[#2563EB]/25 via-[#8B5CF6]/20 to-[#F97316]/20 blur-[90px] transform rotate-12 animate-pulse duration-10000" />
            </div>

            {/* FLOATING LAPTOP PRESENTATION CONTAINER */}
            <motion.div
              animate={{
                y: [-8, 8, -8],
                rotate: [-8.5, -7.5, -8.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-20 w-full max-w-[680px] group transition-all"
              style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Soft Drop Shadow Ellipse */}
              <div className="absolute -bottom-8 left-[10%] right-[10%] h-12 bg-black/15 blur-2xl rounded-full scale-y-50 pointer-events-none" />

              {/* LOQ Laptop Image using Next.js Image Component */}
              <div className="relative w-full h-auto drop-shadow-[0_25px_35px_rgba(37,99,235,0.18)]">
                <Image
                  src="/images/LOQ.png"
                  alt="Frontend Arena Evaluation Dashboard on Laptop"
                  width={1400}
                  height={900}
                  priority
                  quality={100}
                  sizes="(max-width:768px) 100vw, 55vw"
                  className="w-full h-auto object-contain select-none pointer-events-none"
                />

                {/* HIGH-FIDELITY DASHBOARD SCREEN OVERLAY */}
                {/* Positioned inside/over the screen frame of LOQ.png */}
                <div
                  className="absolute top-[11.8%] left-[13.2%] right-[13.2%] bottom-[22.5%] rounded-[8px] sm:rounded-[12px] bg-gradient-to-br from-[#FFFFFF] to-[#F8FAFC] overflow-hidden border border-[#E2E8F0]/90 shadow-2xl flex flex-col pointer-events-auto"
                  style={{
                    boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), 0 10px 25px rgba(15,23,42,0.12)",
                  }}
                >
                  {/* Dashboard Header Bar */}
                  <div className="h-7 sm:h-9 bg-[#F1F5F9]/90 backdrop-blur-sm border-b border-[#E2E8F0] px-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]/80 inline-block" />
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]/80 inline-block" />
                        <span className="w-2 h-2 rounded-full bg-[#22C55E]/80 inline-block" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-[#0F172A] font-heading ml-1 truncate">
                        Frontend Arena Dashboard
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[9px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
                        Evaluated Live
                      </span>
                    </div>
                  </div>

                  {/* Dashboard Main Content Body */}
                  <div className="flex-1 p-2 sm:p-3.5 overflow-hidden flex flex-col justify-between space-y-2 bg-[#FCFCFD]">
                    
                    {/* Top Row: Overall Score Ring (Left) & Score Breakdown Bars (Right) */}
                    <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
                      
                      {/* Overall Score Circular Card */}
                      <div className="col-span-5 sm:col-span-4 bg-white rounded-xl p-2 sm:p-2.5 border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                          Overall Score
                        </span>
                        
                        {/* Circular Progress Indicator */}
                        <div className="relative my-1 flex items-center justify-center">
                          <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              stroke="#E2E8F0"
                              strokeWidth="5"
                              fill="transparent"
                              className="sm:hidden"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              stroke="url(#scoreGradient)"
                              strokeWidth="5"
                              strokeDasharray={163.3}
                              strokeDashoffset={163.3 * (1 - 0.92)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="sm:hidden transition-all duration-1000"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="24"
                              stroke="#E2E8F0"
                              strokeWidth="6"
                              fill="transparent"
                              className="hidden sm:block"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="24"
                              stroke="url(#scoreGradient)"
                              strokeWidth="6"
                              strokeDasharray={150.7}
                              strokeDashoffset={150.7 * (1 - 0.92)}
                              strokeLinecap="round"
                              fill="transparent"
                              className="hidden sm:block transition-all duration-1000"
                            />
                            <defs>
                              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#2563EB" />
                                <stop offset="50%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#22C55E" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="font-mono text-sm sm:text-base font-extrabold text-[#0F172A]">
                              92
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-bold text-[#64748B]">
                              /100
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] sm:text-[10px] font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                          Excellent Grade
                        </span>
                      </div>

                      {/* Score Breakdown List */}
                      <div className="col-span-7 sm:col-span-8 bg-white rounded-xl p-2 sm:p-2.5 border border-[#E2E8F0] shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-1">
                          <span className="text-[9px] sm:text-xs font-bold text-[#0F172A]">
                            Score Breakdown
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">
                            Top 5% Submissions
                          </span>
                        </div>

                        {/* Progress Item Rows */}
                        {[
                          { name: "Code Quality", score: 94, color: "bg-[#2563EB]" },
                          { name: "Performance", score: 98, color: "bg-[#6366F1]" },
                          { name: "Accessibility", score: 95, color: "bg-[#8B5CF6]" },
                          { name: "Security", score: 100, color: "bg-[#22C55E]" },
                          { name: "Problem Alignment", score: 91, color: "bg-[#F97316]" },
                          { name: "Innovation", score: 96, color: "bg-[#2563EB]" },
                        ].map((item) => (
                          <div key={item.name} className="space-y-0.5">
                            <div className="flex justify-between text-[8px] sm:text-[10px]">
                              <span className="text-[#64748B] font-medium">{item.name}</span>
                              <span className="font-mono font-bold text-[#0F172A]">{item.score}%</span>
                            </div>
                            <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Row: Status Cards Grid */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <div className="bg-white rounded-lg p-1.5 sm:p-2 border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[8px] sm:text-[10px] font-bold text-[#0F172A] truncate">
                            Build Passed
                          </div>
                          <div className="text-[7px] sm:text-[8px] text-[#64748B] truncate font-mono">
                            0 Errors
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-1.5 sm:p-2 border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[8px] sm:text-[10px] font-bold text-[#0F172A] truncate">
                            Security Clean
                          </div>
                          <div className="text-[7px] sm:text-[8px] text-[#64748B] truncate font-mono">
                            0 Vulnerabilities
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-1.5 sm:p-2 border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center shrink-0">
                          <Gauge className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[8px] sm:text-[10px] font-bold text-[#0F172A] truncate">
                            Lighthouse 96
                          </div>
                          <div className="text-[7px] sm:text-[8px] text-[#64748B] truncate font-mono">
                            Perf: 98%
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-1.5 sm:p-2 border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
                          <GitPullRequest className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[8px] sm:text-[10px] font-bold text-[#0F172A] truncate">
                            Repo Verified
                          </div>
                          <div className="text-[7px] sm:text-[8px] text-[#64748B] truncate font-mono">
                            Git Clean
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>

            {/* 7 FLOATING GLASS CARDS PARALLAX SURROUNDING LAPTOP */}

            {/* Card 1: AI Evaluation (Top Left) */}
            <motion.div
              animate={{ y: [-6, 6, -6], x: [-3, 3, -3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-2 sm:left-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#6366F1] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading flex items-center gap-1">
                    <span>AI Evaluation</span>
                    <Check className="h-3 w-3 text-[#22C55E]" />
                  </div>
                  <div className="text-[10px] text-[#64748B]">Automated AST Analysis</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Secure Code (Top Right) */}
            <motion.div
              animate={{ y: [6, -6, 6], x: [3, -3, 3] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-2 -right-2 sm:right-2 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading">Secure Code</div>
                  <div className="text-[10px] text-[#22C55E] font-semibold">No Vulnerabilities</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Lighthouse 96 (Middle Right) */}
            <motion.div
              animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[42%] -right-4 sm:-right-6 z-30 pointer-events-none hidden md:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center">
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading">Lighthouse 96</div>
                  <div className="text-[10px] text-[#64748B]">Top Performance</div>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Repository Verified (Middle Left) */}
            <motion.div
              animate={{ y: [8, -8, 8], x: [4, -4, 4] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-[40%] -left-6 sm:-left-8 z-30 pointer-events-none hidden md:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
                  <GitPullRequest className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading">Repository Verified</div>
                  <div className="text-[10px] text-[#8B5CF6] font-semibold">Git Clean</div>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Build Passed (Bottom Left) */}
            <motion.div
              animate={{ y: [-5, 5, -5], x: [-2, 2, -2] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -bottom-2 left-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading">Build Passed</div>
                  <div className="text-[10px] text-[#2563EB] font-semibold">100% Tests Green</div>
                </div>
              </div>
            </motion.div>

            {/* Card 6: Performance Optimized (Bottom Right) */}
            <motion.div
              animate={{ y: [7, -7, 7], x: [3, -3, 3] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
              className="absolute -bottom-4 right-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-[#E2E8F0] shadow-lg shadow-black/5 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] font-heading">Performance Optimized</div>
                  <div className="text-[10px] text-[#64748B]">Zero Render Bottlenecks</div>
                </div>
              </div>
            </motion.div>

            {/* Card 7: Accessibility (Top Center Subtle Pill) */}
            <motion.div
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-24px] left-[45%] -translate-x-1/2 z-30 pointer-events-none hidden lg:block"
            >
              <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E2E8F0] shadow-sm flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span>Accessibility 100%</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* BOTTOM HERO STATS CONTAINER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 md:mt-24 relative"
        >
          <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-[#E2E8F0] p-6 md:p-8 shadow-[0_15px_40px_rgba(15,23,42,0.05)] overflow-hidden">
            {/* Subtle Gradient Accent Border Line on Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#6366F1] via-[#8B5CF6] to-[#F97316]" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]/80">
              
              {/* Stat 1: Developers */}
              <div className="flex flex-col items-center text-center pt-4 md:pt-0">
                <div className="h-10 w-10 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mb-3">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-mono tracking-tight">
                  <CountUp end={5000} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#64748B] font-heading mt-1">
                  Developers
                </div>
              </div>

              {/* Stat 2: Hackathons */}
              <div className="flex flex-col items-center text-center pt-4 md:pt-0">
                <div className="h-10 w-10 rounded-2xl bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center mb-3">
                  <Award className="h-5 w-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-mono tracking-tight">
                  <CountUp end={100} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#64748B] font-heading mt-1">
                  Hackathons
                </div>
              </div>

              {/* Stat 3: Project Evaluations */}
              <div className="flex flex-col items-center text-center pt-4 md:pt-0">
                <div className="h-10 w-10 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center mb-3">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-mono tracking-tight">
                  <CountUp end={10} suffix="K+" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#64748B] font-heading mt-1">
                  Project Evaluations
                </div>
              </div>

              {/* Stat 4: Platform Uptime */}
              <div className="flex flex-col items-center text-center pt-4 md:pt-0">
                <div className="h-10 w-10 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] font-mono tracking-tight">
                  <CountUp end={99.9} decimals={1} suffix="%" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#64748B] font-heading mt-1">
                  Platform Uptime
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
