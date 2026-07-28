"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Calendar, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURED_HACKATHONS } from "@/constants/landing-data";
import { EmptyState } from "@/components/design-system/EmptyState";

export function FeaturedHackathonsSection() {
  return (
    <section id="featured-hackathons" className="py-16 md:py-24 bg-[#F8FAFC] border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="default" size="sm" dot>
              Official Competitions
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
              Featured Hackathons
            </h2>
            <p className="text-base text-[#475569] max-w-xl">
              Register for upcoming Frontend Arena hackathons and compete for major cash prize pools.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/sign-up" className="flex items-center gap-2">
              <span>View All Competitions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Empty State replacement for Mock Hackathons */}
        <EmptyState
          title="Upcoming Hackathons Coming Soon"
          description="We are currently auditing new hackathon tracks, sponsors, and smart contract prize allocations. Get notified as soon as registrations open!"
          primaryActionText="Join Community"
          onPrimaryAction={() => window.location.href = "/sign-up"}
        />
      </div>
    </section>
  );
}
