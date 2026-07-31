"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Calendar, ArrowRight, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURED_HACKATHONS } from "@/constants/landing-data";
import { EmptyState } from "@/components/design-system/EmptyState";

export function FeaturedHackathonsSection() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHackathons = async () => {
      try {
        const res = await fetch("/api/hackathons");
        if (res.ok) {
          const apiHackathons = await res.json();
          if (Array.isArray(apiHackathons) && apiHackathons.length > 0) {
            setHackathons(apiHackathons);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      
      // Fallback to FEATURED_HACKATHONS constant if API returns empty
      setHackathons(FEATURED_HACKATHONS);
      setLoading(false);
    };

    loadHackathons();
  }, []);

  return (
    <section id="featured-hackathons" className="py-16 md:py-24 bg-[#FCFCFD] border-t border-[#E2E8F0]">
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
            <p className="text-base text-[#64748B] max-w-xl">
              Register for upcoming Frontend Arena hackathons and compete for major cash prize pools.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/register" className="flex items-center gap-2">
              <span>View All Competitions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Dynamic Hackathons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((item, idx) => {
              const title = item.name || item.title || "Frontend Hackathon";
              const subtitle = item.tagline || item.subtitle || "Official Hackathon Challenge";
              const prize = item.prize || "$25,000 Cash Pool";
              const dateStr = item.registrationClose ? `Closes: ${item.registrationClose}` : (item.date || "Aug 15 - Aug 20");
              const id = item.id || `h_${idx}`;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Card className="h-full border-[#E2E8F0] shadow-sm hover:shadow-lg hover:border-[#4F46E5]/40 transition-all rounded-2xl bg-white overflow-hidden flex flex-col justify-between group">
                    <div className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-sm">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                            Live Challenge
                          </span>
                        </div>
                        <Badge variant="success" size="sm" className="bg-[#22C55E]/10 text-[#22C55E] border-none font-bold">
                          Registration Open
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-heading text-lg font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-xs text-[#64748B] line-clamp-2">
                          {subtitle}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-[#F1F5F9]">
                        <span className="font-mono font-bold text-[#0F172A] flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-[#F97316]" /> {prize}
                        </span>
                        <span className="text-[#64748B] flex items-center gap-1 text-[11px]">
                          <Clock className="h-3.5 w-3.5" /> {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#22C55E] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified Challenge
                      </span>
                      <Link
                        href={`/register?id=${id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Register Now</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Upcoming Hackathons Coming Soon"
            description="We are currently auditing new hackathon tracks, sponsors, and smart contract prize allocations. Get notified as soon as registrations open!"
            primaryActionText="Join Community"
            onPrimaryAction={() => window.location.href = "/sign-up"}
          />
        )}
      </div>
    </section>
  );
}
