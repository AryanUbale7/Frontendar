import React from "react";
import { Logo } from "@/components/design-system/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] p-4 sm:p-6 md:p-8">
      {/* Top Header Logo */}
      <div className="mb-6 flex justify-center">
        <Logo size="lg" href="/" />
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Minimal Footer */}
      <div className="mt-6 text-center text-xs text-[#64748B]">
        Need help? <a href="/#faq" className="font-bold text-[#4F46E5] hover:underline">Read FAQs</a>
      </div>
    </div>
  );
}
