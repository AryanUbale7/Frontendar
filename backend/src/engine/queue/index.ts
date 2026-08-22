/**
 * Evaluation queue driver factory.
 *
 * Selection is EXPLICIT via EVALUATION_QUEUE_DRIVER:
 *   - "redis"  (default): BullMQ + Redis. If Redis is unreachable the process
 *     fails at boot with a clear error — it NEVER silently downgrades.
 *   - "memory": in-process queue for LOCAL DEVELOPMENT ONLY. Refused when
 *     NODE_ENV === "production".
 */
import Redis from "ioredis";
import { InMemoryEvaluationQueue } from "../in-memory-queue.system";
import { runEvaluationJob } from "../evaluation-runner";
import { RedisEvaluationQueueDriver } from "./redis-queue.system";
import { getSharedRedisConfig, intFromEnv } from "./redis-connection";
import { EvaluationJobData, EvaluationQueueDriver, QueueMetrics, SanitizedJobInfo } from "./types";

export type { EvaluationJobData, EvaluationQueueDriver, QueueMetrics, SanitizedJobInfo };
export { getSharedRedisConfig };

async function verifyRedisAvailable(): Promise<void> {
  const { connection, display } = getSharedRedisConfig();
  const maxAttempts = intFromEnv("REDIS_STARTUP_MAX_ATTEMPTS", 10);
  const retryDelayMs = intFromEnv("REDIS_STARTUP_RETRY_DELAY_MS", 1500);
  const probeTimeoutMs = intFromEnv("REDIS_PROBE_TIMEOUT_MS", 2000);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const probe = new Redis({
      ...connection,
      lazyConnect: true,
      connectTimeout: probeTimeoutMs,
      retryStrategy: null,
      maxRetriesPerRequest: 1,
    });

    probe.on("error", () => {
      /* Handled via connect/ping catch */
    });

    try {
      await probe.connect();
      await probe.ping();
      console.log("[Redis] Connection verified successfully.");
      try {
        probe.disconnect();
      } catch {}
      return;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      try {
        probe.disconnect();
      } catch {}

      if (attempt < maxAttempts) {
        console.warn(
          `[Redis] Connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${retryDelayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  console.error(`[Redis] Startup verification failed after ${maxAttempts} attempts.`);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Redis is unavailable and EVALUATION_QUEUE_DRIVER=redis is configured. " +
        "Redis must be available before production startup."
    );
  }

  throw new Error(
    `Redis is unavailable at ${display} but EVALUATION_QUEUE_DRIVER=redis is configured. ` +
      `Start Redis (or fix REDIS_URL/REDIS_HOST/REDIS_PORT) before booting. ` +
      `For local development only you may set EVALUATION_QUEUE_DRIVER=memory.`
  );
}

class MemoryEvaluationQueueDriver implements EvaluationQueueDriver {
  readonly name = "memory" as const;

  private inner: InMemoryEvaluationQueue;

  constructor() {
    const concurrency = intFromEnv("EVALUATION_WORKER_CONCURRENCY", 2);
    this.inner = new InMemoryEvaluationQueue(concurrency);
    this.inner.setProcessor(async (job) => {
      return runEvaluationJob({
        submissionId: job.submissionId || null,
        repoUrl: job.repoUrl,
        deploymentUrl: job.deploymentUrl,
        userId: job.userId,
        hackathonId: job.hackathonId || "",
        blueprintId: job.blueprintId,
        blueprintVersion: job.blueprintVersion,
        problemStatementId: job.problemStatementId,
        version: 1,
        blueprint: job.blueprint,
      });
    });
  }

  async enqueue(data: EvaluationJobData): Promise<{ jobId: string }> {
    const job = await this.inner.addJob(
      data.repoUrl,
      data.blueprint,
      data.userId,
      data.submissionId,
      data.blueprintId,
      data.blueprintVersion,
      data.hackathonId,
      data.problemStatementId
    );
    return { jobId: job.jobId };
  }

  async getMetrics(): Promise<QueueMetrics> {
    const m = this.inner.getQueueMetrics();
    const recentJobs: SanitizedJobInfo[] = this.inner.getRecentJobs();
    return {
      driver: "memory",
      counts: {
        waiting: m.queuedJobs,
        active: m.activeJobs + m.processingJobs,
        completed: m.completedJobs,
        failed: m.failedJobs,
        delayed: 0,
      },
      recentJobs,
    };
  }
  async close(): Promise<void> {
    // In-memory queue has no external resources to release.
  }
}

export async function createEvaluationQueue(): Promise<EvaluationQueueDriver> {
  const driver = (process.env.EVALUATION_QUEUE_DRIVER || "redis").toLowerCase();

  if (driver === "memory") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "EVALUATION_QUEUE_DRIVER=memory is not allowed when NODE_ENV=production. " +
          "Production requires the durable Redis queue (EVALUATION_QUEUE_DRIVER=redis)."
      );
    }
    console.warn(
      "[Queue] EVALUATION_QUEUE_DRIVER=memory — in-process, NON-DURABLE queue. Local development only."
    );
    return new MemoryEvaluationQueueDriver();
  }

  if (driver !== "redis") {
    throw new Error(
      `Unknown EVALUATION_QUEUE_DRIVER "${driver}". Supported values: redis, memory.`
    );
  }

  await verifyRedisAvailable();
  return new RedisEvaluationQueueDriver();
}
