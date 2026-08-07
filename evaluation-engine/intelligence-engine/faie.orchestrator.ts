import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { GitHubRepoEngine, VirtualRepository } from "./repository-engine/github-repo.engine";
import { ASTAnalysisEngine, ASTRepositoryAnalysis } from "./ast-engine/ast-analysis.engine";
import { TechnologyEngine } from "./technology-engine/technology.engine";
import { FeatureEngine } from "./feature-engine/feature.engine";
import { FAIEQualityEngine } from "./quality-engine/quality.engine";
import { FQEReport } from "./quality-engine/quality.interface";

export interface FAIEReportV3 {
  hackathonTitle: string;
  repoUrl: string;
  deploymentUrl?: string;
  status: "pass" | "fail";
  engineVersion: "FAIE-v3-AST-Static";
  scoreSummary: {
    finalScore: number;
    featureCoveragePercent: number;
    technologyCompliancePercent: number;
    uiCompliancePercent: number;
    moduleCoveragePercent: number;
    overallAlignmentPercent: number;
    qualityEngineScore: number;
    bonusPointsTotal: number;
    deductionsTotal: number;
  };
  detectedTechnologies: Array<{
    technology: string;
    category: string;
    confidencePercent: number;
    evidenceCitations: string[];
  }>;
  featureTreeEvaluations: Array<{
    featureName: string;
    mandatory: boolean;
    maxWeight: number;
    awardedScore: number;
    status: string;
    implementationDepth: string;
    confidenceScore: number;
    matchedFiles: string[];
    evidenceCitations: string[];
  }>;
  qualityEngineReport?: FQEReport;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: string;
    evidenceCitations: string[];
  }>;
  logs: string[];
  auditableReportId: string;
  timestamp: string;
  rejectedClaims: string[];
  capabilityVerifications?: any[];
}

export class FAIEOrchestrator {
  private repoEngine = new GitHubRepoEngine();
  private astEngine = new ASTAnalysisEngine();
  private techEngine = new TechnologyEngine();
  private featureEngine = new FeatureEngine();
  private qualityEngine = new FAIEQualityEngine();

  public async evaluate(
    workspacePathOrUrl: string,
    repoUrl: string,
    passedBlueprint: KnowledgeBlueprint,
    deploymentUrl?: string
  ): Promise<FAIEReportV3> {
    const logs: string[] = [];
    const startTime = Date.now();
    logs.push(`[FAIE v3] Initializing AST Static Intelligence evaluation pipeline for ${repoUrl}...`);

    // 1. Fetch Repository Metadata & Files via GitHub API (or local disk fallback)
    const targetSource = repoUrl || workspacePathOrUrl;
    let repoData: VirtualRepository;

    try {
      logs.push(`[FAIE v3] Fetching repository tree and source files from GitHub REST API...`);
      repoData = await this.repoEngine.loadRepository(targetSource);
      logs.push(`[FAIE v3] Loaded ${repoData.downloadedFilesCount} source files into RAM memory buffers.`);
    } catch (err: any) {
      logs.push(`[FAIE v3] GitHub REST API fetch error: ${err.message}. Falling back to local workspace files...`);
      repoData = await this.repoEngine.loadRepository(workspacePathOrUrl);
    }

    // 2. Perform WebAssembly / TypeScript AST Analysis
    logs.push(`[FAIE v3] Generating AST trees across ${repoData.downloadedFilesCount} JS/TS files...`);
    const astData: ASTRepositoryAnalysis = this.astEngine.analyzeRepository(repoData);
    logs.push(
      `[FAIE v3] AST Parse Complete: ${astData.totalJsxElements} JSX elements, ${astData.totalFunctions} functions, ${astData.allImports.size} unique imports detected.`
    );

    // 3. Deterministic Technology Stack Detection
    logs.push(`[FAIE v3] Executing Technology Stack Detection Engine...`);
    const techReport = this.techEngine.evaluateTechnologies(
      repoData,
      astData,
      passedBlueprint.techStackRules
    );
    logs.push(
      `[FAIE v3] Primary Framework: ${techReport.primaryFramework}. Tech Compliance: ${techReport.technologyScore}/100.`
    );

    // 4. Structural Feature Detection Engine
    logs.push(`[FAIE v3] Executing Feature Detection Engine...`);
    const featureReport = this.featureEngine.evaluateFeatures(
      repoData,
      astData,
      passedBlueprint.requiredFeatures as any
    );
    logs.push(
      `[FAIE v3] Feature Coverage: ${featureReport.totalFeatureCoveragePercent}%. Mandatory features passed: ${featureReport.mandatoryFeaturesPassed}.`
    );

    // 5. FAIE Quality Engine (FQE - 6 Static Quality Modules, Max 40 Marks)
    logs.push(`[FAIE v3] Executing FAIE Quality Engine (FQE 6 Modules)...`);
    const fqeReport: FQEReport = this.qualityEngine.evaluateQuality(repoData, astData);
    logs.push(
      `[FAIE v3] FQE Quality Score: ${fqeReport.totalScore}/40 (Perf: ${fqeReport.performanceScore}/7, Access: ${fqeReport.accessibilityScore}/7, Resp: ${fqeReport.responsiveScore}/7, Code: ${fqeReport.codeQualityScore}/7, Arch: ${fqeReport.architectureScore}/6, Doc: ${fqeReport.documentationScore}/6).`
    );

    // 6. Calculate Final Score & Category Details
    const featureScore = Math.round((featureReport.totalFeatureCoveragePercent / 100) * 40);
    const techScore = Math.round((techReport.technologyScore / 100) * 20);
    const qualityScore = Math.round(fqeReport.totalScore); // Max 40

    const bonusPoints = featureReport.totalFeatureCoveragePercent > 90 ? 5 : 0;
    const deductions = techReport.restrictedTechViolations.length * 20;

    const rawScore = featureScore + techScore + qualityScore + bonusPoints - deductions;
    const finalScore = Math.max(0, Math.min(100, rawScore));
    const status = finalScore >= 75 && featureReport.mandatoryFeaturesPassed ? "pass" : "fail";

    const elapsedMs = Date.now() - startTime;
    logs.push(`[FAIE v3] Evaluation Completed cleanly in ${elapsedMs}ms. Final Score: ${finalScore}/100 [${status.toUpperCase()}].`);

    const featureTreeEvaluations = featureReport.features.map((f) => ({
      featureName: f.featureName,
      mandatory: f.mandatory,
      maxWeight: f.maxWeight,
      awardedScore: f.awardedScore,
      status: f.awardedScore > 0 ? "PASSED" : "FAILED",
      implementationDepth: f.implementationDepth,
      confidenceScore: f.confidencePercent,
      matchedFiles: f.matchedFiles,
      evidenceCitations: f.evidenceCitations
    }));

    const scoringDetails = [
      {
        categoryName: "Problem Alignment & Required Features",
        awardedMarks: featureScore,
        maxMarks: 40,
        passingMarks: 24,
        evaluatedBy: "FAIE v3 AST Feature Engine",
        evidenceCitations: featureReport.features.flatMap((f) => f.evidenceCitations)
      },
      {
        categoryName: "Technology Stack Compliance",
        awardedMarks: techScore,
        maxMarks: 20,
        passingMarks: 12,
        evaluatedBy: "FAIE v3 Technology Engine",
        evidenceCitations: techReport.detectedTechnologies.flatMap((t) => t.evidenceCitations)
      },
      {
        categoryName: "FAIE Quality Engine (FQE Static Audit)",
        awardedMarks: qualityScore,
        maxMarks: 40,
        passingMarks: 24,
        evaluatedBy: "FAIE Quality Engine (6 Deterministic Modules)",
        evidenceCitations: fqeReport.evidenceCitations
      }
    ];

    return {
      hackathonTitle: passedBlueprint.problemStatement?.title || "Hackathon Challenge",
      repoUrl,
      deploymentUrl,
      status,
      engineVersion: "FAIE-v3-AST-Static",
      scoreSummary: {
        finalScore,
        featureCoveragePercent: featureReport.totalFeatureCoveragePercent,
        technologyCompliancePercent: techReport.technologyScore,
        uiCompliancePercent: Math.min(100, astData.totalJsxElements * 4),
        moduleCoveragePercent: Math.min(100, astData.totalFunctions * 5),
        overallAlignmentPercent: finalScore,
        qualityEngineScore: fqeReport.totalScore,
        bonusPointsTotal: bonusPoints,
        deductionsTotal: deductions
      },
      detectedTechnologies: techReport.detectedTechnologies,
      featureTreeEvaluations,
      qualityEngineReport: fqeReport,
      scoringDetails,
      logs,
      auditableReportId: `rep_v3_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      rejectedClaims: [],
      capabilityVerifications: []
    };
  }
}
