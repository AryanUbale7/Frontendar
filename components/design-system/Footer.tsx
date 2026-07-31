import React from "react";
import { MessageSquare } from "lucide-react";
import { BRAND_CONFIG } from "@/constants/design-system";
import { FOOTER_SECTIONS } from "@/constants/landing-data";

export function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-[#FF006E] via-[#FF8A00] to-[#FFD60A] text-white mt-auto relative overflow-hidden shadow-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Official Brand Logo Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black p-1 shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                <img
                  src="/logo.png"
                  alt="Frontend Arena Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold text-white tracking-tight">
                  {BRAND_CONFIG.name}
                </span>
                <span className="text-[10px] font-semibold text-white/80">
                  Developer Community & Hackathons
                </span>
              </div>
            </div>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              The premier developer community & official hackathon platform. Build real-world software, compete in global challenges, and grow with thousands of builders.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-medium text-white/90">
              {FOOTER_SECTIONS.quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white hover:underline transition-all">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform & Support */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-white">
              Platform & Support
            </h4>
            <ul className="space-y-2 text-xs font-medium text-white/90">
              {FOOTER_SECTIONS.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white hover:underline transition-all">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Community */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-white">
              Join the Community
            </h4>
            <p className="text-xs text-white/90 font-medium">
              Connect with fellow developers, find team members, and get real-time hackathon announcements.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-[#FF006E] transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-[#FF006E] transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-[#FF006E] transition-all shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* Discord */}
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/30 bg-white/15 backdrop-blur-md text-white hover:bg-white hover:text-[#FF006E] transition-all shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20 text-xs text-white/90 font-medium">
          <p>© {new Date().getFullYear()} Frontend Arena. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white hover:underline transition-all">Privacy Policy</a>
            <a href="#" className="hover:text-white hover:underline transition-all">Terms of Service</a>
            <a href="#" className="hover:text-white hover:underline transition-all">Community Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
