import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0E1A",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.frontendarena.online"),
  title: {
    default: "Frontend Arena — Official Developer Community & Premium Hackathons",
    template: "%s | Frontend Arena",
  },
  description:
    "Frontend Arena is the premier developer community and official hackathon platform. Build real-world projects, compete in global challenges, and earn verifiable cryptographic certificates.",
  keywords: [
    "Frontend Arena",
    "Hackathons",
    "Web Development",
    "UI/UX Competitions",
    "Developer Platform",
    "Coding Challenges",
    "Verifiable Certificates",
    "React",
    "Next.js",
    "Aryan Ubale",
  ],
  authors: [{ name: "Aryan Ubale", url: "https://www.frontendarena.online" }],
  creator: "Aryan Ubale",
  publisher: "Frontend Arena",
  alternates: {
    canonical: "https://www.frontendarena.online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/official_favicon.png",
    shortcut: "/official_favicon.png",
    apple: "/official_favicon.png",
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
    images: ["https://www.frontendarena.online/logo.png"],
    creator: "@frontendarena",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#0A0E1A] text-[#E2E8F0] font-body antialiased overflow-x-hidden w-full selection:bg-[#2563EB]/30 selection:text-blue-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
