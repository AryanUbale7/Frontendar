/**
 * Independent, durable evaluation worker (Phase 3).
 *
 * A separate executable process that consumes evaluation jobs from the
 * BullMQ/Redis queue. It is started with `npm run worker` (compiled) or
 * `npm run worker:dev` (ts-node) and shares NO process with the API server
 * in the default (standalone) deployment.
 *
 * Combined web mode:
 *   When RUN_EVALUATION_WORKER_IN_WEB=true, backend/src/server.ts starts ONE
 *   BullMQ worker inside the SAME process (low-cost/testing deployments).
 *   The SAME processor logic (runEvaluationJob + test seams + wall-clock
 *   timeout) is reused — nothing is duplicated. Concurrency defaults to 1 in
 *   combined mode unless EVALUATION_WORKER_CONCURRENCY is set explicitly.
 *
 * Behaviour:
 *  - concurrency:          EVALUATION_WORKER_CONCURRENCY
 *                          (default 2 standalone, default 1 combined web mode)
 *  - lock duration:        EVALUATION_LOCK_DURATION_MS (default: job timeout + 60s, min 5min)
 *  - stalled detection:    EVALUATION_STALLED_INTERVAL_MS (default 30s)
 *  - retries/backoff:      applied via job options set at enqueue time
 *  - graceful shutdown:    SIGTERM/SIGINT → finish/safely release jobs → close
 *                          Redis + Prisma connections.
 *
 * Test seams (inert unless the payload carries them; used by phase3.test.ts):
 *  - data.testDelayedMs          → artificial delay before evaluation
 *  - data.testFailFirstAttempt   → fail attempt 0 deterministically
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

export interface StartEvaluationWorkerOptions {
  /**
   * True when the worker is started inside the API process
   * (RUN_EVALUATION_WORKER_IN_WEB=true). Default concurrency becomes 1.
   */
  combinedMode?: boolean;
}

export interface EvaluationWorkerHandle {
  /** The single BullMQ Worker instance created by this call. */
  worker: Worker;
  /** Gracefully closes the worker (finishes/safely releases active jobs). */
  close: () => Promise<void>;
}

/**
 * Creates EXACTLY ONE BullMQ evaluation worker per process.
 *
 * - Standalone: `npm run worker` calls this and registers SIGTERM/SIGINT
 *   shutdown handlers (guarded by require.main === module below).
 * - Combined web mode: backend/src/server.ts calls this once when
 *   RUN_EVALUATION_WORKER_IN_WEB=true, and shuts the worker down as part of
 *   the overall server shutdown.
 *
 * Never call this more than once per process — the caller is responsible for
 * exactly-one-worker semantics.
 */
export async function startEvaluationWorker(opts: StartEvaluationWorkerOptions = {}): Promise<EvaluationWorkerHandle> {
  const combined = opts.combinedMode === true;
  const { connection } = parseRedisConnection();

  // Combined mode is resource-constrained (free/small Render web service):
  // concurrency defaults to 1 unless explicitly overridden.
  const defaultConcurrency = combined ? 1 : 2;
  const concurrency = intFromEnv("EVALUATION_WORKER_CONCURRENCY", defaultConcurrency);
  const jobTimeoutMs = intFromEnv("EVALUATION_JOB_TIMEOUT_MS", 900000);
  const lockDuration = intFromEnv("EVALUATION_LOCK_DURATION_MS", Math.max(jobTimeoutMs + 60000, 300000));
  const stalledInterval = intFromEnv("EVALUATION_STALLED_INTERVAL_MS", 30000);

  if (combined) {
    console.log(`[Worker] Evaluation worker running in combined web mode (queue=${EVALUATION_QUEUE_NAME}, concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms, lockDuration=${lockDuration}ms, stalledInterval=${stalledInterval}ms)`);
  } else {
    console.log(`[Worker] Starting evaluation worker (queue=${EVALUATION_QUEUE_NAME}, concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms, lockDuration=${lockDuration}ms, stalledInterval=${stalledInterval}ms)`);
  }

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

  return {
    worker,
    close: async () => {
      await worker.close();
    },
  };
}

/**
 * Standalone entrypoint (`npm run worker`).
 * Registers SIGTERM/SIGINT graceful-shutdown inside this dedicated process.
 */
async function runStandalone(): Promise<void> {
  const handle = await startEvaluationWorker();

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Worker] ${signal} received — closing worker gracefully (finishing/safely releasing active jobs)...`);
    try {
      await handle.close();
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

// Guard: auto-start ONLY when this file is executed directly (npm run worker).
// When imported by server.ts for combined web mode, no worker is started here;
// the server starts exactly one worker via startEvaluationWorker().
if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(`[Worker] FATAL: ${err.message}`);
    process.exit(1);
  });
}
