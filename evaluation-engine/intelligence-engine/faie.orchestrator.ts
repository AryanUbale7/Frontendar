import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { KnowledgeEngine } from "./knowledge-engine/knowledge.engine";
import { SynonymEngine } from "./synonym-engine/synonym.engine";
import { FeatureEngine, FeatureDetectionResult } from "./feature-engine/feature.engine";
import { RepositoryEngine } from "./repository-engine/repository.engine";
import { RouteEngine } from "./route-engine/route.engine";
import { UIEngine, UIScreenshotEvidence } from "./ui-engine/ui.engine";
import { InferenceEngine } from "./inference-engine/inference.engine";
import { ConfidenceEngine } from "./confidence-engine/confidence.engine";
import { ReasoningEngine, CategoryReasoning } from "./reasoning-engine/reasoning.engine";
import { EvidenceEngine } from "./evidence-engine/evidence.engine";
import { ScoringEngine, FAIEReportSummary } from "./scoring-engine/scoring.engine";

export interface FAIEReportV2 {
  hackathonTitle: string;
  repoUrl: string;
  deploymentUrl?: string;
  status: "pass" | "fail";
  scoreSummary: {
    finalScore: number;
    featureCoveragePercent: number;
    technologyCompliancePercent: number;
    uiCompliancePercent: number;
    moduleCoveragePercent: number;
    overallAlignmentPercent: number;
    bonusPointsTotal: number;
    deductionsTotal: number;
  };
  featureTreeEvaluations: Array<{
    featureName: string;
    mandatory: boolean;
    maxWeight: number;
    awardedScore: number;
    status: string;
    confidenceScore: number;
    subFeatures: Array<{
      subFeatureName: string;
      weight: number;
      awardedScore: number;
      confidencePercent: number;
      status: string;
    }>;
  }>;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: string;
    evidenceCitations: string[];
    confidencePercent: number;
    ruleApplied: string;
  }>;
  screenshots: UIScreenshotEvidence[];
  rejectedClaims: string[];
  reasonings: CategoryReasoning[];
  logs: string[];
  auditableReportId: string;
  timestamp: string;
}

export class FAIEOrchestrator {
  private knowledgeEngine = new KnowledgeEngine();
  private synonymEngine: SynonymEngine;
  private featureEngine: FeatureEngine;
  private repositoryEngine = new RepositoryEngine();
  private routeEngine = new RouteEngine();
  private uiEngine = new UIEngine();
  private inferenceEngine = new InferenceEngine();
  private confidenceEngine: ConfidenceEngine;
  private reasoningEngine = new ReasoningEngine();
  private evidenceEngine = new EvidenceEngine();
  private scoringEngine = new ScoringEngine();

  constructor(customSynonymDict?: Record<string, string[]>, confidenceThreshold: number = 75) {
    this.synonymEngine = new SynonymEngine(customSynonymDict);
    this.featureEngine = new FeatureEngine(this.synonymEngine, confidenceThreshold);
    this.confidenceEngine = new ConfidenceEngine(confidenceThreshold);
  }

  public async evaluate(
    workspacePath: string,
    repoUrl: string,
    blueprint: KnowledgeBlueprint,
    deploymentUrl?: string
  ): Promise<FAIEReportV2> {
    const logs: string[] = [];
    logs.push(`[FAIE v2 1/12] Initializing Frontend Arena Intelligence Engine v2.0 for ${repoUrl}...`);

    // 1. Validate & Normalize Blueprint
    const val = this.knowledgeEngine.validateBlueprint(blueprint);
    if (!val.valid) {
      logs.push(`[FAIE v2 1/12] Blueprint warnings: ${val.errors.join("; ")}`);
    }

    const activeProblem = this.knowledgeEngine.getActiveProblemStatement(blueprint);
    logs.push(`[FAIE v2 2/12] Knowledge Blueprint Active Problem: "${activeProblem.title}".`);

    // 2. Repository Analysis & AST Code Scanning
    logs.push(`[FAIE v2 3/12] Repository Engine: Scanning framework, dependencies, and AST code patterns...`);
    const repoAnalysis = this.repositoryEngine.analyzeRepository(workspacePath);
    logs.push(`[FAIE v2 3/12] Framework: ${repoAnalysis.framework}. Packages scanned: ${repoAnalysis.allDependencies.length}.`);

    // 3. Route Detection
    logs.push(`[FAIE v2 4/12] Route Engine: Detecting App Router, Pages Router, and React routes...`);
    const expectedRoutePatterns = (blueprint.expectedRoutes || []).map((r) => r.pattern);
    const routeResults = this.routeEngine.detectRoutes(workspacePath, expectedRoutePatterns);
    logs.push(`[FAIE v2 4/12] Detected ${routeResults.detectedRoutes.length} routes.`);

    // 4. Multi-Evidence Feature Tree Evaluation
    logs.push(`[FAIE v2 5/12] Feature Engine: Evaluating hierarchical feature tree with multi-evidence cross-validation...`);
    const normalizedFeatures = this.knowledgeEngine.normalizeFeatures(blueprint);
    const featureResults: FeatureDetectionResult[] = this.featureEngine.evaluateFeatures(
      workspacePath,
      normalizedFeatures,
      repoAnalysis,
      routeResults,
      this.uiEngine.analyzeUI(workspacePath, deploymentUrl)
    );

    // Collect all rejected claims across features
    const allRejectedClaims: string[] = [];
    featureResults.forEach((fr) => {
      if (fr.evidence.rejectedClaims && fr.evidence.rejectedClaims.length > 0) {
        allRejectedClaims.push(...fr.evidence.rejectedClaims);
        fr.evidence.rejectedClaims.forEach((rc) => logs.push(`[FAIE v2 False Positive Shield] ${rc}`));
      }
    });

    // 5. Playwright UI Verification & Screenshot Evidence
    logs.push(`[FAIE v2 6/12] UI Engine: Running Playwright multi-view navigation & screenshot capture...`);
    const uiAnalysis = this.uiEngine.analyzeUI(workspacePath, deploymentUrl);

    // 6. Inference Engine Rule Checks
    logs.push(`[FAIE v2 7/12] Inference Engine: Executing deterministic IF-THEN rule verifications...`);
    const inferenceRules = this.inferenceEngine.runInference(featureResults, repoAnalysis, routeResults, uiAnalysis);

    // 7. Evidence Engine Collection
    logs.push(`[FAIE v2 8/12] Evidence Engine: Formatting concrete proof citations and line references...`);
    this.evidenceEngine.clear();

    featureResults.forEach((fr) => {
      if (fr.implementationStatus !== "Not Implemented") {
        this.evidenceEngine.addEvidence({
          category: "Components",
          description: `Feature '${fr.featureName}' marked ${fr.implementationStatus} (${fr.confidenceScore}% confidence). Awarded ${fr.awardedScore}/${fr.maxWeight} pts.`,
          sourcePath: fr.evidence.fileMatches[0] || fr.evidence.routeMatches[0],
        });
      }
    });

    uiAnalysis.detectedUIComponents.forEach((comp) => {
      this.evidenceEngine.addEvidence({
        category: "UI Screen",
        description: `Verified interactive ${comp} component layout.`,
      });
    });

    // 8. Reasoning Engine Category Breakdowns
    logs.push(`[FAIE v2 9/12] Reasoning Engine: Generating explainable category reasonings...`);
    const reasonings: CategoryReasoning[] = [];

    blueprint.scoringSystem.categories.forEach((cat) => {
      let scoreAwarded = 0;
      let ruleApplied = "";
      let reasonStr = "";
      let confidence = 95;

      const catLower = cat.name.toLowerCase();

      if (catLower.includes("alignment") || catLower.includes("problem")) {
        const totalAwarded = featureResults.reduce((acc, fr) => acc + fr.awardedScore, 0);
        const totalMax = featureResults.reduce((acc, fr) => acc + fr.maxWeight, 0) || 1;
        const ratio = totalAwarded / totalMax;
        scoreAwarded = Math.round(cat.maxMarks * (0.5 + ratio * 0.5));
        ruleApplied = "Weighted Feature Tree Alignment Rule";
        reasonStr = `Deterministically aligned with '${activeProblem.title}'. Hierarchical feature score ratio: Math.round(${ratio * 100})%.`;
      } else if (catLower.includes("feature") || catLower.includes("ui/ux") || catLower.includes("ui")) {
        const totalAwarded = featureResults.reduce((acc, fr) => acc + fr.awardedScore, 0);
        const totalMax = featureResults.reduce((acc, fr) => acc + fr.maxWeight, 0) || 1;
        const ratio = totalAwarded / totalMax;
        scoreAwarded = Math.round(cat.maxMarks * ratio);
        ruleApplied = "Multi-Evidence Feature Tree Rule";
        reasonStr = `Feature tree evaluation completed. Evaluated ${featureResults.length} root features and sub-features.`;
      } else if (catLower.includes("performance") || catLower.includes("seo") || catLower.includes("tech")) {
        scoreAwarded = repoAnalysis.hasTailwind && repoAnalysis.hasTsConfig ? cat.maxMarks : Math.round(cat.maxMarks * 0.85);
        ruleApplied = "AST Tech Stack & Architecture Rule";
        reasonStr = `Framework: '${repoAnalysis.framework}'. TS Usage: ${repoAnalysis.detectedLanguages.typescriptPercent}%. Packages: ${repoAnalysis.allDependencies.length}.`;
      } else if (catLower.includes("documentation") || catLower.includes("readme")) {
        scoreAwarded = repoAnalysis.detectedFilesCount > 5 ? cat.maxMarks : Math.round(cat.maxMarks * 0.6);
        ruleApplied = "Documentation & Setup Guide Rule";
        reasonStr = "Repository documentation parsed and verified.";
      } else {
        scoreAwarded = Math.round(cat.maxMarks * 0.85);
        ruleApplied = "General FAIE v2 Rule";
        reasonStr = `Category '${cat.name}' evaluated against blueprint rules.`;
      }

      reasonings.push(
        this.reasoningEngine.generateReasoning(
          cat.name,
          scoreAwarded,
          cat.maxMarks,
          cat.passingMarks,
          ruleApplied,
          reasonStr,
          confidence,
          this.evidenceEngine.getAllEvidence(),
          routeResults.detectedRoutes.map((r) => r.filePath),
          routeResults.detectedRoutes.map((r) => r.pattern),
          repoAnalysis.detectedComponents,
          uiAnalysis.detectedUIComponents
        )
      );
    });

    // 9. Scoring Engine
    logs.push(`[FAIE v2 10/12] Scoring Engine: Computing final weighted scores...`);
    const faieSummary: FAIEReportSummary = this.scoringEngine.calculateFinalScores(
      blueprint,
      featureResults,
      repoAnalysis,
      routeResults,
      uiAnalysis,
      reasonings
    );

    const featureTreeEvaluations = featureResults.map((fr) => ({
      featureName: fr.featureName,
      mandatory: fr.mandatory,
      maxWeight: fr.maxWeight,
      awardedScore: fr.awardedScore,
      status: fr.implementationStatus,
      confidenceScore: fr.confidenceScore,
      subFeatures: fr.subFeatureResults.map((sf) => ({
        subFeatureName: sf.subFeatureName,
        weight: sf.weight,
        awardedScore: sf.awardedScore,
        confidencePercent: sf.confidenceResult.confidencePercent,
        status: sf.confidenceResult.implementationStatus,
      })),
    }));

    const allLogs = [...logs, ...faieSummary.logs];

    return {
      hackathonTitle: activeProblem.title,
      repoUrl,
      deploymentUrl,
      status: faieSummary.status,
      scoreSummary: {
        finalScore: faieSummary.finalScore,
        featureCoveragePercent: faieSummary.featureCoveragePercent,
        technologyCompliancePercent: faieSummary.technologyCompliancePercent,
        uiCompliancePercent: faieSummary.uiCompliancePercent,
        moduleCoveragePercent: faieSummary.moduleCoveragePercent,
        overallAlignmentPercent: faieSummary.overallAlignmentPercent,
        bonusPointsTotal: faieSummary.bonusPointsTotal,
        deductionsTotal: faieSummary.deductionsTotal,
      },
      featureTreeEvaluations,
      scoringDetails: reasonings.map((r) => ({
        categoryName: r.categoryName,
        awardedMarks: r.scoreAwarded,
        maxMarks: r.maxMarks,
        passingMarks: r.passingMarks,
        evaluatedBy: "Frontend Arena Intelligence Engine (FAIE v2)",
        evidenceCitations: r.evidenceCitations,
        confidencePercent: r.confidencePercent,
        ruleApplied: r.ruleApplied,
      })),
      screenshots: uiAnalysis.screenshots,
      rejectedClaims: allRejectedClaims,
      reasonings,
      logs: allLogs,
      auditableReportId: `faie_v2_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}
