// Authoritative hackathon lifecycle model. Status is ALWAYS derived from
// persisted fields (published, archived, startDate, endDate) — never from
// separate frontend-only state.

export type LifecycleStatus = "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface LifecycleFields {
  published: boolean;
  archived: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export const LIFECYCLE_STATUSES: LifecycleStatus[] = [
  "DRAFT",
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
];

export function resolveLifecycleStatus(hackathon: LifecycleFields, now: Date = new Date()): LifecycleStatus {
  if (hackathon.archived) return "ARCHIVED";
  if (!hackathon.published) return "DRAFT";

  const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
  const end = hackathon.endDate ? new Date(hackathon.endDate) : null;

  if (end && now > end) return "COMPLETED";
  if (start && now < start) return "UPCOMING";

  return "ACTIVE";
}

// Lowercase form used to persist the derived status into Hackathon.status
// (keeps database compatibility with existing lowercase status strings).
export function lifecycleToPersisted(status: LifecycleStatus): string {
  return status.toLowerCase();
}

export function canAcceptSubmissions(hackathon: LifecycleFields, now: Date = new Date()): boolean {
  return resolveLifecycleStatus(hackathon, now) === "ACTIVE";
}

export function canAcceptRegistrations(hackathon: LifecycleFields, now: Date = new Date()): boolean {
  const status = resolveLifecycleStatus(hackathon, now);
  return status === "UPCOMING" || status === "ACTIVE";
}
