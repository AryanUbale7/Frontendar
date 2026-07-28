"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section id="hero" className="relative py-16 md:py-28 overflow-hidden bg-gradient-to-b from-[#FFF2F7] via-[#FFFBEB] to-[#F8FAFC]">
      {/* Background Decorative Gradients/Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-[#FF006E]/12 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-[#FFD60A]/25 to-transparent rounded-full blur-[120px] pointer-events-none" />
      
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF006E/[0.03]_1px,transparent_1px),linear-gradient(to_bottom,#FF006E/[0.03]_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        {/* Hero Header */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Brand Logo Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex h-28 w-28 items-center justify-center rounded-2xl bg-black p-3.5 shadow-md hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/logo.png"
              alt="Frontend Arena Brand Logo"
              className="h-full w-full object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <Badge variant="accent" size="md" dot className="bg-[#FFD60A] text-[#0F172A] border-[#FFD60A] font-bold">
              Official Developer Community
            </Badge>
            <Badge variant="outline" size="md">
              Free Premium Hackathons
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]"
          >
            Build. Compete.{" "}
            <span className="bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent">
              Innovate.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#475569] max-w-3xl leading-relaxed"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button asChild variant="default" size="lg">
              <a href="#featured-hackathons" className="flex items-center gap-2">
                <span>Explore Hackathons</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-up" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Join Community</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
