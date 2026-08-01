import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { prisma } from "./config/db";
import { authRouter } from "./routes/auth";
import { verifyToken, optionalAuth, requireRole, AuthenticatedRequest } from "./middleware/auth";
import { createEvaluationQueue, EvaluationQueueDriver } from "./engine/queue";
import { hashPassword } from "./engine/password";
import { resolveLifecycleStatus, lifecycleToPersisted, canAcceptSubmissions, canAcceptRegistrations, LifecycleStatus } from "./engine/lifecycle";

const app = express();
const PORT = process.env.PORT || 4000;

let evaluationQueue: EvaluationQueueDriver;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Auth Router mount
app.use("/api/auth", authRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", service: "evaluation-engine", time: new Date() });
});

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
app.post("/api/evaluate", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const {
    repoUrl,
    deploymentUrl,
    hackathonId,
    userId,
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

  // The authenticated user's identity is authoritative when a JWT is present
  let effectiveUserId = userId;
  if (req.user) {
    if (userId && req.user.role === "PARTICIPANT" && userId !== req.user.id) {
      return res.status(403).json({ error: "Cannot submit on behalf of another user." });
    }
    effectiveUserId = req.user.id;
  }

  // 1. Resolve lifecycle + published blueprint from the database (authoritative).
  //    The client-supplied blueprint is NEVER trusted for hackathon submissions.
  let blueprint = req.body.blueprint;
  let blueprintId: string | null = null;
  let blueprintVersion: number | null = null;

  if (hackathonId) {
    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found." });
    }

    const lifecycle: LifecycleStatus = resolveLifecycleStatus(hackathon);
    if (lifecycle === "DRAFT") {
      return res.status(409).json({ error: "Hackathon is not published yet. Submissions are disabled." });
    }
    if (lifecycle === "UPCOMING") {
      return res.status(409).json({ error: "Submissions are not open yet. The hackathon window has not started." });
    }
    if (lifecycle === "COMPLETED") {
      return res.status(409).json({ error: "Hackathon has ended. New submissions are disabled." });
    }
    if (lifecycle === "ARCHIVED") {
      return res.status(409).json({ error: "Hackathon is archived. Submissions are disabled." });
    }
    if (!canAcceptSubmissions(hackathon)) {
      return res.status(409).json({ error: "Submissions are disabled for this hackathon." });
    }

    // Deterministic precedence: published blueprint for the submission's hackathon.
    const dbBlueprint = await prisma.blueprint.findFirst({
      where: { hackathonId, status: "published" },
      orderBy: { version: "desc" }
    });
    if (!dbBlueprint) {
      return res.status(400).json({ error: "No published blueprint configured for this hackathon. Evaluation cannot run." });
    }
    blueprint = dbBlueprint;
    blueprintId = dbBlueprint.id;
    blueprintVersion = dbBlueprint.version;
  }

  if (!blueprint) {
    return res.status(400).json({ error: "Missing blueprint configuration." });
  }

  // 2. Persist/update Submission in PostgreSQL under QUEUED status
  let submission: any;
  try {
    if (hackathonId && effectiveUserId) {
      const existing = await prisma.submission.findFirst({
        where: { hackathonId, userId: effectiveUserId }
      });

      if (existing) {
        submission = await prisma.submission.update({
          where: { id: existing.id },
          data: {
            repoUrl,
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
            blueprintId,
            blueprintVersion,
            completedAt: null,
            version: existing.version + 1
          }
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            hackathonId,
            userId: effectiveUserId,
            repoUrl,
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
            blueprintId,
            blueprintVersion,
            version: 1
          }
        });
      }
    }
  } catch (dbErr: any) {
    console.error(`[Evaluate] Database error saving submission: ${dbErr.message}`);
  }

  if (!submission) {
    return res.status(500).json({ error: "Failed to persist submission. Evaluation was not queued." });
  }

  // 3. Enqueue the evaluation job and return promptly (202).
  //    Durable driver (BullMQ/Redis or explicit in-memory dev fallback) —
  //    the HTTP request NEVER waits for clone/install/build/Lighthouse/FAIE.
  const job = await evaluationQueue.enqueue({
    submissionId: submission.id,
    repoUrl,
    deploymentUrl: deploymentUrl || undefined,
    userId: effectiveUserId,
    hackathonId: hackathonId || "",
    blueprintId: blueprintId || undefined,
    blueprintVersion: blueprintVersion || undefined,
    version: submission.version,
  });

  console.log(`[Evaluate] Enqueued FAIE evaluation job ${job.jobId} (driver=${evaluationQueue.name}) for repository: ${repoUrl}`);

  res.status(202).json({
    jobId: job.jobId,
    submissionId: submission.id,
    status: "QUEUED",
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
app.get("/api/registrations", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);

    // Participants can only read their own registrations
    if (req.user && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      if (userId && String(userId) !== req.user.id) {
        return res.status(403).json({ error: "Cannot view another user's registrations." });
      }
      whereClause.userId = req.user.id;
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
app.post("/api/registrations", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, collegeName, teamName, participationMode, userEmail } = req.body;
  const userId = req.user?.id || req.body.userId;

  if (!hackathonId || !userId) {
    return res.status(400).json({ error: "Missing hackathonId or userId." });
  }
  if (req.user && req.user.role === "PARTICIPANT" && req.body.userId && req.body.userId !== req.user.id) {
    return res.status(403).json({ error: "Cannot register on behalf of another user." });
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
app.get("/api/submissions", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);

    // Participants can only read their own submissions
    if (req.user && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      if (userId && String(userId) !== req.user.id) {
        return res.status(403).json({ error: "Cannot view another user's submissions." });
      }
      whereClause.userId = req.user.id;
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
  if (!hackathonId) {
    return res.status(400).json({ error: "Missing hackathonId parameter." });
  }

  try {
    const submissions = await prisma.submission.findMany({
      where: { hackathonId, status: "COMPLETED" },
      include: { reports: true }
    });

    // Deterministic ranking: higher score wins. Ties are broken by
    // evaluation completion time (earlier = better), then stable submission ID.
    // FAILED/non-COMPLETED submissions are excluded above and cannot outrank.
    submissions.sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    // Generate ranks (computed synchronously before any async enrichment)
    let currentRank = 0;
    let lastScore: number | null = null;
    const ranked = submissions.map((sub, idx) => {
      if (lastScore === null || sub.score !== lastScore) {
        currentRank = idx + 1;
        lastScore = sub.score;
      }
      return { sub, rank: currentRank };
    });

    const rankedLeaderboard = await Promise.all(
      ranked.map(async ({ sub, rank }) => {
        // Enrich user details
        const user = await prisma.user.findUnique({
          where: { id: sub.userId },
          select: { firstName: true, lastName: true, email: true }
        });

        return {
          rank,
          submissionId: sub.id,
          participantId: sub.userId,
          participantName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown Participant",
          participantEmail: user ? user.email : "unknown@example.com",
          projectName: sub.projectName,
          repoUrl: sub.repoUrl,
          deploymentUrl: sub.deploymentUrl,
          score: sub.score ?? 0,
          grade: sub.grade || (sub.score && sub.score >= 75 ? "PASSED" : "FAILED"),
          status: sub.status,
          timestamp: sub.updatedAt
        };
      })
    );

    res.json({
      hackathonId,
      totalEntries: rankedLeaderboard.length,
      leaderboard: rankedLeaderboard
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

  const server = app.listen(PORT, async () => {
    console.log(`Frontend Arena Evaluation Engine running on port ${PORT}`);
    try {
      await ensureDemoUsers();
    } catch (err: any) {
      console.warn(`[Auth] Demo user seeding skipped: ${err.message}`);
    }
  });

  // Graceful shutdown: stop accepting new work, close queue + DB connections.
  const shutdown = (signal: string) => {
    console.log(`[Server] ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      try {
        await evaluationQueue.close();
      } catch (err: any) {
        console.error(`[Server] Error closing queue: ${err.message}`);
      }
      try {
        await prisma.$disconnect();
      } catch (err: any) {
        console.error(`[Server] Error closing Prisma: ${err.message}`);
      }
      console.log("[Server] Shutdown complete.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[Server] Forced shutdown after 10s timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

boot().catch((err) => {
  console.error(`[Server] FATAL: ${err.message}`);
  process.exit(1);
});
