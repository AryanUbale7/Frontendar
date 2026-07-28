"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  ChevronRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequireRole } from "@/components/auth/RequireRole";
import { useUser } from "@/hooks/useUser";
import { EmptyState } from "@/components/design-system/EmptyState";

export default function ParticipantDashboardPage() {
  const { user } = useUser();
  const initiatives: any[] = [];

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
              <div className="relative mx-auto h-20 w-20 rounded-full bg-[#FF006E] text-white font-heading font-bold text-2xl flex items-center justify-center shadow-md ring-4 ring-white">
                {user?.firstName?.charAt(0) || "A"}
                {user?.lastName?.charAt(0) || "U"}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#22C55E] ring-2 ring-white" />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold text-[#0F172A] line-clamp-1">
                  {user?.fullName || "Aryan Gajanan Ubale"}
                </h3>
                <p className="text-xs text-[#475569] font-code truncate">
                  {user?.email || "aryanubale318@gmail.com"}
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
                      <p className="text-[10px] text-[#475569]">Ongoing: 0</p>
                    </div>
                  </div>
                  <span className="font-heading text-lg font-extrabold text-[#0F172A]">0</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFD60A]/10 text-[#8A6500]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0F172A]">Submitted</h5>
                      <p className="text-[10px] text-[#475569]">Evaluated</p>
                    </div>
                  </div>
                  <span className="font-heading text-lg font-extrabold text-[#0F172A]">0</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (Initiatives Empty State) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 space-y-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <span>🧩</span> My Initiatives
                </h2>
                <p className="text-xs text-[#475569]">
                  Access a comprehensive listing of all initiatives you have registered for and participated.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF2F7] border border-[#FFCCD5] text-xs text-[#A30046] flex items-center justify-between">
                <span>This is your Primary Dashboard. Change it <a href="#" className="font-bold underline text-[#FF006E]">Here</a></span>
              </div>

              <EmptyState
                title="No Enrolled Initiatives Found"
                description="You are not currently registered for any hackathons. When a new hackathon launches and you enroll, your active tracks and submissions portal will appear here."
              />
            </Card>
          </div>
        </div>
      </motion.div>
    </RequireRole>
  );
}
