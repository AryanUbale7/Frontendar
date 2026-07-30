import express, { Request, Response } from "express";
import cors from "cors";
import { evaluateSubmission } from "./engine/evaluator";
import { prisma } from "./config/db";
import { authRouter } from "./routes/auth";
import { verifyToken, AuthenticatedRequest } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 4000;

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
  const { repoUrl, blueprint } = req.body;
  if (!repoUrl || !blueprint) {
    return res.status(400).json({ error: "Missing repository URL or blueprint configuration." });
  }

  try {
    const report = await evaluateSubmission(repoUrl, blueprint);
    res.json(report);
  } catch (error: any) {
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
  const { hackathonId } = req.query;
  if (!hackathonId) {
    return res.status(400).json({ error: "Missing hackathonId parameter." });
  }
  try {
    const list = await prisma.registration.findMany({
      where: { hackathonId: String(hackathonId) },
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

// Update registration status (shortlisted, rejected, approved)
app.put("/api/registrations/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Missing status field." });
  }
  try {
    const updated = await prisma.registration.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update registration status: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend Arena Evaluation Engine running on port ${PORT}`);
});
