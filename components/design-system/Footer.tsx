import React from "react";
import { MessageSquare } from "lucide-react";
import { FOOTER_SECTIONS } from "@/constants/landing-data";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E2E8F0] mt-auto relative overflow-hidden">
      {/* Top Brand Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF006E] via-[#FF8A00] to-[#FFD60A]" />

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        {/* Layout matching user hand-drawn paper sketch with larger readable font size */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start mb-12">
          {/* Left Section: 2 Link Columns */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm font-semibold text-[#334155]">
                {FOOTER_SECTIONS.quickLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-[#FF006E] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">
                Explore Tracks
              </h4>
              <ul className="space-y-3 text-sm font-semibold text-[#334155]">
                <li><a href="#featured-hackathons" className="hover:text-[#FF006E] transition-colors">Frontend Wars</a></li>
                <li><a href="#featured-hackathons" className="hover:text-[#FF006E] transition-colors">UI/UX Sprints</a></li>
                <li><a href="#featured-hackathons" className="hover:text-[#FF006E] transition-colors">AI Build Challenges</a></li>
                <li><a href="#featured-hackathons" className="hover:text-[#FF006E] transition-colors">Open Source</a></li>
              </ul>
            </div>
          </div>

          {/* Center Section: Centered Logo + Frontend Arena Title + 2 Sub Link Columns */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-3 flex flex-col items-center group cursor-pointer">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-black p-3 shadow-lg border border-[#E2E8F0] group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="Frontend Arena Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-2xl font-black text-[#0F172A] tracking-tight">
                  Frontend Arena
                </h3>
                <p className="text-sm text-[#475569] font-semibold">
                  Developer Community & Hackathons
                </p>
              </div>
            </div>

            {/* 2 Sub Link Columns under Center Logo */}
            <div className="grid grid-cols-2 gap-10 text-center pt-4 border-t border-[#E2E8F0] w-full max-w-sm">
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">Support</span>
                <ul className="space-y-2 text-sm font-semibold text-[#334155]">
                  <li><a href="#" className="hover:text-[#FF006E] transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-[#FF006E] transition-colors">Contact Us</a></li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">Legal</span>
                <ul className="space-y-2 text-sm font-semibold text-[#334155]">
                  <li><a href="/privacy-policy" className="hover:text-[#FF006E] transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-[#FF006E] transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Section: Paragraph Description + Social Links Box */}
          <div className="space-y-6">
            <div className="space-y-2.5">
              <h4 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">
                About Platform
              </h4>
              <p className="text-sm text-[#475569] leading-relaxed font-medium">
                The premier developer community & official hackathon platform. Build real-world software, compete in global challenges, and grow with thousands of ambitious builders.
              </p>
            </div>

            {/* Distinct Social Links Box matching paper sketch */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 shadow-2xs">
              <h5 className="font-heading text-sm font-extrabold uppercase tracking-wider text-[#0F172A]">
                Social Links
              </h5>
              <div className="flex items-center gap-3">
                {/* GitHub */}
                <a
                  href="https://github.com/FrontendArenaOfficial"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white hover:border-[#FF006E] transition-all shadow-xs"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/frontend-arena7/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white hover:border-[#FF006E] transition-all shadow-xs"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/frontend_arena?igsh=M3FpcTZoNmd6cmx4"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white hover:border-[#FF006E] transition-all shadow-xs"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* Discord */}
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Discord"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#FF006E] hover:text-white hover:border-[#FF006E] transition-all shadow-xs"
                >
                  <MessageSquare className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0] text-sm text-[#475569] font-medium">
          <p>© {new Date().getFullYear()} Frontend Arena. All rights reserved.</p>
          <div className="flex items-center gap-6 font-semibold">
            <a href="/privacy-policy" className="hover:text-[#FF006E] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#FF006E] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#FF006E] transition-colors">Community Guidelines</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
