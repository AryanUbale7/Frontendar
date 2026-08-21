"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Crown,
  ChevronDown,
  Globe,
  Calendar,
  Users,
  Building,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkedInIcon, GitHubIcon } from "@/features/admin/hall-of-fame/social-icons";

interface HofBadgeData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface HofParticipantData {
  id: string;
  fullName: string;
  teamName?: string;
  collegeOrOrg?: string;
  description?: string;
  photoUrl?: string;
  recognitionType: string;
  customRecognition?: string;
  order: number;
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  badges?: HofBadgeData[];
}

interface HofEventData {
  id: string;
  name: string;
  year: string;
  description?: string;
  coverUrl?: string;
  status: string;
  participants?: HofParticipantData[];
}

export function HallOfFameSection() {
  const [events, setEvents] = useState<HofEventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchPublicEvents() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/hall-of-fame/events");
        if (res.ok) {
          const data: HofEventData[] = await res.json();
          setEvents(data);
          if (data.length > 0 && !selectedEventId) {
            setSelectedEventId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load Hall of Fame events:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicEvents();
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  if (isLoading) {
    return (
      <section id="hall-of-fame" className="py-16 md:py-24 bg-[#FAFCFF] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-96 bg-slate-100 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no published events exist yet, show clean state
  if (!activeEvent || events.length === 0) {
    return (
      <section id="hall-of-fame" className="py-16 md:py-24 bg-[#FAFCFF] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center space-y-4">
          <Badge variant="accent" size="sm">
            Builders Community
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Hall of Fame
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto">
            Celebrating the builders who stood out in Frontend Arena hackathons.
          </p>
          <div className="p-8 max-w-md mx-auto rounded-2xl border border-dashed border-[#CBD5E1] bg-white text-xs text-[#64748B]">
            No published Hall of Fame events yet. Upcoming hackathon winners will be showcased here.
          </div>
        </div>
      </section>
    );
  }

  // Group participants by category
  const participants = (activeEvent.participants || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const winners = participants.filter((p) => p.recognitionType === "winner");
  const runnerUps = participants.filter((p) => p.recognitionType === "runner_up");
  const top10s = participants.filter((p) => p.recognitionType === "top_10");
  const otherFinalists = participants.filter(
    (p) =>
      p.recognitionType === "finalist" ||
      p.recognitionType === "special_recognition" ||
      p.recognitionType === "custom"
  );

  return (
    <section id="hall-of-fame" className="py-16 md:py-24 bg-[#FAFCFF] border-t border-[#E2E8F0] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-12">
        {/* Section Header with Event Name & Event Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-[#E2E8F0]/70">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                Hall of Fame
              </span>
              <span className="text-xs font-bold text-[#0F172A] bg-white px-3 py-1 rounded-md border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                {activeEvent.name}
              </span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#DBEAFE]">
                Edition {activeEvent.year}
              </span>
            </div>

            <div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight">
                {activeEvent.name}
              </h2>
              <p className="text-base sm:text-lg text-[#475569] max-w-2xl mt-1.5">
                {activeEvent.description || "Celebrating the outstanding builders, winners, and honorees who created exceptional projects."}
              </p>
            </div>
          </div>

          {/* Event Dropdown Switcher */}
          {events.length > 1 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#0F172A] hover:border-[#2563EB] shadow-xs transition-all"
              >
                <Trophy className="h-4 w-4 text-[#2563EB]" />
                <span>Switch Event ({activeEvent.name})</span>
                <ChevronDown className={`h-3.5 w-3.5 text-[#64748B] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl z-30 space-y-1 animate-in fade-in zoom-in-95">
                    {events.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => {
                          setSelectedEventId(ev.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          ev.id === activeEvent.id
                            ? "bg-[#2563EB] text-white"
                            : "text-[#0F172A] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        <span className="truncate">{ev.name}</span>
                        <span className={`text-[10px] ${ev.id === activeEvent.id ? "text-white/80" : "text-[#64748B]"}`}>
                          {ev.year}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 1. WINNER SPOTLIGHT PODIUM                                            */}
        {/* ===================================================================== */}
        {winners.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A]">
                Champion {winners.length > 1 ? "Winners" : "Winner"}
              </h3>
            </div>

            <div className={`grid gap-6 ${winners.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {winners.map((winner, idx) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Card className="border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                    {/* Crown watermark badge */}
                    <div className="absolute top-4 right-4 h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold shadow-xs">
                      <Crown className="h-5 w-5" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      {/* Photo Frame */}
                      <div className="relative shrink-0">
                        <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-3xl overflow-hidden border-2 border-amber-400 p-1 bg-white shadow-md group-hover:scale-105 transition-transform duration-300">
                          {winner.photoUrl ? (
                            <img
                              src={winner.photoUrl}
                              alt={winner.fullName}
                              className="h-full w-full object-cover rounded-2xl"
                            />
                          ) : (
                            <div className="h-full w-full rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-3xl">
                              {winner.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
                          <Trophy className="h-3 w-3" />
                          <span>1st Place</span>
                        </div>
                      </div>

                      {/* Info & Achievements */}
                      <div className="space-y-3 flex-1 text-center sm:text-left min-w-0">
                        <div>
                          <h4 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
                            {winner.fullName}
                          </h4>
                          {winner.teamName && (
                            <p className="text-sm font-semibold text-[#2563EB] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                              <Users className="h-3.5 w-3.5" />
                              <span>{winner.teamName}</span>
                            </p>
                          )}
                          {winner.collegeOrOrg && (
                            <p className="text-xs text-[#64748B] flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                              <Building className="h-3 w-3" />
                              <span>{winner.collegeOrOrg}</span>
                            </p>
                          )}
                        </div>

                        {winner.description && (
                          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-white/80 p-3 rounded-2xl border border-amber-100">
                            {winner.description}
                          </p>
                        )}

                        {/* Badges List */}
                        {winner.badges && winner.badges.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                            {winner.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 text-xs font-bold border border-amber-200/60"
                              >
                                <Sparkles className="h-3 w-3 text-amber-600" />
                                <span>{b.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Social Profiles */}
                        <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[#64748B]">
                          {winner.linkedInUrl && (
                            <a
                              href={winner.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-xs"
                              title="LinkedIn"
                            >
                              <LinkedInIcon className="h-4 w-4" />
                            </a>
                          )}
                          {winner.portfolioUrl && (
                            <a
                              href={winner.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#059669] hover:border-[#059669] transition-colors shadow-xs"
                              title="Portfolio"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {winner.githubUrl && (
                            <a
                              href={winner.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#0F172A] hover:border-[#0F172A] transition-colors shadow-xs"
                              title="GitHub"
                            >
                              <GitHubIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 2. RUNNER-UP SPOTLIGHT                                                */}
        {/* ===================================================================== */}
        {runnerUps.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Medal className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A]">
                Runner-Up {runnerUps.length > 1 ? "Honorees" : "Honoree"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {runnerUps.map((runner, idx) => (
                <motion.div
                  key={runner.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Card className="border border-[#CBD5E1] bg-white p-6 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full group">
                    <div className="space-y-4">
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" size="sm" className="bg-slate-100 text-slate-800 font-bold text-xs">
                          🥈 2nd Place Runner-Up
                        </Badge>
                        <span className="text-xs font-bold text-[#94A3B8]">#{idx + 2}</span>
                      </div>

                      {/* Photo + Details */}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-slate-300 p-0.5 bg-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {runner.photoUrl ? (
                            <img
                              src={runner.photoUrl}
                              alt={runner.fullName}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-2xl">
                              {runner.fullName.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-heading text-lg font-bold text-[#0F172A]">
                            {runner.fullName}
                          </h4>
                          {runner.teamName && (
                            <p className="text-xs font-semibold text-[#2563EB] mt-0.5">
                              {runner.teamName}
                            </p>
                          )}
                          {runner.collegeOrOrg && (
                            <p className="text-[11px] text-[#64748B]">
                              {runner.collegeOrOrg}
                            </p>
                          )}
                        </div>
                      </div>

                      {runner.description && (
                        <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                          {runner.description}
                        </p>
                      )}

                      {/* Badges List */}
                      {runner.badges && runner.badges.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                          {runner.badges.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-bold"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>{b.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Social links */}
                    <div className="flex items-center justify-center gap-3 pt-3 mt-4 border-t border-[#E2E8F0] text-[#64748B]">
                      {runner.linkedInUrl && (
                        <a
                          href={runner.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#0A66C2] transition-colors p-1"
                          title="LinkedIn"
                        >
                          <LinkedInIcon className="h-4 w-4" />
                        </a>
                      )}
                      {runner.portfolioUrl && (
                        <a
                          href={runner.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#059669] transition-colors p-1"
                          title="Portfolio"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {runner.githubUrl && (
                        <a
                          href={runner.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#0F172A] transition-colors p-1"
                          title="GitHub"
                        >
                          <GitHubIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 3. TOP 10 FINALISTS GRID                                              */}
        {/* ===================================================================== */}
        {top10s.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-[#2563EB] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A]">
                Top 10 Finalists
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {top10s.map((finalist, idx) => (
                <motion.div
                  key={finalist.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                >
                  <Card className="border border-[#E2E8F0] bg-white p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full group text-center">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-bold">
                          Top 10 Finalist
                        </span>
                        <span className="text-[11px] font-bold text-[#94A3B8]">#{idx + 1}</span>
                      </div>

                      {/* Large Photo */}
                      <div className="flex justify-center pt-1">
                        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-[#E2E8F0] p-0.5 bg-white shadow-xs group-hover:scale-105 transition-transform duration-300">
                          {finalist.photoUrl ? (
                            <img
                              src={finalist.photoUrl}
                              alt={finalist.fullName}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="h-full w-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold text-xl">
                              {finalist.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-base text-[#0F172A] truncate" title={finalist.fullName}>
                          {finalist.fullName}
                        </h4>
                        {finalist.teamName && (
                          <p className="text-xs text-[#2563EB] font-medium truncate mt-0.5">
                            {finalist.teamName}
                          </p>
                        )}
                        {finalist.collegeOrOrg && (
                          <p className="text-[11px] text-[#64748B] truncate">
                            {finalist.collegeOrOrg}
                          </p>
                        )}
                      </div>

                      {finalist.description && (
                        <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-2.5 rounded-xl text-left border border-[#E2E8F0]/60">
                          {finalist.description}
                        </p>
                      )}

                      {finalist.badges && finalist.badges.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                          {finalist.badges.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-bold"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>{b.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Social profiles */}
                    <div className="flex items-center justify-center gap-3 pt-3 mt-3 border-t border-[#E2E8F0]/60 text-[#64748B]">
                      {finalist.linkedInUrl && (
                        <a
                          href={finalist.linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#0A66C2] transition-colors p-1"
                          title="LinkedIn"
                        >
                          <LinkedInIcon className="h-4 w-4" />
                        </a>
                      )}
                      {finalist.portfolioUrl && (
                        <a
                          href={finalist.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#059669] transition-colors p-1"
                          title="Portfolio"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {finalist.githubUrl && (
                        <a
                          href={finalist.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#0F172A] transition-colors p-1"
                          title="GitHub"
                        >
                          <GitHubIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. SPECIAL RECOGNITION & CUSTOM AWARDS                                */}
        {/* ===================================================================== */}
        {otherFinalists.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Award className="h-3.5 w-3.5" />
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A]">
                Special Recognition & Honors
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {otherFinalists.map((honoree, idx) => {
                const title =
                  honoree.recognitionType === "custom" && honoree.customRecognition
                    ? honoree.customRecognition
                    : honoree.recognitionType === "finalist"
                    ? "Finalist"
                    : "Special Recognition";

                return (
                  <motion.div
                    key={honoree.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                  >
                    <Card className="border border-[#E2E8F0] bg-white p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-full group text-center">
                      <div className="space-y-3">
                        {/* Top Category Badge */}
                        <div className="flex items-center justify-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] truncate max-w-full">
                            {title}
                          </span>
                        </div>

                        {/* Large Participant Photo */}
                        <div className="flex justify-center pt-1">
                          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-purple-100 p-0.5 bg-white shadow-xs group-hover:scale-105 transition-transform duration-300">
                            {honoree.photoUrl ? (
                              <img
                                src={honoree.photoUrl}
                                alt={honoree.fullName}
                                className="h-full w-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className="h-full w-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xl">
                                {honoree.fullName.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Name & Subtitles */}
                        <div>
                          <h4 className="font-heading font-bold text-base text-[#0F172A] truncate" title={honoree.fullName}>
                            {honoree.fullName}
                          </h4>
                          {honoree.teamName && (
                            <p className="text-xs text-[#2563EB] font-medium truncate mt-0.5">
                              {honoree.teamName}
                            </p>
                          )}
                          {honoree.collegeOrOrg && (
                            <p className="text-[11px] text-[#64748B] truncate">
                              {honoree.collegeOrOrg}
                            </p>
                          )}
                        </div>

                        {/* Bio / Description */}
                        {honoree.description && (
                          <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-2.5 rounded-xl text-left border border-[#E2E8F0]/60">
                            {honoree.description}
                          </p>
                        )}

                        {/* Badges List */}
                        {honoree.badges && honoree.badges.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                            {honoree.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-bold"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                <span>{b.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Social profiles */}
                      <div className="flex items-center justify-center gap-3 pt-3 mt-3 border-t border-[#E2E8F0]/60 text-[#64748B]">
                        {honoree.linkedInUrl && (
                          <a
                            href={honoree.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#0A66C2] transition-colors p-1"
                            title="LinkedIn"
                          >
                            <LinkedInIcon className="h-4 w-4" />
                          </a>
                        )}
                        {honoree.portfolioUrl && (
                          <a
                            href={honoree.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#059669] transition-colors p-1"
                            title="Portfolio"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {honoree.githubUrl && (
                          <a
                            href={honoree.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#0F172A] transition-colors p-1"
                            title="GitHub"
                          >
                            <GitHubIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
