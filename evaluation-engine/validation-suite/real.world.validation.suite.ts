import { GitHubRepositoryCollector, RealWorldRepositoryMeta } from "./github.repository.collector";
import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";

export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  marginOfError: number;
}

export interface RealWorldBenchmarkComparison {
  id: string;
  name: string;
  repoUrl: string;
  framework: string;
  category: string;
  humanScore: number;
  faieScore: number;
  scoreDifference: number;
  signedDifference: number;
  humanStatus: "pass" | "fail";
  faieStatus: "pass" | "fail";
  statusMatch: boolean;
  humanExpectedFeatures: string[];
  faieDetectedFeaturesCount: number;
  featureDetectionAccuracyPercent: number;
  tuningRecommendations: string[];
}

export interface RealWorldValidationReport {
  timestamp: string;
  totalRealWorldReposEvaluated: number;
  matchesCount: number;
  overallAccuracyRatePercent: number;
  averageDifference: number;
  meanAbsoluteError: number;
  medianError: number;
  stdDeviationError: number;
  confidenceInterval95: ConfidenceInterval;
  precisionPercent: number;
  recallPercent: number;
  f1ScorePercent: number;
  falsePositivesCount: number;
  falseNegativesCount: number;
  frameworkAccuracyBreakdown: { framework: string; total: number; matches: number; accuracyPercent: number; mae: number }[];
  categoryAccuracyBreakdown: { category: string; total: number; matches: number; accuracyPercent: number; mae: number }[];
  featureDetectionAccuracyPercent: number;
  benchmarkDetails: RealWorldBenchmarkComparison[];
  systemTuningRecommendations: string[];
}

export class RealWorldValidationSuite {
  private collector = new GitHubRepositoryCollector();
  private orchestrator = new FAIEOrchestrator();

  public async runRealWorldValidation(): Promise<RealWorldValidationReport> {
    const repos = this.collector.getRealWorldRepositories();
    const comparisons: RealWorldBenchmarkComparison[] = [];

    const defaultBlueprint: KnowledgeBlueprint = {
      problemStatement: {
        title: "Real World GitHub Validation Problem Statement",
        description: "Verify production code architectural features across open-source GitHub repositories.",
      },
      requiredFeatures: [
        {
          id: "auth",
          name: "Authentication",
          description: "Login/Signup auth page",
          mandatory: true,
          weight: 20,
          expectedRoutes: ["/auth", "/login", "/signin"],
          expectedComponents: ["AuthPage", "Login", "Auth"],
        },
        {
          id: "dash",
          name: "Responsive Dashboard",
          description: "Analytics navbar layout",
          mandatory: true,
          weight: 20,
          expectedRoutes: ["/dashboard", "/app"],
          expectedComponents: ["Dashboard", "Navbar", "App"],
        },
      ],
      techStackRules: {
        allowed: ["Next.js", "React", "Vue", "Angular", "TypeScript", "TailwindCSS"],
        required: ["React"],
        restricted: ["jQuery"],
      },
      confidenceThreshold: 65,
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

    let totalSignedDiff = 0;
    let totalAbsDiff = 0;
    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let matchesCount = 0;
    const absDiffs: number[] = [];

    for (const repoMeta of repos) {
      const repoDir = this.collector.cloneRepository(repoMeta.repoUrl);

      try {
        const report = await this.orchestrator.evaluate(repoDir, repoMeta.repoUrl, defaultBlueprint);
        const faieScore = report.scoreSummary.finalScore;
        const faieStatus = report.status;

        const signedDiff = faieScore - repoMeta.humanScore;
        const absDiff = Math.abs(signedDiff);
        totalSignedDiff += signedDiff;
        totalAbsDiff += absDiff;
        absDiffs.push(absDiff);

        const statusMatch = faieStatus === repoMeta.humanStatus;
        if (statusMatch) matchesCount++;

        if (faieStatus === "pass" && repoMeta.humanStatus === "pass") tp++;
        else if (faieStatus === "pass" && repoMeta.humanStatus === "fail") fp++;
        else if (faieStatus === "fail" && repoMeta.humanStatus === "pass") fn++;
        else tn++;

        const faieDetectedFeatures = report.featureTreeEvaluations.filter(
          (f) => f.status === "Implemented" || f.status === "Partially Implemented"
        ).length;

        const featureAcc =
          repoMeta.humanExpectedFeatures.length > 0
            ? Math.min(100, Math.round((faieDetectedFeatures / repoMeta.humanExpectedFeatures.length) * 100))
            : 100;

        const tuningRecommendations: string[] = [];
        if (absDiff > 10) {
          tuningRecommendations.push(
            `Human vs FAIE Score gap for '${repoMeta.name}': Human ${repoMeta.humanScore} pts vs FAIE ${faieScore} pts (Diff: ${absDiff} pts).`
          );
        }

        comparisons.push({
          id: repoMeta.id,
          name: repoMeta.name,
          repoUrl: repoMeta.repoUrl,
          framework: repoMeta.framework,
          category: repoMeta.category,
          humanScore: repoMeta.humanScore,
          faieScore,
          scoreDifference: absDiff,
          signedDifference: signedDiff,
          humanStatus: repoMeta.humanStatus,
          faieStatus,
          statusMatch,
          humanExpectedFeatures: repoMeta.humanExpectedFeatures,
          faieDetectedFeaturesCount: faieDetectedFeatures,
          featureDetectionAccuracyPercent: featureAcc,
          tuningRecommendations,
        });
      } finally {
        this.collector.cleanupRepository(repoDir);
      }
    }

    const totalCount = repos.length;
    const overallAccuracyRatePercent = Math.round((matchesCount / totalCount) * 100);
    const averageDifference = Math.round((totalSignedDiff / totalCount) * 10) / 10;
    const meanAbsoluteError = Math.round((totalAbsDiff / totalCount) * 10) / 10;

    // Median Error
    absDiffs.sort((a, b) => a - b);
    const mid = Math.floor(absDiffs.length / 2);
    const medianError =
      absDiffs.length % 2 !== 0 ? absDiffs[mid] : Math.round(((absDiffs[mid - 1] + absDiffs[mid]) / 2) * 10) / 10;

    // Standard Deviation of Absolute Errors
    const variance = absDiffs.reduce((sum, err) => sum + Math.pow(err - meanAbsoluteError, 2), 0) / totalCount;
    const stdDeviationError = Math.round(Math.sqrt(variance) * 10) / 10;

    // 95% Confidence Interval (Z = 1.96)
    const marginOfError = Math.round((1.96 * (stdDeviationError / Math.sqrt(totalCount))) * 10) / 10;
    const confidenceInterval95: ConfidenceInterval = {
      lowerBound: Math.max(0, Math.round((meanAbsoluteError - marginOfError) * 10) / 10),
      upperBound: Math.round((meanAbsoluteError + marginOfError) * 10) / 10,
      marginOfError,
    };

    const precisionPercent = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 100) : 100;
    const recallPercent = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 100) : 100;
    const f1ScorePercent =
      precisionPercent + recallPercent > 0
        ? Math.round((2 * precisionPercent * recallPercent) / (precisionPercent + recallPercent))
        : 100;

    // Framework accuracy breakdown
    const fwMap = new Map<string, RealWorldBenchmarkComparison[]>();
    comparisons.forEach((c) => {
      if (!fwMap.has(c.framework)) fwMap.set(c.framework, []);
      fwMap.get(c.framework)!.push(c);
    });

    const frameworkAccuracyBreakdown = Array.from(fwMap.entries()).map(([fw, items]) => {
      const matches = items.filter((i) => i.statusMatch).length;
      const mae = Math.round((items.reduce((sum, i) => sum + i.scoreDifference, 0) / items.length) * 10) / 10;
      return {
        framework: fw,
        total: items.length,
        matches,
        accuracyPercent: Math.round((matches / items.length) * 100),
        mae,
      };
    });

    // Category accuracy breakdown
    const catMap = new Map<string, RealWorldBenchmarkComparison[]>();
    comparisons.forEach((c) => {
      if (!catMap.has(c.category)) catMap.set(c.category, []);
      catMap.get(c.category)!.push(c);
    });

    const categoryAccuracyBreakdown = Array.from(catMap.entries()).map(([cat, items]) => {
      const matches = items.filter((i) => i.statusMatch).length;
      const mae = Math.round((items.reduce((sum, i) => sum + i.scoreDifference, 0) / items.length) * 10) / 10;
      return {
        category: cat,
        total: items.length,
        matches,
        accuracyPercent: Math.round((matches / items.length) * 100),
        mae,
      };
    });

    const featureDetectionAccuracyPercent = Math.round(
      comparisons.reduce((sum, c) => sum + c.featureDetectionAccuracyPercent, 0) / totalCount
    );

    const systemTuningRecommendations: string[] = [];
    if (meanAbsoluteError > 5) {
      systemTuningRecommendations.push(
        `Mean Absolute Error (${meanAbsoluteError} pts) vs Human Judges exceeds target 5.0 pts. Adjust AST & feature scoring bounds.`
      );
    }
    if (systemTuningRecommendations.length === 0) {
      systemTuningRecommendations.push("FAIE Engine predictions match real-world GitHub open-source human judge assessments.");
    }

    return {
      timestamp: new Date().toISOString(),
      totalRealWorldReposEvaluated: totalCount,
      matchesCount,
      overallAccuracyRatePercent,
      averageDifference,
      meanAbsoluteError,
      medianError,
      stdDeviationError,
      confidenceInterval95,
      precisionPercent,
      recallPercent,
      f1ScorePercent,
      falsePositivesCount: fp,
      falseNegativesCount: fn,
      frameworkAccuracyBreakdown,
      categoryAccuracyBreakdown,
      featureDetectionAccuracyPercent,
      benchmarkDetails: comparisons,
      systemTuningRecommendations,
    };
  }
}
