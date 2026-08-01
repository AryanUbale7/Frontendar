import { prisma } from "../config/db";
import { resolveHackathonLifecycle } from "./utils";

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runE2E() {
  console.log("=========================================================");
  console.log("PHASE 9 — REAL END-TO-END VERIFICATION");
  console.log("=========================================================");

  // Find the published Frontend Wars 2026 hackathon and blueprint in PostgreSQL
  const hackathon = await prisma.hackathon.findFirst({
    where: { name: "Frontend Wars 2026" }
  });

  if (!hackathon) {
    console.error("[FAIL] Frontend Wars 2026 hackathon not found in database.");
    process.exit(1);
  }

  const blueprint = await prisma.blueprint.findUnique({
    where: { hackathonId: hackathon.id }
  });

  if (!blueprint) {
    console.error("[FAIL] Published blueprint for Frontend Wars 2026 not found in database.");
    process.exit(1);
  }

  console.log(`Resolved Hackathon: ${hackathon.name} (ID: ${hackathon.id})`);
  console.log(`Resolved Blueprint ID: ${blueprint.id}`);

  // Create a test user in DB if not exists
  const testUserId = "e2e_test_participant_user";
  let user = await prisma.user.findUnique({ where: { id: testUserId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: testUserId,
        email: "e2e_participant@frontendarena.dev",
        firstName: "Jane",
        lastName: "Doe",
        role: "PARTICIPANT"
      }
    });
  }

  // Trigger real HTTP POST to /api/evaluate
  console.log("\nTriggering real evaluation HTTP call...");
  const payload = {
    repoUrl: "https://github.com/AryanUbale7/Frontendar",
    deploymentUrl: "https://frontendar-demo.vercel.app",
    hackathonId: hackathon.id,
    userId: user.id,
    projectName: "Enterprise Admin Hub",
    shortDesc: "Premium dashboard layout built with React & Tailwind",
    detailedDesc: "Contains responsive graphs, analytics tracking, user tables, and clean settings page.",
    problemSolved: "Aggregates workspace metrics in real-time.",
    features: ["Responsive Dashboard", "Interactive Charts", "Admin Settings"],
    techStack: {
      frontend: ["React", "TypeScript", "TailwindCSS"],
      backend: ["Next.js Router"],
      database: ["PostgreSQL via Prisma"]
    },
    videoUrl: "https://youtube.com/watch?v=e2e-demo",
    presentationPdf: "https://slides.com/e2e-pdf",
    architectureDiagram: "https://diagrams.com/e2e-architecture",
    teamContributions: [
      { member: "Jane Doe", role: "Frontend Lead", contribution: "Built the responsive layouts and interactive charts" }
    ],
    blueprint: blueprint
  };

  try {
    const res = await fetch("http://localhost:4000/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert(res.status === 202, "HTTP request to /api/evaluate returned 202 Accepted (non-blocking)");
    const queued = await res.json();
    assert(queued.jobId !== undefined, "Queue job id returned immediately");
    assert(queued.status === "QUEUED", "Submission starts in QUEUED status");

    console.log(`\n--- Evaluation queued (jobId: ${queued.jobId}) — waiting for completion ---`);

    // Poll submissions endpoint until the evaluation completes
    let report: any;
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const checkRes = await fetch(`http://localhost:4000/api/submissions?hackathonId=${hackathon.id}&userId=${user.id}`);
      if (!checkRes.ok) continue;
      const subs = await checkRes.json();
      const latest = subs.find((s: any) => s.id === queued.submissionId) || subs[0];
      if (latest?.status === "COMPLETED" && latest.reports?.length > 0) {
        report = latest.reports[0].payload;
        break;
      }
      if (latest?.status === "FAILED") {
        throw new Error("Evaluation finished with FAILED status.");
      }
    }

    if (!report) {
      throw new Error("Evaluation did not complete within the polling window.");
    }

    console.log("\n--- FAIE Runtime Evidence Captured ---");
    console.log(`Detected Project Type: ${report.projectClassification?.detectedProjectType}`);
    console.log(`Selected Blueprint: ${report.hackathonTitle}`);
    console.log(`Final Score: ${report.scoreSummary?.finalScore}/100`);
    console.log(`Logs Generated: ${report.logs?.length || 0} lines`);

    assert(report.projectClassification !== undefined, "Project classification engine executed successfully");
    assert(report.scoreSummary?.finalScore !== undefined, "Final score was calculated successfully");
    assert(report.logs?.length > 0, "FAIE runtime logs generated successfully");

    // 2. Verify DB persistence
    console.log("\n--- Verifying PostgreSQL Database Persistence ---");
    const sub = await prisma.submission.findUnique({
      where: { id: queued.submissionId },
      include: { reports: true }
    });

    assert(sub !== null, "Submission record was successfully persisted in PostgreSQL");
    assert(sub?.status === "COMPLETED", "Submission status is COMPLETED");
    assert(sub?.score === Math.round(report.scoreSummary.finalScore), "Persisted score matches the evaluated score");
    assert(sub?.reports.length === 1, "Evaluation report is saved and linked to submission");
    assert((sub?.reports[0].payload as any).scoreSummary.finalScore === report.scoreSummary.finalScore, "Report payload score matches");

    // 3. Verify Admin API Submissions Endpoint
    console.log("\n--- Verifying Admin Submissions API ---");
    const subRes = await fetch(`http://localhost:4000/api/submissions?hackathonId=${hackathon.id}`);
    assert(subRes.ok, "Submissions API returned 200 OK");
    const subsList = await subRes.json();
    assert(subsList.length > 0, "Submissions list contains the new submission");
    const matchedSub = subsList.find((s: any) => s.id === sub?.id);
    assert(matchedSub !== undefined, "Submissions list contains our exact submission");
    assert(matchedSub.user.email === user.email, "Submission contains enriched user details (email)");

    // 4. Verify Leaderboard API
    console.log("\n--- Verifying Leaderboard Rankings & Ranks ---");
    const leadRes = await fetch(`http://localhost:4000/api/hackathons/${hackathon.id}/leaderboard`);
    assert(leadRes.ok, "Leaderboard API returned 200 OK");
    const leaderboardData = await leadRes.json();
    
    assert(leaderboardData.leaderboard.length > 0, "Leaderboard contains entries");
    const leader = leaderboardData.leaderboard.find((l: any) => l.submissionId === sub?.id);
    assert(leader !== undefined, "Leaderboard contains our new submission");
    
    let isSorted = true;
    for (let i = 0; i < leaderboardData.leaderboard.length - 1; i++) {
      if (leaderboardData.leaderboard[i].score < leaderboardData.leaderboard[i + 1].score) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "Leaderboard entries are correctly sorted by score descending");
    assert(leader.rank !== undefined, "Submission was ranked correctly in the leaderboard");
    assert(leader.participantName === "Jane Doe", "Leaderboard entry contains enriched participant name");

    console.log("\n=========================================================");
    console.log("E2E SUBMISSION EVALUATION PIPELINE VERIFIED SUCCESSFULLY!");
    console.log("=========================================================");

  } catch (err: any) {
    console.error("[FAIL] E2E verification failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2E();
