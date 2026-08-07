"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Users, LayoutDashboard, LogOut, User } from "lucide-react";
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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs"
          : "bg-white/70 backdrop-blur-sm border-b border-[#E2E8F0]/50"
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo */}
        <Link href="#hero" className="flex items-center gap-3 group">
          <div className="flex h-13 w-13 items-center justify-center rounded-[14px] bg-black p-1 shadow-md group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/logo.png"
              alt="Frontend Arena Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-base font-bold text-[#0F172A]">
              {BRAND_CONFIG.name}
            </span>
            <span className="text-[10px] font-medium text-[#475569]">
              Developer Community & Hackathons
            </span>
          </div>
        </Link>

        {/* Center Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#475569] hover:text-[#FF006E] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Desktop CTAs / User Profile */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/sign-up" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Join Community</span>
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
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
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E8F0] bg-white p-4 space-y-3 animate-in slide-in-from-top-2">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#0F172A] hover:text-[#FF006E]"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-xs">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0F172A]">{user.fullName}</span>
                      <span className="text-[10px] text-[#64748B]">{user.email}</span>
                    </div>
                  </div>
                </div>
                <Button asChild variant="default" className="w-full">
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild variant="default" className="w-full">
                  <Link href="/sign-up" className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Join Community</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
