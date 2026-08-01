export type HackathonLifecycleStatus = 
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "LIVE"
  | "EVALUATING"
  | "COMPLETED";

export function resolveHackathonLifecycle(
  hackathon: {
    registrationStart: string | Date | null;
    registrationClose: string | Date | null;
    eventStart: string | Date | null;
    eventClose: string | Date | null;
  },
  submissionsStatus?: {
    total: number;
    completed: number;
  }
): HackathonLifecycleStatus {
  const now = new Date();

  const regStart = hackathon.registrationStart ? new Date(hackathon.registrationStart) : null;
  const regClose = hackathon.registrationClose ? new Date(hackathon.registrationClose) : null;
  const evtStart = hackathon.eventStart ? new Date(hackathon.eventStart) : null;
  const evtClose = hackathon.eventClose ? new Date(hackathon.eventClose) : null;

  if (regStart && now < regStart) {
    return "UPCOMING";
  }

  if (regStart && regClose && now >= regStart && now <= regClose) {
    return "REGISTRATION_OPEN";
  }

  if (evtStart && evtClose && now >= evtStart && now <= evtClose) {
    return "LIVE";
  }

  if (evtClose && now > evtClose) {
    if (submissionsStatus && submissionsStatus.total > submissionsStatus.completed) {
      return "EVALUATING";
    }
    return "COMPLETED";
  }

  return "UPCOMING";
}
