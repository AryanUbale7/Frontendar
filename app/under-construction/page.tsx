import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Construction — Frontend Arena",
  description: "Frontend Arena is currently under construction. A premium space for developer events is coming soon.",
};

export default function UnderConstructionPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] flex flex-col items-center justify-center text-white p-6 relative overflow-hidden select-none">
      
      {/* Ambient background grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      {/* Centered card */}
      <div className="z-10 flex flex-col items-center max-w-md w-full text-center">
        
        {/* Brand Logo Container */}
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-black p-1.5 shadow-xl border border-slate-800 animate-pulse">
          <img
            src="/logo.png"
            alt="Frontend Arena Logo"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Headline */}
        <h1 className="mt-8 font-heading text-2xl sm:text-3xl font-black tracking-widest text-white uppercase leading-none">
          UNDER CONSTRUCTION
        </h1>
        
        {/* Description */}
        <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
          We are currently crafting a premium platform for developer hackathons, community events, and challenges.
        </p>

        {/* Divider line */}
        <div className="my-8 w-24 h-[1px] bg-slate-800" />

        {/* Subtitle / Footer info */}
        <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
          FRONTEND ARENA • COMING SOON
        </span>
        
      </div>
    </div>
  );
}
