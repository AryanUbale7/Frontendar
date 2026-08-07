"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  showSubtitle?: boolean;
}

export function Logo({
  className,
  size = "md",
  href = "/",
  showSubtitle = false,
}: LogoProps) {
  const iconSizeClasses = {
    sm: "h-11 w-11 rounded-[12px]",
    md: "h-14 w-14 rounded-[14px]",
    lg: "h-18 w-18 rounded-[16px]",
    xl: "h-22 w-22 rounded-[20px]",
  };

  const textSizeClasses = {
    sm: "text-base sm:text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {/* Actual Image Logo Container */}
      <div className={cn("flex items-center justify-center bg-[#121929] border border-[#1E2B45] p-0.5 shadow-sm group-hover:scale-105 group-hover:border-[#FE218B] transition-all duration-200 shrink-0", iconSizeClasses[size])}>
        <img
          src="/logo.png"
          alt="Frontend Arena Official Logo"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Brand Text Header in Malison Font */}
      <div className="flex flex-col">
        <div className={cn("font-logo font-black tracking-normal flex items-center leading-tight uppercase", textSizeClasses[size])}>
          <span className="text-[#FE218B] transition-colors group-hover:text-[#E01076]">
            Frontend
          </span>
          <span className="text-[#21B0FE] transition-colors group-hover:text-[#00CCFF] ml-1">
            Arena
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] font-bold text-[#FED700]/90 tracking-wider uppercase">
            Developer Community & Hackathons
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label="FrontendArena Logo">
        {content}
      </Link>
    );
  }

  return content;
}
