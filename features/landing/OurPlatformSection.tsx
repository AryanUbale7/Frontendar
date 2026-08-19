"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  GitPullRequest,
  Code2,
  Award,
  BarChart3,
  FileSpreadsheet,
  Bell,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OUR_PLATFORM_CAPABILITIES } from "@/constants/landing-data";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  GitPullRequest,
  Code2,
  Award,
  BarChart3,
  FileSpreadsheet,
  Bell,
  TrendingUp,
};

export function OurPlatformSection() {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="default" size="sm">
            Platform Capabilities
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Our Platform
          </h2>
          <p className="text-base text-[#475569]">
            Powerful built-in developer tools designed to make competing, submitting, and tracking progress seamless.
          </p>
        </div>

        {/* 8 Capability Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {OUR_PLATFORM_CAPABILITIES.map((item, idx) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
              >
                <Card
                  className={`h-full p-6 space-y-4 transition-all duration-200 hover:shadow-md ${
                    item.isVirtualJudge
                      ? "border-[#ACC00B]/40 bg-[#ACC00B]/5 ring-1 ring-[#ACC00B]/20"
                      : "hover:border-[#CBD5E1]"
                  }`}
                >
                  <CardHeader className="p-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${
                          item.isVirtualJudge
                            ? "bg-gradient-to-br from-[#ACC00B] to-[#FFD60A] text-white"
                            : "bg-[#ACC00B]/10 text-[#ACC00B]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {item.isVirtualJudge && (
                        <Badge variant="accent" size="sm" dot>
                          AI Assistant
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#475569] leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
