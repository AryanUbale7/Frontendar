import React from "react";
import { Terminal, ShieldCheck, Code2, Trophy, Building2, CheckCircle2 } from "lucide-react";
import { BRAND_CONFIG } from "@/constants/design-system";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* Left Brand Panel (Desktop & Laptop) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-12 text-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#FF006E]/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#FFD60A]/15 blur-3xl" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black p-1 shadow-md">
            <img
              src="/logo.png"
              alt="Frontend Arena Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            {BRAND_CONFIG.name}
          </span>
        </div>

        {/* Center Tagline & Checklist */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl xl:text-4xl font-extrabold leading-tight text-white">
              Building the Future of{" "}
              <span className="bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent">
                Transparent Hackathons
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join thousands of developers and top tech organizations building real-world
              software, competing in live hackathons, and earning verifiable skill credentials.
            </p>
          </div>

          {/* Feature Checklist */}
          <div className="space-y-4 pt-2">
            {[
              { label: "Secure Cryptographic Authentication", icon: ShieldCheck },
              { label: "Automated Project & Code Evaluation", icon: Code2 },
              { label: "Real-Time Leaderboards & Scorecards", icon: Trophy },
              { label: "Enterprise Organization Management", icon: Building2 },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FF006E]/15 border border-[#FF006E]/30 text-[#FFD60A]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} Frontend Arena. Official Developer Platform.
        </div>
      </div>

      {/* Right Auth Form Container */}
      <div className="flex w-full lg:w-1/2 flex-col justify-between p-4 sm:p-8 md:p-12 overflow-y-auto">
        {/* Mobile Header Banner */}
        <div className="flex lg:hidden items-center justify-center gap-2 pb-6 border-b border-[#E2E8F0] mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF006E] to-[#FFD60A] text-white">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-bold text-[#0F172A]">
            {BRAND_CONFIG.name}
          </span>
        </div>

        <div className="my-auto mx-auto w-full max-w-md space-y-6">
          {children}
        </div>

        {/* Footer info link */}
        <div className="text-center text-xs text-[#475569] pt-8">
          Need help? <a href="/#faq" className="text-[#FF006E] hover:underline font-medium">Read FAQs</a>
        </div>
      </div>
    </div>
  );
}
