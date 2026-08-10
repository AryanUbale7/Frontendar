"use client";

import React from "react";
import { Navbar } from "@/components/design-system/Navbar";
import { Sidebar } from "@/components/design-system/Sidebar";
import { Footer } from "@/components/design-system/Footer";

export interface AppLayoutShellProps {
  children: React.ReactNode;
}

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body Shell: Sidebar + Content */}
      <div className="flex flex-1 overflow-x-hidden w-full min-w-0">
        {/* Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full min-w-0">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
