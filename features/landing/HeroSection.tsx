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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF006E/[0.015]_1px,transparent_1px),linear-gradient(to_bottom,#FF006E/[0.015]_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        
        {/* Centered Hero Header */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto mb-16">
          
          {/* Community Badge Pill */}
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

          {/* Centered Headline */}
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

          {/* Centered Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl font-medium"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
            to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>
        </div>

        {/* Centered Visual Arena Container */}
        <div className="relative flex flex-col items-center max-w-4xl mx-auto select-none px-4 sm:px-8">
          
          {/* Glowing gradient blur behind image */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

          {/* Card 1: Top-Left (Dark 100+ Projects Card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
            transition={{ delay: 0.3, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
            className="absolute -top-10 -left-2 sm:left-4 z-20 bg-slate-950 text-white rounded-3xl p-5 shadow-lg max-w-[190px] text-left border border-slate-900"
          >
            <span className="font-heading text-3xl font-extrabold text-white block mb-1">100+</span>
            <h4 className="font-heading text-xs font-bold text-slate-300 mb-1">Projects Built</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Production codebases submitted by global developers.
            </p>
          </motion.div>

          {/* Card 2: Bottom-Left (White 500+ Members Card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, 6, 0] }}
            transition={{ delay: 0.4, y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" } }}
            className="absolute bottom-6 -left-4 sm:left-0 z-20 bg-white/95 border border-slate-200/80 text-slate-800 rounded-3xl p-5 shadow-md max-w-[170px] text-left"
          >
            <span className="font-heading text-3xl font-extrabold text-blue-600 block mb-1">500+</span>
            <h4 className="font-heading text-xs font-bold text-slate-800 mb-1">Community Members</h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              Active builders in our global developer network.
            </p>
          </motion.div>

          {/* Card 3: Top-Right (White 20+ Hackathons Card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{ delay: 0.5, y: { repeat: Infinity, duration: 3.8, ease: "easeInOut" } }}
            className="absolute top-6 -right-2 sm:right-6 z-20 bg-white/95 border border-slate-200/80 rounded-3xl p-5 shadow-md max-w-[175px] text-left"
          >
            <span className="font-heading text-3xl font-extrabold text-pink-600 block mb-1">20+</span>
            <h4 className="font-heading text-xs font-bold text-slate-800 mb-1">Hackathons Organized</h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              Highly competitive web sprints completed.
            </p>
          </motion.div>

          {/* Card 4: Bottom-Right (Tag Pills Container) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1, y: [0, 5, 0] }}
            transition={{ delay: 0.6, y: { repeat: Infinity, duration: 4.2, ease: "easeInOut" } }}
            className="absolute -bottom-6 -right-2 sm:right-4 z-20 bg-white border border-slate-200/70 rounded-3xl p-5 shadow-lg max-w-[320px] text-left"
          >
            <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">
              Technologies Utilized
            </h4>
            <div className="flex flex-wrap gap-2">
              {["React", "Next.js", "Tailwind CSS", "TypeScript", "Prisma", "AST Parser"].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200/40 rounded-lg text-[10px] font-bold text-slate-700 whitespace-nowrap"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Main Visual Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-[620px] h-[330px] sm:h-[400px] rounded-[36px] overflow-hidden border-4 border-white shadow-xl shadow-slate-200/60 transition-transform duration-500 hover:scale-[1.015] z-10"
          >
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Developers participating in a hackathon workspace"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>

        </div>

        {/* Centered CTA Buttons (Tucked below the entire visual composition) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-14 w-full sm:w-auto z-20 relative"
        >
          <Button asChild variant="default" size="lg" className="w-full sm:w-auto shadow-sm rounded-full px-8">
            <a href="#featured-hackathons" className="flex items-center justify-center gap-2">
              <span>Explore Hackathons</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-white/70 backdrop-blur-xs rounded-full px-8">
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
    </section>
  );
}
