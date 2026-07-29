import express, { Request, Response } from "express";
import cors from "cors";
import { evaluateSubmission } from "./engine/evaluator";
import { prisma } from "./config/db";
import { authRouter } from "./routes/auth";
import { verifyToken, AuthenticatedRequest } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
  const { id, name, description, problemTitle, startDate, endDate } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Missing hackathon name or description." });
  }

  try {
    const hackathon = await prisma.hackathon.upsert({
      where: { id: id || "" },
      update: {
        name,
        description,
        problemTitle: problemTitle || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      create: {
        id: id || undefined,
        name,
        description,
        problemTitle: problemTitle || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });
    res.json(hackathon);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to configure hackathon: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend Arena Evaluation Engine running on port ${PORT}`);
});
