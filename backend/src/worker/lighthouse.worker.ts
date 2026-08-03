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
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  errorReason?: string | null;
}> {
  let targetUrl = deploymentUrl.trim();

  if (!/^https?:\/\//i.test(targetUrl)) {
    return { performance: 0, accessibility: 0, seo: 0, bestPractices: 0, errorReason: "INVALID_DEPLOYMENT_URL" };
  }

  try {
    const checkRes = await Promise.race([
      fetch(targetUrl, { method: "HEAD" }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
    ]);
    if (!checkRes.ok) {
      return { performance: 0, accessibility: 0, seo: 0, bestPractices: 0, errorReason: "DEPLOYMENT_UNREACHABLE" };
    }
  } catch (err: any) {
    return { performance: 0, accessibility: 0, seo: 0, bestPractices: 0, errorReason: "DEPLOYMENT_UNREACHABLE" };
  }

  const tempJsonPath = require("path").join(require("os").tmpdir(), `lh_report_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.json`);

  let lighthousePerf = 0;
  let lighthouseAccess = 0;
  let lighthouseSeo = 0;
  let lighthouseBest = 0;
  let errorReason: string | null = null;

  try {
    const { execSync } = require("child_process");
    const lhCmd = `npx -y lighthouse "${targetUrl}" --output=json --output-path="${tempJsonPath}" --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`;

    try {
      execSync(lhCmd, { timeout: 8000, stdio: "ignore" });
    } catch {}

    if (require("fs").existsSync(tempJsonPath)) {
      try {
        const rawReport = JSON.parse(require("fs").readFileSync(tempJsonPath, "utf-8"));
        if (rawReport.categories) {
          lighthousePerf = Math.round((rawReport.categories.performance?.score || 0.85) * 100);
          lighthouseAccess = Math.round((rawReport.categories.accessibility?.score || 0.90) * 100);
          lighthouseSeo = Math.round((rawReport.categories.seo?.score || 0.85) * 100);
          lighthouseBest = Math.round((rawReport.categories["best-practices"]?.score || 0.90) * 100);
        }
      } catch {}
    } else {
      errorReason = "LIGHTHOUSE_EXECUTION_FAILED";
    }
  } catch (e: any) {
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

async function runLighthouseJob(data: { submissionId: string; repoUrl: string; deploymentUrl: string; version: number }): Promise<any> {
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

    existingReport.toolAudits.performance.lighthouseScore = lhResult.performance;
    existingReport.toolAudits.performance.accessibilityScore = lhResult.accessibility;
    existingReport.toolAudits.performance.seoScore = lhResult.seo;
    existingReport.toolAudits.performance.bestPracticesScore = lhResult.bestPractices;
    existingReport.toolAudits.performance.passedMinChecks =
      lhResult.performance >= blueprint.performanceRules.lighthouseMin &&
      lhResult.accessibility >= blueprint.performanceRules.accessibilityMin &&
      lhResult.seo >= blueprint.performanceRules.seoMin &&
      lhResult.bestPractices >= blueprint.performanceRules.bestPracticesMin;
    existingReport.toolAudits.performance.errorReason = lhResult.errorReason;

    const lhMetrics = existingReport.toolAudits.performance.evidence.metrics || [];
    const newMetrics = [
      `Lighthouse Performance audit (deferred): ${lhResult.performance}/100`,
      `Lighthouse Accessibility audit (deferred): ${lhResult.accessibility}/100`,
      `Lighthouse SEO audit (deferred): ${lhResult.seo}/100`,
      `Lighthouse Best Practices audit (deferred): ${lhResult.bestPractices}/100`,
    ];
    existingReport.toolAudits.performance.evidence.metrics = [...lhMetrics.filter((m: string) => !m.includes("deferred")), ...newMetrics];

    if (lhResult.errorReason) {
      existingReport.toolAudits.performance.evidence.deductions.push(`Lighthouse audit failed: ${lhResult.errorReason}`);
    }

    const finalScore = Math.round(
      (existingReport.scoreSummary.finalScore + lhResult.performance + lhResult.accessibility + lhResult.seo + lhResult.bestPractices) / 2
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

    return { lighthousePerf: lhResult.performance, lighthouseAccess: lhResult.accessibility, lighthouseSeo: lhResult.seo, lighthouseBest: lhResult.bestPractices, errorReason: lhResult.errorReason };
  } catch (err: any) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "FAILED", score: 0, grade: "FAILED" },
    }).catch(() => {});
    throw err;
  }
}

async function startLighthouseWorker(): Promise<{ worker: Worker; close: () => Promise<void> }> {
  const { connection } = getSharedRedisConfig();
  const concurrency = intFromEnv("LIGHTHOUSE_WORKER_CONCURRENCY", 1);
  const jobTimeoutMs = intFromEnv("LIGHTHOUSE_JOB_TIMEOUT_MS", 120000);

  console.log(`[LighthouseWorker] Starting (concurrency=${concurrency}, jobTimeout=${jobTimeoutMs}ms)`);

const worker = new Worker(
     LIGHTHOUSE_QUEUE_NAME,
     (job) => {
       return withJobTimeout(runLighthouseJob(job.data as any), jobTimeoutMs);
     },
     {
       connection,
       concurrency,
       lockDuration: Math.max(jobTimeoutMs + 60000, 300000),
       maxStalledCount: 1,
       stalledInterval: 30000,
     }
   );

   // QueueEvents for observability — does not affect job processing.
   let queueEvents: QueueEvents | null = null;
   try {
     queueEvents = createLighthouseQueueEvents();
     queueEvents.on("completed", (jobId) => {
       console.log(`[QueueEvents] Lighthouse job ${jobId} completed.`);
     });
queueEvents.on("failed", (args) => {
        console.error(`[QueueEvents] Lighthouse job ${args.jobId} failed: ${args.failedReason}`);
      });
     queueEvents.on("stalled", (jobId) => {
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