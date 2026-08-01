/**
 * Redis/BullMQ evaluation queue driver (production, durable).
 *
 * - Jobs are persisted in Redis and survive API server restarts.
 * - The worker is an independent process (backend/src/worker).
 * - Stable job identity: `<submissionId>_v<version>` â€” re-enqueuing the same
 *   submission version is deduplicated by BullMQ (idempotent enqueue).
 * - Retry policy: attempts + exponential backoff (env-configurable).
 * - Per-job processing timeout is passed as a BullMQ job option.
 */
import { Queue } from "bullmq";
import { EVALUATION_QUEUE_NAME } from "./queue-constants";
import { parseRedisConnection, intFromEnv, RedisConnectionConfig } from "./redis-config";
import {
  EvaluationJobData,
  EvaluationQueueDriver,
  QueueMetrics,
  SanitizedJobInfo,
} from "./types";

export class RedisEvaluationQueueDriver implements EvaluationQueueDriver {
  readonly name = "redis" as const;

  private queue: Queue;
  private redisHost: string;
  private redisPort: number;

  constructor() {
    const { connection } = parseRedisConnection();
    this.redisHost = (connection.host as string) || "127.0.0.1";
    this.redisPort = (connection.port as number) || 6379;

    // NOTE: job-level timeout is enforced by the WORKER (Promise.race) because
    // BullMQ 6.0.x does not expose a `timeout` job option.
    this.queue = new Queue(EVALUATION_QUEUE_NAME, {
      connection: connection,
      defaultJobOptions: {
        attempts: intFromEnv("EVALUATION_MAX_ATTEMPTS", 3),
        backoff: { type: "exponential", delay: intFromEnv("EVALUATION_BACKOFF_MS", 2000) },
        removeOnComplete: { age: 7 * 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600, count: 2000 },
      },
    });
  }

  async enqueue(data: EvaluationJobData): Promise<{ jobId: string }> {
    const version = data.version ?? 1;
    // BullMQ forbids ":" in custom job IDs (Redis key separator), so use "_v".
    const jobId = `${data.submissionId}_v${version}`;
    // Same jobId + data â†’ BullMQ returns the existing job instead of duplicating.
    const job = await this.queue.add("evaluation", data, { jobId });
    return { jobId: job.id || jobId };
  }

  async getMetrics(): Promise<QueueMetrics> {
    const counts = await this.queue.getJobCounts();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(0, 25),
      this.queue.getActive(0, 25),
      this.queue.getCompleted(0, 25),
      this.queue.getFailed(0, 25),
      this.queue.getDelayed(0, 25),
    ]);

    const recentJobs: SanitizedJobInfo[] = [
      ...waiting.map((j) => sanitizeJob(j, "waiting")),
      ...active.map((j) => sanitizeJob(j, "active")),
      ...delayed.map((j) => sanitizeJob(j, "delayed")),
      ...completed.map((j) => sanitizeJob(j, "completed")),
      ...failed.map((j) => sanitizeJob(j, "failed")),
    ];

    let connected = true;
    try {
      await this.queue.getVersion();
    } catch {
      connected = false;
    }

    return {
      driver: "redis",
      redis: { host: this.redisHost, port: this.redisPort, connected },
      counts: {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      },
      recentJobs,
    };
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

function sanitizeJob(job: { id?: string; data?: unknown; attemptsMade?: number; timestamp?: number; processedOn?: number; finishedOn?: number; failedReason?: string }, status: SanitizedJobInfo["status"]): SanitizedJobInfo {
  const data = (job.data ?? {}) as EvaluationJobData;
  return {
    jobId: job.id || "unknown",
    submissionId: data.submissionId || null,
    repoUrl: data.repoUrl,
    attemptsMade: job.attemptsMade ?? 0,
    status,
    queuedAt: job.timestamp ?? null,
    startedAt: job.processedOn ?? null,
    completedAt: job.finishedOn ?? null,
    failedReason: job.failedReason ?? null,
  };
}

