import React from "react";
import { Terminal, ShieldCheck, Code2, Trophy, Building2, CheckCircle2 } from "lucide-react";
import { BRAND_CONFIG } from "@/constants/design-system";
import { Logo } from "@/components/design-system/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-[#F4F6FF] text-[#1A1A1A]">
      {/* Left Brand Panel (Desktop & Laptop) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-[#5B4DFF] via-[#4738E6] to-[#5B4DFF] p-12 text-[#FFFFFF] relative overflow-hidden border-r border-[#4738E6]">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#00D1B2]/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#FF3D81]/20 blur-3xl" />

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo size="md" href="/" />
        </div>

        {/* Center Tagline & Checklist */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl xl:text-4xl font-extrabold leading-tight text-[#FFFFFF]">
              Build Real Software. <br />
              <span className="text-[#00D1B2]">
                Compete Globally.
              </span>
            </h1>
            <p className="text-sm text-[#FFFFFF]/90 font-medium leading-relaxed">
              Join thousands of developers competing in premier frontend challenges, hackathons, and engineering sprints.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { title: "Verifiable Certifications & Badges", desc: "Proof of participation and winner certificates generated directly." },
              { title: "Live Mentor Code Reviews", desc: "Get real feedback from senior frontend architects and judges." },
              { title: "Guaranteed Prize Pools", desc: "Direct cash rewards, sponsor bounties, and tech career opportunities." },
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-[14px] bg-[#FFFFFF]/15 border border-[#FFFFFF]/30 backdrop-blur-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFFFFF] text-[#5B4DFF] shrink-0 mt-0.5 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#00D1B2]">{feat.title}</h4>
                  <p className="text-[11px] text-[#FFFFFF]/90">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="relative z-10 text-xs text-[#FFFFFF]/80 font-medium">
          © {new Date().getFullYear()} Frontend Arena. All rights reserved.
        </div>
      </div>

      {/* Right Auth Form Container */}
      <div className="flex w-full lg:w-1/2 flex-col justify-between p-4 sm:p-8 md:p-12 overflow-y-auto bg-[#F4F6FF]">
        {/* Mobile Header Banner */}
        <div className="flex lg:hidden items-center justify-center pb-6 border-b border-[#E2E8F0] mb-6">
          <Logo size="sm" href="/" />
        </div>

        <div className="my-auto mx-auto w-full max-w-md space-y-6">
          {children}
        </div>

        {/* Footer info link */}
        <div className="text-center text-xs text-[#2D2B55] pt-8">
          Need help? <a href="/#faq" className="text-[#4741A6] hover:underline font-bold">Read FAQs</a>
        </div>
      </div>
    </div>
  );
}
