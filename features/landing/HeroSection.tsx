"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  ArrowUpRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Award,
  Users,
  Code2,
  TrendingUp,
  LayoutDashboard,
  FileCode2,
  Award as TrophyIcon,
  ChevronRight,
  Sparkles,
  BarChart3,
  HelpCircle,
  Settings,
  Flame,
  Check,
  ShieldAlert,
  Gauge,
} from "lucide-react";

// Count up animation component
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
      {/* Background Soft Glow Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-[#4F46E5]/08 via-[#6366F1]/05 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-5%] w-[650px] h-[650px] bg-gradient-to-bl from-[#8B5CF6]/08 via-[#F97316]/06 to-transparent rounded-full blur-[160px] pointer-events-none" />

      {/* Decorative Grid & Dot Patterns */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main 45% / 55% Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT CONTENT (45% -> 5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col space-y-7 text-left">
            
            {/* Small Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-xs font-semibold text-[#4F46E5] shadow-xs">
                <span className="text-sm">🚀</span>
                <span className="font-heading font-bold">
                  Automated. Transparent. Fair.
                </span>
              </div>
            </motion.div>

            {/* Headline with Animated Gradient Text on "Compete." and "Automatically." */}
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

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              {/* Primary Button */}
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#featured-hackathons"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-heading font-bold text-sm shadow-md shadow-[#4F46E5]/25 transition-all"
                >
                  <span>Explore Hackathons</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>

              {/* Secondary Button */}
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] font-heading font-semibold text-sm shadow-xs hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                    <Play className="h-3 w-3 fill-current ml-0.5" />
                  </div>
                  <span>Watch Demo</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-3 flex items-center gap-3.5"
            >
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Developer"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Developer"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Developer"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="Developer"
                />
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center">
                  +2K
                </div>
              </div>

              <div className="text-xs text-[#64748B]">
                Trusted by <span className="font-bold text-[#0F172A]">5000+</span> developers and students
              </div>
            </motion.div>
          </div>

          {/* RIGHT CONTENT (55% -> 7 cols on lg) */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[500px] md:min-h-[600px] mt-8 lg:mt-0">
            
            {/* Ambient Background Wave Accent */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[90%] h-[80%] rounded-full bg-gradient-to-tr from-[#8B5CF6]/15 via-[#4F46E5]/10 to-[#F97316]/10 blur-[100px] transform rotate-6" />
            </div>

            {/* LAPTOP PRESENTATION CONTAINER */}
            <motion.div
              animate={{
                y: [-6, 6, -6],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-20 w-full max-w-[680px]"
            >
              {/* Drop Shadow underneath */}
              <div className="absolute -bottom-6 left-[8%] right-[8%] h-10 bg-black/10 blur-xl rounded-full pointer-events-none" />

              {/* LOQ Laptop Image */}
              <div className="relative w-full h-auto">
                <Image
                  src="/images/LOQ.png"
                  alt="Frontend Arena Evaluation Dashboard on Laptop"
                  width={1400}
                  height={900}
                  priority
                  quality={100}
                  sizes="(max-width:768px) 100vw, 55vw"
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-xl"
                />

                {/* EXACT HIGH-FIDELITY DASHBOARD SCREEN OVERLAY */}
                <div
                  className="absolute top-[11.8%] left-[13.2%] right-[13.2%] bottom-[22.5%] rounded-[8px] sm:rounded-[12px] bg-white overflow-hidden border border-[#E2E8F0] shadow-2xl flex flex-col pointer-events-auto"
                >
                  {/* Dashboard Header Bar */}
                  <div className="h-8 bg-white border-b border-[#E2E8F0] px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-[#4F46E5] text-white flex items-center justify-center font-bold text-[10px]">
                        F
                      </div>
                      <span className="text-[11px] font-bold text-[#0F172A] font-heading">
                        Frontend Arena
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <img
                        className="h-5 w-5 rounded-full object-cover border border-[#E2E8F0]"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt="Aryan Ubale"
                      />
                      <div className="hidden sm:flex flex-col text-left">
                        <span className="text-[9px] font-bold text-[#0F172A] leading-tight">
                          Aryan Ubale
                        </span>
                        <span className="text-[7px] text-[#64748B] leading-tight">
                          Team Leader
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Body Container (Sidebar + Main Content) */}
                  <div className="flex-1 flex overflow-hidden bg-[#FCFCFD]">
                    
                    {/* Left Sidebar inside Laptop */}
                    <div className="w-16 sm:w-28 bg-[#F8FAFC] border-r border-[#E2E8F0] p-1.5 flex flex-col space-y-1">
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-extrabold text-[#4F46E5] bg-[#EEF2FF] rounded-md flex items-center gap-1.5">
                        <LayoutDashboard className="h-3 w-3" />
                        <span className="hidden sm:inline">Overview</span>
                      </div>
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-medium text-[#64748B] hover:bg-white rounded-md flex items-center gap-1.5">
                        <FileCode2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Submissions</span>
                      </div>
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-medium text-[#64748B] hover:bg-white rounded-md flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        <span className="hidden sm:inline">Evaluation</span>
                      </div>
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-medium text-[#64748B] hover:bg-white rounded-md flex items-center gap-1.5">
                        <BarChart3 className="h-3 w-3" />
                        <span className="hidden sm:inline">Leaderboards</span>
                      </div>
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-medium text-[#64748B] hover:bg-white rounded-md flex items-center gap-1.5">
                        <TrophyIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">Hackathons</span>
                      </div>
                      <div className="px-2 py-1 text-[8px] sm:text-[9px] font-medium text-[#64748B] hover:bg-white rounded-md flex items-center gap-1.5">
                        <Settings className="h-3 w-3" />
                        <span className="hidden sm:inline">Settings</span>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between space-y-2 overflow-hidden">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold text-[#0F172A]">
                          Evaluation Overview
                        </span>
                      </div>

                      {/* Top Metric Cards Grid */}
                      <div className="grid grid-cols-12 gap-2">
                        
                        {/* Overall Score Circle Card */}
                        <div className="col-span-5 bg-white rounded-xl p-2 border border-[#E2E8F0] flex flex-col items-center justify-center text-center shadow-2xs">
                          <span className="text-[8px] sm:text-[9px] font-bold text-[#64748B]">
                            Overall Score
                          </span>
                          
                          <div className="relative my-1 flex items-center justify-center">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="24"
                                stroke="#F1F5F9"
                                strokeWidth="5"
                                fill="transparent"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="24"
                                stroke="url(#dashboardGradient)"
                                strokeWidth="5"
                                strokeDasharray={150.7}
                                strokeDashoffset={150.7 * (1 - 0.92)}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                              <defs>
                                <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#4F46E5" />
                                  <stop offset="50%" stopColor="#6366F1" />
                                  <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="font-mono text-sm sm:text-base font-extrabold text-[#0F172A]">
                                92
                              </span>
                              <span className="text-[7px] text-[#64748B]">/100</span>
                            </div>
                          </div>

                          <span className="text-[8px] font-bold text-[#0F172A]">Excellent</span>
                          <span className="text-[7px] text-[#64748B]">Top 10% Submissions</span>
                        </div>

                        {/* Score Breakdown List Card */}
                        <div className="col-span-7 bg-white rounded-xl p-2 border border-[#E2E8F0] space-y-1 shadow-2xs">
                          <span className="text-[8px] sm:text-[9px] font-bold text-[#0F172A] block">
                            Score Breakdown
                          </span>

                          {[
                            { name: "Code Quality", val: "18/20", color: "bg-[#2563EB]", width: "90%" },
                            { name: "Performance", val: "16/20", color: "bg-[#3B82F6]", width: "80%" },
                            { name: "Accessibility", val: "13/15", color: "bg-[#8B5CF6]", width: "86%" },
                            { name: "Best Practices", val: "12/15", color: "bg-[#06B6D4]", width: "80%" },
                            { name: "SEO", val: "8/10", color: "bg-[#0EA5E9]", width: "80%" },
                            { name: "AI Alignment", val: "18/20", color: "bg-[#6366F1]", width: "90%" },
                          ].map((item) => (
                            <div key={item.name} className="space-y-0.5">
                              <div className="flex justify-between text-[7px] sm:text-[8px]">
                                <span className="text-[#64748B]">{item.name}</span>
                                <span className="font-mono font-bold text-[#0F172A]">{item.val}</span>
                              </div>
                              <div className="w-full bg-[#F1F5F9] h-1 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Status Cards Row */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-white rounded-lg p-1.5 border border-[#E2E8F0] space-y-0.5">
                          <div className="text-[7px] sm:text-[8px] text-[#64748B]">Build Status</div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-[#22C55E]">Passed</div>
                          <div className="text-[6px] sm:text-[7px] text-[#94A3B8]">All checks successful</div>
                        </div>

                        <div className="bg-white rounded-lg p-1.5 border border-[#E2E8F0] space-y-0.5">
                          <div className="text-[7px] sm:text-[8px] text-[#64748B]">Security Scan</div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-[#F97316]">No Issues</div>
                          <div className="text-[6px] sm:text-[7px] text-[#94A3B8]">0 vulnerabilities found</div>
                        </div>

                        <div className="bg-white rounded-lg p-1.5 border border-[#E2E8F0] space-y-0.5">
                          <div className="text-[7px] sm:text-[8px] text-[#64748B]">Lighthouse Score</div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-[#06B6D4]">96</div>
                          <div className="text-[6px] sm:text-[7px] text-[#94A3B8]">Performance - 96%</div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* FLOATING GLASS CARDS (Matching Reference Image) */}

            {/* Floating Card 1: Clean Code / AI Powered (Top Left) */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-6 left-2 sm:left-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex flex-col items-center text-center space-y-1">
                <div className="h-9 w-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A] font-heading">Clean Code</div>
                <div className="text-[10px] text-[#64748B]">AI Analyzed</div>
              </div>
            </motion.div>

            {/* Floating Card 2: Secure (Top Right) */}
            <motion.div
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-8 right-2 sm:right-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex flex-col items-center text-center space-y-1">
                <div className="h-9 w-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A] font-heading">Secure</div>
                <div className="text-[10px] text-[#64748B]">No Vulnerabilities</div>
              </div>
            </motion.div>

            {/* Floating Card 3: Optimized (Bottom Right) */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-6 right-2 sm:right-4 z-30 pointer-events-none hidden sm:block"
            >
              <div className="px-4 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-lg flex flex-col items-center text-center space-y-1">
                <div className="h-9 w-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A] font-heading">Optimized</div>
                <div className="text-[10px] text-[#64748B]">High Performance</div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* BOTTOM HERO STATS CONTAINER (Matching Reference Image) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 md:mt-24"
        >
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 md:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
              
              {/* Stat 1: Developers */}
              <div className="flex items-center justify-center gap-4 pt-4 md:pt-0">
                <div className="h-12 w-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
                    <CountUp end={5000} suffix="+" />
                  </div>
                  <div className="text-xs font-semibold text-[#64748B]">
                    Developers
                  </div>
                </div>
              </div>

              {/* Stat 2: Hackathons */}
              <div className="flex items-center justify-center gap-4 pt-4 md:pt-0">
                <div className="h-12 w-12 rounded-2xl bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center shrink-0">
                  <TrophyIcon className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
                    <CountUp end={100} suffix="+" />
                  </div>
                  <div className="text-xs font-semibold text-[#64748B]">
                    Hackathons
                  </div>
                </div>
              </div>

              {/* Stat 3: Submissions / Evaluations */}
              <div className="flex items-center justify-center gap-4 pt-4 md:pt-0">
                <div className="h-12 w-12 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
                    <CountUp end={10} suffix="K+" />
                  </div>
                  <div className="text-xs font-semibold text-[#64748B]">
                    Submissions
                  </div>
                </div>
              </div>

              {/* Stat 4: Uptime */}
              <div className="flex items-center justify-center gap-4 pt-4 md:pt-0">
                <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] text-[#22C55E] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-mono">
                    <CountUp end={99.9} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs font-semibold text-[#64748B]">
                    Uptime
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
