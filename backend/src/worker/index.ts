/**
 * Independent, durable evaluation worker (Phase 3).
 *
 * A separate executable process that consumes evaluation jobs from the
 * BullMQ/Redis queue. It is started with `npm run worker` (compiled) or
 * `npm run worker:dev` (ts-node) and shares NO process with the API server.
 *
 * Behaviour:
 *  - concurrency:          EVALUATION_WORKER_CONCURRENCY (default 2)
 *  - lock duration:        EVALUATION_LOCK_DURATION_MS (default: job timeout + 60s, min 5min)
 *  - stalled detection:    EVALUATION_STALLED_INTERVAL_MS (default 30s)
 *  - retries/backoff:      applied via job options set at enqueue time
 *  - graceful shutdown:    SIGTERM/SIGINT â†’ finish/safely release jobs â†’ close
 *                          Redis + Prisma connections.
 *
 * Test seams (inert unless the payload carries them; used by phase3.test.ts):
 *  - data.testDelayedMs          â†’ artificial delay before evaluation
 *  - data.testFailFirstAttempt   â†’ fail attempt 0 deterministically
 */
import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "../config/db";
import { runEvaluationJob } from "../engine/evaluation-runner";
import { EVALUATION_QUEUE_NAME } from "../engine/queue/queue-constants";
import { parseRedisConnection, intFromEnv } from "../engine/queue/redis-config";
import { EvaluationJobData } from "../engine/queue/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the job with a hard wall-clock timeout (EVALUATION_JOB_TIMEOUT_MS).
 *
 * Note on blocking steps: git clone / npm install / npm build / Lighthouse are
 * bounded by their own per-step timeouts inside the evaluator, so no single
 * blocking segment can exceed those bounds. The race timer fires between
 * async steps (e.g. during the FAIE evaluation phases and the test seam
 * delays) and fails the job so the retry policy applies.
 */
function withJobTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Evaluation job exceeded the timeout of ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function main(): Promise<void> {
  const { connection } = parseRedisConnection();

  const concurrency = intFromEnv("EVALUATION_WORKER_CONCURRENCY", 2);
  const jobTimeoutMs = intFromEnv("EVALUATION_JOB_TIMEOUT_MS", 900000);
  const lockDuration = intFromEnv("EVALUATION_LOCK_DURATION_MS", Math.max(jobTimeoutMs + 60000, 300000));
  const stalledInterval = intFromEnv("EVALUATION_STALLED_INTERVAL_MS", 30000);

  console.log(`[Worker] Starting evaluation worker (queue=${EVALUATION_QUEUE_NAME}, concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms, lockDuration=${lockDuration}ms, stalledInterval=${stalledInterval}ms)`);

  const worker = new Worker(
    EVALUATION_QUEUE_NAME,
    (job) => {
      const data = (job.data ?? {}) as EvaluationJobData;

      // The hard timeout covers the ENTIRE processing run, including the
      // test seams — nothing can run past EVALUATION_JOB_TIMEOUT_MS.
      return withJobTimeout(
        (async () => {
          // Test seams (documented; inert unless present in the payload).
          if (data.testDelayedMs && data.testDelayedMs > 0) {
            await sleep(data.testDelayedMs);
          }
          if (data.testSkipEvaluation) {
            return { skipped: true };
          }
          if (data.testFailFirstAttempt && job.attemptsMade === 0) {
            throw new Error("Test seam: failing first attempt deterministically.");
          }
          return runEvaluationJob(data);
        })(),
        jobTimeoutMs
      );
    },
    {
      connection: connection,
      concurrency,
      lockDuration,
      maxStalledCount: 1,
      stalledInterval,
    }
  );

  worker.on("ready", () => {
    console.log("WORKER READY");
  });

  worker.on("completed", (job) => {
    if (job) console.log(`[Worker] Job ${job.id} completed (attempt ${job.attemptsMade + 1}).`);
  });

  worker.on("failed", async (job, err) => {
    if (job) {
      console.error(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
      // Converge the persisted lifecycle when a job fails PERMANENTLY (all
      // attempts exhausted — e.g. timeout before the runner started, or a
      // crash after the runner died without persisting). Retryable attempts
      // leave the submission in EVALUATING so the next attempt can complete.
      const data = (job.data ?? {}) as EvaluationJobData;
      if (data.submissionId && job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await prisma.submission
          .updateMany({
            where: { id: data.submissionId, status: { notIn: ["COMPLETED", "FAILED"] } },
            data: { status: "FAILED", score: 0, grade: "FAILED" },
          })
          .catch(() => {});
      }
    }
  });

  worker.on("error", (err) => {
    console.error(`[Worker] Worker error: ${err.message}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Worker] ${signal} received â€” closing worker gracefully (finishing/safely releasing active jobs)...`);
    try {
      await worker.close();
      console.log("[Worker] Worker closed.");
    } catch (err) {
      console.error("[Worker] Error closing worker:", err);
    }
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error("[Worker] Error closing Prisma:", err);
    }
    console.log("WORKER SHUTDOWN");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(`[Worker] FATAL: ${err.message}`);
  process.exit(1);
});

