import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { GitHubRepoEngine, VirtualRepository } from "./repository-engine/github-repo.engine";
import { ASTAnalysisEngine, ASTRepositoryAnalysis } from "./ast-engine/ast-analysis.engine";
import { TechnologyEngine } from "./technology-engine/technology.engine";
import { FeatureEngine } from "./feature-engine/feature.engine";
import { FAIEQualityEngine } from "./quality-engine/quality.engine";
import { FQEReport } from "./quality-engine/quality.interface";
import { SubmissionRequirementsValidator, SubmissionRequirementsReport } from "./submission-engine/submission-requirements.validator";
import { ScoringEngine, DynamicScoringReport } from "./scoring-engine/scoring.engine";
import { SynonymEngine } from "./synonym-engine/synonym.engine";

export interface FAIEReportV3 {
  hackathonTitle: string;
  repoUrl: string;
  deploymentUrl?: string;
  status: "pass" | "fail";
  engineVersion: "FAIE-v3-AST-Static";
  blueprintVersion?: number | string;
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
  submissionRequirementsReport?: SubmissionRequirementsReport;
  qualityEngineReport?: FQEReport;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: string;
    evidenceCitations: string[];
  }>;
  ruleResults?: Array<{
    ruleName: string;
    triggered: boolean;
    action: string;
    pointsDeducted: number;
    detail: string;
  }>;
  bonusResults?: Array<{
    bonusName: string;
    awarded: boolean;
    pointsAwarded: number;
    detail: string;
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
  private submissionValidator = new SubmissionRequirementsValidator();
  private scoringEngine = new ScoringEngine();
  private synonymEngine = new SynonymEngine();

  public async evaluate(
    workspacePathOrUrl: string,
    repoUrl: string,
    passedBlueprint: KnowledgeBlueprint,
    deploymentUrl?: string,
    submissionMetadata?: {
      videoUrl?: string;
      presentationPdf?: string;
      architectureDiagram?: string;
      apiDocsUrl?: string;
    }
  ): Promise<FAIEReportV3> {
    const logs: string[] = [];
    const startTime = Date.now();
    logs.push(`[FAIE v3] Initializing Dynamic AST Evaluation Pipeline for ${repoUrl}...`);

    // Initialize SynonymEngine with Blueprint synonym dictionary
    if (passedBlueprint.synonymDictionary) {
      this.synonymEngine.updateDictionary(passedBlueprint.synonymDictionary);
      logs.push(`[FAIE v3] Loaded Blueprint Synonym Dictionary with ${Object.keys(passedBlueprint.synonymDictionary).length} custom mappings.`);
    }

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

    // 3. Deterministic Technology Stack Detection against Blueprint Tech Rules
    logs.push(`[FAIE v3] Executing Dynamic Technology Stack Engine...`);
    const techReport = this.techEngine.evaluateTechnologies(
      repoData,
      astData,
      passedBlueprint.techStackRules,
      deploymentUrl
    );
    logs.push(
      `[FAIE v3] Primary Framework: ${techReport.primaryFramework}. Tech Score: ${techReport.technologyScore}/100.`
    );

    // 4. Structural Feature Detection Engine with Blueprint Features & Synonyms
    logs.push(`[FAIE v3] Executing Dynamic Feature Detection Engine...`);
    const featureReport = this.featureEngine.evaluateFeatures(
      repoData,
      astData,
      passedBlueprint.requiredFeatures as any,
      passedBlueprint.synonymDictionary
    );
    logs.push(
      `[FAIE v3] Feature Coverage: ${featureReport.totalFeatureCoveragePercent}%. Mandatory passed: ${featureReport.mandatoryFeaturesPassed}.`
    );

    // 5. Submission Requirements Validation
    logs.push(`[FAIE v3] Executing Deterministic Submission Requirements Validator...`);
    const subReqReport = this.submissionValidator.validate(
      repoData,
      repoUrl,
      deploymentUrl,
      submissionMetadata,
      passedBlueprint.submissionRequirements as any
    );
    logs.push(
      `[FAIE v3] Submission Requirements: ${subReqReport.passedCount}/${subReqReport.totalEnabledCount} passed (${subReqReport.compliancePercent}%).`
    );

    // 6. FAIE Quality Engine (FQE - 6 Static Quality Modules)
    logs.push(`[FAIE v3] Executing FAIE Quality Engine with Blueprint Code Quality Rules...`);
    const fqeReport: FQEReport = this.qualityEngine.evaluateQuality(
      repoData,
      astData,
      passedBlueprint.codeQualityRules as any
    );
    logs.push(
      `[FAIE v3] FQE Quality Score: ${fqeReport.totalScore}/40.`
    );

    // 7. Dynamic Category Scoring & Rule Engine
    logs.push(`[FAIE v3] Calculating Dynamic Category Scores & Rules...`);
    const scoringReport: DynamicScoringReport = this.scoringEngine.calculateDynamicScores(
      passedBlueprint,
      featureReport,
      techReport,
      fqeReport,
      subReqReport,
      astData
    );

    const elapsedMs = Date.now() - startTime;
    logs.push(
      `[FAIE v3] Evaluation Completed in ${elapsedMs}ms. Final Score: ${scoringReport.finalScore}/100 [${scoringReport.status.toUpperCase()}].`
    );

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

    const scoringDetails = scoringReport.categoryResults.map((c) => ({
      categoryName: c.categoryName,
      awardedMarks: c.awardedMarks,
      maxMarks: c.maxMarks,
      passingMarks: c.passingMarks,
      evaluatedBy: c.evaluatedBy,
      evidenceCitations: c.evidenceCitations
    }));

    // Resolve hackathon title cleanly
    const activeProblemTitle =
      (passedBlueprint as any).problemStatement?.title ||
      (passedBlueprint as any).problemStatements?.[0]?.title ||
      "Hackathon Challenge";

    return {
      hackathonTitle: activeProblemTitle,
      repoUrl,
      deploymentUrl,
      status: scoringReport.status,
      engineVersion: "FAIE-v3-AST-Static",
      blueprintVersion: (passedBlueprint as any).version || (passedBlueprint as any).blueprintVersion || 1,
      scoreSummary: {
        finalScore: scoringReport.finalScore,
        featureCoveragePercent: featureReport.totalFeatureCoveragePercent,
        technologyCompliancePercent: techReport.technologyScore,
        uiCompliancePercent: Math.min(100, astData.totalJsxElements * 4),
        moduleCoveragePercent: subReqReport.compliancePercent,
        overallAlignmentPercent: scoringReport.finalScore,
        qualityEngineScore: fqeReport.totalScore,
        bonusPointsTotal: scoringReport.totalBonusPoints,
        deductionsTotal: scoringReport.totalDeductions
      },
      detectedTechnologies: techReport.detectedTechnologies,
      featureTreeEvaluations,
      submissionRequirementsReport: subReqReport,
      qualityEngineReport: fqeReport,
      scoringDetails,
      ruleResults: scoringReport.ruleResults,
      bonusResults: scoringReport.bonusResults,
      logs: [...logs, ...scoringReport.logs],
      auditableReportId: `rep_v3_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      rejectedClaims: [],
      capabilityVerifications: []
    };
  }
}
