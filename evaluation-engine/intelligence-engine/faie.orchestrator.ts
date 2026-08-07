import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { GitHubRepoEngine, VirtualRepository } from "./repository-engine/github-repo.engine";
import { ASTAnalysisEngine, ASTRepositoryAnalysis } from "./ast-engine/ast-analysis.engine";
import { TechnologyEngine } from "./technology-engine/technology.engine";
import { FeatureEngine } from "./feature-engine/feature.engine";

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

    // 5. Calculate Final Score & Category Details
    const featureScore = Math.round((featureReport.totalFeatureCoveragePercent / 100) * 30);
    const techScore = Math.round((techReport.technologyScore / 100) * 20);
    
    // Code Quality & Architecture Score
    const hasTs = repoData.hasTsConfig ? 10 : 5;
    const hasReadmeScore = repoData.hasReadme && repoData.readmeContent.length > 100 ? 10 : 5;
    const structureScore = Math.min(20, Math.round(repoData.downloadedFilesCount * 0.8));
    const bonusPoints = featureReport.totalFeatureCoveragePercent > 90 ? 10 : 0;
    const deductions = techReport.restrictedTechViolations.length * 20;

    const rawScore = featureScore + techScore + hasTs + hasReadmeScore + structureScore + bonusPoints - deductions;
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
        maxMarks: 30,
        passingMarks: 18,
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
        categoryName: "Code Quality & Architecture",
        awardedMarks: hasTs + structureScore,
        maxMarks: 30,
        passingMarks: 18,
        evaluatedBy: "FAIE v3 AST Architecture Auditor",
        evidenceCitations: [
          `TypeScript configuration: ${repoData.hasTsConfig ? "Valid tsconfig.json present" : "Missing"}`,
          `Files structure modularity: ${repoData.downloadedFilesCount} modular source files analyzed.`
        ]
      },
      {
        categoryName: "Documentation & Repository Quality",
        awardedMarks: hasReadmeScore,
        maxMarks: 20,
        passingMarks: 10,
        evaluatedBy: "FAIE v3 Repository Intelligence",
        evidenceCitations: [
          `README presence: ${repoData.hasReadme ? `Valid (${repoData.readmeContent.length} bytes)` : "Missing"}`
        ]
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
        bonusPointsTotal: bonusPoints,
        deductionsTotal: deductions
      },
      detectedTechnologies: techReport.detectedTechnologies,
      featureTreeEvaluations,
      scoringDetails,
      logs,
      auditableReportId: `rep_v3_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      rejectedClaims: [],
      capabilityVerifications: []
    };
  }
}
