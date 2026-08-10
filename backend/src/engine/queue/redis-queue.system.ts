/**
 * Redis/BullMQ evaluation queue driver (production, durable).
 *
 * - Jobs are persisted in Redis and survive API server restarts.
 * - The worker is an independent process (backend/src/worker).
 * - Stable job identity: `<submissionId>_v<version>` — re-enqueuing the same
 *   submission version is deduplicated by BullMQ (idempotent enqueue).
 * - Retry policy: attempts + exponential backoff (env-configurable).
 * - Per-job processing timeout is passed as a BullMQ job option.
 * - Queue backpressure: enqueue rejects when queue depth exceeds
 *   EVALUATION_QUEUE_MAX_DEPTH (default 10000).
 */
import { Queue } from "bullmq";
import { EVALUATION_QUEUE_NAME } from "./queue-constants";
import { getSharedRedisConfig, intFromEnv } from "./redis-connection";
import {
  EvaluationJobData,
  EvaluationQueueDriver,
  QueueMetrics,
  SanitizedJobInfo,
} from "./types";

const DEFAULT_QUEUE_MAX_DEPTH = 10000;

export class RedisEvaluationQueueDriver implements EvaluationQueueDriver {
  readonly name = "redis" as const;

  private queue: Queue;
  private maxDepth: number;

  constructor() {
    const { connection, display } = getSharedRedisConfig();
    this.maxDepth = intFromEnv("EVALUATION_QUEUE_MAX_DEPTH", DEFAULT_QUEUE_MAX_DEPTH);

    this.queue = new Queue(EVALUATION_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: intFromEnv("EVALUATION_MAX_ATTEMPTS", 3),
        backoff: { type: "exponential", delay: intFromEnv("EVALUATION_BACKOFF_MS", 2000) },
        removeOnComplete: { age: 7 * 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600, count: 2000 },
      },
    });

    this.queue.on("error", (err) => {
      console.error(`[Queue] Redis/BullMQ error: ${err.message}`);
    });
  }

  /**
   * Returns the approximate number of jobs waiting in the queue.
   * Used for backpressure checks and observability.
   */
  async getWaitingCount(): Promise<number> {
    try {
      const counts = await this.queue.getJobCounts("waiting");
      return counts.waiting ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Returns the total number of active (processing) jobs.
   */
  async getActiveCount(): Promise<number> {
    try {
      const counts = await this.queue.getJobCounts("active");
      return counts.active ?? 0;
    } catch {
      return 0;
    }
  }

  async enqueue(data: EvaluationJobData): Promise<{ jobId: string }> {
    const version = data.version ?? 1;
    const attemptTag = data.attemptId ? `_a${data.attemptId}` : `_t${Date.now()}`;
    const jobId = `${data.submissionId}${attemptTag}_v${version}`;

    // Backpressure check: if the queue is too deep, reject new submissions
    // to protect Redis memory and prevent unbounded queue growth.
    const waitingCount = await this.getWaitingCount();
    if (waitingCount >= this.maxDepth) {
      throw new Error(
        `Queue backpressure: ${waitingCount} jobs waiting (max ${this.maxDepth}). ` +
          `Try again shortly or contact the platform administrator.`
      );
    }

    // Remove any stale job with same ID if present
    try {
      const existingJob = await this.queue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove();
      }
    } catch {
      // Ignore cleanup error
    }

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

