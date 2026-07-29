"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Calendar, ArrowRight, Clock, FileCode2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/design-system/EmptyState";

export function FeaturedHackathonsSection() {
  const [hackathons, setHackathons] = useState<any[]>([]);

  // Load launched hackathons from backend on mount
  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await fetch("/api/hackathons");
        if (res.ok) {
          const list = await res.json();
          setHackathons(list);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHackathons();
  }, []);

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

        {/* Hackathons Grid or Empty State */}
        {hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {hackathons.map((hackathon) => (
              <Card
                key={hackathon.id}
                className="overflow-hidden border-[#E2E8F0] shadow-sm bg-white rounded-2xl flex flex-col hover:border-[#FF006E]/40 hover:shadow-md transition-all duration-200"
              >
                {/* Header Banner Preview */}
                <div
                  className="h-32 w-full flex flex-col justify-end p-4 text-white relative"
                  style={{
                    background: hackathon.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)",
                  }}
                >
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="relative z-10 space-y-1">
                    <Badge variant="accent" size="sm" className="bg-[#FEF3C7] text-[#B45309] border-[#FDE047] font-bold">
                      Registration Open
                    </Badge>
                    <h3 className="font-heading text-lg font-bold truncate mt-1">
                      {hackathon.name}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <CardContent className="p-5 flex-1 space-y-3">
                  <p className="text-xs text-[#475569] font-medium leading-relaxed line-clamp-3">
                    {hackathon.tagline || hackathon.description || "Join the challenge, showcase your skills, and earn verifiable certificates."}
                  </p>

                  <div className="space-y-1.5 text-xs text-[#475569] pt-2 border-t border-[#F1F5F9]">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-[#0F172A] shrink-0">Problem:</span>{" "}
                      <span className="truncate">{hackathon.problemTitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0F172A] shrink-0">Closes on:</span>{" "}
                      <span>{new Date(hackathon.registrationClose).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 bg-[#F8FAFC]/50 border-t border-[#F1F5F9] flex justify-between items-center text-xs">
                  <span className="text-[#FF006E] font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {hackathon.rounds.length} Rounds
                  </span>
                  <Button asChild variant="default" size="sm" className="text-xs">
                    <Link href={`/register?id=${hackathon.id}`}>Register Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State replacement for Mock Hackathons */
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
