"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, Menu, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BRAND_CONFIG } from "@/constants/design-system";
import { useUIStore } from "@/store/uiStore";
import { UserMenu } from "@/components/design-system/UserMenu";
import { useUser } from "@/hooks/useUser";

export function Navbar() {
  const { toggleSidebar, searchQuery, setSearchQuery } = useUIStore();
  const { user } = useUser();
  const isParticipant = user?.role === "participant";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 md:px-6 backdrop-blur-sm shadow-xs">
      <div className="flex items-center gap-3">
        {!isParticipant && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            className="text-[#475569] hover:text-[#0F172A]"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black p-1 shadow-sm group-hover:scale-105 transition-transform duration-200">
            <img
              src="/logo.png"
              alt="Frontend Arena Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold text-[#0F172A]">
                {BRAND_CONFIG.name}
              </span>
              <Badge variant="accent" size="sm">
                Developer Hub
              </Badge>
            </div>
            <span className="text-[11px] font-medium text-[#475569]">
              Hackathons & Innovation Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex max-w-md w-full mx-4">
        <Input
          placeholder="Search hackathons, projects, teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-[#475569]" />}
          className="bg-[#F8FAFC] border-[#E2E8F0] focus-visible:bg-white"
        />
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#16A34A] text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Community Active</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative text-[#475569] hover:text-[#0F172A]"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
        </Button>

        {/* User Profile Avatar Dropdown */}
        <div className="pl-2 border-l border-[#E2E8F0]">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
