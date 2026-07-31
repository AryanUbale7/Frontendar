"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, ArrowUpRight, Sparkles } from "lucide-react";
import { LANDING_NAV_LINKS } from "@/constants/landing-data";
import { cn } from "@/lib/utils";

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
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none flex justify-center">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto w-full max-w-6xl rounded-full transition-all duration-300",
          "bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
          scrolled
            ? "bg-white/90 backdrop-blur-2xl border-[#E2E8F0] shadow-[0_12px_40px_rgba(37,99,235,0.08)] py-2.5 px-4 md:px-6"
            : "py-3 px-4 md:px-6"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="#hero" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2563EB] via-[#6366F1] to-[#8B5CF6] p-0.5 shadow-md shadow-[#2563EB]/20 group-hover:scale-105 transition-transform duration-300">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-[#2563EB] font-heading font-black text-lg">
                F
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-[#0F172A] flex items-center gap-1.5">
                Frontend Arena
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              </span>
              <span className="text-[11px] font-medium text-[#64748B] tracking-wide">
                Enterprise Hackathons
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0]/60 p-1.5 rounded-full shadow-inner">
            {LANDING_NAV_LINKS.map((link) => {
              const isActive = activeTab === link.label;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setActiveTab(link.label)}
                  className={cn(
                    "relative px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200",
                    isActive
                      ? "text-[#2563EB]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-[#E2E8F0]/60"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-md shadow-[#2563EB]/25 overflow-hidden group bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#8B5CF6]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <LayoutDashboard className="h-3.5 w-3.5 relative z-10" />
                <span className="relative z-10 font-heading">Dashboard</span>
                <ArrowUpRight className="h-3.5 w-3.5 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Glass Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute top-20 left-4 right-4 md:hidden rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#E2E8F0] p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col space-y-2">
              {LANDING_NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    setActiveTab(link.label);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-between py-2.5 px-4 text-sm font-semibold text-[#0F172A] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#64748B]" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-3">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] rounded-xl border border-[#E2E8F0]"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] via-[#6366F1] to-[#8B5CF6] shadow-md"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
