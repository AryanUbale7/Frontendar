"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Trophy,
  BarChart3,
  BookOpen,
  Info,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "#hero", icon: Home },
  { label: "Hackathons", href: "#featured-hackathons", icon: Trophy },
  { label: "Leaderboards", href: "#leaderboards", icon: BarChart3 },
  { label: "Resources", href: "#resources", icon: BookOpen },
  { label: "About", href: "#who-we-are", icon: Info },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none flex justify-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto w-full max-w-7xl rounded-2xl transition-all duration-300",
          "bg-white/90 backdrop-blur-xl border border-[#E2E8F0] shadow-[0_4px_25px_rgba(0,0,0,0.04)]",
          scrolled ? "shadow-[0_10px_35px_rgba(37,99,235,0.08)] py-2.5 px-4 md:px-6" : "py-3 px-4 md:px-6"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="#hero" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] text-white font-heading font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-heading text-lg font-bold text-[#0F172A] tracking-tight">
              Frontend Arena
            </span>
          </Link>

          {/* Center Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0]/80 p-1 rounded-2xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setActiveTab(item.label)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
                    isActive
                      ? "text-[#4F46E5] bg-[#EEF2FF] shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/80"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-md shadow-[#4F46E5]/20 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="font-heading">Dashboard</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute top-20 left-4 right-4 md:hidden rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xl space-y-3"
          >
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => {
                      setActiveTab(item.label);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 py-2.5 px-4 text-sm font-semibold text-[#0F172A] rounded-xl hover:bg-[#F8FAFC]"
                  >
                    <Icon className="h-4 w-4 text-[#4F46E5]" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0]">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-[#4F46E5]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
