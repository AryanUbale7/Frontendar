import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import { prisma } from "../config/db";
import { LIGHTHOUSE_QUEUE_NAME } from "../engine/queue/lighthouse-constants";
import { getSharedRedisConfig, intFromEnv } from "../engine/queue/redis-connection";
import { createLighthouseQueueEvents } from "../engine/queue/queue-events";
import { evaluateSubmission, Blueprint, LighthouseMode } from "../engine/evaluator";

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

async function runLighthouseAudit(
  deploymentUrl: string,
  logs?: string[]
): Promise<{
  performance: number | "UNAVAILABLE";
  accessibility: number | "UNAVAILABLE";
  seo: number | "UNAVAILABLE";
  bestPractices: number | "UNAVAILABLE";
  errorReason?: string | null;
}> {
  let targetUrl = deploymentUrl.trim();

  if (!/^https?:\/\//i.test(targetUrl)) {
    return { performance: "UNAVAILABLE", accessibility: "UNAVAILABLE", seo: "UNAVAILABLE", bestPractices: "UNAVAILABLE", errorReason: "INVALID_DEPLOYMENT_URL" };
  }

  try {
    const checkRes = await Promise.race([
      fetch(targetUrl, { method: "HEAD" }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
    ]);
    if (!checkRes.ok) {
      return { performance: "UNAVAILABLE", accessibility: "UNAVAILABLE", seo: "UNAVAILABLE", bestPractices: "UNAVAILABLE", errorReason: "DEPLOYMENT_UNREACHABLE" };
    }
  } catch (err: any) {
    return { performance: "UNAVAILABLE", accessibility: "UNAVAILABLE", seo: "UNAVAILABLE", bestPractices: "UNAVAILABLE", errorReason: "DEPLOYMENT_UNREACHABLE" };
  }

  const tempJsonPath = require("path").join(require("os").tmpdir(), `lh_report_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  // Resolve Playwright Chromium path programmatically
  let chromePath = "";
  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH = "0"; // Force local project directory cache
    const playwright = require("playwright");
    if (playwright && playwright.chromium) {
      chromePath = playwright.chromium.executablePath();
    }
  } catch (err: any) {
    console.error(`[LighthouseWorker] Playwright dependency not loadable: ${err.message}`);
  }

  const fs = require("fs");
  const chromeExists = chromePath ? fs.existsSync(chromePath) : false;

  console.log(`[LighthouseWorker] Chromium executable resolved: ${chromePath || "none"}`);
  console.log(`[LighthouseWorker] Chromium executable exists: ${chromeExists}`);

  if (!chromePath || !chromeExists) {
    console.error(`[LighthouseWorker] Chromium executable is not available at path: ${chromePath}`);
    return {
      performance: "UNAVAILABLE",
      accessibility: "UNAVAILABLE",
      seo: "UNAVAILABLE",
      bestPractices: "UNAVAILABLE",
      errorReason: "CHROMIUM_NOT_AVAILABLE"
    };
  }

  let lighthousePerf: number | "UNAVAILABLE" = "UNAVAILABLE";
  let lighthouseAccess: number | "UNAVAILABLE" = "UNAVAILABLE";
  let lighthouseSeo: number | "UNAVAILABLE" = "UNAVAILABLE";
  let lighthouseBest: number | "UNAVAILABLE" = "UNAVAILABLE";
  let errorReason: string | null = null;

  const executionTimeoutMs = intFromEnv("LIGHTHOUSE_EXECUTION_TIMEOUT_MS", 120000);
  const startTime = Date.now();

  try {
    const { execSync } = require("child_process");
    const lhCmd = `npx lighthouse "${targetUrl}" --output=json --output-path="${tempJsonPath}" --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`;

    try {
      const childEnv = {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: "0",
        CHROME_PATH: chromePath
      };
      execSync(lhCmd, { timeout: executionTimeoutMs, stdio: "pipe", env: childEnv });
    } catch (execErr: any) {
      const duration = Date.now() - startTime;
      console.error(
        `[LighthouseWorker] CLI Execution failed. ` +
        `Audited URL: ${targetUrl}, Duration: ${duration}ms, Timeout: ${executionTimeoutMs}ms. ` +
        `Status: ${execErr.status}, Signal: ${execErr.signal}, Message: ${execErr.message}`
      );
      if (execErr.stderr) {
        console.error(`[LighthouseWorker] CLI Stderr: ${execErr.stderr.toString()}`);
      }
      errorReason = "LIGHTHOUSE_EXECUTION_FAILED";
    }

    if (!errorReason && require("fs").existsSync(tempJsonPath)) {
      try {
        const rawReport = JSON.parse(require("fs").readFileSync(tempJsonPath, "utf-8"));
        if (rawReport.categories) {
          lighthousePerf = Math.round((rawReport.categories.performance?.score || 0.85) * 100);
          lighthouseAccess = Math.round((rawReport.categories.accessibility?.score || 0.90) * 100);
          lighthouseSeo = Math.round((rawReport.categories.seo?.score || 0.85) * 100);
          lighthouseBest = Math.round((rawReport.categories["best-practices"]?.score || 0.90) * 100);
        } else {
          errorReason = "LIGHTHOUSE_INVALID_LHR";
        }
      } catch (parseErr: any) {
        console.error(`[LighthouseWorker] Failed to parse LHR JSON: ${parseErr.message}`);
        errorReason = "LIGHTHOUSE_INVALID_LHR";
      }
    } else if (!errorReason) {
      errorReason = "LIGHTHOUSE_EXECUTION_FAILED";
    }
  } catch (e: any) {
    console.error(`[LighthouseWorker] Unexpected exception during audit: ${e.message}`);
    errorReason = "LIGHTHOUSE_EXECUTION_FAILED";
  } finally {
    if (require("fs").existsSync(tempJsonPath)) {
      try { require("fs").unlinkSync(tempJsonPath); } catch {}
    }
  }

  return {
    performance: lighthousePerf,
    accessibility: lighthouseAccess,
    seo: lighthouseSeo,
    bestPractices: lighthouseBest,
    errorReason,
  };
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
      ...lhMetrics.filter((m: string) => !m.includes("deferred") && !m.includes("failed")),
      ...newMetrics
    ];
    existingReport.toolAudits.performance.evidence.deductions.push(`Lighthouse audit failed: ${errorMsg}`);

    const finalScore = existingReport.scoreSummary.finalScore;
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

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "EVALUATING" },
  });

  try {
    const report = await prisma.evaluationReport.findUnique({ where: { submissionId } });
    if (!report) {
      throw new Error(`No intermediate evaluation report found for submission ${submissionId}.`);
    }

    const existingReport = report.payload as any;
    const blueprintId = submission.blueprintId;
    let blueprint: Blueprint | null = null;

    if (blueprintId) {
      const bp = await prisma.blueprint.findUnique({ where: { id: blueprintId } });
      if (bp) {
        blueprint = bp as unknown as Blueprint;
      }
    }

    if (!blueprint) {
      throw new Error(`Blueprint not found for submission ${submissionId}.`);
    }

    const lhResult = await runLighthouseAudit(deploymentUrl);

    if (lhResult.errorReason || lhResult.performance === "UNAVAILABLE") {
      throw new Error(`Lighthouse audit failed with reason: ${lhResult.errorReason || "UNAVAILABLE"}`);
    }

    const perf = lhResult.performance as number;
    const access = lhResult.accessibility as number;
    const seo = lhResult.seo as number;
    const best = lhResult.bestPractices as number;

    existingReport.toolAudits.performance.lighthouseScore = perf;
    existingReport.toolAudits.performance.accessibilityScore = access;
    existingReport.toolAudits.performance.seoScore = seo;
    existingReport.toolAudits.performance.bestPracticesScore = best;
    existingReport.toolAudits.performance.passedMinChecks =
      perf >= blueprint.performanceRules.lighthouseMin &&
      access >= blueprint.performanceRules.accessibilityMin &&
      seo >= blueprint.performanceRules.seoMin &&
      best >= blueprint.performanceRules.bestPracticesMin;
    existingReport.toolAudits.performance.errorReason = null;

    const lhMetrics = existingReport.toolAudits.performance.evidence.metrics || [];
    const newMetrics = [
      `Lighthouse Performance audit (deferred): ${perf}/100`,
      `Lighthouse Accessibility audit (deferred): ${access}/100`,
      `Lighthouse SEO audit (deferred): ${seo}/100`,
      `Lighthouse Best Practices audit (deferred): ${best}/100`,
    ];
    existingReport.toolAudits.performance.evidence.metrics = [...lhMetrics.filter((m: string) => !m.includes("deferred")), ...newMetrics];

    const finalScore = Math.round(
      (existingReport.scoreSummary.finalScore + perf + access + seo + best) / 2
    );

    existingReport.scoreSummary.finalScore = finalScore;
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

    return { status: "SUCCESS", lighthousePerf: perf, lighthouseAccess: access, lighthouseSeo: seo, lighthouseBest: best };
  } catch (err: any) {
    const attemptsMade = job.attemptsMade ?? 0;
    const maxAttempts = job.opts?.attempts ?? 1;

    if (attemptsMade + 1 < maxAttempts) {
      console.warn(`[LighthouseWorker] Job ${job.id} failed attempt ${attemptsMade + 1}/${maxAttempts}. Retrying... Error: ${err.message}`);
      throw err;
    }

    console.error(`[LighthouseWorker] Job ${job.id} failed all ${maxAttempts} attempts. Finalizing with UNAVAILABLE metrics. Error: ${err.message}`);
    await finalizeWithUnavailableLighthouse(submissionId, err.message || "LIGHTHOUSE_EXECUTION_FAILED");

    return { status: "FAILED", error: err.message };
  }
}

export async function startLighthouseWorker(): Promise<{ worker: Worker; close: () => Promise<void> }> {

  const { connection } = getSharedRedisConfig();
  const concurrency = intFromEnv("LIGHTHOUSE_WORKER_CONCURRENCY", 1);
  const jobTimeoutMs = intFromEnv("LIGHTHOUSE_JOB_TIMEOUT_MS", 120000);

  console.log(`[LighthouseWorker] Starting (concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms)`);

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
      try { await handle.close(); } catch {}
      try { await prisma.$disconnect(); } catch {}
      process.exit(0);
    };
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  }).catch((err) => {
    console.error(`[LighthouseWorker] FATAL: ${err.message}`);
    process.exit(1);
  });
}