"use client";

import React from "react";
import {
  LayoutDashboard,
  Trophy,
  GitPullRequest,
  Scale,
  Medal,
  Users,
  BarChart3,
  Settings,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_NAVIGATION } from "@/constants/design-system";
import { useUIStore } from "@/store/uiStore";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Trophy,
  GitPullRequest,
  Scale,
  Medal,
  Users,
  QrCode,
  BarChart3,
  Settings,
};

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeTab, setActiveTab } = useUIStore();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 z-30 select-none",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Sidebar Top Collapse Toggle */}
      <div className="flex h-12 items-center justify-end px-3 border-b border-[#E2E8F0]/60">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {DEFAULT_NAVIGATION.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {sidebarOpen && (
              <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#475569]/80 mb-2">
                {group.title}
              </h4>
            )}
            {group.items.map((item) => {
              const Icon = item.icon ? ICON_MAP[item.icon] || LayoutDashboard : LayoutDashboard;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#FF006E] text-white shadow-xs"
                      : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-white" : "text-[#475569]"
                    )}
                  />
                  {sidebarOpen && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {sidebarOpen && item.badge && (
                    <Badge
                      variant={isActive ? "solid" : "secondary"}
                      size="sm"
                      className={isActive ? "bg-white/20 text-white" : ""}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer System Info */}
      {sidebarOpen && (
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]/50">
          <div className="rounded-[12px] border border-[#E2E8F0] bg-white p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Arena Subnet</span>
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            </div>
            <p className="text-[11px] text-[#475569]">
              Mainnet v2.4 judging nodes operational.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
