export type VariantType =
  | "default"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "outline"
  | "ghost"
  | "solid";

export type ComponentSize = "sm" | "md" | "lg";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  active?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  iconName?: string;
  description?: string;
}

export interface FeatureCardData {
  id: string;
  title: string;
  description: string;
  tag?: string;
  iconName: string;
  actionText?: string;
  onAction?: () => void;
}

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  status: "completed" | "current" | "upcoming" | "error";
  user?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
}
