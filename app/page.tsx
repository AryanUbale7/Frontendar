import type { Metadata } from "next";
import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { MarqueeBanner } from "@/features/landing/MarqueeBanner";
import { HeroSection } from "@/features/landing/HeroSection";
import { WhoWeAreSection } from "@/features/landing/WhoWeAreSection";
import { WhyJoinSection } from "@/features/landing/WhyJoinSection";
import { FeaturedHackathonsSection } from "@/features/landing/FeaturedHackathonsSection";
import { HallOfFameSection } from "@/features/landing/HallOfFameSection";
import { PlatformStatsSection } from "@/features/landing/PlatformStatsSection";
import { FAQSection } from "@/features/landing/FAQSection";
import { CtaBannerSection } from "@/features/landing/CtaBannerSection";
import { Footer } from "@/components/design-system/Footer";

export const metadata: Metadata = {
  title: "Frontend Arena — Official Developer Community & Premium Hackathons",
  description:
    "Join Frontend Arena and participate in premium hackathons, innovation challenges, and developer events designed to help you build real-world projects, showcase your skills, and grow with the community.",
  alternates: {
    canonical: "https://www.frontendarena.online",
  },
  openGraph: {
    title: "Frontend Arena — Premier Developer Community & Hackathons",
    description:
      "Participate in premium hackathons, coding challenges, UI/UX competitions, and earn verifiable digital certificates.",
    url: "https://www.frontendarena.online",
    siteName: "Frontend Arena",
    images: [
      {
        url: "https://www.frontendarena.online/logo.png",
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
    <div className="min-h-screen flex flex-col bg-[#000000]">
      {/* 1. Navbar */}
      <LandingNavbar />

      {/* Main Developer Platform Landing Flow */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 1b. Marquee Banner */}
        <MarqueeBanner />

        {/* 2. Community Impact (Statistics) - Relocated right after Marquee & before Who We Are */}
        <PlatformStatsSection />

        {/* 3. Who We Are */}
        <WhoWeAreSection />

        {/* 5. Why Join Frontend Arena */}
        <WhyJoinSection />

        {/* 6. Featured Hackathons */}
        <FeaturedHackathonsSection />

        {/* 6b. Hall of Fame Showcase */}
        <HallOfFameSection />

        {/* 7. FAQ */}
        <FAQSection />

        {/* 8. Final CTA Banner */}
        <CtaBannerSection />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
