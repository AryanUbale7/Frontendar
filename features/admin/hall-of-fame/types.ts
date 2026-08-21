export type EventStatus = "draft" | "published" | "archived";

export type RecognitionType =
  | "winner"
  | "runner_up"
  | "top_10"
  | "finalist"
  | "special_recognition"
  | "custom";

export interface HofBadge {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  status: "active" | "inactive";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface HofParticipant {
  id: string;
  eventId: string;
  fullName: string;
  teamName?: string | null;
  collegeOrOrg?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  recognitionType: RecognitionType;
  customRecognition?: string | null;
  order: number;
  linkedInUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  badgeIds?: string[];
  badges?: HofBadge[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface HofEvent {
  id: string;
  name: string;
  year: string;
  description?: string | null;
  coverUrl?: string | null;
  status: EventStatus;
  order: number;
  participantCount?: number;
  participants?: HofParticipant[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const RECOGNITION_LABELS: Record<RecognitionType, string> = {
  winner: "Winner (1st Place)",
  runner_up: "Runner-Up",
  top_10: "Top 10 Finalist",
  finalist: "Finalist",
  special_recognition: "Special Recognition",
  custom: "Custom Recognition",
};
