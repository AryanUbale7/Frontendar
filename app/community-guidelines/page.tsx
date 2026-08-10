import type { Metadata } from "next";
import { CommunityGuidelinesClient } from "./CommunityGuidelinesClient";

export const metadata: Metadata = {
  title: "Community Guidelines | Frontend Arena",
  description:
    "Read the Frontend Arena Community Guidelines to understand our standards for respect, fair play, communication, and collaboration.",
  alternates: {
    canonical: "https://www.frontendarena.online/community-guidelines",
  },
  openGraph: {
    title: "Community Guidelines | Frontend Arena",
    description:
      "Read the Frontend Arena Community Guidelines to understand our standards for respect, fair play, communication, and collaboration.",
    url: "https://www.frontendarena.online/community-guidelines",
    siteName: "Frontend Arena",
  },
};

export default function CommunityGuidelinesPage() {
  return <CommunityGuidelinesClient />;
}
