import express, { Request, Response } from "express";
import cors from "cors";
import { evaluateSubmission } from "./engine/evaluator";
import { prisma } from "./config/db";
import { authRouter } from "./routes/auth";
import { verifyToken, AuthenticatedRequest } from "./middleware/auth";
import { RealRedisBullQueue } from "./engine/redis-queue.system";

const app = express();
const PORT = process.env.PORT || 4000;

const evaluationQueue = new RealRedisBullQueue();

evaluationQueue.on("queued", (job) => {
  console.log(`[Queue] Job ${job.jobId} enqueued for repository: ${job.repoUrl}`);
});

evaluationQueue.on("active", (job) => {
  console.log(`[Queue] Job ${job.jobId} is now active (processing)`);
});

evaluationQueue.on("completed", (job) => {
  console.log(`[Queue] Job ${job.jobId} completed successfully!`);
});

evaluationQueue.on("failed", (job) => {
  console.log(`[Queue] Job ${job.jobId} failed: ${job.errorLog}`);
});

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
app.get("/api/blueprints/:hackathonId", async (req: Request, res: Response) => {
  const { hackathonId } = req.params;
  try {
    const bp = await prisma.blueprint.findUnique({ where: { hackathonId } });
    if (!bp) {
      return res.status(404).json({ error: "No blueprint configured for this hackathon." });
    }
    res.json(bp);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch blueprint: " + err.message });
  }
});

// Save or update blueprint for a hackathon in PostgreSQL
app.post("/api/blueprints", async (req: Request, res: Response) => {
  const { hackathonId, blueprint } = req.body;
  if (!hackathonId || !blueprint) {
    return res.status(400).json({ error: "Missing hackathonId or blueprint details." });
  }

  try {
    await prisma.blueprint.upsert({
      where: { hackathonId },
      update: {
        problemStatement: blueprint.problemStatement || {},
        requiredFeatures: blueprint.requiredFeatures || [],
        techStackRules: blueprint.techStackRules || {},
        submissionRequirements: blueprint.submissionRequirements || {},
        codeQualityRules: blueprint.codeQualityRules || {},
        performanceRules: blueprint.performanceRules || {},
        securityRules: blueprint.securityRules || {},
        scoringSystem: blueprint.scoringSystem || {},
        autoPassFailRules: blueprint.autoPassFailRules || [],
        bonusRules: blueprint.bonusRules || []
      },
      create: {
        hackathonId,
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
      }
    });

    res.json({ message: "Blueprint configured successfully!", hackathonId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure blueprint: " + err.message });
  }
});

// Trigger dynamic evaluation
app.post("/api/evaluate", async (req: Request, res: Response) => {
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

  // 1. Resolve dynamic blueprint from database or fallback
  let blueprint = req.body.blueprint;
  if (hackathonId) {
    try {
      const dbBlueprint = await prisma.blueprint.findUnique({ where: { hackathonId } });
      if (dbBlueprint) {
        blueprint = dbBlueprint;
      } else {
        console.warn(`[Evaluate] No blueprint found in database for hackathonId ${hackathonId}. Using fallback/passed blueprint.`);
      }
    } catch (dbErr: any) {
      console.error(`[Evaluate] Error fetching blueprint from database: ${dbErr.message}`);
    }
  }

  if (!blueprint) {
    return res.status(400).json({ error: "Missing blueprint configuration." });
  }

  // 2. Persist/update Submission in PostgreSQL under QUEUED status
  let submission: any;
  try {
    if (hackathonId && userId) {
      const existing = await prisma.submission.findFirst({
        where: { hackathonId, userId }
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
            version: existing.version + 1
          }
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            hackathonId,
            userId,
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
            version: 1
          }
        });
      }
    }
  } catch (dbErr: any) {
    console.error(`[Evaluate] Database error saving submission: ${dbErr.message}`);
  }

  // 3. Queue the evaluation job
  const job = await evaluationQueue.addJob(repoUrl, deploymentUrl || undefined, blueprint, userId);

  // 4. Update status to EVALUATING and run evaluation
  try {
    if (submission) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: { status: "EVALUATING" }
      });
      // Fire event to transition in queue system too
      evaluationQueue.processQueue();
    }

    console.log(`[Evaluate] Launching FAIE evaluation for repository: ${repoUrl}`);
    const report = await evaluateSubmission(repoUrl, blueprint);

    // Update queue to completed
    evaluationQueue.completeJob(job.jobId, report);

    // 5. Update submission to COMPLETED with scores
    if (submission) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "COMPLETED",
          score: report.scoreSummary.finalScore,
          grade: report.scoreSummary.finalScore >= 75 ? "PASSED" : "FAILED"
        }
      });

      await prisma.evaluationReport.upsert({
        where: { submissionId: submission.id },
        update: { payload: report as any },
        create: { submissionId: submission.id, payload: report as any }
      });
    }

    res.json(report);
  } catch (error: any) {
    // 6. Update submission to FAILED
    if (submission) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "FAILED",
          score: 0,
          grade: "FAILED"
        }
      });
    }

    evaluationQueue.failJob(job.jobId, error.message);
    res.status(500).json({ error: "Evaluation engine failed: " + error.message });
  }
});

// Fetch all hackathons from PostgreSQL
app.get("/api/hackathons", async (req: Request, res: Response) => {
  try {
    const list = await prisma.hackathon.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch hackathons: " + err.message });
  }
});

// Save or update a hackathon in PostgreSQL
app.post("/api/hackathons", async (req: Request, res: Response) => {
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
    status
  } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: "Missing hackathon name or description." });
  }

  try {
    const dataObj = {
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
      status: status || "upcoming",
      startDate: eventStart ? new Date(eventStart) : null,
      endDate: eventClose ? new Date(eventClose) : null
    };

    const hackathon = await prisma.hackathon.upsert({
      where: { id: id || "" },
      update: dataObj,
      create: {
        id: id || undefined,
        ...dataObj
      }
    });
    res.json(hackathon);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure hackathon: " + err.message });
  }
});

// Delete a hackathon
app.delete("/api/hackathons/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing hackathon ID." });
  }

  try {
    await prisma.registration.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    await prisma.blueprint.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    await prisma.submission.deleteMany({ where: { hackathonId: id } }).catch(() => {});
    await prisma.hackathon.deleteMany({ where: { id } });

    res.json({ message: "Hackathon deleted successfully", id });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete hackathon: " + err.message });
  }
});

// Fetch registrations for a particular hackathon
app.get("/api/registrations", async (req: Request, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);
    if (userId) whereClause.userId = String(userId);

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

// Create or update a registration
app.post("/api/registrations", async (req: Request, res: Response) => {
  const { hackathonId, userId, collegeName, teamName, participationMode, userEmail } = req.body;
  if (!hackathonId || !userId) {
    return res.status(400).json({ error: "Missing hackathonId or userId." });
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

// Fetch submissions with manual user/hackathon enrichment
app.get("/api/submissions", async (req: Request, res: Response) => {
  const { hackathonId, userId } = req.query;
  try {
    const whereClause: any = {};
    if (hackathonId) whereClause.hackathonId = String(hackathonId);
    if (userId) whereClause.userId = String(userId);

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

    // Helper to get category score from report payload
    const getCategoryScore = (sub: any, categoryName: string): number => {
      const report = sub.reports?.[0];
      if (!report || !report.payload) return 0;
      const payload = report.payload as any;
      const details = payload.scoringDetails || [];
      const match = details.find(
        (d: any) => d.categoryName?.toLowerCase().includes(categoryName.toLowerCase())
      );
      return match ? match.awardedMarks : 0;
    };

    // Sort submissions deterministically
    submissions.sort((a, b) => {
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Tie breaker 1: Problem Alignment
      const alignA = getCategoryScore(a, "alignment");
      const alignB = getCategoryScore(b, "alignment");
      if (alignB !== alignA) return alignB - alignA;

      // Tie breaker 2: UI/UX & Features
      const uiA = getCategoryScore(a, "ui/ux") || getCategoryScore(a, "feature");
      const uiB = getCategoryScore(b, "ui/ux") || getCategoryScore(b, "feature");
      if (uiB !== uiA) return uiB - uiA;

      // Tie breaker 3: Performance & SEO
      const perfA = getCategoryScore(a, "performance");
      const perfB = getCategoryScore(b, "performance");
      if (perfB !== perfA) return perfB - perfA;

      // Tie breaker 4: Accessibility
      const accA = getCategoryScore(a, "accessibility");
      const accB = getCategoryScore(b, "accessibility");
      if (accB !== accA) return accB - accA;

      // Tie breaker 5: Innovation
      const innA = getCategoryScore(a, "innovation");
      const innB = getCategoryScore(b, "innovation");
      if (innB !== innA) return innB - innA;

      // Tie breaker 6: Documentation
      const docA = getCategoryScore(a, "documentation");
      const docB = getCategoryScore(b, "documentation");
      if (docB !== docA) return docB - docA;

      // Tie breaker 7: submittedAt/createdAt
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Generate ranks
    let currentRank = 0;
    let lastScore: number | null = null;
    const rankedLeaderboard = await Promise.all(
      submissions.map(async (sub, idx) => {
        if (lastScore === null || sub.score !== lastScore) {
          currentRank = idx + 1;
          lastScore = sub.score;
        }
        
        // Enrich user details
        const user = await prisma.user.findUnique({
          where: { id: sub.userId },
          select: { firstName: true, lastName: true, email: true }
        });

        return {
          rank: currentRank,
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

app.listen(PORT, () => {
  console.log(`Frontend Arena Evaluation Engine running on port ${PORT}`);
});
