import { BenchmarkRepositoryBuilder, BenchmarkDefinition } from "./benchmark.repository.builder";
import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";

export interface BenchmarkResultComparison {
  benchmarkId: string;
  benchmarkName: string;
  expectedScore: number;
  actualScore: number;
  scoreDifference: number;
  expectedStatus: "pass" | "fail";
  actualStatus: "pass" | "fail";
  statusMatch: boolean;
  expectedFeaturesCount: number;
  actualFeaturesImplemented: number;
  rejectedClaimsDetected: number;
  falsePositives: number;
  falseNegatives: number;
  truePositives: number;
  trueNegatives: number;
  tuningRecommendations: string[];
}

export interface ValidationSuiteReport {
  timestamp: string;
  totalBenchmarksTested: number;
  passedBenchmarkMatches: number;
  accuracyRatePercent: number;
  meanAbsoluteError: number;
  precisionPercent: number;
  recallPercent: number;
  f1ScorePercent: number;
  totalFalsePositives: number;
  totalFalseNegatives: number;
  benchmarkDetails: BenchmarkResultComparison[];
  systemTuningRecommendations: string[];
}

export class FAIEValidationSuite {
  private builder = new BenchmarkRepositoryBuilder();
  private orchestrator = new FAIEOrchestrator();

  public async runValidationSuite(): Promise<ValidationSuiteReport> {
    const benchmarks = this.builder.createBenchmarkSuite();
    const comparisons: BenchmarkResultComparison[] = [];

    const defaultBlueprint: KnowledgeBlueprint = {
      problemStatement: {
        title: "Benchmark Validation Problem Statement",
        description: "Verify authentication, responsive layouts, and database architecture.",
      },
      requiredFeatures: [
        {
          id: "auth",
          name: "Authentication",
          description: "Login/Signup page",
          mandatory: true,
          weight: 20,
          expectedRoutes: ["/auth", "/login"],
          expectedComponents: ["AuthPage", "Login"],
          expectedUIElements: ["Forms", "Buttons"],
          subFeatures: [
            { id: "login", name: "Login", weight: 10, expectedRoutes: ["/auth"] },
            { id: "signup", name: "Signup", weight: 10, expectedRoutes: ["/auth"] },
          ],
        },
        {
          id: "dash",
          name: "Responsive Dashboard",
          description: "Analytics layout",
          mandatory: true,
          weight: 20,
          expectedRoutes: ["/dashboard"],
          expectedComponents: ["Dashboard", "Navbar"],
          expectedUIElements: ["Navigation", "Cards"],
          subFeatures: [
            { id: "analytics", name: "Analytics", weight: 10, expectedRoutes: ["/dashboard"] },
            { id: "cards", name: "Cards", weight: 10, expectedRoutes: ["/dashboard"] },
          ],
        },
      ],
      techStackRules: {
        allowed: ["Next.js", "React", "TypeScript", "TailwindCSS"],
        required: ["Next.js", "React"],
        restricted: ["jQuery"],
      },
      confidenceThreshold: 75,
      scoringSystem: {
        categories: [
          { name: "Problem Alignment", weight: 20, maxMarks: 20, passingMarks: 12 },
          { name: "UI/UX & Features", weight: 30, maxMarks: 30, passingMarks: 18 },
          { name: "Performance & SEO", weight: 20, maxMarks: 20, passingMarks: 12 },
          { name: "Code Architecture", weight: 30, maxMarks: 30, passingMarks: 18 },
        ],
      },
      mandatoryRules: [],
      bonusRules: [],
    };

    let totalMAE = 0;
    let totalTP = 0;
    let totalFP = 0;
    let totalFN = 0;
    let totalTN = 0;
    let matchesCount = 0;

    for (const bm of benchmarks) {
      const workspacePath = this.builder.prepareBenchmarkWorkspace(bm);

      try {
        const report = await this.orchestrator.evaluate(workspacePath, `https://github.com/benchmark/${bm.id}`, defaultBlueprint);
        const actualScore = report.scoreSummary.finalScore;
        const actualStatus = report.status;
        const scoreDiff = Math.abs(actualScore - bm.expectedScore);
        totalMAE += scoreDiff;

        const statusMatch = actualStatus === bm.expectedStatus;
        if (statusMatch) matchesCount++;

        const actualImplementedCount = report.featureTreeEvaluations.filter((f) => f.status === "Implemented" || f.status === "Partially Implemented").length;
        const rejectedClaimsCount = report.rejectedClaims.length;

        let tp = 0;
        let fp = 0;
        let fn = 0;
        let tn = 0;

        if (actualStatus === "pass" && bm.expectedStatus === "pass") tp = 1;
        else if (actualStatus === "pass" && bm.expectedStatus === "fail") fp = 1;
        else if (actualStatus === "fail" && bm.expectedStatus === "pass") fn = 1;
        else tn = 1;

        totalTP += tp;
        totalFP += fp;
        totalFN += fn;
        totalTN += tn;

        const tuningRecommendations: string[] = [];
        if (scoreDiff > 10) {
          tuningRecommendations.push(`Score mismatch for '${bm.name}': Expected ${bm.expectedScore}, got ${actualScore}. Adjust feature weight bounds.`);
        }

        comparisons.push({
          benchmarkId: bm.id,
          benchmarkName: bm.name,
          expectedScore: bm.expectedScore,
          actualScore,
          scoreDifference: scoreDiff,
          expectedStatus: bm.expectedStatus,
          actualStatus,
          statusMatch,
          expectedFeaturesCount: bm.expectedFeatureCount,
          actualFeaturesImplemented: actualImplementedCount,
          rejectedClaimsDetected: rejectedClaimsCount,
          falsePositives: fp,
          falseNegatives: fn,
          truePositives: tp,
          trueNegatives: tn,
          tuningRecommendations,
        });
      } finally {
        this.builder.cleanupBenchmarkWorkspace(workspacePath);
      }
    }

    const accuracyRatePercent = Math.round((matchesCount / benchmarks.length) * 100);
    const meanAbsoluteError = Math.round((totalMAE / benchmarks.length) * 10) / 10;
    const precisionPercent = totalTP + totalFP > 0 ? Math.round((totalTP / (totalTP + totalFP)) * 100) : 100;
    const recallPercent = totalTP + totalFN > 0 ? Math.round((totalTP / (totalTP + totalFN)) * 100) : 100;
    const f1ScorePercent = precisionPercent + recallPercent > 0 ? Math.round((2 * precisionPercent * recallPercent) / (precisionPercent + recallPercent)) : 100;

    const systemTuningRecommendations: string[] = [];
    if (meanAbsoluteError > 5) {
      systemTuningRecommendations.push(`Mean Absolute Error (${meanAbsoluteError} pts) exceeds 5.0 target threshold. Fine-tune category mark allocations.`);
    }
    if (totalFP > 0) {
      systemTuningRecommendations.push(`Detected ${totalFP} false positive passes. Increase confidence threshold for mandatory features.`);
    }
    if (totalFN > 0) {
      systemTuningRecommendations.push(`Detected ${totalFN} false negative fails. Soften AST syntax requirements for partial implementations.`);
    }
    if (systemTuningRecommendations.length === 0) {
      systemTuningRecommendations.push("FAIE Engine accuracy is highly aligned with benchmark ground truths.");
    }

    return {
      timestamp: new Date().toISOString(),
      totalBenchmarksTested: benchmarks.length,
      passedBenchmarkMatches: matchesCount,
      accuracyRatePercent,
      meanAbsoluteError,
      precisionPercent,
      recallPercent,
      f1ScorePercent,
      totalFalsePositives: totalFP,
      totalFalseNegatives: totalFN,
      benchmarkDetails: comparisons,
      systemTuningRecommendations,
    };
  }
}
