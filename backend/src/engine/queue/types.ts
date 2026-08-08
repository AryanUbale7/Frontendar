/**
 * Shared types for the durable evaluation queue layer.
 *
 * Phase 3: the queue is an abstracted driver with two implementations:
 *   - "redis"  → BullMQ backed by Redis (production, durable)
 *   - "memory" → in-process InMemoryEvaluationQueue (local development only)
 *
 * Selection is explicit via EVALUATION_QUEUE_DRIVER. There is NEVER a silent
 * downgrade from redis to memory.
 */

export interface EvaluationJobData {
  /** Authoritative submission row id — the job identity anchor (stable jobId). */
  submissionId: string | null;
  /** Participant-supplied repository URL (untrusted input; validated at eval time). */
  repoUrl: string;
  deploymentUrl?: string;
  userId?: string;
  hackathonId: string;
  /** Published blueprint binding captured at enqueue time. */
  blueprintId?: string;
  blueprintVersion?: number;
  attemptId?: string;
  attemptNumber?: number;
  /** Submission.version at enqueue time — part of the stable job identity. */
  version?: number;
  /**
   * Legacy/in-memory-only blueprint payload. NOT stored for redis jobs; the
   * worker re-resolves the blueprint from the database (BlueprintVersion
   * snapshot) so Redis never carries large payloads or stale content.
   */
  blueprint?: unknown;
  problemStatementId?: string;
  /** Test-only seams used by phase3.test.ts (inert unless present). */
  testDelayedMs?: number;
  testFailFirstAttempt?: boolean;
  testSkipEvaluation?: boolean;
  /** When "defer", Lighthouse audit is deferred to the dedicated Lighthouse worker. */
  lighthouseMode?: "in-process" | "defer";
}

export interface SanitizedJobInfo {
  jobId: string;
  submissionId: string | null;
  repoUrl?: string;
  attemptsMade: number;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  queuedAt?: number | null;
  startedAt?: number | null;
  completedAt?: number | null;
  failedReason?: string | null;
}

export interface QueueMetrics {
  driver: "redis" | "memory";
  redis?: { host: string; port: number; connected: boolean };
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  /** Most recent jobs across all states (sanitized — never secrets/env vars). */
  recentJobs: SanitizedJobInfo[];
}

export interface EvaluationQueueDriver {
  readonly name: "redis" | "memory";
  enqueue(data: EvaluationJobData): Promise<{ jobId: string }>;
  getMetrics(): Promise<QueueMetrics>;
  close(): Promise<void>;
}
