"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_CONFIG } from "@/constants/design-system";
import { LANDING_NAV_LINKS } from "@/constants/landing-data";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/design-system/UserMenu";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full pt-4 pb-2 px-4 pointer-events-none bg-transparent">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 rounded-full border bg-white/90 backdrop-blur-md shadow-xs pointer-events-auto transition-all duration-300",
          scrolled
            ? "border-slate-200/80 shadow-md shadow-slate-100/20"
            : "border-slate-200/40 shadow-xs"
        )}
      >
        {/* Brand Logo */}
        <Link href="#hero" className="flex items-center gap-2 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black p-1 shadow-sm group-hover:scale-105 transition-transform shrink-0 border border-slate-200">
            <img
              src="/logo.png"
              alt="Frontend Arena Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-sm font-black text-[#0F172A] tracking-tight leading-none">
              {BRAND_CONFIG.name}
            </span>
            <span className="text-[9px] font-bold text-slate-500 tracking-widest mt-0.5">
              ARENA
            </span>
          </div>
        </Link>

        {/* Center Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-slate-605 hover:text-[#0F172A] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Desktop CTAs / User Profile */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <>
              <Button asChild variant="default" size="sm" className="rounded-full h-8 px-4 text-xs font-bold">
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 text-xs font-semibold h-8 px-3">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="rounded-full h-8 px-4 text-xs font-bold">
                <a
                  href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Join Community</span>
                </a>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-1">
          {isAuthenticated && user && (
            <div className="mr-1">
              <UserMenu />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="h-8 w-8 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-100/50"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border border-slate-200/50 bg-white/95 backdrop-blur-md p-4 mt-2 rounded-2xl shadow-lg space-y-3 animate-in slide-in-from-top-2 pointer-events-auto">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A]"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{user.fullName}</span>
                      <span className="text-[9px] text-slate-400">{user.email}</span>
                    </div>
                  </div>
                </div>
                <Button asChild variant="default" className="w-full rounded-full text-xs font-bold h-9">
                  <Link href="/dashboard" className="flex items-center justify-center gap-1.5">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Go to Dashboard</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full text-xs font-bold h-9 text-[#EF4444] border-[#EF4444]/20 hover:bg-[#EF4444]/5"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  <span>Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full rounded-full text-xs font-bold h-9">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild variant="default" className="w-full rounded-full text-xs font-bold h-9">
                  <a
                    href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Join Community</span>
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
