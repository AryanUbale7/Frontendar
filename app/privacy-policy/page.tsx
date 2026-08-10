import type { Metadata } from "next";
import { PrivacyPolicyClient } from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Frontend Arena",
  description:
    "Read the Frontend Arena Privacy Policy to understand how we collect, use, protect, and manage personal information.",
  alternates: {
    canonical: "https://www.frontendarena.online/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Frontend Arena",
    description:
      "Read the Frontend Arena Privacy Policy to understand how we collect, use, protect, and manage personal information.",
    url: "https://www.frontendarena.online/privacy-policy",
    siteName: "Frontend Arena",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
