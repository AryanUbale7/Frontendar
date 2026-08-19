"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Rocket, Trophy, HeartHandshake } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WhoWeAreSection() {
  return (
    <section id="who-we-are" className="py-16 md:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="default" size="sm">
            Who We Are
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            More Than Just Hackathons
          </h2>
          <p className="text-base text-[#475569] leading-relaxed">
            Frontend Arena is a developer-first community dedicated to helping students
            and developers learn, compete and innovate through carefully designed hackathons,
            technical events and collaborative challenges.
          </p>
        </div>

        {/* 4 Story Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Developer-First Ecosystem",
              desc: "Built by developers for developers. We design challenges around real engineering problems, modern frameworks, and production tools.",
              icon: Users,
            },
            {
              title: "Learn & Build Sprints",
              desc: "Every hackathon comes with live workshops, starter templates, and mentor guidance so you ship working code every single time.",
              icon: Rocket,
            },
            {
              title: "Transparent Competitions",
              desc: "Zero bias. Clear rubrics, open scoring matrix, and automated test runners ensure fair evaluation for every team.",
              icon: Trophy,
            },
            {
              title: "Collaborative Squads",
              desc: "Find co-builders, join active squads, pair-program on Discord, and connect with lifelong friends and future tech co-founders.",
              icon: HeartHandshake,
            },
          ].map((item, idx) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Card className="h-full p-6 space-y-4 hover:border-[#ACC00B]/40 hover:shadow-md transition-all duration-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ACC00B]/10 text-[#ACC00B]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-[#0F172A]">{item.title}</CardTitle>
                  <CardDescription className="text-xs text-[#475569] leading-relaxed">
                    {item.desc}
                  </CardDescription>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
