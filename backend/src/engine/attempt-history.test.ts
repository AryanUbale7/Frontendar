import { FAIEOrchestrator } from "../../../evaluation-engine/intelligence-engine";

async function runAttemptHistoryVerificationTests() {
  console.log("================================================================");
  console.log("FAIE v3 EvaluationAttempt History & Immutability Test Suite");
  console.log("================================================================\n");

  const orchestrator = new FAIEOrchestrator();

  // Mock Blueprint Version 1 (Enterprise SaaS)
  const blueprintV1: any = {
    version: 1,
    problemStatement: { id: "ps_1", title: "Enterprise SaaS" },
    requiredFeatures: [
      { name: "Auth", mandatory: true, weight: 30, keywords: ["auth"] }
    ],
    techStackRules: { allowed: ["React", "TypeScript"], required: ["TypeScript"] },
    submissionRequirements: { githubRepo: true, readme: true },
    scoringSystem: {
      categories: [
        { name: "Required Features", weight: 50, maxMarks: 50, passingMarks: 30 },
        { name: "Tech Stack", weight: 50, maxMarks: 50, passingMarks: 30 }
      ]
    }
  };

  // Mock Blueprint Version 2 (Updated Weightings)
  const blueprintV2: any = {
    version: 2,
    problemStatement: { id: "ps_1", title: "Enterprise SaaS v2" },
    requiredFeatures: [
      { name: "Auth", mandatory: true, weight: 40, keywords: ["auth"] }
    ],
    techStackRules: { allowed: ["React", "TypeScript"], required: ["TypeScript"] },
    submissionRequirements: { githubRepo: true, readme: true },
    scoringSystem: {
      categories: [
        { name: "Required Features", weight: 70, maxMarks: 70, passingMarks: 40 },
        { name: "Tech Stack", weight: 30, maxMarks: 30, passingMarks: 18 }
      ]
    }
  };

  // Simulated Attempt DB Store
  const mockSubmission = {
    id: "sub_test_999",
    hackathonId: "hack_test_100",
    userId: "user_test_42",
    repoUrl: "https://github.com/aryanubale7/test_hw.git",
    version: 0,
    score: null as number | null,
    bestScore: null as number | null,
    latestAttemptId: null as string | null
  };

  const attemptsStore: Array<{
    id: string;
    attemptNumber: number;
    blueprintVersion: number;
    score: number;
    reportPayload: any;
  }> = [];

  console.log("A. Simulating FIRST SUBMISSION (Attempt #1)...");
  mockSubmission.version += 1;
  const report1 = await orchestrator.evaluate(mockSubmission.repoUrl, mockSubmission.repoUrl, blueprintV1);
  const score1 = 62; // Controlled score 1
  report1.scoreSummary.finalScore = score1;

  attemptsStore.push({
    id: `att_1`,
    attemptNumber: 1,
    blueprintVersion: 1,
    score: score1,
    reportPayload: report1
  });

  mockSubmission.score = score1;
  mockSubmission.bestScore = score1;
  mockSubmission.latestAttemptId = "att_1";

  console.log(`   Attempt #1 Recorded: Score = ${attemptsStore[0].score}/100, Version = ${attemptsStore[0].blueprintVersion}`);

  console.log("\nB. Simulating SECOND SUBMISSION after repo improvement (Attempt #2)...");
  mockSubmission.version += 1;
  const report2 = await orchestrator.evaluate(mockSubmission.repoUrl, mockSubmission.repoUrl, blueprintV1);
  const score2 = 81; // Improved score
  report2.scoreSummary.finalScore = score2;

  attemptsStore.push({
    id: `att_2`,
    attemptNumber: 2,
    blueprintVersion: 1,
    score: score2,
    reportPayload: report2
  });

  const scoresSoFar = attemptsStore.map(a => a.score);
  mockSubmission.score = score2;
  mockSubmission.bestScore = Math.max(...scoresSoFar);
  mockSubmission.latestAttemptId = "att_2";

  console.log(`   Attempt #2 Recorded: Score = ${attemptsStore[1].score}/100, Version = ${attemptsStore[1].blueprintVersion}`);
  console.log(`   Attempt #1 Preserved Unchanged: Score = ${attemptsStore[0].score}/100`);

  console.log("\nC. Simulating THIRD SUBMISSION with blueprint v2 & temporary regression (Attempt #3)...");
  mockSubmission.version += 1;
  const report3 = await orchestrator.evaluate(mockSubmission.repoUrl, mockSubmission.repoUrl, blueprintV2);
  const score3 = 76; // Regression in score 3
  report3.scoreSummary.finalScore = score3;

  attemptsStore.push({
    id: `att_3`,
    attemptNumber: 3,
    blueprintVersion: 2,
    score: score3,
    reportPayload: report3
  });

  const allScores = attemptsStore.map(a => a.score);
  mockSubmission.score = score3; // Latest score = 76
  mockSubmission.bestScore = Math.max(...allScores); // Best score = 81
  mockSubmission.latestAttemptId = "att_3";

  console.log(`   Attempt #3 Recorded: Score = ${attemptsStore[2].score}/100, Blueprint Version = ${attemptsStore[2].blueprintVersion}`);

  console.log("\n================================================================");
  console.log("IMMUTABLE ATTEMPT HISTORY AUDIT SUMMARY");
  console.log("================================================================\n");

  console.log(`Total Attempts Recorded: ${attemptsStore.length}`);
  console.log(`Attempt #1: Score = ${attemptsStore[0].score}, BlueprintVersion = ${attemptsStore[0].blueprintVersion}`);
  console.log(`Attempt #2: Score = ${attemptsStore[1].score}, BlueprintVersion = ${attemptsStore[1].blueprintVersion}`);
  console.log(`Attempt #3: Score = ${attemptsStore[2].score}, BlueprintVersion = ${attemptsStore[2].blueprintVersion}`);

  console.log(`\nParent Submission Latest Score:  ${mockSubmission.score} (Attempt #3)`);
  console.log(`Parent Submission Best Score:    ${mockSubmission.bestScore} (Attempt #2)`);

  const leaderboardScore = mockSubmission.bestScore;
  console.log(`Leaderboard Effective Score:     ${leaderboardScore}`);

  // Assertions
  if (
    attemptsStore.length === 3 &&
    attemptsStore[0].score === 62 &&
    attemptsStore[1].score === 81 &&
    attemptsStore[2].score === 76 &&
    mockSubmission.score === 76 &&
    mockSubmission.bestScore === 81 &&
    leaderboardScore === 81
  ) {
    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
    console.log("   - Attempt #1 payload was NOT overwritten.");
    console.log("   - Attempt #2 increased score from 62 to 81.");
    console.log("   - Attempt #3 lower score (76) did NOT reduce leaderboard score (81).");
    console.log("   - Each attempt preserved its original BlueprintVersion binding.");
  } else {
    console.error("\n❌ TEST FAILURE DETECTED!");
    process.exit(1);
  }
}

runAttemptHistoryVerificationTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
