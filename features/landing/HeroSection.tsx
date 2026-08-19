"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, Code2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[85vh] flex items-center justify-center py-20 overflow-hidden bg-[#FCFBF7] selection:bg-rose-500/10 selection:text-rose-900"
    >
      {/* Background Decorative Gradients/Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] md:w-[700px] h-[450px] md:h-[700px] bg-blue-100/20 rounded-full blur-[100px] md:blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] md:w-[650px] h-[400px] md:h-[650px] bg-pink-100/15 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-yellow-100/15 rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />

      {/* Elegant Technical Background Grid with subtle Parallax */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0/[0.04]_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0/[0.04]_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
        style={{
          transform: `translate3d(${mouse.x * 10}px, ${mouse.y * 10}px, 0)`,
          transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)",
        }}
      />

      {/* Tiny Floating Geometric/Code Elements (Parallax) */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {/* Code tag left */}
        <div
          className="absolute left-[8%] top-[25%] text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5"
          style={{
            transform: `translate3d(${mouse.x * -25}px, ${mouse.y * -25}px, 0)`,
            transition: "transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <Code2 className="h-3.5 w-3.5 text-slate-200" />
          <span>&lt;/&gt;</span>
        </div>

        {/* Braces right */}
        <div
          className="absolute right-[10%] top-[30%] text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5"
          style={{
            transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)`,
            transition: "transform 0.45s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <span>{"{ }"}</span>
          <Sparkles className="h-3.5 w-3.5 text-slate-200" />
        </div>

        {/* 01 String left bottom */}
        <div
          className="absolute left-[12%] bottom-[25%] text-[10px] font-mono font-bold text-slate-250 opacity-40 tracking-wider"
          style={{
            transform: `translate3d(${mouse.x * -15}px, ${mouse.y * -15}px, 0)`,
            transition: "transform 0.5s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          01 10 11 00
        </div>

        {/* Trophy right bottom */}
        <div
          className="absolute right-[15%] bottom-[28%] text-xs font-mono font-bold text-slate-300 flex items-center gap-1"
          style={{
            transform: `translate3d(${mouse.x * -30}px, ${mouse.y * -30}px, 0)`,
            transition: "transform 0.35s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <Trophy className="h-4 w-4 text-slate-200" />
          <span>WIN</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        
        {/* Main Content Area */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-5xl mx-auto">
          
          {/* Top Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="px-3.5 py-1.5 bg-white border border-slate-200/60 rounded-full text-xs font-bold text-slate-400 shadow-2xs tracking-wide">
              Official Developer Community
            </span>
          </motion.div>

          {/* Large Editorial Headline with Embedded Capsules */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-6xl lg:text-[76px] font-extrabold tracking-tight text-[#0F172A] leading-[1.2] max-w-5xl"
          >
            Build.{" "}
            {/* Capsule 1: Coding developer */}
            <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[70px] sm:w-[110px] lg:w-[135px] h-[36px] sm:h-[48px] lg:h-[56px] rounded-full overflow-hidden border border-slate-200/80 shadow-xs transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop"
                alt="Developer coding"
                className="w-full h-full object-cover"
              />
            </span>{" "}
            Compete.{" "}
            <br className="hidden md:inline" />
            {/* Capsule 2: Hackathon sprint */}
            <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[70px] sm:w-[110px] lg:w-[135px] h-[36px] sm:h-[48px] lg:h-[56px] rounded-full overflow-hidden border border-slate-200/80 shadow-xs transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200&auto=format&fit=crop"
                alt="Hackathon team collaborating"
                className="w-full h-full object-cover"
              />
            </span>{" "}
            <span className="bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent inline-block">
              Innovate.
            </span>{" "}
            {/* Capsule 3: UI Design mockup */}
            <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[70px] sm:w-[110px] lg:w-[135px] h-[36px] sm:h-[48px] lg:h-[56px] rounded-full overflow-hidden border border-slate-200/80 shadow-xs transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=200&auto=format&fit=crop"
                alt="UI mockups"
                className="w-full h-full object-cover"
              />
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl font-medium pt-2"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
            to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>

          {/* Action Button Pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4 w-full sm:w-auto z-20"
          >
            <Button
              asChild
              variant="default"
              size="lg"
              className="w-full sm:w-auto shadow-xs rounded-full px-8 py-3.5 font-bold"
            >
              <a href="#featured-hackathons" className="flex items-center justify-center gap-2">
                <span>Explore Hackathons</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-[#0F172A]/90 hover:bg-[#0F172A] text-white border-transparent rounded-full px-8 py-3.5 font-bold shadow-xs transition-colors"
            >
              <a
                href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Join Community</span>
              </a>
            </Button>
          </motion.div>

          {/* Micro Information Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="pt-6 text-[10px] sm:text-xs font-bold text-slate-400 tracking-[0.2em]"
          >
            BUILD • COMPETE • INNOVATE
          </motion.div>

        </div>
      </div>
    </section>
  );
}
