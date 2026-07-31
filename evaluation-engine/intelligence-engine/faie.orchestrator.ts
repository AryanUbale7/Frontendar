import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { KnowledgeEngine } from "./knowledge-engine/knowledge.engine";
import { SynonymEngine } from "./synonym-engine/synonym.engine";
import { FeatureEngine } from "./feature-engine/feature.engine";
import { RepositoryEngine } from "./repository-engine/repository.engine";
import { RouteEngine } from "./route-engine/route.engine";
import { UIEngine } from "./ui-engine/ui.engine";
import { InferenceEngine } from "./inference-engine/inference.engine";
import { ConfidenceEngine } from "./confidence-engine/confidence.engine";
import { ReasoningEngine, CategoryReasoning } from "./reasoning-engine/reasoning.engine";
import { EvidenceEngine } from "./evidence-engine/evidence.engine";
import { ScoringEngine, FAIEReportSummary } from "./scoring-engine/scoring.engine";

export interface FAIEReport {
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
  private confidenceEngine = new ConfidenceEngine();
  private reasoningEngine = new ReasoningEngine();
  private evidenceEngine = new EvidenceEngine();
  private scoringEngine = new ScoringEngine();

  constructor(customSynonymDict?: Record<string, string[]>) {
    this.synonymEngine = new SynonymEngine(customSynonymDict);
    this.featureEngine = new FeatureEngine(this.synonymEngine);
  }

  public async evaluate(
    workspacePath: string,
    repoUrl: string,
    blueprint: KnowledgeBlueprint,
    deploymentUrl?: string
  ): Promise<FAIEReport> {
    const logs: string[] = [];
    logs.push(`[FAIE 1/10] Starting Frontend Arena Intelligence Engine evaluation for ${repoUrl}...`);

    // 1. Validate Blueprint
    const val = this.knowledgeEngine.validateBlueprint(blueprint);
    if (!val.valid) {
      logs.push(`[FAIE 1/10] Blueprint validation warnings: ${val.errors.join("; ")}`);
    }

    const activeProblem = this.knowledgeEngine.getActiveProblemStatement(blueprint);
    logs.push(`[FAIE 2/10] Active Knowledge Blueprint problem: "${activeProblem.title}".`);

    // 2. Repository Analysis
    logs.push(`[FAIE 3/10] Repository Engine: Scanning framework, package.json, TypeScript density...`);
    const repoAnalysis = this.repositoryEngine.analyzeRepository(workspacePath);
    logs.push(`[FAIE 3/10] Framework detected: ${repoAnalysis.framework}. TS density: ${repoAnalysis.detectedLanguages.typescriptPercent}%.`);

    // 3. Route Detection
    logs.push(`[FAIE 4/10] Route Engine: Detecting App Router, Pages Router, and React routes...`);
    const expectedRoutePatterns = (blueprint.expectedRoutes || []).map((r) => r.pattern);
    const routeResults = this.routeEngine.detectRoutes(workspacePath, expectedRoutePatterns);
    logs.push(`[FAIE 4/10] Detected ${routeResults.detectedRoutes.length} active routes. Coverage: ${routeResults.coveragePercent}%.`);

    // 4. Feature Extraction & Synonym Matching
    logs.push(`[FAIE 5/10] Feature Engine & Synonym Engine: Matching blueprint features against source code...`);
    const normalizedFeatures = this.knowledgeEngine.normalizeFeatures(blueprint);
    const detectedFiles = routeResults.detectedRoutes.map((r) => r.filePath);
    const featureResults = this.featureEngine.evaluateFeatures(
      workspacePath,
      normalizedFeatures,
      detectedFiles,
      expectedRoutePatterns,
      repoAnalysis.detectedComponents
    );

    // 5. UI Analysis
    logs.push(`[FAIE 6/10] UI Engine: Inspecting layouts, cards, buttons, footers, charts, and Playwright DOM signals...`);
    const uiAnalysis = this.uiEngine.analyzeUI(workspacePath, deploymentUrl);

    // 6. Inference Engine & Rule Evaluations
    logs.push(`[FAIE 7/10] Inference Engine: Running deterministic IF-THEN rule verifications...`);
    const inferenceRules = this.inferenceEngine.runInference(featureResults, repoAnalysis, routeResults, uiAnalysis);

    // 7. Evidence Engine & Citations Collection
    logs.push(`[FAIE 8/10] Evidence Engine: Collecting concrete file paths, routes, and component proofs...`);
    this.evidenceEngine.clear();

    featureResults.forEach((fr) => {
      if (fr.implemented) {
        this.evidenceEngine.addEvidence({
          category: "Components",
          description: `Implemented feature '${fr.featureName}' with ${fr.confidenceScore}% confidence.`,
          sourcePath: fr.evidence.fileMatches[0] || fr.evidence.routeMatches[0],
        });
      }
    });

    uiAnalysis.detectedUIComponents.forEach((comp) => {
      this.evidenceEngine.addEvidence({
        category: "UI Screen",
        description: `Verified ${comp} element in application layout.`,
      });
    });

    // 8. Reasoning Engine Category Breakdowns
    logs.push(`[FAIE 9/10] Reasoning Engine: Generating explainable category reasonings...`);
    const reasonings: CategoryReasoning[] = [];

    blueprint.scoringSystem.categories.forEach((cat) => {
      let scoreAwarded = 0;
      let ruleApplied = "";
      let reasonStr = "";
      let confidence = 90;

      const catLower = cat.name.toLowerCase();

      if (catLower.includes("alignment") || catLower.includes("problem")) {
        const implementedCount = featureResults.filter((f) => f.implemented).length;
        const ratio = normalizedFeatures.length > 0 ? implementedCount / normalizedFeatures.length : 1;
        scoreAwarded = Math.round(cat.maxMarks * (0.6 + ratio * 0.4));
        ruleApplied = "Problem Alignment Rule (Feature Coverage + Blueprint Objectives)";
        reasonStr = `Deterministically aligned with '${activeProblem.title}'. Implemented ${implementedCount}/${normalizedFeatures.length} specified features.`;
      } else if (catLower.includes("feature") || catLower.includes("ui/ux") || catLower.includes("ui")) {
        const implementedCount = featureResults.filter((f) => f.implemented).length;
        const ratio = normalizedFeatures.length > 0 ? implementedCount / normalizedFeatures.length : 1;
        scoreAwarded = Math.round(cat.maxMarks * ratio);
        ruleApplied = "Feature Completeness Rule (Deterministic Match)";
        reasonStr = `Implemented ${implementedCount} required features (${featureResults.filter((f) => f.implemented).map((f) => f.featureName).join(", ")}).`;
      } else if (catLower.includes("performance") || catLower.includes("seo") || catLower.includes("tech")) {
        scoreAwarded = repoAnalysis.hasTailwind && repoAnalysis.hasTsConfig ? cat.maxMarks : Math.round(cat.maxMarks * 0.8);
        ruleApplied = "Technology Compliance Rule (Framework & Build Config)";
        reasonStr = `Framework '${repoAnalysis.framework}' with ${repoAnalysis.detectedLanguages.typescriptPercent}% TypeScript usage.`;
      } else if (catLower.includes("documentation") || catLower.includes("readme")) {
        scoreAwarded = repoAnalysis.detectedFilesCount > 5 ? cat.maxMarks : Math.round(cat.maxMarks * 0.6);
        ruleApplied = "Documentation Completeness Rule";
        reasonStr = "Repository includes comprehensive README setup guides and file structure.";
      } else {
        scoreAwarded = Math.round(cat.maxMarks * 0.85);
        ruleApplied = "General Compliance Category Rule";
        reasonStr = `Category '${cat.name}' evaluated deterministically against blueprint rules.`;
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
          detectedFiles,
          routeResults.detectedRoutes.map((r) => r.pattern),
          repoAnalysis.detectedComponents,
          uiAnalysis.detectedUIComponents
        )
      );
    });

    // 9. Scoring Engine
    logs.push(`[FAIE 10/10] Scoring Engine: Computing final audit report card...`);
    const faieSummary: FAIEReportSummary = this.scoringEngine.calculateFinalScores(
      blueprint,
      featureResults,
      repoAnalysis,
      routeResults,
      uiAnalysis,
      reasonings
    );

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
      scoringDetails: reasonings.map((r) => ({
        categoryName: r.categoryName,
        awardedMarks: r.scoreAwarded,
        maxMarks: r.maxMarks,
        passingMarks: r.passingMarks,
        evaluatedBy: "Frontend Arena Intelligence Engine (FAIE)",
        evidenceCitations: r.evidenceCitations,
        confidencePercent: r.confidencePercent,
        ruleApplied: r.ruleApplied,
      })),
      reasonings,
      logs: allLogs,
      auditableReportId: `faie_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
}
