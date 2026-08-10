import type { Metadata } from "next";
import { TermsOfServiceClient } from "./TermsOfServiceClient";

export const metadata: Metadata = {
  title: "Terms of Service | Frontend Arena",
  description:
    "Read the Frontend Arena Terms of Service to understand the rules, guidelines, and terms governing our hackathons, events, and developer platform.",
  alternates: {
    canonical: "https://www.frontendarena.online/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service | Frontend Arena",
    description:
      "Read the Frontend Arena Terms of Service to understand the rules, guidelines, and terms governing our hackathons, events, and developer platform.",
    url: "https://www.frontendarena.online/terms-of-service",
    siteName: "Frontend Arena",
  },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}
