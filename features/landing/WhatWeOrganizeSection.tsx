"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WHAT_WE_ORGANIZE } from "@/constants/landing-data";

const ICON_MAP: Record<string, React.ElementType> = {
  Code2,
  Sparkles,
  Layout,
  Globe,
  Lightbulb,
  Users,
};

export function WhatWeOrganizeSection() {
  return (
    <section id="what-we-organize" className="py-16 md:py-24 bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="accent" size="sm">
            Event Spectrum
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            What We Organize
          </h2>
          <p className="text-base text-[#475569]">
            From 48-hour hackathon sprints to month-long innovation challenges, explore
            our official developer competitions.
          </p>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHAT_WE_ORGANIZE.map((item, idx) => {
            const Icon = ICON_MAP[item.iconName] || Code2;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Card className="h-full flex flex-col justify-between group hover:border-[#FF006E]/40 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#FF006E] to-[#FFD60A] text-white shadow-sm group-hover:scale-105 transition-transform">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" size="sm">
                        {item.tag}
                      </Badge>
                    </div>

                    <CardTitle className="text-xl group-hover:text-[#FF006E] transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-[#475569]">
                      {item.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="pt-2">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full group-hover:bg-[#FF006E] group-hover:text-white group-hover:border-[#FF006E] transition-all"
                    >
                      <a href="#featured-hackathons" className="flex items-center justify-between w-full">
                        <span>Explore {item.title}</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
