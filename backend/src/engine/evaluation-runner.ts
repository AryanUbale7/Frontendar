import { evaluateSubmission, Blueprint } from "./evaluator";
import { prisma } from "../config/db";
import { EvaluationJobData } from "./queue/types";

export const PASS_GRADE_THRESHOLD = 75;

const MAX_REPORT_LOG_ENTRIES = 200;
const MAX_REPORT_LOG_LINE_LENGTH = 2000;

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

async function finalizeReport(
  submissionId: string,
  report: any,
  jobData: EvaluationJobData
): Promise<void> {
  const finalScore = Math.round(report.scoreSummary.finalScore);
  const grade = report.scoreSummary.finalScore >= PASS_GRADE_THRESHOLD ? "PASSED" : "FAILED";
  const commitSha = report.commitSha || null;

  // 1. Update EvaluationAttempt if attemptId is present (or target latest attempt)
  let targetAttemptId = jobData.attemptId;
  if (!targetAttemptId) {
    const latestAttempt = await prisma.evaluationAttempt.findFirst({
      where: { submissionId },
      orderBy: { attemptNumber: "desc" }
    });
    targetAttemptId = latestAttempt?.id;
  }

  if (targetAttemptId) {
    await prisma.evaluationAttempt.update({
      where: { id: targetAttemptId },
      data: {
        status: "COMPLETED",
        score: finalScore,
        grade,
        commitSha: commitSha || undefined,
        reportPayload: report as any,
        completedAt: new Date(),
      }
    });
  }

  // 2. Fetch all completed attempts to calculate immutable bestScore
  const allAttempts = await prisma.evaluationAttempt.findMany({
    where: { submissionId, status: "COMPLETED" },
    select: { score: true }
  });

  const scores = allAttempts.map(a => a.score).filter((s): s is number => s !== null);
  const bestScore = scores.length > 0 ? Math.max(...scores, finalScore) : finalScore;

  // 3. Update parent Submission with latest score and bestScore
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: "COMPLETED",
      score: finalScore, // latest score
      bestScore: bestScore, // best score overall
      grade,
      completedAt: new Date(),
      ...(targetAttemptId ? { latestAttemptId: targetAttemptId } : {}),
      ...(jobData.blueprintId ? { blueprintId: jobData.blueprintId } : {}),
      ...(jobData.blueprintVersion ? { blueprintVersion: jobData.blueprintVersion } : {}),
    },
  });

  // 4. Backwards compatibility sync for EvaluationReport
  await prisma.evaluationReport.upsert({
    where: { submissionId },
    update: { payload: report as any },
    create: { submissionId, payload: report as any },
  });
}

export async function runEvaluationJob(jobData: EvaluationJobData): Promise<any> {
  const { submissionId, repoUrl } = jobData;
  let deploymentUrl: string | null = null;

  if (submissionId) {
    const existing = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!existing) {
      throw new Error(`Submission ${submissionId} not found — cannot evaluate.`);
    }
    deploymentUrl = existing.deploymentUrl;

    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "EVALUATING" },
    });

    if (jobData.attemptId) {
      await prisma.evaluationAttempt.update({
        where: { id: jobData.attemptId },
        data: { status: "EVALUATING" }
      }).catch(() => null);
    }
  }

  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: "global" } }).catch(() => null);
    const enableAst = config ? config.enableAstEvaluation : true;
    process.env.ENABLE_AST_EVALUATION = enableAst ? "true" : "false";

    const blueprint = await resolveBlueprintForJob(jobData);
    if (!blueprint) {
      throw new Error("No blueprint available for this evaluation job.");
    }

    if (submissionId) {
      const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (submission && submission.problemStatementId) {
        const pss = (blueprint.problemStatements as any[]) || [];
        const idx = pss.findIndex((ps) => ps.id === submission.problemStatementId || ps.title === submission.problemStatementId);
        if (idx !== -1) {
          (blueprint as any).selectedProblemIndex = idx;
          const selectedPs = pss[idx];
          const psFeatures = ((blueprint.requiredFeatures as any[]) || []).filter(
            (f: any) => !f.problemStatementId || f.problemStatementId === (selectedPs.id || selectedPs.title)
          );
          if (psFeatures.length > 0) {
            blueprint.requiredFeatures = psFeatures;
          }
          console.log(`[FAIE v3] Submission: ${submissionId}`);
          console.log(`[FAIE v3] Problem Statement ID: ${submission.problemStatementId}`);
          console.log(`[FAIE v3] Problem Statement: ${selectedPs.title || selectedPs.id}`);
          console.log(`[FAIE v3] Loaded Required Features: ${blueprint.requiredFeatures.length}`);
        }
      }
    }

    const report = await evaluateSubmission(repoUrl, blueprint, deploymentUrl);

    if (Array.isArray(report.logs)) {
      report.logs = report.logs
        .slice(-MAX_REPORT_LOG_ENTRIES)
        .map((l) => (typeof l === "string" && l.length > MAX_REPORT_LOG_LINE_LENGTH ? l.slice(0, MAX_REPORT_LOG_LINE_LENGTH) + "…" : l));
    }

    if (submissionId) {
      await finalizeReport(submissionId, report, jobData);
    }

    return report;
  } catch (err: any) {
    if (submissionId) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          score: 0,
          grade: "FAILED",
        },
      }).catch(() => {});
    }
    throw err;
  }
}