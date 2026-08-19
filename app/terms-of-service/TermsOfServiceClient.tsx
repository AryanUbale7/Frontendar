"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  ShieldCheck,
  Mail,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  HelpCircle,
  FileText,
} from "lucide-react";
import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { Footer } from "@/components/design-system/Footer";
import { TERMS_CONFIG, TERMS_SECTIONS } from "@/constants/terms-of-service";

export function TermsOfServiceClient() {
  const [activeSectionId, setActiveSectionId] = useState<string>(TERMS_SECTIONS[0].id);

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

    TERMS_SECTIONS.forEach((sec) => {
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#2563EB]/20 selection:text-[#2563EB]">
      {/* 1. Top Global Navigation Header */}
      <LandingNavbar />

      {/* 2. Light Theme Hero Section */}
      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-white py-16 md:py-20 shadow-2xs">
        {/* Top Brand Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DEE32E] via-[#FF8A00] to-[#FFD60A]" />

        <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
            {/* Small Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB] shadow-2xs">
              <Scale className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>{TERMS_CONFIG.brandName}</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Terms of Service
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#475569] font-medium leading-relaxed">
              Rules and guidelines governing your access to and use of Frontend Arena platform & events.
            </p>

            {/* Last Updated Date Badge */}
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#334155] bg-[#F1F5F9] border border-[#E2E8F0] px-4 py-2 rounded-xl">
              <Calendar className="h-4 w-4 text-[#2563EB]" />
              <span>Last Updated: {TERMS_CONFIG.lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Document Body & Sticky On-This-Page Navigation */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Legal Content Column (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-8 max-w-4xl">
            {TERMS_SECTIONS.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="scroll-mt-24 rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-8 shadow-xs transition-all hover:border-[#2563EB]/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] font-mono font-extrabold text-xs shrink-0">
                    {sec.number}
                  </div>
                  <h2 className="font-heading text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
                    {sec.title}
                  </h2>
                </div>

                <div className="space-y-4 text-[#334155] text-sm md:text-base leading-relaxed font-medium">
                  {sec.content.map((block, idx) => {
                    if (block.type === "paragraph") {
                      return <p key={idx}>{block.text}</p>;
                    }

                    if (block.type === "list" && block.items) {
                      return (
                        <ul key={idx} className="space-y-2.5 my-3 pl-2">
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2.5 text-[#334155]">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
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
                          className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3 font-mono text-xs md:text-sm text-[#0F172A]"
                        >
                          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-base mb-2">
                            <ShieldCheck className="h-5 w-5" />
                            <span>{TERMS_CONFIG.brandName}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#334155]">
                            <div>
                              <span className="text-[#64748B] block text-[11px] uppercase tracking-wider font-semibold">Founder</span>
                              <span className="font-bold text-[#0F172A]">{TERMS_CONFIG.founder}</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px] uppercase tracking-wider font-semibold">Email</span>
                              <a
                                href={`mailto:${TERMS_CONFIG.officialEmail}`}
                                className="font-bold text-[#2563EB] hover:underline"
                              >
                                {TERMS_CONFIG.officialEmail}
                              </a>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[#64748B] block text-[11px] uppercase tracking-wider font-semibold">Website</span>
                              <a
                                href={TERMS_CONFIG.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                              >
                                {TERMS_CONFIG.websiteUrl}
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
            <div className="rounded-2xl border border-[#2563EB]/20 bg-gradient-to-r from-white via-[#F8FAFC] to-[#2563EB]/5 p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[#2563EB] font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="h-4 w-4" />
                  <span>Terms Support</span>
                </div>
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  Have a question about our Terms of Service?
                </h3>
                <p className="text-xs text-[#475569]">
                  Contact the Frontend Arena team for any clarifications or requests.
                </p>
              </div>

              <a
                href={`mailto:${TERMS_CONFIG.officialEmail}`}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1D4ED8] transition-all shadow-md hover:shadow-lg"
              >
                <Mail className="h-4 w-4" />
                <span>Contact Us</span>
              </a>
            </div>
          </div>

          {/* Sticky Table of Contents Sidebar ("On this page") (4 cols on lg) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3 mb-3 text-xs font-extrabold uppercase tracking-wider text-[#2563EB]">
                <FileText className="h-4 w-4 text-[#2563EB]" />
                <span>On this page</span>
              </div>

              <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1 text-xs">
                {TERMS_SECTIONS.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? "bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/30"
                          : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <span className="truncate">{sec.shortTitle}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                          isActive ? "text-[#2563EB] translate-x-0.5" : "text-[#94A3B8]"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Small Quick Info Box */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-[11px] text-[#64748B] space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F172A] font-bold">
                <Scale className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>{TERMS_CONFIG.tagline}</span>
              </div>
              <p>
                © {new Date().getFullYear()} {TERMS_CONFIG.brandName}. All rights reserved.
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
