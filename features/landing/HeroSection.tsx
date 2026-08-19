"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, Star, Code2, ShieldAlert, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative py-12 sm:py-16 md:py-24 overflow-hidden bg-gradient-to-b from-[#FFF2F7] via-[#FFFBEB] to-[#F8FAFC]"
    >
      {/* Background Decorative Gradients/Blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-100/35 rounded-full blur-[100px] md:blur-[160px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute top-[20%] right-[-10%] w-[350px] md:w-[550px] h-[350px] md:h-[550px] bg-pink-100/25 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-yellow-100/25 rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF006E/[0.015]_1px,transparent_1px),linear-gradient(to_bottom,#FF006E/[0.015]_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE (5 Columns on Desktop) */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-2xl mx-auto lg:max-w-none">
            
            {/* Community Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge
                variant="accent"
                size="md"
                dot
                className="bg-[#FFD60A] text-[#0F172A] border-[#FFD60A] font-bold text-xs sm:text-sm px-3.5 py-1.5 shadow-sm"
              >
                Official Developer Community
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]"
            >
              Build. Compete.{" "}
              <span className="block mt-1 bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent">
                Innovate.
              </span>
            </motion.h1>

            {/* Subheading / Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl lg:max-w-none font-medium"
            >
              Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
              to help you build real-world projects, showcase your skills and grow with the community.
            </motion.p>

            {/* Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2 w-full sm:w-auto"
            >
              <Button asChild variant="default" size="lg" className="w-full sm:w-auto shadow-sm">
                <a href="#featured-hackathons" className="flex items-center justify-center gap-2">
                  <span>Explore Hackathons</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-white/50 backdrop-blur-xs">
                <a
                  href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Join Community</span>
                </a>
              </Button>
            </motion.div>
          </div>

          {/* RIGHT SIDE (7 Columns on Desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative mt-4 lg:mt-0 select-none">
            
            {/* Floating Card 1: Top-Left (500+ Developers) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{ delay: 0.4, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
              className="absolute -top-4 left-0 sm:left-4 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-md shadow-slate-100/60 flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading text-base font-bold text-[#0F172A]">500+</span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide">Members Registered</span>
              </div>
            </motion.div>

            {/* Floating Card 2: Bottom-Left (₹10,000+ Prize Pool) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, 6, 0] }}
              transition={{ delay: 0.5, y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } }}
              className="absolute bottom-6 left-0 sm:left-8 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-md shadow-slate-100/60 flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                <Trophy className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading text-base font-bold text-[#0F172A]">₹10,000+</span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide">Prize Pools</span>
              </div>
            </motion.div>

            {/* Floating Card 3: Top-Right (20+ Hackathons) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
              transition={{ delay: 0.6, y: { repeat: Infinity, duration: 3.8, ease: "easeInOut" } }}
              className="absolute top-1/4 -right-2 sm:right-6 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-md shadow-slate-100/60 flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <Star className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading text-base font-bold text-[#0F172A]">20+</span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide">Hackathons Held</span>
              </div>
            </motion.div>

            {/* Floating Card 4: Bottom-Right (100+ Projects) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, 5, 0] }}
              transition={{ delay: 0.7, y: { repeat: Infinity, duration: 4.2, ease: "easeInOut" } }}
              className="absolute bottom-12 -right-2 sm:right-4 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 shadow-md shadow-slate-100/60 flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Terminal className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-heading text-base font-bold text-[#0F172A]">100+</span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide">Projects Built</span>
              </div>
            </motion.div>

            {/* Main Visual Image Container */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-[490px] h-[310px] sm:h-[370px] rounded-[36px] overflow-hidden border-4 border-white shadow-xl shadow-slate-100/80 transition-transform duration-500 hover:scale-[1.015] z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                alt="Developers collaborating at Frontend Arena hackathon"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
            </motion.div>

            {/* BOTTOM HORIZONTAL FEATURE CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full max-w-[500px] mt-8 bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm shadow-slate-100 flex flex-wrap items-center justify-around gap-4 z-10"
            >
              {[
                { label: "Frontend Only", icon: Code2, bg: "bg-blue-50 text-blue-600" },
                { label: "Real-World Problems", icon: ShieldAlert, bg: "bg-yellow-50 text-yellow-600" },
                { label: "Exciting Rewards", icon: Trophy, bg: "bg-pink-50 text-pink-600" },
                { label: "Community Driven", icon: Users, bg: "bg-emerald-50 text-emerald-600" }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${item.bg}`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
