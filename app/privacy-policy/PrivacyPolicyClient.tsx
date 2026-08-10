"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  Globe,
  User,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { Footer } from "@/components/design-system/Footer";
import { PRIVACY_CONFIG, PRIVACY_SECTIONS } from "@/constants/privacy-policy";
import { Button } from "@/components/ui/button";

export function PrivacyPolicyClient() {
  const [activeSectionId, setActiveSectionId] = useState<string>(PRIVACY_SECTIONS[0].id);

  // IntersectionObserver for active scrollspy highlighting
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    PRIVACY_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E1A] text-[#E2E8F0] selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. Top Global Navigation Header */}
      <LandingNavbar />

      {/* 2. Hero Section with Gold Accents */}
      <section className="relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-[#0F172A] via-[#0A0E1A] to-[#0A0E1A] py-16 md:py-24">
        {/* Subtle Ambient Gold Glow Effect */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-amber-400/5 to-transparent blur-3xl opacity-60"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            {/* Small Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 shadow-xs backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>{PRIVACY_CONFIG.brandName}</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Privacy Policy
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 font-medium">
              Your privacy matters to us. Learn how we collect, use, and safeguard your personal information.
            </p>

            {/* Last Updated Date & Shield Badge */}
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-amber-400/90 bg-slate-900/80 border border-amber-500/20 px-4 py-2 rounded-xl shadow-inner">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Last Updated: {PRIVACY_CONFIG.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Bottom Metallic Gold Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </section>

      {/* 3. Main Document Body & Sticky On-This-Page Navigation */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Legal Content Column (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-10 max-w-4xl">
            {PRIVACY_SECTIONS.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-md backdrop-blur-xs transition-colors hover:border-amber-500/30"
              >
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                    {sec.number}
                  </div>
                  <h2 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed font-normal">
                  {sec.content.map((block, idx) => {
                    if (block.type === "paragraph") {
                      return <p key={idx}>{block.text}</p>;
                    }

                    if (block.type === "list" && block.items) {
                      return (
                        <ul key={idx} className="space-y-2.5 my-3 pl-2">
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2.5 text-slate-300">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (block.type === "contact_info") {
                      return (
                        <div
                          key={idx}
                          className="mt-6 rounded-xl border border-amber-500/30 bg-slate-950/80 p-5 space-y-3 font-mono text-xs md:text-sm text-slate-200"
                        >
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-2">
                            <ShieldCheck className="h-5 w-5" />
                            <span>{PRIVACY_CONFIG.brandName}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                            <div>
                              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Founder</span>
                              <span className="font-semibold text-white">{PRIVACY_CONFIG.founder}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Email</span>
                              <a
                                href={`mailto:${PRIVACY_CONFIG.officialEmail}`}
                                className="font-semibold text-amber-400 hover:underline"
                              >
                                {PRIVACY_CONFIG.officialEmail}
                              </a>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Website</span>
                              <a
                                href={PRIVACY_CONFIG.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-amber-400 hover:underline flex items-center gap-1"
                              >
                                {PRIVACY_CONFIG.websiteUrl}
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </section>
            ))}

            {/* Bottom Callout Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="h-4 w-4" />
                  <span>Privacy Support</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Have a question about your privacy?
                </h3>
                <p className="text-xs text-slate-300">
                  Contact the Frontend Arena team for any questions or data requests.
                </p>
              </div>

              <a
                href={`mailto:${PRIVACY_CONFIG.officialEmail}`}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md hover:shadow-amber-500/20"
              >
                <Mail className="h-4 w-4" />
                <span>Contact Us</span>
              </a>
            </div>
          </div>

          {/* Sticky Table of Contents Sidebar ("On this page") (4 cols on lg) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3 text-xs font-bold uppercase tracking-wider text-amber-400">
                <FileText className="h-4 w-4 text-amber-400" />
                <span>On this page</span>
              </div>

              <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1 text-xs">
                {PRIVACY_SECTIONS.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="truncate">{sec.shortTitle}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isActive ? "text-amber-400 translate-x-0.5" : "text-slate-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Small Quick Info Box */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>{PRIVACY_CONFIG.tagline}</span>
              </div>
              <p>
                © {new Date().getFullYear()} {PRIVACY_CONFIG.brandName}. All rights reserved.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
