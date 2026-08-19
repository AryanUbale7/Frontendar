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
      className="relative py-16 sm:py-20 md:py-24 overflow-hidden bg-gradient-to-b from-[#FFF2F7] via-[#FFFBEB] to-[#F8FAFC]"
    >
      {/* Background Decorative Gradients/Blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[450px] md:w-[700px] h-[450px] md:h-[700px] bg-blue-100/30 rounded-full blur-[100px] md:blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] md:w-[650px] h-[400px] md:h-[650px] bg-pink-100/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-yellow-100/20 rounded-full blur-[100px] md:blur-[130px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF006E/[0.012]_1px,transparent_1px),linear-gradient(to_bottom,#FF006E/[0.012]_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        
        {/* Centered Hero Header */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-4xl mx-auto mb-16">
          
          {/* Small Category Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="px-4 py-1.5 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-500 shadow-2xs block">
              Official Developer Community
            </span>
          </motion.div>

          {/* Centered Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-tight"
          >
            Build. Compete.{" "}
            <span className="bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent">
              Innovate.
            </span>
          </motion.h1>

          {/* Centered Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#475569]/90 leading-relaxed max-w-2xl font-medium"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
            to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>
        </div>

        {/* Center Visual Canvas (Exactly resembling the reference image) */}
        <div className="relative flex flex-col items-center w-full max-w-[620px] mx-auto select-none px-4 sm:px-8">
          
          {/* 1. Card Top-Left: Dark Card (99% Actionable business) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
            transition={{ delay: 0.3, y: { repeat: Infinity, duration: 4.2, ease: "easeInOut" } }}
            className="absolute -top-8 -left-2 sm:left-2 z-20 bg-slate-950 text-white rounded-[22px] p-4 shadow-md max-w-[170px] text-left border border-slate-900"
          >
            <span className="font-heading text-3xl font-extrabold text-white block mb-1">99%</span>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Evaluation accuracy with detailed performance metrics.
            </p>
          </motion.div>

          {/* 2. Card Bottom-Left: White Card (2.5M Impacted) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, 5, 0] }}
            transition={{ delay: 0.4, y: { repeat: Infinity, duration: 4.6, ease: "easeInOut" } }}
            className="absolute bottom-4 -left-6 sm:-left-10 z-20 bg-white border border-slate-200/60 rounded-[22px] p-4 shadow-md max-w-[150px] text-left"
          >
            <span className="font-heading text-2xl font-extrabold text-[#0F172A] block mb-1">500+</span>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Total active builders registered globally.
            </p>
          </motion.div>

          {/* 3. Card Right: White Card (4.8 Rating) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
            transition={{ delay: 0.5, y: { repeat: Infinity, duration: 3.9, ease: "easeInOut" } }}
            className="absolute top-8 -right-4 sm:-right-8 z-20 bg-white border border-slate-200/60 rounded-[22px] p-4 shadow-md max-w-[155px] text-left"
          >
            <span className="font-heading text-2xl font-extrabold text-[#0F172A] block mb-1">20+</span>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Premium hackathons successfully organized.
            </p>
          </motion.div>

          {/* 4. Card Bottom-Right: White Card with Tag Pills (Designing, Branding...) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, 4, 0] }}
            transition={{ delay: 0.6, y: { repeat: Infinity, duration: 4.3, ease: "easeInOut" } }}
            className="absolute -bottom-6 -right-2 sm:right-0 z-20 bg-white border border-slate-200/60 rounded-[22px] p-4 shadow-md w-[285px] max-w-full text-left"
          >
            <div className="flex flex-col gap-2">
              {/* Row 1 */}
              <div className="flex gap-1.5">
                {["React", "Next.js", "Tailwind"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {/* Row 2 */}
              <div className="flex gap-1.5">
                {["TypeScript", "Prisma", "AST parser"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Central Workspace Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-[550px] h-[250px] sm:h-[300px] rounded-[28px] overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-100/50 transition-transform duration-500 hover:scale-[1.01] z-10"
          >
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Developers collaborating at Frontend Arena hackathon"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>

        </div>

        {/* Center Single CTA Pill (Tucked below the visual composition) */}
        <div className="flex flex-col items-center justify-center mt-10 z-20 relative w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col items-center"
          >
            <Button
              asChild
              variant="default"
              size="lg"
              className="rounded-full px-8 py-3.5 font-bold shadow-lg shadow-blue-100 hover:shadow-xl transition-all"
            >
              <a href="#featured-hackathons" className="flex items-center gap-2">
                <span>Explore Hackathons</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            
            {/* Small Community Secondary Action Link */}
            <a
              href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-[#00B8CC] text-xs font-semibold tracking-wide transition-colors mt-3.5 hover:underline flex items-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Or join our developer community</span>
            </a>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
