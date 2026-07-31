import { NavGroup } from "@/types/design-system";

export const BRAND_CONFIG = {
  name: "Frontend Arena",
  subtitle: "Hackathon Management & Virtual Judging Platform",
  tagline: "Build, Submit, and Judge Next-Gen Developer Projects",
};

export const TOKENS = {
  colors: {
    primary: "#2563EB",
    secondary: "#3B82F6",
    accent: "#06B6D4",
    background: "#F8FAFC",
    card: "#FFFFFF",
    heading: "#0F172A",
    body: "#475569",
    border: "#E2E8F0",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
  },
  gradient: "linear-gradient(135deg, #2563EB, #06B6D4)",
  radius: "16px",
};

export const DEFAULT_NAVIGATION: NavGroup[] = [
  {
    title: "Platform",
    items: [
      { id: "overview", label: "Dashboard", href: "#", icon: "LayoutDashboard" },
      { id: "hackathons", label: "Hackathons", href: "#", icon: "Trophy" },
      { id: "submissions", label: "Submissions", href: "#", icon: "GitPullRequest" },
      { id: "judging", label: "Virtual Judging", href: "#", icon: "Scale" },
    ],
  },
  {
    title: "Developer Tools",
    items: [
      { id: "leaderboard", label: "Leaderboards", href: "#", icon: "Medal" },
      { id: "teams", label: "Registrations", href: "#", icon: "Users" },
      { id: "analytics", label: "Metrics & Logs", href: "#", icon: "BarChart3" },
      { id: "settings", label: "System Config", href: "#", icon: "Settings" },
    ],
  },
];
