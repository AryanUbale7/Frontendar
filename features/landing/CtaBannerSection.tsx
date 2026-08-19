"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBannerSection() {
  return (
    <section className="py-16 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[16px] bg-gradient-to-r from-[#0F172A] to-[#FFD60A] p-8 md:p-14 text-white shadow-xl flex flex-col items-center text-center space-y-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/20 backdrop-blur-sm shadow-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-white max-w-3xl leading-tight">
            Ready to Build Something Amazing?
          </h2>

          <p className="text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
            Join Frontend Arena and become part of a growing developer community where innovation meets opportunity.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white text-[#0F172A] hover:bg-[rgba(15,23,42,0.08)] hover:text-[#0F172A] border-white font-semibold"
            >
              <a href="#featured-hackathons" className="flex items-center gap-2">
                <span>Explore Hackathons</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10 hover:text-white font-medium"
            >
              <a
                href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-white" />
                <span>Join Community</span>
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
