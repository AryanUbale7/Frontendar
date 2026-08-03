import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import { prisma } from "../config/db";
import { LIGHTHOUSE_QUEUE_NAME } from "../engine/queue/lighthouse-constants";
import { getSharedRedisConfig, intFromEnv } from "../engine/queue/redis-connection";
import { createLighthouseQueueEvents } from "../engine/queue/queue-events";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withJobTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Lighthouse job exceeded the timeout of ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Triggers a workflow dispatch on GitHub Actions to run Lighthouse asynchronously.
 * Replaces the local Chromium/Lighthouse execution on Render to save memory.
 */
async function dispatchGitHubLighthouse(submissionId: string, deploymentUrl: string): Promise<void> {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  const owner = process.env.GITHUB_ACTIONS_OWNER || "AryanUbale7";
  const repo = process.env.GITHUB_ACTIONS_REPO || "Frontendar";
  const workflow = process.env.GITHUB_ACTIONS_WORKFLOW || "lighthouse.yml";

  if (!token) {
    throw new Error("Missing GITHUB_ACTIONS_TOKEN environment variable.");
  }

  // Validate deploymentUrl syntax and protocols (HTTP/HTTPS only) - SSRF/Sanitization
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(deploymentUrl.trim());
  } catch (err) {
    throw new Error("Invalid deployment URL syntax.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Invalid deployment URL protocol. Only HTTP and HTTPS are allowed.");
  }

  const urlStr = parsedUrl.toString();
  const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

  console.log(`[LighthouseDispatcher] Dispatching GitHub Actions audit for submission ${submissionId} on URL ${urlStr}`);

  const res = await fetch(dispatchUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "FrontendArena-Render-Backend"
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        submission_id: submissionId,
        deployment_url: urlStr,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub dispatch API responded with status ${res.status}: ${errorText}`);
  }

  console.log(`[LighthouseDispatcher] GitHub workflow accepted for submission ${submissionId}.`);
}

async function finalizeWithUnavailableLighthouse(submissionId: string, errorMsg: string) {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return;

    const report = await prisma.evaluationReport.findUnique({ where: { submissionId } });
    if (!report) return;

    const existingReport = report.payload as any;

    existingReport.toolAudits.performance.lighthouseScore = "UNAVAILABLE";
    existingReport.toolAudits.performance.accessibilityScore = "UNAVAILABLE";
    existingReport.toolAudits.performance.seoScore = "UNAVAILABLE";
    existingReport.toolAudits.performance.bestPracticesScore = "UNAVAILABLE";
    existingReport.toolAudits.performance.passedMinChecks = false;
    existingReport.toolAudits.performance.errorReason = "LIGHTHOUSE_EXECUTION_FAILED";

    const lhMetrics = existingReport.toolAudits.performance.evidence.metrics || [];
    const newMetrics = [
      `Lighthouse Performance audit failed: ${errorMsg}`,
      `Lighthouse metrics marked as UNAVAILABLE.`
    ];
    existingReport.toolAudits.performance.evidence.metrics = [
      ...lhMetrics.filter((m: string) => !m.includes("deferred") && !m.includes("failed") && !m.includes("UNAVAILABLE")),
      ...newMetrics
    ];

    const deductions = existingReport.toolAudits.performance.evidence.deductions || [];
    const failMsg = `Lighthouse audit failed: ${errorMsg}`;
    if (!deductions.includes(failMsg)) {
      deductions.push(failMsg);
    }
    existingReport.toolAudits.performance.evidence.deductions = deductions;

    const finalScore = existingReport.scoreSummary.codeScore !== undefined
      ? existingReport.scoreSummary.codeScore
      : existingReport.scoreSummary.finalScore;
    existingReport.status = finalScore >= 75 ? "pass" : "fail";

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: "COMPLETED",
        score: finalScore,
        grade: finalScore >= 75 ? "PASSED" : "FAILED",
        completedAt: new Date(),
      },
    });

    await prisma.evaluationReport.upsert({
      where: { submissionId },
      update: { payload: existingReport },
      create: { submissionId, payload: existingReport },
    });
  } catch (err: any) {
    console.error(`[LighthouseWorker] Failed to finalize fallback for ${submissionId}: ${err.message}`);
  }
}

async function runLighthouseJob(
  job: any,
  data: { submissionId: string; repoUrl: string; deploymentUrl: string; version: number }
): Promise<any> {
  const { submissionId, deploymentUrl } = data;

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  try {
    await dispatchGitHubLighthouse(submissionId, deploymentUrl);
    return { status: "DISPATCHED" };
  } catch (err: any) {
    const attemptsMade = job.attemptsMade ?? 0;
    const maxAttempts = job.opts?.attempts ?? 1;

    if (attemptsMade + 1 < maxAttempts) {
      console.warn(`[LighthouseWorker] Dispatch failed attempt ${attemptsMade + 1}/${maxAttempts}. Retrying... Error: ${err.message}`);
      throw err;
    }

    console.error(`[LighthouseWorker] Dispatch failed all ${maxAttempts} attempts. Finalizing with UNAVAILABLE metrics. Error: ${err.message}`);
    await finalizeWithUnavailableLighthouse(submissionId, err.message || "LIGHTHOUSE_DISPATCH_FAILED");

    return { status: "FAILED", error: err.message };
  }
}

export async function startLighthouseWorker(): Promise<{ worker: Worker; close: () => Promise<void> }> {
  const { connection } = getSharedRedisConfig();
  const concurrency = intFromEnv("LIGHTHOUSE_WORKER_CONCURRENCY", 1);
  const jobTimeoutMs = intFromEnv("LIGHTHOUSE_JOB_TIMEOUT_MS", 120000);

  console.log(`[LighthouseWorker] Starting dispatch-only worker (concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms)`);

  const worker = new Worker(
    LIGHTHOUSE_QUEUE_NAME,
    (job) => {
      return withJobTimeout(runLighthouseJob(job, job.data as any), jobTimeoutMs);
    },
    {
      connection,
      concurrency,
      lockDuration: Math.max(jobTimeoutMs + 60000, 300000),
      maxStalledCount: 1,
      stalledInterval: 30000,
    }
  );

  let queueEvents: QueueEvents | null = null;
  try {
    queueEvents = createLighthouseQueueEvents();
    queueEvents.on("completed", ({ jobId }) => {
      console.log(`[QueueEvents] Lighthouse job ${jobId} completed.`);
    });
    queueEvents.on("failed", (args) => {
      console.error(`[QueueEvents] Lighthouse job ${args.jobId} failed: ${args.failedReason}`);
    });
    queueEvents.on("stalled", ({ jobId }) => {
      console.warn(`[QueueEvents] Lighthouse job ${jobId} stalled.`);
    });
  } catch (err: any) {
    console.warn(`[LighthouseWorker] QueueEvents setup skipped: ${err.message}`);
  }

  worker.on("completed", (job) => {
    console.log(`[LighthouseWorker] Job ${job?.id} completed.`);
  });

  worker.on("failed", async (job, err) => {
    if (job) {
      console.error(`[LighthouseWorker] Job ${job.id} failed: ${err.message}`);
      const data = job.data as any;
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
    console.error(`[LighthouseWorker] Worker error: ${err.message}`);
  });

  return {
    worker,
    close: async () => {
      await worker.close();
      if (queueEvents) {
        try { await queueEvents.close(); } catch {}
      }
    },
  };
}

if (require.main === module) {
  startLighthouseWorker().then((handle) => {
    const shutdown = async (signal: string) => {
      console.log(`[LighthouseWorker] ${signal} received — closing...`);
      try { handle.close(); } catch {}
      try { prisma.$disconnect(); } catch {}
      process.exit(0);
    };
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  }).catch((err) => {
    console.error(`[LighthouseWorker] FATAL: ${err.message}`);
    process.exit(1);
  });
}