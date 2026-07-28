"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEVELOPER_TESTIMONIALS } from "@/constants/landing-data";

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-[#F8FAFC] border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="default" size="sm">
            Community Voices
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            What Builders Say
          </h2>
          <p className="text-base text-[#475569]">
            Hear from students, developers, and winners who build and compete on Frontend Arena.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEVELOPER_TESTIMONIALS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="h-full flex flex-col justify-between p-6 space-y-4 hover:border-[#2563EB]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <Quote className="h-8 w-8 text-[#2563EB]/20" />
                  <Badge variant="accent" size="sm">
                    {item.type}
                  </Badge>
                </div>

                <p className="text-sm text-[#475569] leading-relaxed italic">
                  "{item.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-[#E2E8F0]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-white font-heading font-bold text-xs shadow-xs">
                    {item.avatar}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {item.author}
                    </span>
                    <span className="text-xs text-[#475569]">{item.role}</span>
                    <span className="text-[11px] font-semibold text-[#2563EB]">
                      {item.org}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
