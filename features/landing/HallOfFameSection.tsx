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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />
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

      <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-14">
        {/* Section Header with Event Name & Event Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-[#E2E8F0]/80">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                Hall of Fame
              </span>
              <span className="text-xs font-bold text-[#0F172A] bg-white px-3 py-1 rounded-lg border border-[#E2E8F0] shadow-2xs flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                {activeEvent.name}
              </span>
              <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                Edition {activeEvent.year}
              </span>
            </div>

            <div>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-tight">
                {activeEvent.name}
              </h2>
              <p className="text-base sm:text-lg text-[#475569] max-w-3xl mt-2 leading-relaxed">
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
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
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
                  <Card className="border border-amber-300/80 bg-gradient-to-b from-amber-50/50 via-white to-white p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute top-4 right-4 h-11 w-11 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 font-bold shadow-xs">
                      <Crown className="h-6 w-6" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                      {/* Photo Frame */}
                      <div className="relative shrink-0">
                        <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-3xl overflow-hidden border-3 border-amber-400 p-1 bg-white shadow-lg group-hover:scale-105 transition-transform duration-300">
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
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap">
                          <Trophy className="h-3.5 w-3.5" />
                          <span>1st Place Winner</span>
                        </div>
                      </div>

                      {/* Info & Achievements */}
                      <div className="space-y-3.5 flex-1 text-center sm:text-left min-w-0 pt-1">
                        <div>
                          <h4 className="font-heading text-2xl sm:text-3xl font-bold text-[#0F172A]">
                            {winner.fullName}
                          </h4>
                          {winner.teamName && (
                            <p className="text-sm font-bold text-[#2563EB] flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                              <Users className="h-4 w-4" />
                              <span>Team: {winner.teamName}</span>
                            </p>
                          )}
                          {winner.collegeOrOrg && (
                            <p className="text-xs text-[#64748B] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                              <Building className="h-3.5 w-3.5" />
                              <span>{winner.collegeOrOrg}</span>
                            </p>
                          )}
                        </div>

                        {winner.description && (
                          <p className="text-xs sm:text-sm text-[#475569] leading-relaxed bg-white/90 p-3.5 rounded-2xl border border-amber-100 shadow-2xs">
                            {winner.description}
                          </p>
                        )}

                        {/* Badges List */}
                        {winner.badges && winner.badges.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                            {winner.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-900 text-xs font-bold border border-amber-200"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
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
                              className="h-9 w-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-xs"
                              title="LinkedIn"
                            >
                              <LinkedInIcon className="h-4.5 w-4.5" />
                            </a>
                          )}
                          {winner.portfolioUrl && (
                            <a
                              href={winner.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#059669] hover:border-[#059669] transition-colors shadow-xs"
                              title="Portfolio"
                            >
                              <Globe className="h-4.5 w-4.5" />
                            </a>
                          )}
                          {winner.githubUrl && (
                            <a
                              href={winner.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center hover:text-[#0F172A] hover:border-[#0F172A] transition-colors shadow-xs"
                              title="GitHub"
                            >
                              <GitHubIcon className="h-4.5 w-4.5" />
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
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                <Medal className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
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
                  <Card className="border border-[#CBD5E1] bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all flex flex-col justify-between h-full group overflow-hidden">
                    {/* Full Card Top Portrait Photo */}
                    <div className="relative w-full h-64 sm:h-72 bg-slate-100 overflow-hidden shrink-0">
                      {runner.photoUrl ? (
                        <img
                          src={runner.photoUrl}
                          alt={runner.fullName}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-4xl">
                          {runner.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />

                      <div className="absolute top-3.5 left-3.5">
                        <span className="px-3 py-1 rounded-full bg-white/95 text-slate-900 font-extrabold text-xs shadow-md backdrop-blur-xs border border-white/80 flex items-center gap-1">
                          🥈 2nd Place Runner-Up
                        </span>
                      </div>
                      <div className="absolute top-3.5 right-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                          #{idx + 2}
                        </span>
                      </div>

                      <div className="absolute bottom-3.5 left-4 right-4 text-white">
                        <h4 className="font-heading text-xl font-bold drop-shadow-md">
                          {runner.fullName}
                        </h4>
                        {runner.teamName && (
                          <p className="text-xs font-semibold text-blue-200 drop-shadow-xs">
                            Team: {runner.teamName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {runner.collegeOrOrg && (
                          <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5" />
                            <span>{runner.collegeOrOrg}</span>
                          </p>
                        )}

                        {runner.description && (
                          <p className="text-xs text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                            {runner.description}
                          </p>
                        )}

                        {runner.badges && runner.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {runner.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>{b.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Social links */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-[#64748B]">
                        <div className="flex items-center gap-3">
                          {runner.linkedInUrl && (
                            <a
                              href={runner.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#0A66C2] transition-colors p-1"
                              title="LinkedIn"
                            >
                              <LinkedInIcon className="h-4.5 w-4.5" />
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
                              <Globe className="h-4.5 w-4.5" />
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
                              <GitHubIcon className="h-4.5 w-4.5" />
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
        {/* 3. TOP 10 FINALISTS GRID                                              */}
        {/* ===================================================================== */}
        {top10s.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-[#2563EB] flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4 text-[#2563EB]" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
                Top 10 Finalists
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {top10s.map((finalist, idx) => (
                <motion.div
                  key={finalist.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                >
                  <Card className="border border-[#E2E8F0] bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all flex flex-col justify-between h-full group overflow-hidden">
                    {/* Full Top Portrait Photo */}
                    <div className="relative w-full h-64 sm:h-72 bg-slate-100 overflow-hidden shrink-0">
                      {finalist.photoUrl ? (
                        <img
                          src={finalist.photoUrl}
                          alt={finalist.fullName}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold text-3xl">
                          {finalist.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />

                      <div className="absolute top-3.5 left-3.5">
                        <span className="px-3 py-1 rounded-full bg-white/95 text-blue-900 font-extrabold text-xs shadow-md backdrop-blur-xs border border-white/80">
                          Top 10 Finalist
                        </span>
                      </div>
                      <div className="absolute top-3.5 right-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-white font-bold text-xs backdrop-blur-xs">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="absolute bottom-3.5 left-4 right-4 text-white">
                        <h4 className="font-heading text-lg font-bold drop-shadow-md truncate" title={finalist.fullName}>
                          {finalist.fullName}
                        </h4>
                        {finalist.teamName && (
                          <p className="text-xs font-semibold text-blue-200 drop-shadow-xs truncate">
                            Team: {finalist.teamName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {finalist.collegeOrOrg && (
                          <p className="text-xs text-[#64748B] flex items-center gap-1.5 truncate">
                            <Building className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{finalist.collegeOrOrg}</span>
                          </p>
                        )}

                        {finalist.description && (
                          <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]/60">
                            {finalist.description}
                          </p>
                        )}

                        {finalist.badges && finalist.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {finalist.badges.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>{b.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Social profiles */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-[#64748B]">
                        <div className="flex items-center gap-3">
                          {finalist.linkedInUrl && (
                            <a
                              href={finalist.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#0A66C2] transition-colors p-1"
                              title="LinkedIn"
                            >
                              <LinkedInIcon className="h-4.5 w-4.5" />
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
                              <Globe className="h-4.5 w-4.5" />
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
                              <GitHubIcon className="h-4.5 w-4.5" />
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
        {/* 4. SPECIAL RECOGNITION & CUSTOM AWARDS                                */}
        {/* ===================================================================== */}
        {otherFinalists.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-xs">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
                Special Recognition & Honors
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                    <Card className="border border-[#E2E8F0] bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all flex flex-col justify-between h-full group overflow-hidden">
                      {/* Full Card Top Portrait Photo */}
                      <div className="relative w-full h-64 sm:h-72 bg-slate-100 overflow-hidden shrink-0">
                        {honoree.photoUrl ? (
                          <img
                            src={honoree.photoUrl}
                            alt={honoree.fullName}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center font-bold text-3xl">
                            {honoree.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />

                        {/* Top Floating Badge */}
                        <div className="absolute top-3.5 left-3.5 max-w-[85%]">
                          <span className="px-3 py-1 rounded-full bg-white/95 text-purple-900 font-extrabold text-xs shadow-md backdrop-blur-xs border border-white/80 truncate block">
                            {title}
                          </span>
                        </div>

                        {/* Name on image overlay */}
                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                          <h4 className="font-heading text-lg font-bold drop-shadow-md truncate" title={honoree.fullName}>
                            {honoree.fullName}
                          </h4>
                          {honoree.teamName && (
                            <p className="text-xs font-semibold text-purple-200 drop-shadow-xs truncate">
                              Team: {honoree.teamName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          {honoree.collegeOrOrg && (
                            <p className="text-xs text-[#64748B] flex items-center gap-1.5 truncate">
                              <Building className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{honoree.collegeOrOrg}</span>
                            </p>
                          )}

                          {honoree.description && (
                            <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]/60">
                              {honoree.description}
                            </p>
                          )}

                          {honoree.badges && honoree.badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {honoree.badges.map((b) => (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>{b.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Social profiles */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-[#64748B]">
                          <div className="flex items-center gap-3">
                            {honoree.linkedInUrl && (
                              <a
                                href={honoree.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[#0A66C2] transition-colors p-1"
                                title="LinkedIn"
                              >
                                <LinkedInIcon className="h-4.5 w-4.5" />
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
                                <Globe className="h-4.5 w-4.5" />
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
                                <GitHubIcon className="h-4.5 w-4.5" />
                              </a>
                            )}
                          </div>
                        </div>
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
