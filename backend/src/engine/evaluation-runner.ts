import { evaluateSubmission, Blueprint } from "./evaluator";
import { prisma } from "../config/db";
import { EvaluationJobData } from "./queue/types";

export const PASS_GRADE_THRESHOLD = 75;

const MAX_REPORT_LOG_ENTRIES = 200;
const MAX_REPORT_LOG_LINE_LENGTH = 2000;

/**
 * Resolve the blueprint for a job from the database — the authoritative source.
 *
 * Priority:
 *   1. BlueprintVersion snapshot bound at enqueue time (hackathonId + version) —
 *      evaluation always runs against the exact published content the
 *      participant submitted against.
 *   2. The current Blueprint row (blueprintId) if no snapshot exists.
 *   3. Legacy in-memory payload (integration tests / memory driver).
 */
async function resolveBlueprintForJob(data: EvaluationJobData): Promise<Blueprint | null> {
  if (data.hackathonId && data.blueprintVersion) {
    const snapshot = await prisma.blueprintVersion.findFirst({
      where: { hackathonId: data.hackathonId, version: data.blueprintVersion },
      orderBy: { version: "desc" },
    });
    if (snapshot) {
      return snapshot.payload as unknown as Blueprint;
    }
  }

  if (data.hackathonId && data.blueprintId) {
    const bp = await prisma.blueprint.findUnique({ where: { id: data.blueprintId } });
    if (bp) {
      return bp as unknown as Blueprint;
    }
  }

  if (data.blueprint) {
    return data.blueprint as Blueprint;
  }

  return null;
}

/**
 * Runs a single evaluation job and persists the authoritative result.
 *
 * Idempotency: a submission that is already COMPLETED with a persisted report
 * is never re-evaluated — the existing report is returned instead. Combined
 * with the stable BullMQ jobId (`<submissionId>:v<version>`) this guarantees
 * one authoritative persisted result even if the same job is processed twice
 * (e.g. after a worker crash / stalled-job recovery).
 */
export async function runEvaluationJob(jobData: EvaluationJobData): Promise<any> {
  const { submissionId, repoUrl } = jobData;
  let deploymentUrl: string | null = null;

  if (submissionId) {
    const existing = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!existing) {
      throw new Error(`Submission ${submissionId} not found — cannot evaluate.`);
    }
    deploymentUrl = existing.deploymentUrl;

    // Idempotency guard: already completed with a persisted report → return it.
    if (existing.status === "COMPLETED") {
      const report = await prisma.evaluationReport.findUnique({ where: { submissionId } });
      if (report) {
        return report.payload;
      }
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "EVALUATING" },
    });
  }

  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: "global" } }).catch(() => null);
    const enableAst = config ? config.enableAstEvaluation : true;
    process.env.ENABLE_AST_EVALUATION = enableAst ? "true" : "false";

    const blueprint = await resolveBlueprintForJob(jobData);
    if (!blueprint) {
      throw new Error("No blueprint available for this evaluation job.");
    }

    // Set selectedProblemIndex dynamically based on submission's problemStatementId
    if (submissionId) {
      const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (submission && submission.problemStatementId) {
        const pss = (blueprint.problemStatements as any[]) || [];
        const idx = pss.findIndex((ps) => ps.id === submission.problemStatementId || ps.title === submission.problemStatementId);
        if (idx !== -1) {
          (blueprint as any).selectedProblemIndex = idx;
        }
      }
    }

    const report = await evaluateSubmission(repoUrl, blueprint, deploymentUrl);

    // Log/output size cap: keep the report bounded regardless of repo behaviour.
    if (Array.isArray(report.logs)) {
      report.logs = report.logs
        .slice(-MAX_REPORT_LOG_ENTRIES)
        .map((l) => (typeof l === "string" && l.length > MAX_REPORT_LOG_LINE_LENGTH ? l.slice(0, MAX_REPORT_LOG_LINE_LENGTH) + "…" : l));
    }

    if (submissionId) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "COMPLETED",
          score: Math.round(report.scoreSummary.finalScore),
          grade: report.scoreSummary.finalScore >= PASS_GRADE_THRESHOLD ? "PASSED" : "FAILED",
          completedAt: new Date(),
          ...(jobData.blueprintId ? { blueprintId: jobData.blueprintId } : {}),
          ...(jobData.blueprintVersion ? { blueprintVersion: jobData.blueprintVersion } : {})
        }
      });

      await prisma.evaluationReport.upsert({
        where: { submissionId },
        update: { payload: report as any },
        create: { submissionId, payload: report as any }
      });
    }

    return report;
  } catch (err: any) {
    if (submissionId) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          score: 0,
          grade: "FAILED"
        }
      }).catch(() => {});
    }
    throw err;
  }
}
