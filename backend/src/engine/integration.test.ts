import { prisma } from "../config/db";
import { resolveHackathonLifecycle } from "../../../lib/utils";
import { evaluateSubmission } from "./evaluator";
import { RealRedisBullQueue } from "./redis-queue.system";

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log("=========================================================");
  console.log("PHASE 10 — AUTOMATED INTEGRATION & ISOLATION TESTS");
  console.log("=========================================================");

  const hackathonAId = `test_hack_a_${Date.now()}`;
  const hackathonBId = `test_hack_b_${Date.now()}`;
  const testUserId = `test_user_${Date.now()}`;

  try {
    // 1. Test Hackathon Lifecycle Status Resolver
    console.log("\n--- Testing Hackathon Lifecycle Status Resolver ---");
    
    // Case 1: Upcoming
    const upcomingHack = {
      registrationStart: new Date(Date.now() + 86400000), // tomorrow
      registrationClose: new Date(Date.now() + 172800000),
      eventStart: new Date(Date.now() + 259200000),
      eventClose: new Date(Date.now() + 345600000)
    };
    assert(resolveHackathonLifecycle(upcomingHack) === "UPCOMING", "Upcoming hackathon resolved as UPCOMING");

    // Case 2: Registration Open
    const regOpenHack = {
      registrationStart: new Date(Date.now() - 86400000), // yesterday
      registrationClose: new Date(Date.now() + 86400000),  // tomorrow
      eventStart: new Date(Date.now() + 172800000),
      eventClose: new Date(Date.now() + 259200000)
    };
    assert(resolveHackathonLifecycle(regOpenHack) === "REGISTRATION_OPEN", "Registration open hackathon resolved as REGISTRATION_OPEN");

    // Case 3: Live
    const liveHack = {
      registrationStart: new Date(Date.now() - 172800000),
      registrationClose: new Date(Date.now() - 86400000),
      eventStart: new Date(Date.now() - 3600000), // 1 hour ago
      eventClose: new Date(Date.now() + 86400000) // tomorrow
    };
    assert(resolveHackathonLifecycle(liveHack) === "LIVE", "Live hackathon resolved as LIVE");

    // Case 4: Completed
    const completedHack = {
      registrationStart: new Date(Date.now() - 345600000),
      registrationClose: new Date(Date.now() - 259200000),
      eventStart: new Date(Date.now() - 172800000),
      eventClose: new Date(Date.now() - 86400000) // yesterday
    };
    assert(resolveHackathonLifecycle(completedHack) === "COMPLETED", "Completed hackathon resolved as COMPLETED");

    // 2. Setup Test Hackathons and Blueprints in DB
    console.log("\n--- Setting up isolation test data ---");
    
    // Create Hackathon A
    await prisma.hackathon.create({
      data: {
        id: hackathonAId,
        name: "Hackathon A (Isolation Test)",
        description: "Test hackathon description",
        status: "live",
        submissionEnabled: true,
        leaderboardEnabled: true,
        rounds: [],
        testCases: [],
        rules: [],
        resources: []
      }
    });

    // Create Hackathon B
    await prisma.hackathon.create({
      data: {
        id: hackathonBId,
        name: "Hackathon B (Isolation Test)",
        description: "Test hackathon description",
        status: "live",
        submissionEnabled: true,
        leaderboardEnabled: true,
        rounds: [],
        testCases: [],
        rules: [],
        resources: []
      }
    });

    // Create User Profile
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `test_${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "Participant",
        role: "PARTICIPANT"
      }
    });

    // Create Blueprints
    const mockBlueprint = {
      synonymDictionary: {},
      confidenceThreshold: 75,
      problemStatement: { title: "Test Problem", description: "Design a clean dashboard" },
      requiredFeatures: [],
      techStackRules: { allowed: ["React", "TypeScript"], preferred: [], restricted: [] },
      submissionRequirements: { githubRepo: true, liveDeployment: true, readme: true },
      codeQualityRules: { folders: 25, comments: 25 },
      performanceRules: { lighthouseMin: 70, accessibilityMin: 60, seoMin: 70, bestPracticesMin: 70, performanceWeight: 15 },
      securityRules: { secretsDetection: true },
      scoringSystem: {
        categories: [
          { name: "Problem Alignment", maxMarks: 100, weight: 100, passingMarks: 50 }
        ]
      },
      autoPassFailRules: [],
      bonusRules: []
    };

    await prisma.blueprint.create({
      data: {
        hackathonId: hackathonAId,
        problemStatement: mockBlueprint.problemStatement,
        requiredFeatures: mockBlueprint.requiredFeatures,
        techStackRules: mockBlueprint.techStackRules,
        submissionRequirements: mockBlueprint.submissionRequirements,
        codeQualityRules: mockBlueprint.codeQualityRules,
        performanceRules: mockBlueprint.performanceRules,
        securityRules: mockBlueprint.securityRules,
        scoringSystem: mockBlueprint.scoringSystem,
        autoPassFailRules: mockBlueprint.autoPassFailRules,
        bonusRules: mockBlueprint.bonusRules
      }
    });

    await prisma.blueprint.create({
      data: {
        hackathonId: hackathonBId,
        problemStatement: mockBlueprint.problemStatement,
        requiredFeatures: mockBlueprint.requiredFeatures,
        techStackRules: mockBlueprint.techStackRules,
        submissionRequirements: mockBlueprint.submissionRequirements,
        codeQualityRules: mockBlueprint.codeQualityRules,
        performanceRules: mockBlueprint.performanceRules,
        securityRules: mockBlueprint.securityRules,
        scoringSystem: mockBlueprint.scoringSystem,
        autoPassFailRules: mockBlueprint.autoPassFailRules,
        bonusRules: mockBlueprint.bonusRules
      }
    });

    // 3. Test Queue and Execution Connection
    console.log("\n--- Testing Submission Queue and DB Lifecycle ---");
    
    // Create submission for Hackathon A
    const sub = await prisma.submission.create({
      data: {
        hackathonId: hackathonAId,
        userId: testUserId,
        repoUrl: "https://github.com/AryanUbale7/Frontendar",
        projectName: "Test Pipeline Submission",
        status: "QUEUED",
        features: [],
        techStack: {},
        teamContributions: []
      }
    });
    assert(sub.status === "QUEUED", "Submission initial status is QUEUED");

    // Add to Queue
    const queue = new RealRedisBullQueue();
    const job = await queue.addJob(sub.repoUrl, undefined, mockBlueprint, testUserId);
    assert(job.status === "queued" || job.status === "processing", "Queue job enqueued/processing successfully");

    // Update status to Evaluating
    const updatedSub = await prisma.submission.update({
      where: { id: sub.id },
      data: { status: "EVALUATING" }
    });
    assert(updatedSub.status === "EVALUATING", "Submission status updated to EVALUATING");

    // Mock successful evaluation completion and save
    const score = 88;
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        status: "COMPLETED",
        score,
        grade: "PASSED"
      }
    });

    const reportPayload = {
      hackathonTitle: "Hackathon A Test",
      repoUrl: sub.repoUrl,
      status: "COMPLETED",
      scoreSummary: { finalScore: score },
      scoringDetails: [
        { categoryName: "Problem Alignment", awardedMarks: score, maxMarks: 100 }
      ]
    };

    await prisma.evaluationReport.create({
      data: {
        submissionId: sub.id,
        payload: reportPayload as any
      }
    });

    const finalSub = await prisma.submission.findUnique({
      where: { id: sub.id },
      include: { reports: true }
    });
    assert(finalSub?.status === "COMPLETED" && finalSub.score === score, "Submission status is COMPLETED and score is persisted");
    assert(finalSub?.reports.length === 1, "EvaluationReport payload is persisted and linked to Submission");

    // 4. Test Isolation
    console.log("\n--- Testing Hackathon Isolation Constraints ---");
    
    // Fetch submissions for Hackathon B
    const subB = await prisma.submission.findMany({
      where: { hackathonId: hackathonBId }
    });
    assert(subB.length === 0, "Submission to HackA does NOT appear in HackB database entries");

    // Fetch leaderboard for HackA and HackB
    const getLeaderboard = async (hackId: string) => {
      const list = await prisma.submission.findMany({
        where: { hackathonId: hackId, status: "COMPLETED" }
      });
      return list;
    };

    const leaderboardA = await getLeaderboard(hackathonAId);
    const leaderboardB = await getLeaderboard(hackathonBId);
    
    assert(leaderboardA.length === 1 && leaderboardA[0].id === sub.id, "Submission appears in HackA leaderboard");
    assert(leaderboardB.length === 0, "Submission does NOT appear in HackB leaderboard");

    console.log("\n=========================================================");
    console.log("INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================");

  } catch (err: any) {
    console.error("\n[FAIL] Test suite failed:", err.message);
    process.exit(1);
  } finally {
    // 5. Cleanup Test Data
    console.log("\nCleaning up test data...");
    await prisma.evaluationReport.deleteMany({ where: { submission: { hackathonId: { in: [hackathonAId, hackathonBId] } } } }).catch(() => {});
    await prisma.submission.deleteMany({ where: { hackathonId: { in: [hackathonAId, hackathonBId] } } }).catch(() => {});
    await prisma.blueprint.deleteMany({ where: { hackathonId: { in: [hackathonAId, hackathonBId] } } }).catch(() => {});
    await prisma.registration.deleteMany({ where: { hackathonId: { in: [hackathonAId, hackathonBId] } } }).catch(() => {});
    await prisma.hackathon.deleteMany({ where: { id: { in: [hackathonAId, hackathonBId] } } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    await prisma.$disconnect();
  }
}

runTests();
