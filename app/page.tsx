import type { Metadata } from "next";
import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { HeroSection } from "@/features/landing/HeroSection";
import { WhoWeAreSection } from "@/features/landing/WhoWeAreSection";
import { WhatWeOrganizeSection } from "@/features/landing/WhatWeOrganizeSection";
import { WhyJoinSection } from "@/features/landing/WhyJoinSection";
import { HowItWorksSection } from "@/features/landing/HowItWorksSection";
import { OurPlatformSection } from "@/features/landing/OurPlatformSection";
import { FeaturedHackathonsSection } from "@/features/landing/FeaturedHackathonsSection";
import { PlatformStatsSection } from "@/features/landing/PlatformStatsSection";
import { TestimonialsSection } from "@/features/landing/TestimonialsSection";
import { FAQSection } from "@/features/landing/FAQSection";
import { CtaBannerSection } from "@/features/landing/CtaBannerSection";
import { Footer } from "@/components/design-system/Footer";

export const metadata: Metadata = {
  title: "Frontend Arena — Official Developer Community & Premium Hackathons",
  description:
    "Join Frontend Arena and participate in premium hackathons, innovation challenges, and developer events designed to help you build real-world projects, showcase your skills, and grow with the community.",
  openGraph: {
    title: "Frontend Arena — Premier Developer Community & Hackathons",
    description:
      "Participate in premium hackathons, coding challenges, UI/UX competitions, and earn verifiable digital certificates.",
    url: "https://frontendarena.dev",
    siteName: "Frontend Arena",
    images: [
      {
        url: "https://frontendarena.dev/og-image.png",
        width: 1200,
        height: 630,
        alt: "Frontend Arena Developer Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frontend Arena — Developer Community & Hackathons",
    description:
      "Join Frontend Arena to build real-world software, compete in global hackathons, and win cash prizes.",
    creator: "@frontendarena",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* 1. Navbar */}
      <LandingNavbar />

      {/* Main Developer Platform Landing Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Who We Are */}
        <WhoWeAreSection />

        {/* 3. What We Organize */}
        <WhatWeOrganizeSection />

        {/* 4. Why Join Frontend Arena */}
        <WhyJoinSection />

        {/* 5. How It Works (6-Step Timeline) */}
        <HowItWorksSection />

        {/* 6. Our Platform (Capabilities) */}
        <OurPlatformSection />

        {/* 7. Featured Hackathons */}
        <FeaturedHackathonsSection />

        {/* 8. Community Impact (Statistics) */}
        <PlatformStatsSection />

        {/* 9. Testimonials (Students, Developers, Winners) */}
        <TestimonialsSection />

        {/* 10. FAQ */}
        <FAQSection />

        {/* 11. Final CTA Banner */}
        <CtaBannerSection />
      </main>

      {/* 12. Footer */}
      <Footer />
    </div>
  );
}
