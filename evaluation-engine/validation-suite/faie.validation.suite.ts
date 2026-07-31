import { BenchmarkRepositoryBuilder, BenchmarkDefinition } from "./benchmark.repository.builder";
import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";

export interface ConfusionMatrix {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface CategoryAccuracy {
  category: string;
  totalBenchmarks: number;
  matchesCount: number;
  accuracyPercent: number;
  mae: number;
}

export interface FrameworkAccuracy {
  framework: string;
  totalBenchmarks: number;
  matchesCount: number;
  accuracyPercent: number;
  mae: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface BenchmarkResultComparison {
  benchmarkId: string;
  benchmarkName: string;
  category: string;
  framework: string;
  expectedScore: number;
  actualScore: number;
  scoreDifference: number;
  expectedGrade: string;
  actualGrade: string;
  expectedStatus: "pass" | "fail";
  actualStatus: "pass" | "fail";
  statusMatch: boolean;
  expectedFeatureCoverage: number;
  actualFeatureCoverage: number;
  rejectedClaimsDetected: number;
  tuningRecommendations: string[];
}

export interface ComprehensiveValidationReport {
  timestamp: string;
  totalBenchmarksTested: number;
  passedBenchmarkMatches: number;
  overallAccuracyRatePercent: number;
  meanAbsoluteError: number;
  confusionMatrix: ConfusionMatrix;
  precisionPercent: number;
  recallPercent: number;
  f1ScorePercent: number;
  scoreDistribution: ScoreDistribution[];
  categoryAccuracyBreakdown: CategoryAccuracy[];
  frameworkAccuracyBreakdown: FrameworkAccuracy[];
  top20LargestDifferences: BenchmarkResultComparison[];
  benchmarkDetails: BenchmarkResultComparison[];
  systemTuningRecommendations: string[];
}

export class FAIEValidationSuite {
  private builder = new BenchmarkRepositoryBuilder();
  private orchestrator = new FAIEOrchestrator();

  public async runValidationSuite(): Promise<ComprehensiveValidationReport> {
    const benchmarks = this.builder.createBenchmarkSuite();
    const comparisons: BenchmarkResultComparison[] = [];

    const defaultBlueprint: KnowledgeBlueprint = {
      problemStatement: {
        title: "50-Benchmark Validation Suite Problem Statement",
        description: "Verify authentication, responsive layouts, and database architecture across frameworks.",
      },
      requiredFeatures: [
        {
          id: "auth",
          name: "Authentication",
          description: "Login/Signup page",
          mandatory: true,
          weight: 20,
          expectedRoutes: ["/auth", "/login"],
          expectedComponents: ["AuthPage", "Login", "Auth"],
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
        allowed: ["Next.js", "React", "Vue", "Angular", "TypeScript", "TailwindCSS"],
        required: ["React"],
        restricted: ["jQuery"],
      },
      confidenceThreshold: 70,
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
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let matchesCount = 0;

    for (const bm of benchmarks) {
      const workspacePath = this.builder.prepareBenchmarkWorkspace(bm);

      try {
        const report = await this.orchestrator.evaluate(
          workspacePath,
          `https://github.com/benchmark/${bm.id}`,
          defaultBlueprint
        );

        const actualScore = report.scoreSummary.finalScore;
        const actualStatus = report.status;
        const actualGrade = actualScore >= 90 ? "EXCELLENT" : actualScore >= 60 ? "PASSED" : "FAILED";
        const scoreDiff = Math.abs(actualScore - bm.expectedScore);
        totalMAE += scoreDiff;

        const statusMatch = actualStatus === bm.expectedStatus;
        if (statusMatch) matchesCount++;

        const actualFeatureCoverage = report.scoreSummary.featureCoveragePercent;
        const rejectedClaimsCount = report.rejectedClaims.length;

        if (actualStatus === "pass" && bm.expectedStatus === "pass") tp++;
        else if (actualStatus === "pass" && bm.expectedStatus === "fail") fp++;
        else if (actualStatus === "fail" && bm.expectedStatus === "pass") fn++;
        else tn++;

        const tuningRecommendations: string[] = [];
        if (scoreDiff > 10) {
          tuningRecommendations.push(
            `Score mismatch for '${bm.name}': Expected ${bm.expectedScore}, got ${actualScore} (Diff: ${scoreDiff} pts).`
          );
        }

        comparisons.push({
          benchmarkId: bm.id,
          benchmarkName: bm.name,
          category: bm.category,
          framework: bm.framework,
          expectedScore: bm.expectedScore,
          actualScore,
          scoreDifference: scoreDiff,
          expectedGrade: bm.expectedGrade,
          actualGrade,
          expectedStatus: bm.expectedStatus,
          actualStatus,
          statusMatch,
          expectedFeatureCoverage: bm.expectedFeatureCoverage,
          actualFeatureCoverage,
          rejectedClaimsDetected: rejectedClaimsCount,
          tuningRecommendations,
        });
      } finally {
        this.builder.cleanupBenchmarkWorkspace(workspacePath);
      }
    }

    const overallAccuracyRatePercent = Math.round((matchesCount / benchmarks.length) * 100);
    const meanAbsoluteError = Math.round((totalMAE / benchmarks.length) * 10) / 10;

    const precisionPercent = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 100) : 100;
    const recallPercent = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 100) : 100;
    const f1ScorePercent =
      precisionPercent + recallPercent > 0
        ? Math.round((2 * precisionPercent * recallPercent) / (precisionPercent + recallPercent))
        : 100;

    // Score distribution calculation
    const ranges = [
      { label: "90 - 100 (Excellent)", min: 90, max: 100 },
      { label: "75 - 89 (Passed)", min: 75, max: 89 },
      { label: "50 - 74 (Needs Work)", min: 50, max: 74 },
      { label: "25 - 49 (Poor)", min: 25, max: 49 },
      { label: "0 - 24 (Failed)", min: 0, max: 24 },
    ];

    const scoreDistribution: ScoreDistribution[] = ranges.map((r) => {
      const count = comparisons.filter((c) => c.actualScore >= r.min && c.actualScore <= r.max).length;
      return {
        range: r.label,
        count,
        percentage: Math.round((count / benchmarks.length) * 100),
      };
    });

    // Category accuracy breakdown
    const categoryMap = new Map<string, BenchmarkResultComparison[]>();
    comparisons.forEach((c) => {
      if (!categoryMap.has(c.category)) categoryMap.set(c.category, []);
      categoryMap.get(c.category)!.push(c);
    });

    const categoryAccuracyBreakdown: CategoryAccuracy[] = Array.from(categoryMap.entries()).map(
      ([cat, items]) => {
        const matches = items.filter((i) => i.statusMatch).length;
        const catMAE = Math.round((items.reduce((sum, i) => sum + i.scoreDifference, 0) / items.length) * 10) / 10;
        return {
          category: cat,
          totalBenchmarks: items.length,
          matchesCount: matches,
          accuracyPercent: Math.round((matches / items.length) * 100),
          mae: catMAE,
        };
      }
    );

    // Framework accuracy breakdown
    const frameworkMap = new Map<string, BenchmarkResultComparison[]>();
    comparisons.forEach((c) => {
      if (!frameworkMap.has(c.framework)) frameworkMap.set(c.framework, []);
      frameworkMap.get(c.framework)!.push(c);
    });

    const frameworkAccuracyBreakdown: FrameworkAccuracy[] = Array.from(frameworkMap.entries()).map(
      ([fw, items]) => {
        const matches = items.filter((i) => i.statusMatch).length;
        const fwMAE = Math.round((items.reduce((sum, i) => sum + i.scoreDifference, 0) / items.length) * 10) / 10;
        return {
          framework: fw,
          totalBenchmarks: items.length,
          matchesCount: matches,
          accuracyPercent: Math.round((matches / items.length) * 100),
          mae: fwMAE,
        };
      }
    );

    // Top 20 largest differences
    const top20LargestDifferences = [...comparisons]
      .sort((a, b) => b.scoreDifference - a.scoreDifference)
      .slice(0, 20);

    const systemTuningRecommendations: string[] = [];
    if (meanAbsoluteError > 5) {
      systemTuningRecommendations.push(
        `Mean Absolute Error (${meanAbsoluteError} pts) exceeds 5.0 target threshold across 50 benchmarks. Adjust category weight allocations.`
      );
    }
    if (fp > 0) {
      systemTuningRecommendations.push(
        `Detected ${fp} false positive passes. Increase confidence threshold for mandatory features.`
      );
    }
    if (fn > 0) {
      systemTuningRecommendations.push(
        `Detected ${fn} false negative fails. Soften AST syntax requirements for partial implementations.`
      );
    }
    if (systemTuningRecommendations.length === 0) {
      systemTuningRecommendations.push("FAIE Engine accuracy is highly aligned across all 50 benchmark ground truths.");
    }

    return {
      timestamp: new Date().toISOString(),
      totalBenchmarksTested: benchmarks.length,
      passedBenchmarkMatches: matchesCount,
      overallAccuracyRatePercent,
      meanAbsoluteError,
      confusionMatrix: {
        truePositives: tp,
        trueNegatives: tn,
        falsePositives: fp,
        falseNegatives: fn,
      },
      precisionPercent,
      recallPercent,
      f1ScorePercent,
      scoreDistribution,
      categoryAccuracyBreakdown,
      frameworkAccuracyBreakdown,
      top20LargestDifferences,
      benchmarkDetails: comparisons,
      systemTuningRecommendations,
    };
  }
}
