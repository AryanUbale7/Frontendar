"use client";

import React from "react";
import { Navbar } from "@/components/design-system/Navbar";
import { Sidebar } from "@/components/design-system/Sidebar";
import { Footer } from "@/components/design-system/Footer";
import { UserMenu } from "@/components/design-system/UserMenu";
import { useUser } from "@/hooks/useUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const isParticipant = user?.role === "participant";

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Top Navbar with UserMenu */}
      <Navbar />

      {/* Main Body Shell */}
      <div className="flex flex-1 overflow-hidden">
        {!isParticipant && <Sidebar />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
