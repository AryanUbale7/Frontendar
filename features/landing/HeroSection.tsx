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
      className="relative min-h-[85vh] flex items-center justify-center py-16 md:py-20 overflow-hidden bg-[#080C14] selection:bg-rose-500/20 selection:text-rose-100"
    >
      {/* Background Glowing Ambient Light Blobs (Rich colors on dark background) */}
      <div className="absolute top-[-10%] left-[-15%] w-[450px] md:w-[750px] h-[450px] md:h-[750px] bg-blue-600/10 rounded-full blur-[120px] md:blur-[200px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-rose-500/8 rounded-full blur-[120px] md:blur-[190px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[350px] md:w-[550px] h-[350px] md:h-[550px] bg-amber-500/5 rounded-full blur-[100px] md:blur-[160px] pointer-events-none" />

      {/* Elegant Technical Background Grid with subtle Parallax */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:6rem_6rem] pointer-events-none"
        style={{
          transform: `translate3d(${mouse.x * 6}px, ${mouse.y * 6}px, 0)`,
          transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)",
        }}
      />

      {/* Tiny Floating Geometric/Code Elements (Parallax) */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {/* Code tag left */}
        <div
          className="absolute left-[8%] top-[28%] text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5 opacity-60"
          style={{
            transform: `translate3d(${mouse.x * -20}px, ${mouse.y * -20}px, 0)`,
            transition: "transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <Code2 className="h-3.5 w-3.5 text-slate-600" />
          <span>&lt;/&gt;</span>
        </div>

        {/* Braces right */}
        <div
          className="absolute right-[10%] top-[33%] text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5 opacity-60"
          style={{
            transform: `translate3d(${mouse.x * 18}px, ${mouse.y * 18}px, 0)`,
            transition: "transform 0.45s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <span>{"{ }"}</span>
          <Sparkles className="h-3.5 w-3.5 text-slate-600" />
        </div>

        {/* 01 String left bottom */}
        <div
          className="absolute left-[12%] bottom-[28%] text-[10px] font-mono font-bold text-slate-600 opacity-30 tracking-wider"
          style={{
            transform: `translate3d(${mouse.x * -12}px, ${mouse.y * -12}px, 0)`,
            transition: "transform 0.5s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          01 10 11 00
        </div>

        {/* Trophy right bottom */}
        <div
          className="absolute right-[12%] bottom-[30%] text-xs font-mono font-bold text-slate-500 flex items-center gap-1.5 opacity-65"
          style={{
            transform: `translate3d(${mouse.x * -22}px, ${mouse.y * -22}px, 0)`,
            transition: "transform 0.35s cubic-bezier(0.1, 0.8, 0.3, 1)",
          }}
        >
          <Trophy className="h-4 w-4 text-slate-600" />
          <span>WIN</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        
        {/* Centered Content Area */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-5xl mx-auto">
          
          {/* Small Badge Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-3.5 py-1.5 bg-[#0F172A]/80 border border-slate-800 rounded-full text-xs font-bold text-slate-400 shadow-3xs flex items-center gap-1.5 max-w-fit mx-auto"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Official Developer Community</span>
          </motion.div>

          {/* Large Editorial Headline with Tight Leading & Embedded Capsules */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-7xl lg:text-[88px] font-extrabold tracking-tight text-white leading-[1.0] max-w-5xl mx-auto"
          >
            {/* Line 1 */}
            <span className="block sm:inline-block">
              Build.{" "}
              <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[80px] sm:w-[130px] lg:w-[160px] h-[36px] sm:h-[55px] lg:h-[65px] rounded-full overflow-hidden border border-white/10 shadow-sm transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=300&auto=format&fit=crop"
                  alt="Developer coding"
                  className="w-full h-full object-cover animate-fade-in"
                />
              </span>{" "}
              Compete.
            </span>
            
            {/* Line 2 */}
            <span className="block sm:mt-4">
              <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[80px] sm:w-[130px] lg:w-[160px] h-[36px] sm:h-[55px] lg:h-[65px] rounded-full overflow-hidden border border-white/10 shadow-sm transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=300&auto=format&fit=crop"
                  alt="Hackathon team collaborating"
                  className="w-full h-full object-cover animate-fade-in"
                />
              </span>{" "}
              <span className="bg-gradient-to-r from-[#FF2D73] via-[#FF6B57] to-[#FFB52E] bg-clip-text text-transparent inline-block">
                Innovate.
              </span>{" "}
              <span className="inline-block align-middle mx-1.5 sm:mx-3 w-[80px] sm:w-[130px] lg:w-[160px] h-[36px] sm:h-[55px] lg:h-[65px] rounded-full overflow-hidden border border-white/10 shadow-sm transition-transform duration-300 hover:scale-105 select-none pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=300&auto=format&fit=crop"
                  alt="UI design mockups"
                  className="w-full h-full object-cover animate-fade-in"
                />
              </span>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 font-medium leading-[1.6] max-w-2xl mx-auto pt-2 mb-2"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
            to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>

          {/* Action Button Pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-4 w-full sm:w-auto z-20"
          >
            <Button
              asChild
              variant="default"
              size="lg"
              className="w-full sm:w-auto shadow-sm rounded-full h-14 px-8 font-bold"
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
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 border-transparent rounded-full h-14 px-8 font-bold shadow-xs transition-colors"
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
            className="pt-8 text-[10px] sm:text-xs font-bold text-slate-500 tracking-[0.25em]"
          >
            BUILD • COMPETE • INNOVATE
          </motion.div>

        </div>
      </div>
    </section>
  );
}
