"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  // Show administrative sidebar only when active route is under /dashboard/admin
  const showSidebar = pathname.startsWith("/dashboard/admin");

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Navbar with UserMenu */}
      <Navbar />

      {/* Main Body Shell */}
      <div className="flex flex-1 overflow-x-hidden w-full min-w-0">
        {showSidebar && <Sidebar />}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full min-w-0">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
