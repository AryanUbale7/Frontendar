"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trophy,
  GitBranch,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireRole } from "@/components/auth/RequireRole";
import { useUser } from "@/hooks/useUser";
import { EmptyState } from "@/components/design-system/EmptyState";

export default function ParticipantDashboardPage() {
  const { user } = useUser();
  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Load enrolled hackathons from localStorage
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const stored = localStorage.getItem(`fa_enrolled_hackathons_usr_${user.id}`);
      if (stored) {
        try {
          setInitiatives(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  // Count evaluated submissions
  const submittedCount = React.useMemo(() => {
    if (!user || typeof window === "undefined") return 0;
    const subs = localStorage.getItem(`fa_submissions_${user.id}`);
    if (!subs) return 0;
    try { return JSON.parse(subs).length; } catch { return 0; }
  }, [user]);


  return (
    <RequireRole role="participant">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-[#475569]">
          <Link href="/" className="hover:text-[#FF006E] flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
          <span className="font-semibold text-[#0F172A] uppercase tracking-wider text-[10px]">
            Innovator Dashboard
          </span>
        </div>

        {/* Top Dark Hero Cover Banner */}
        <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,110,0.25),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,214,10,0.15),transparent_50%)]" />
          <div className="absolute top-4 right-8 text-white/10 font-heading font-black text-6xl select-none">
            FRONTEND ARENA
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column (User Card + Stats) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="relative -mt-14 p-5 space-y-4 text-center border-[#E2E8F0] shadow-sm bg-white rounded-2xl">
              <div className="relative mx-auto h-20 w-20 rounded-full bg-[#FF006E] text-white font-heading font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-white overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.fullName || "User"} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <>
                    {user?.firstName?.charAt(0) || "A"}
                    {user?.lastName?.charAt(0) || "U"}
                  </>
                )}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#22C55E] ring-2 ring-white" />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-[#0F172A] line-clamp-1">
                  {user?.fullName || "Developer User"}
                </h3>
                <p className="text-xs text-[#475569] font-code truncate">
                  {user?.email || "user@frontendarena.dev"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-md bg-[#FFF2F7] text-[#FF006E] text-xs font-bold border border-[#FFCCD5]">
                  Level 1
                </span>
                <span className="px-3 py-1 rounded-md bg-[#DCFCE7] text-[#16A34A] text-xs font-bold border border-[#86EFAC]">
                  INNOVATOR
                </span>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-5 space-y-4 border-[#E2E8F0] shadow-sm bg-white rounded-2xl">
              <h4 className="font-heading text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <span>🎨</span> Statistics
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EF4444]/10 text-[#EF4444]">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0F172A]">Active Initiatives</h5>
                      <p className="text-[10px] text-[#475569]">Ongoing: {initiatives.length}</p>
                    </div>
                  </div>
                  <span className="font-heading text-lg font-extrabold text-[#0F172A]">{initiatives.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFD60A]/10 text-[#8A6500]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0F172A]">Evaluated</h5>
                      <p className="text-[10px] text-[#475569]">Reports generated</p>
                    </div>
                  </div>
                  <span className="font-heading text-lg font-extrabold text-[#0F172A]">{submittedCount}</span>
                </div>


              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-5 space-y-3 border-[#E2E8F0] shadow-sm bg-white rounded-2xl">
              <h4 className="font-heading text-sm font-bold text-[#0F172A]">⚡ Quick Links</h4>
              <div className="space-y-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#FF006E]/30 hover:bg-[#FFF2F7] transition-all text-xs font-semibold text-[#0F172A]"
                >
                  <GitBranch className="h-4 w-4 text-[#475569]" />
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-[#94A3B8]" />
                </a>
                <Link
                  href="/profile/settings"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#FF006E]/30 hover:bg-[#FFF2F7] transition-all text-xs font-semibold text-[#0F172A]"
                >
                  <span>👤</span>
                  <span>Edit Profile</span>
                  <ChevronRight className="h-3 w-3 ml-auto text-[#94A3B8]" />
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">



            {/* ── MY INITIATIVES ── */}
            <Card className="p-6 space-y-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <span>🧩</span> My Initiatives
                </h2>
                <p className="text-xs text-[#475569]">
                  Access all hackathons you have registered for.
                </p>
              </div>

              {initiatives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {initiatives.map((item, idx) => (
                    <Card key={idx} className="p-4 border-[#E2E8F0] shadow-xs bg-white rounded-xl space-y-3 hover:border-[#FF006E]/40 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="h-8 w-8 rounded-lg text-white font-bold text-xs flex items-center justify-center font-heading"
                            style={{ background: item.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)" }}
                          >
                            {item.title.charAt(0)}
                          </div>
                          <Badge variant="outline" size="sm" className="text-[10px]">
                            {item.tag || "Free | Virtual"}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#0F172A] line-clamp-1">{item.title}</h4>
                          <p className="text-[10px] text-[#475569] mt-0.5 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Closes: {item.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/60 text-[11px] mt-2">
                        <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
                        </span>
        <Link
                          href={`/register?id=${item.id}&workspace=true`}
                          className="text-[#FF006E] hover:underline font-bold"
                        >
                          View Workspace →
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Enrolled Initiatives Found"
                  description="You are not currently registered for any hackathons. When a new hackathon launches and you enroll, your active tracks and submissions portal will appear here."
                />
              )}
            </Card>

          </div>
        </div>
      </motion.div>
    </RequireRole>
  );
}
