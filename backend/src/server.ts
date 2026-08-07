import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { prisma } from "./config/db";
import { authRouter } from "./routes/auth";
import { verifyToken, optionalAuth, requireRole, AuthenticatedRequest, maintenanceGuard } from "./middleware/auth";
import { createEvaluationQueue, EvaluationQueueDriver } from "./engine/queue";
import { startEvaluationWorker, EvaluationWorkerHandle } from "./worker";
import { hashPassword } from "./engine/password";
import { resolveLifecycleStatus, lifecycleToPersisted, canAcceptSubmissions, canAcceptRegistrations, LifecycleStatus } from "./engine/lifecycle";

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many submission requests. Please wait before trying again." },
  skipSuccessfulRequests: false,
});

let evaluationQueue: EvaluationQueueDriver;
let combinedWorkerHandle: EvaluationWorkerHandle | null = null;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(maintenanceGuard);

// Auth Router mount
app.use("/api/auth", authRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "evaluation-engine", time: new Date() });
});

async function getSystemConfig() {
  let config = await prisma.systemConfig.findUnique({ where: { id: "global" } });
  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        id: "global",
        allowRegistration: true,
        enableAstEvaluation: true,
        maintenanceMode: false,
        forceEmailVerification: false
      }
    });
  }
  return config;
}

// Fetch system configuration
app.get("/api/system/config", async (req: Request, res: Response) => {
  try {
    const config = await getSystemConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch system config: " + err.message });
  }
});

// Update system configuration (admin only)
app.post("/api/system/config", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { allowRegistration, enableAstEvaluation, maintenanceMode, forceEmailVerification } = req.body;
  try {
    const config = await prisma.systemConfig.upsert({
      where: { id: "global" },
      update: {
        allowRegistration: allowRegistration !== undefined ? !!allowRegistration : undefined,
        enableAstEvaluation: enableAstEvaluation !== undefined ? !!enableAstEvaluation : undefined,
        maintenanceMode: maintenanceMode !== undefined ? !!maintenanceMode : undefined,
        forceEmailVerification: forceEmailVerification !== undefined ? !!forceEmailVerification : undefined
      },
      create: {
        id: "global",
        allowRegistration: allowRegistration !== undefined ? !!allowRegistration : true,
        enableAstEvaluation: enableAstEvaluation !== undefined ? !!enableAstEvaluation : true,
        maintenanceMode: maintenanceMode !== undefined ? !!maintenanceMode : false,
        forceEmailVerification: forceEmailVerification !== undefined ? !!forceEmailVerification : false
      }
    });
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update system config: " + err.message });
  }
});

const DEFAULT_CATEGORIES = [
  { name: "Problem Alignment & Mandatory Features", weight: 30, maxMarks: 30, passingMarks: 18 },
  { name: "UI/UX & Responsiveness", weight: 25, maxMarks: 25, passingMarks: 15 },
  { name: "Functionality & Interactivity", weight: 15, maxMarks: 15, passingMarks: 9 },
  { name: "Code Quality & Architecture", weight: 10, maxMarks: 10, passingMarks: 6 },
  { name: "Performance & Accessibility", weight: 10, maxMarks: 10, passingMarks: 6 },
  { name: "Innovation & Creativity", weight: 5, maxMarks: 5, passingMarks: 3 },
  { name: "Documentation", weight: 5, maxMarks: 5, passingMarks: 3 }
];

// Fetch blueprint for a hackathon from PostgreSQL
// Public: returns the PUBLISHED blueprint only (drafts are never exposed).
// Admin: pass ?includeDraft=true to load the current row regardless of status.
app.get("/api/blueprints/:hackathonId", async (req: Request, res: Response) => {
  const { hackathonId } = req.params;
  const includeDraft = req.query.includeDraft === "true";

  try {
    if (includeDraft) {
      // Drafts may only be read by admins.
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. Token missing." });
      }
      verifyToken(req as AuthenticatedRequest, res, () => {});
      if (res.headersSent) return;
      const actor = (req as AuthenticatedRequest).user;
      if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
        return res.status(403).json({ error: "Unauthorized access role permissions." });
      }
    }

    const bp = await prisma.blueprint.findUnique({ where: { hackathonId } });
    if (!bp) {
      return res.status(404).json({ error: "No blueprint configured for this hackathon." });
    }
    if (!includeDraft && bp.status !== "published") {
      return res.status(404).json({ error: "No published blueprint for this hackathon." });
    }

    // Hydrate default categories if missing or empty
    const scoring = bp.scoringSystem as any;
    if (!scoring || !Array.isArray(scoring.categories) || scoring.categories.length === 0) {
      bp.scoringSystem = {
        ...(scoring || {}),
        categories: DEFAULT_CATEGORIES
      };
    }

    res.json(bp);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch blueprint: " + err.message });
  }
});

// Save draft or publish a blueprint (admin only; identity from JWT, never body)
app.post("/api/blueprints", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, blueprint, action } = req.body;
  if (!hackathonId || !blueprint) {
    return res.status(400).json({ error: "Missing hackathonId or blueprint details." });
  }

  // Validate category scoring weights sum to exactly 100%
  const scoringSystem = blueprint.scoringSystem;
  if (scoringSystem && Array.isArray(scoringSystem.categories) && scoringSystem.categories.length > 0) {
    const totalWeight = scoringSystem.categories.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ error: "VALIDATION_FAILED", message: `Total category scoring weights must sum to exactly 100%. Currently it is ${totalWeight}%.` });
    }
  }

  // Validate required features and problem statements
  const requiredFeatures = blueprint.requiredFeatures || [];
  const problemStatements = blueprint.problemStatements || [];
  const psIds = new Set(problemStatements.map((ps: any, idx: number) => ps.id || ps.title || `ps_${idx}`));

  for (const f of requiredFeatures) {
    if (!f.problemStatementId || !psIds.has(f.problemStatementId)) {
      return res.status(400).json({
        error: "VALIDATION_FAILED",
        message: `Required feature '${f.name || "Unnamed feature"}' is not assigned to a valid Problem Statement.`
      });
    }
  }

  for (const ps of problemStatements) {
    const psId = ps.id || ps.title;
    const psFeatures = requiredFeatures.filter((f: any) => f.problemStatementId === psId);
    if (psFeatures.length === 0) {
      return res.status(400).json({
        error: "VALIDATION_FAILED",
        message: `Problem Statement '${ps.title || "Unnamed option"}' must have at least one required feature.`
      });
    }
  }

  for (const f of requiredFeatures) {
    if (f.mandatory && (f.weight === undefined || f.weight <= 0 || isNaN(Number(f.weight)))) {
      return res.status(400).json({
        error: "VALIDATION_FAILED",
        message: `Validation Error: Mandatory feature '${f.name || "Unnamed feature"}' must have a valid weight greater than 0.`
      });
    }
  }

  const publishAction = action === "publish" || blueprint?.status === "published";

  try {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found for this blueprint." });
    }

    const existing = await prisma.blueprint.findUnique({ where: { hackathonId } });

    const content = {
      problemStatement: blueprint.problemStatement || {},
      problemStatements: blueprint.problemStatements || [],
      requiredFeatures: blueprint.requiredFeatures || [],
      techStackRules: blueprint.techStackRules || {},
      submissionRequirements: blueprint.submissionRequirements || {},
      codeQualityRules: blueprint.codeQualityRules || {},
      performanceRules: blueprint.performanceRules || {},
      securityRules: blueprint.securityRules || {},
      scoringSystem: blueprint.scoringSystem || {},
      autoPassFailRules: blueprint.autoPassFailRules || [],
      bonusRules: blueprint.bonusRules || []
    };

    if (existing) {
      let newVersion = existing.version;
      let snapshotVersion: number | null = null;

      if (publishAction) {
        const maxHistory = await prisma.blueprintVersion.aggregate({
          where: { blueprintId: existing.id },
          _max: { version: true },
        });
        const hasHistory = (maxHistory._max.version ?? 0) > 0;

        // version = published generation. First publication = v1.
        if (!hasHistory) {
          newVersion = existing.status === "published" ? existing.version + 1 : 1;
        } else {
          newVersion = (maxHistory._max.version ?? 0) + 1;
        }

        // Snapshot the content that is becoming "published version X" unless it
        // is already the published row (already represented in history).
        if (existing.status !== "published") {
          snapshotVersion = newVersion;
        }
      }

      if (snapshotVersion !== null) {
        await prisma.blueprintVersion.create({
          data: {
            blueprintId: existing.id,
            hackathonId,
            version: snapshotVersion,
            payload: existing as unknown as Prisma.InputJsonValue,
            publishedAt: new Date(),
          },
        });
      }

      const updated = await prisma.blueprint.update({
        where: { id: existing.id },
        data: {
          ...content,
          status: publishAction ? "published" : "draft",
          version: publishAction ? newVersion : existing.version,
          publishedAt: publishAction ? new Date() : existing.publishedAt,
          updatedAt: new Date(),
        },
      });

      return res.json({
        message: publishAction ? "Blueprint published successfully!" : "Blueprint draft saved successfully!",
        blueprintId: updated.id,
        hackathonId,
        status: updated.status,
        version: updated.version,
        publishedAt: updated.publishedAt,
      });
    }

    const created = await prisma.blueprint.create({
      data: {
        hackathonId,
        ...content,
        status: publishAction ? "published" : "draft",
        version: 1,
        publishedAt: publishAction ? new Date() : null,
      },
    });

    if (publishAction) {
      await prisma.blueprintVersion.create({
        data: {
          blueprintId: created.id,
          hackathonId,
          version: 1,
          payload: created as unknown as Prisma.InputJsonValue,
          publishedAt: created.publishedAt || new Date(),
        },
      });
    }

    res.json({
      message: publishAction ? "Blueprint published successfully!" : "Blueprint draft saved successfully!",
      blueprintId: created.id,
      hackathonId,
      status: created.status,
      version: created.version,
      publishedAt: created.publishedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure blueprint: " + err.message });
  }
});

// Delete a blueprint and its version history (admin only)
app.delete("/api/blueprints/:hackathonId", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { hackathonId } = req.params;
  try {
    const bp = await prisma.blueprint.findUnique({ where: { hackathonId } });
    if (!bp) {
      return res.status(404).json({ error: "No blueprint configured for this hackathon." });
    }
    await prisma.blueprintVersion.deleteMany({ where: { blueprintId: bp.id } }).catch(() => {});
    await prisma.blueprint.delete({ where: { hackathonId } });
    res.json({ message: "Blueprint deleted successfully", hackathonId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete blueprint: " + err.message });
  }
});

// Trigger dynamic evaluation (non-blocking: enqueues and returns immediately)
// Rate-limited to prevent submission spam.
app.post("/api/evaluate", verifyToken, submissionLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const {
    repoUrl,
    deploymentUrl,
    hackathonId,
    problemStatementId,
    projectName,
    shortDesc,
    detailedDesc,
    problemSolved,
    features,
    techStack,
    videoUrl,
    presentationPdf,
    architectureDiagram,
    teamContributions
  } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "Missing repository URL." });
  }
  if (!hackathonId) {
    return res.status(400).json({ error: "Missing hackathonId." });
  }

  const effectiveUserId = req.user!.id;

  // 1. Verify Hackathon exists
  const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
  if (!hackathon) {
    return res.status(404).json({ error: "Hackathon not found." });
  }

  // 2. Resolve published blueprint
  const dbBlueprint = await prisma.blueprint.findFirst({
    where: { hackathonId, status: "published" },
    orderBy: { version: "desc" }
  });
  if (!dbBlueprint) {
    return res.status(400).json({ error: "No published blueprint configured for this hackathon. Evaluation cannot run." });
  }

  // Verify selected Problem Statement (Phase 4)
  const problemStatements = (dbBlueprint.problemStatements as any[]) || [];
  let finalProblemStatementId = problemStatementId;
  
  if (problemStatements.length > 0) {
    if (problemStatements.length === 1) {
      finalProblemStatementId = problemStatements[0].id || problemStatements[0].title;
    } else {
      if (!problemStatementId) {
        return res.status(400).json({ error: "MISSING_PROBLEM_STATEMENT", message: "A problem statement selection is required." });
      }
      const matched = problemStatements.find(ps => ps.id === problemStatementId || ps.title === problemStatementId);
      if (!matched) {
        return res.status(400).json({ error: "INVALID_PROBLEM_STATEMENT", message: "The selected problem statement is invalid." });
      }
      finalProblemStatementId = matched.id || matched.title;
    }
  }

  // 3. Verify Submission Window & submissionEnabled flag
  const lifecycle = resolveLifecycleStatus(hackathon);
  if (lifecycle === "DRAFT") {
    return res.status(409).json({ error: "SUBMISSION_DISABLED", message: "Hackathon is not published yet. Submissions are disabled." });
  }
  if (lifecycle === "UPCOMING") {
    return res.status(409).json({ error: "SUBMISSION_NOT_STARTED", message: "Submissions are not open yet. The hackathon window has not started." });
  }
  if (lifecycle === "COMPLETED") {
    return res.status(409).json({ error: "SUBMISSION_CLOSED", message: "Hackathon has ended. New submissions are disabled." });
  }
  if (lifecycle === "ARCHIVED") {
    return res.status(409).json({ error: "SUBMISSION_DISABLED", message: "Hackathon is archived. Submissions are disabled." });
  }
  if (!hackathon.submissionEnabled || !canAcceptSubmissions(hackathon)) {
    return res.status(409).json({ error: "SUBMISSION_DISABLED", message: "Submissions are disabled for this hackathon." });
  }

  // 4. Verify participant registration eligibility (Phase 2 & 11)
  const registration = await prisma.registration.findUnique({
    where: {
      hackathonId_userId: {
        hackathonId,
        userId: effectiveUserId
      }
    }
  });
  if (!registration) {
    return res.status(403).json({ error: "NOT_REGISTERED", message: "You must register for this hackathon before submitting." });
  }

  // 5. Force strict email verification if active
  const sysConfig = await getSystemConfig();
  if (sysConfig.forceEmailVerification) {
    const dbUser = await prisma.user.findUnique({ where: { id: effectiveUserId } });
    if (!dbUser || !dbUser.emailVerified) {
      return res.status(403).json({
        error: "EMAIL_UNVERIFIED",
        message: "Strict email verification is enabled. Unverified participants cannot submit."
      });
    }
  }

  // 6. Normalize GitHub URL (Phase 3)
  function normalizeGithubUrl(urlStr: string): { owner: string; repo: string; normalized: string } {
    let clean = urlStr.trim().replace(/\/+$/, "");
    if (clean.endsWith(".git")) {
      clean = clean.slice(0, -4);
    }
    const match = clean.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    if (!match) {
      throw new Error("Invalid GitHub repository URL. Must be a valid github.com repository.");
    }
    const owner = match[1].toLowerCase();
    const repo = match[2].toLowerCase();
    return {
      owner,
      repo,
      normalized: `https://github.com/${owner}/${repo}`
    };
  }

  let normalizedRepo: { owner: string; repo: string; normalized: string };
  try {
    normalizedRepo = normalizeGithubUrl(repoUrl);
  } catch (err: any) {
    return res.status(400).json({ error: "INVALID_GITHUB_URL", message: err.message });
  }

  // SSRF check on deploymentUrl (Phase 9)
  if (deploymentUrl) {
    try {
      const parsedUrl = new URL(deploymentUrl.trim());
      const host = parsedUrl.hostname.toLowerCase();
      const isPrivate = host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        host.startsWith("169.254.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

      if (isPrivate) {
        return res.status(400).json({ error: "SSRF_ATTEMPT", message: "Private network URLs are restricted." });
      }
    } catch {
      return res.status(400).json({ error: "INVALID_DEPLOYMENT_URL", message: "Invalid deployment URL." });
    }
  }

  // 7. Enforce submissionRequirements deliverable checklist (Phase 5 & 6)
  const reqChecks = (dbBlueprint.submissionRequirements as any) || {};
  if (reqChecks.readme && !repoUrl) {
    return res.status(400).json({ error: "MISSING_DELIVERABLE", message: "Repository URL is required by blueprint checklist." });
  }
  if (reqChecks.liveDeployment && !deploymentUrl) {
    return res.status(400).json({ error: "MISSING_DELIVERABLE", message: "Live deployment URL is required by blueprint checklist." });
  }
  if (reqChecks.presentationPdf && !presentationPdf) {
    return res.status(400).json({ error: "MISSING_DELIVERABLE", message: "Presentation PDF is required by blueprint checklist." });
  }
  if (reqChecks.architectureDiagram && !architectureDiagram) {
    return res.status(400).json({ error: "MISSING_DELIVERABLE", message: "Architecture Diagram is required by blueprint checklist." });
  }

  // 8. Transactional limits & lock policies (Phase 2 & 3 & 4)
  const existing = await prisma.submission.findFirst({
    where: { hackathonId, userId: effectiveUserId }
  });

  if (existing) {
    // Lock Problem Statement identity
    if (existing.problemStatementId && existing.problemStatementId !== finalProblemStatementId) {
      return res.status(409).json({
        error: "PROJECT_IDENTITY_LOCKED",
        message: "You cannot change the problem statement selection after your first submission."
      });
    }

    // Lock Repository URL identity (compare normalized forms)
    let existingNorm: { normalized: string } | null = null;
    try {
      existingNorm = normalizeGithubUrl(existing.repoUrl);
    } catch {}

    if (existingNorm && existingNorm.normalized !== normalizedRepo.normalized) {
      return res.status(409).json({
        error: "PROJECT_IDENTITY_LOCKED",
        message: "Evaluation attempts must use the repository registered during the first submission."
      });
    }

    // Count attempts & limit enforcement
    const maxSub = reqChecks.maxSubmissions || "unlimited";
    if (maxSub !== "unlimited") {
      const maxVal = parseInt(maxSub, 10);
      if (existing.version >= maxVal) {
        return res.status(409).json({
          error: "SUBMISSION_LIMIT_REACHED",
          message: `Maximum ${maxVal} evaluation attempts allowed.`,
          used: existing.version,
          max: maxVal,
          remaining: 0
        });
      }
    }

    // Enforce resubmission policy
    if (reqChecks.resubmissionPolicy === false) {
      return res.status(409).json({
        error: "RESUBMISSION_DISALLOWED",
        message: "Resubmissions are disallowed for this hackathon."
      });
    }

    // Check concurrency
    if (existing.status === "QUEUED" || existing.status === "EVALUATING") {
      return res.status(409).json({ error: "Evaluation already in progress for this hackathon." });
    }
  } else {
    // First Submission Attempt Limit Check
    const maxSub = reqChecks.maxSubmissions || "unlimited";
    if (maxSub !== "unlimited") {
      const maxVal = parseInt(maxSub, 10);
      if (maxVal <= 0) {
        return res.status(409).json({
          error: "SUBMISSION_LIMIT_REACHED",
          message: `Maximum ${maxVal} evaluation attempts allowed.`,
          used: 0,
          max: maxVal,
          remaining: 0
        });
      }
    }
  }

  // 9. Update/Create submission row
  let submission: any;
  try {
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          repoUrl: normalizedRepo.normalized,
          deploymentUrl: deploymentUrl || null,
          projectName: projectName || existing.projectName,
          shortDesc: shortDesc || existing.shortDesc,
          detailedDesc: detailedDesc || existing.detailedDesc,
          problemSolved: problemSolved || existing.problemSolved,
          features: features || existing.features || [],
          techStack: techStack || existing.techStack || {},
          videoUrl: videoUrl || existing.videoUrl || null,
          presentationPdf: presentationPdf || existing.presentationPdf || null,
          architectureDiagram: architectureDiagram || existing.architectureDiagram || null,
          teamContributions: teamContributions || existing.teamContributions || [],
          status: "QUEUED",
          score: null,
          grade: null,
          blueprintId: dbBlueprint.id,
          blueprintVersion: dbBlueprint.version,
          completedAt: null,
          version: existing.version + 1
        }
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          hackathonId,
          problemStatementId: finalProblemStatementId || null,
          userId: effectiveUserId,
          repoUrl: normalizedRepo.normalized,
          deploymentUrl: deploymentUrl || null,
          projectName: projectName || "Untitled Project",
          shortDesc: shortDesc || "",
          detailedDesc: detailedDesc || "",
          problemSolved: problemSolved || "",
          features: features || [],
          techStack: techStack || {},
          videoUrl: videoUrl || null,
          presentationPdf: presentationPdf || null,
          architectureDiagram: architectureDiagram || null,
          teamContributions: teamContributions || [],
          status: "QUEUED",
          blueprintId: dbBlueprint.id,
          blueprintVersion: dbBlueprint.version,
          version: 1
        }
      });
    }
  } catch (dbErr: any) {
    console.error(`[Evaluate] Database error saving submission: ${dbErr.message}`);
    return res.status(500).json({ error: "Failed to persist submission. Evaluation was not queued." });
  }

  // 10. Enqueue BullMQ Evaluation Job
  const job = await evaluationQueue.enqueue({
    submissionId: submission.id,
    repoUrl: normalizedRepo.normalized,
    deploymentUrl: deploymentUrl || undefined,
    userId: effectiveUserId,
    hackathonId,
    blueprintId: dbBlueprint.id,
    blueprintVersion: dbBlueprint.version,
    version: submission.version,
    problemStatementId: finalProblemStatementId || undefined,
  });

  console.log(`[Evaluate] Enqueued FAIE evaluation job ${job.jobId} (driver=${evaluationQueue.name}) for repository: ${normalizedRepo.normalized}`);

  res.status(202).json({
    jobId: job.jobId,
    submissionId: submission.id,
    status: "QUEUED",
    version: submission.version,
    message: "Evaluation queued. Results will be available via the submissions endpoint once complete."
  });
});

// Queue observability (admin only): counts + recent jobs. Never exposes
// secrets or environment variables — only job identity, timing and failure reason.
app.get("/api/queue/metrics", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  try {
    const metrics = await evaluationQueue.getMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read queue metrics: " + err.message });
  }
});

// Virtual Judging Center: Fetch all submissions with optional filters (admin only)
app.get("/api/judging/submissions", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { hackathonId, problemStatementId, status } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);
    if (problemStatementId) whereClause.problemStatementId = String(problemStatementId);
    if (status) whereClause.status = String(status);

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        const user = await prisma.user.findUnique({
          where: { id: sub.userId },
          select: { firstName: true, lastName: true, email: true }
        });
        const hackathon = await prisma.hackathon.findUnique({
          where: { id: sub.hackathonId },
          select: { name: true }
        });
        const reports = await prisma.evaluationReport.findMany({
          where: { submissionId: sub.id }
        });
        return {
          ...sub,
          user: user || { firstName: "Unknown", lastName: "User", email: "unknown@example.com" },
          hackathonName: hackathon ? hackathon.name : "Unknown Hackathon",
          reports
        };
      })
    );
    res.json(enrichedSubmissions);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch judging submissions: " + err.message });
  }
});

// Virtual Judging Center: Fetch evaluation stats (admin only)
app.get("/api/judging/stats", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { hackathonId, problemStatementId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);
    if (problemStatementId) whereClause.problemStatementId = String(problemStatementId);

    const submissions = await prisma.submission.findMany({ where: whereClause });

    let queuedCount = 0;
    let evaluatingCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let scoredCount = 0;

    submissions.forEach(sub => {
      if (sub.status === "QUEUED") queuedCount++;
      else if (sub.status === "EVALUATING") evaluatingCount++;
      else if (sub.status === "COMPLETED") completedCount++;
      else if (sub.status === "FAILED") failedCount++;

      if (sub.score !== null && sub.score !== undefined) {
        totalScore += sub.score;
        scoredCount++;
        if (sub.score > highestScore) highestScore = sub.score;
        if (sub.score < lowestScore) lowestScore = sub.score;
      }
    });

    if (scoredCount === 0) {
      lowestScore = 0;
    }

    const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    res.json({
      queuedCount,
      evaluatingCount,
      completedCount,
      failedCount,
      averageScore,
      highestScore,
      lowestScore
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch judging stats: " + err.message });
  }
});

// Virtual Judging Center: Retry a failed submission evaluation (admin only)
// Rate-limited to prevent retry flooding.
app.post("/api/judging/retry", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), submissionLimiter, async (req: Request, res: Response) => {
  const { submissionId } = req.body;
  if (!submissionId) {
    return res.status(400).json({ error: "Missing submissionId." });
  }

  try {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) {
      return res.status(404).json({ error: "Submission not found." });
    }

    if (submission.status === "COMPLETED") {
      return res.status(400).json({ error: "SUBMISSION_COMPLETED", message: "Completed evaluations cannot be retried." });
    }

    // Reset status to QUEUED
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "QUEUED", completedAt: null, score: null, grade: null }
    });

    // Enqueue
    const job = await evaluationQueue.enqueue({
      submissionId: updated.id,
      repoUrl: updated.repoUrl,
      deploymentUrl: updated.deploymentUrl || undefined,
      userId: updated.userId,
      hackathonId: updated.hackathonId,
      blueprintId: updated.blueprintId || undefined,
      blueprintVersion: updated.blueprintVersion || undefined,
      version: updated.version,
      problemStatementId: updated.problemStatementId || undefined,
      lighthouseMode: evaluationQueue.name === "redis" ? "defer" : "in-process",
    });

    res.json({ message: "Retrying evaluation. Re-queued job.", jobId: job.jobId, submission: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retry evaluation: " + err.message });
  }
});

// Fetch system dashboard metrics (admin only)
app.get("/api/system/metrics", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  try {
    const queueStats = await evaluationQueue.getMetrics().catch(() => null);

    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" }
    });

    let queuedCount = 0;
    let evaluatingCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let totalDur = 0;
    let completedWithDur = 0;

    const failures: any[] = [];

    submissions.forEach(sub => {
      if (sub.status === "QUEUED") queuedCount++;
      else if (sub.status === "EVALUATING") evaluatingCount++;
      else if (sub.status === "COMPLETED") {
        completedCount++;
        if (sub.completedAt) {
          totalDur += new Date(sub.completedAt).getTime() - new Date(sub.createdAt).getTime();
          completedWithDur++;
        }
      }
      else if (sub.status === "FAILED") {
        failedCount++;
        if (failures.length < 10) {
          failures.push({
            id: sub.id,
            projectName: sub.projectName,
            repoUrl: sub.repoUrl,
            failedAt: sub.updatedAt
          });
        }
      }
    });

    const avgDurationSec = completedWithDur > 0 ? Math.round((totalDur / completedWithDur) / 1000) : 0;

    res.json({
      queue: queueStats ? {
        driver: queueStats.driver,
        waiting: queueStats.counts.waiting,
        active: queueStats.counts.active,
        completed: queueStats.counts.completed,
        failed: queueStats.counts.failed
      } : null,
      db: {
        queued: queuedCount,
        evaluating: evaluatingCount,
        completed: completedCount,
        failed: failedCount,
        avgDurationSec
      },
      recentFailures: failures
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch system metrics: " + err.message });
  }
});

// Fetch all hackathons from PostgreSQL (lifecycle computed server-side)
// Public callers only see published, non-archived hackathons (UPCOMING/ACTIVE/COMPLETED).
// Admins see everything, including DRAFT and ARCHIVED.
app.get("/api/hackathons", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await prisma.hackathon.findMany({
      orderBy: { createdAt: "desc" }
    });

    const isAdmin = req.user && (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN");
    const visible = isAdmin ? list : list.filter((h) => h.published && !h.archived);

    res.json(
      visible.map((h) => ({
        ...h,
        lifecycle: resolveLifecycleStatus(h),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch hackathons: " + err.message });
  }
});

// Save or update a hackathon in PostgreSQL (admin only)
app.post("/api/hackathons", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const {
    id,
    name,
    tagline,
    description,
    registrationStart,
    registrationClose,
    eventStart,
    eventClose,
    bannerUrl,
    submissionEnabled,
    leaderboardEnabled,
    discussionEnabled,
    problemReleased,
    rounds,
    problemTitle,
    problemDescription,
    testCases,
    rules,
    resources,
    published,
    archived
  } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: "Missing hackathon name or description." });
  }

  try {
    const existing = id ? await prisma.hackathon.findUnique({ where: { id } }) : null;

    // Lifecycle state comes from the database, never from client-side status strings.
    const isPublished = published !== undefined ? !!published : (existing?.published ?? false);
    const isArchived = archived !== undefined ? !!archived : (existing?.archived ?? false);

    const dataObj: any = {
      name,
      tagline: tagline || null,
      description,
      registrationStart: registrationStart ? new Date(registrationStart) : null,
      registrationClose: registrationClose ? new Date(registrationClose) : null,
      eventStart: eventStart ? new Date(eventStart) : null,
      eventClose: eventClose ? new Date(eventClose) : null,
      bannerUrl: bannerUrl || null,
      submissionEnabled: !!submissionEnabled,
      leaderboardEnabled: !!leaderboardEnabled,
      discussionEnabled: !!discussionEnabled,
      problemReleased: !!problemReleased,
      rounds: rounds || [],
      problemTitle: problemTitle || null,
      problemDescription: problemDescription || null,
      testCases: testCases || [],
      rules: rules || [],
      resources: resources || [],
      startDate: eventStart ? new Date(eventStart) : null,
      endDate: eventClose ? new Date(eventClose) : null,
      published: isPublished,
      archived: isArchived,
      publishedAt: isPublished && !existing?.published ? new Date() : existing?.publishedAt ?? null,
    };

    const hackathon = await prisma.hackathon.upsert({
      where: { id: id || "" },
      update: dataObj,
      create: {
        id: id || undefined,
        ...dataObj
      }
    });

    // Persist the authoritative derived lifecycle back into Hackathon.status
    const lifecycle = resolveLifecycleStatus(hackathon);
    const persisted = await prisma.hackathon.update({
      where: { id: hackathon.id },
      data: { status: lifecycleToPersisted(lifecycle) }
    });

    res.json({ ...persisted, lifecycle });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure hackathon: " + err.message });
  }
});

// Publish / activate a hackathon (admin only)
app.post("/api/hackathons/:id/publish", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing hackathon ID." });
  }

  try {
    const existing = await prisma.hackathon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const updated = await prisma.hackathon.update({
      where: { id },
      data: { published: true, archived: false, publishedAt: existing.publishedAt || new Date() }
    });
    const lifecycle = resolveLifecycleStatus(updated);
    const persisted = await prisma.hackathon.update({
      where: { id },
      data: { status: lifecycleToPersisted(lifecycle) }
    });

    res.json({ ...persisted, lifecycle, message: `Hackathon published. Status: ${lifecycle}` });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to publish hackathon: " + err.message });
  }
});

// Archive a hackathon (admin only)
app.post("/api/hackathons/:id/archive", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing hackathon ID." });
  }

  try {
    const existing = await prisma.hackathon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const updated = await prisma.hackathon.update({
      where: { id },
      data: { archived: true }
    });
    const lifecycle = resolveLifecycleStatus(updated);
    const persisted = await prisma.hackathon.update({
      where: { id },
      data: { status: lifecycleToPersisted(lifecycle) }
    });

    res.json({ ...persisted, lifecycle, message: "Hackathon archived." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to archive hackathon: " + err.message });
  }
});

// Delete a hackathon (admin only)
app.delete("/api/hackathons/:id", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing hackathon ID." });
  }

  try {
    await prisma.registration.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    const bp = await prisma.blueprint.findUnique({ where: { hackathonId: id } }).catch(() => null);
    if (bp) {
      await prisma.blueprintVersion.deleteMany({ where: { blueprintId: bp.id } }).catch(() => {});
    }
    await prisma.blueprint.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    await prisma.submission.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    await prisma.hackathon.deleteMany({ where: { id } });

    res.json({ message: "Hackathon deleted successfully", id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete hackathon: " + err.message });
  }
});

// Fetch registrations for a particular hackathon
app.get("/api/registrations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);

    // Participants can only read their own registrations
    if (req.user!.role !== "ADMIN" && req.user!.role !== "SUPER_ADMIN") {
      whereClause.userId = req.user!.id;
    } else if (userId) {
      whereClause.userId = String(userId);
    }

    const list = await prisma.registration.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch registrations: " + err.message });
  }
});

// Create or update a registration (authenticated user identity is authoritative)
app.post("/api/registrations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, collegeName, teamName, participationMode, userEmail } = req.body;
  const userId = req.user!.id;

  if (!hackathonId || !userId) {
    return res.status(400).json({ error: "Missing hackathonId or userId." });
  }

  // Lifecycle gate: registrations only for published (UPCOMING/ACTIVE) hackathons.
  const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
  if (!hackathon) {
    return res.status(404).json({ error: "Hackathon not found." });
  }
  if (!canAcceptRegistrations(hackathon)) {
    const lifecycle = resolveLifecycleStatus(hackathon);
    return res.status(409).json({
      error: lifecycle === "DRAFT"
        ? "Hackathon is not published yet. Registration is disabled."
        : lifecycle === "COMPLETED"
          ? "Hackathon has ended. Registration is closed."
          : "Hackathon is archived. Registration is disabled."
    });
  }

  try {
    // Safely verify if user exists, create on-the-fly if missing (handles mock dev credentials)
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      const email = userEmail || `${userId.toLowerCase()}@example.com`;
      // Check if email already registered under another ID to prevent email uniqueness crash
      const emailMatch = await prisma.user.findUnique({ where: { email } });
      const targetEmail = emailMatch ? `${userId.toLowerCase()}@example.com` : email;

      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: targetEmail,
          firstName: "Mock",
          lastName: "Developer",
          role: "PARTICIPANT"
        }
      });
    }

    const reg = await prisma.registration.upsert({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId
        }
      },
      update: {
        collegeName: collegeName || null,
        teamName: teamName || null,
        participationMode: participationMode || "solo"
      },
      create: {
        hackathonId,
        userId,
        collegeName: collegeName || null,
        teamName: teamName || null,
        participationMode: participationMode || "solo",
        status: "PENDING"
      }
    });
    res.json(reg);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to register user: " + err.message });
  }
});

// Update registration status (admin only)
app.put("/api/registrations/:id", verifyToken, requireRole(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing registration ID." });
  }

  const VALID_STATUSES = ["PENDING", "SHORTLISTED", "REJECTED", "APPROVED", "ON_HOLD"];
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}.`
    });
  }

  try {
    const existing = await prisma.registration.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Registration not found." });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update registration: " + err.message });
  }
});

// Fetch submissions with manual user/hackathon enrichment
app.get("/api/submissions", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);

    // Participants can only read their own submissions
    if (req.user!.role !== "ADMIN" && req.user!.role !== "SUPER_ADMIN") {
      whereClause.userId = req.user!.id;
    } else if (userId) {
      whereClause.userId = String(userId);
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    const enrichedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        const user = await prisma.user.findUnique({
          where: { id: sub.userId },
          select: { firstName: true, lastName: true, email: true }
        });
        const hackathon = await prisma.hackathon.findUnique({
          where: { id: sub.hackathonId },
          select: { name: true }
        });
        const reports = await prisma.evaluationReport.findMany({
          where: { submissionId: sub.id }
        });
        return {
          ...sub,
          user: user || { firstName: "Unknown", lastName: "User", email: "unknown@example.com" },
          hackathonName: hackathon ? hackathon.name : "Unknown Hackathon",
          reports
        };
      })
    );

    res.json(enrichedSubmissions);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch submissions: " + err.message });
  }
});

// PostgreSQL-backed Hackathon Leaderboard Endpoint
app.get("/api/hackathons/:hackathonId/leaderboard", async (req: Request, res: Response) => {
  const { hackathonId } = req.params;
  const { problemStatementId } = req.query;

  if (!hackathonId) {
    return res.status(400).json({ error: "Missing hackathonId parameter." });
  }

  try {
    const whereClause: any = { hackathonId, status: "COMPLETED" };
    if (problemStatementId) {
      whereClause.problemStatementId = String(problemStatementId);
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    // Group submissions by userId (Phase 8 best-score policy)
    const userGroups: Record<string, typeof submissions> = {};
    submissions.forEach(sub => {
      if (!userGroups[sub.userId]) {
        userGroups[sub.userId] = [];
      }
      userGroups[sub.userId].push(sub);
    });

    const userBestRecords = await Promise.all(
      Object.keys(userGroups).map(async (uid) => {
        const userSubs = userGroups[uid];
        const attemptCount = userSubs.length;

        // Find the best attempt
        let bestSub = userSubs[0];
        userSubs.forEach(s => {
          const scoreS = s.score ?? 0;
          const scoreBest = bestSub.score ?? 0;
          if (scoreS > scoreBest) {
            bestSub = s;
          } else if (scoreS === scoreBest) {
            const timeS = s.completedAt ? new Date(s.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
            const timeBest = bestSub.completedAt ? new Date(bestSub.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
            if (timeS < timeBest) {
              bestSub = s;
            }
          }
        });

        // Find the latest attempt
        let latestSub = userSubs[0];
        userSubs.forEach(s => {
          if (new Date(s.createdAt) > new Date(latestSub.createdAt)) {
            latestSub = s;
          }
        });

        const user = await prisma.user.findUnique({
          where: { id: uid },
          select: { firstName: true, lastName: true, email: true }
        });

        return {
          userId: uid,
          participantName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown Participant",
          participantEmail: user ? user.email : "unknown@example.com",
          bestSubmission: bestSub,
          latestSubmission: latestSub,
          attemptCount
        };
      })
    );

    // Sort by best score descending, then earliest completedAt, then userId
    userBestRecords.sort((a, b) => {
      const scoreA = a.bestSubmission.score ?? 0;
      const scoreB = b.bestSubmission.score ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      const timeA = a.bestSubmission.completedAt ? new Date(a.bestSubmission.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.bestSubmission.completedAt ? new Date(b.bestSubmission.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
    });

    // Assign ranks
    let currentRank = 0;
    let lastScore: number | null = null;
    const leaderboard = userBestRecords.map((rec, idx) => {
      const score = rec.bestSubmission.score ?? 0;
      if (lastScore === null || score !== lastScore) {
        currentRank = idx + 1;
        lastScore = score;
      }

      return {
        rank: currentRank,
        submissionId: rec.bestSubmission.id,
        participantId: rec.userId,
        participantName: rec.participantName,
        participantEmail: rec.participantEmail,
        projectName: rec.bestSubmission.projectName,
        repoUrl: rec.bestSubmission.repoUrl,
        deploymentUrl: rec.bestSubmission.deploymentUrl,
        problemStatementId: rec.bestSubmission.problemStatementId,
        score,
        grade: rec.bestSubmission.grade || (score >= 75 ? "PASSED" : "FAILED"),
        status: rec.bestSubmission.status,
        timestamp: rec.bestSubmission.updatedAt,
        attemptCount: rec.attemptCount,
        latestAttemptVersion: rec.latestSubmission.version
      };
    });

    res.json({
      hackathonId,
      totalEntries: leaderboard.length,
      leaderboard
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch PostgreSQL leaderboard: " + err.message });
  }
});

// Ensure demo credentials exist so the real JWT auth flow works out of the box.
// Idempotent: never modifies existing users.
async function ensureDemoUsers(): Promise<void> {
  const demoUsers = [
    { email: "admin@frontendarena.dev", password: "admin123", firstName: "Admin", lastName: "User", role: "ADMIN" },
    { email: "developer@frontendarena.dev", password: "developer123", firstName: "Developer", lastName: "User", role: "PARTICIPANT" }
  ];

  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: demo.email,
          password: hashPassword(demo.password),
          firstName: demo.firstName,
          lastName: demo.lastName,
          role: demo.role
        }
      });
      console.log(`[Auth] Seeded demo ${demo.role.toLowerCase()} account: ${demo.email}`);
    }
  }
}

async function boot(): Promise<void> {
  evaluationQueue = await createEvaluationQueue();
  console.log(`[Queue] Evaluation queue driver active: ${evaluationQueue.name}`);

  const runWorkerInWeb =
    (process.env.RUN_EVALUATION_WORKER_IN_WEB || "false").toLowerCase() === "true";

  if (runWorkerInWeb) {
    if (
      (process.env.EVALUATION_QUEUE_DRIVER || "redis").toLowerCase() !== "redis"
    ) {
      throw new Error(
        "RUN_EVALUATION_WORKER_IN_WEB=true requires EVALUATION_QUEUE_DRIVER=redis."
      );
    }

    // Start FAIE evaluation worker
    combinedWorkerHandle = await startEvaluationWorker({
      combinedMode: true,
    });

    console.log(
      `[Server] Combined mode active — FAIE v3 AST worker running in web process ` +
        `(concurrency=${process.env.EVALUATION_WORKER_CONCURRENCY || "1"}).`
    );
  } else {
    console.log(
      `[Server] API-only mode — evaluation workers run in separate processes (npm run worker).`
    );
  }

  const server = app.listen(PORT, async () => {
    console.log(`Frontend Arena Evaluation Engine running on port ${PORT}`);

    try {
      await ensureDemoUsers();
    } catch (err: any) {
      console.warn(`[Auth] Demo user seeding skipped: ${err.message}`);
    }
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(
      `[Server] ${signal} received — shutting down gracefully...`
    );

    server.close(async () => {
      console.log(
        "[Server] HTTP server closed (no new connections)."
      );

      // Close FAIE worker
      if (combinedWorkerHandle) {
        try {
          await combinedWorkerHandle.close();
          console.log(
            "[Server] Combined evaluation worker closed."
          );
        } catch (err: any) {
          console.error(
            `[Server] Error closing combined evaluation worker: ${err.message}`
          );
        }

        combinedWorkerHandle = null;
      }

      // Close evaluation queue
      try {
        await evaluationQueue.close();
        console.log("[Server] Queue closed.");
      } catch (err: any) {
        console.error(
          `[Server] Error closing queue: ${err.message}`
        );
      }

      // Disconnect Prisma
      try {
        await prisma.$disconnect();
        console.log("[Server] Prisma disconnected.");
      } catch (err: any) {
        console.error(
          `[Server] Error closing Prisma: ${err.message}`
        );
      }

      console.log("[Server] Shutdown complete.");
      process.exit(0);
    });

    // Force shutdown if graceful shutdown hangs
    setTimeout(() => {
      console.error(
        "[Server] Forced shutdown after 10s timeout."
      );
      process.exit(1);
    }, 10_000).unref();
  };

  // IMPORTANT: ye boot() ke andar hi rahenge
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Start server
boot().catch((err) => {
  console.error(`[Server] FATAL: ${err.message}`);
  process.exit(1);
});