import * as fs from "fs";
import * as path from "path";
import { SynonymEngine } from "../synonym-engine/synonym.engine";
import { ExpectedFeature, SubFeature } from "../knowledge-engine/knowledge-blueprint.interface";
import { ConfidenceEngine, DetailedConfidenceResult } from "../confidence-engine/confidence.engine";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";

export interface SubFeatureEvaluationResult {
  subFeatureId: string;
  subFeatureName: string;
  weight: number;
  awardedScore: number;
  confidenceResult: DetailedConfidenceResult;
}

export interface FeatureDetectionResult {
  featureId: string;
  featureName: string;
  mandatory: boolean;
  maxWeight: number;
  awardedScore: number;
  implementationStatus: "Implemented" | "Partially Implemented" | "Not Implemented";
  confidenceScore: number;
  subFeatureResults: SubFeatureEvaluationResult[];
  evidence: {
    readmeMatches: string[];
    fileMatches: string[];
    routeMatches: string[];
    componentMatches: string[];
    uiMatches: string[];
    packageMatches: string[];
    rejectedClaims: string[];
  };
}

export class FeatureEngine {
  private synonymEngine: SynonymEngine;
  private confidenceEngine: ConfidenceEngine;

  constructor(synonymEngine?: SynonymEngine, confidenceThreshold: number = 75) {
    this.synonymEngine = synonymEngine || new SynonymEngine();
    this.confidenceEngine = new ConfidenceEngine(confidenceThreshold);
  }

  public evaluateFeatures(
    workspacePath: string,
    features: ExpectedFeature[],
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult
  ): FeatureDetectionResult[] {
    const readmeContent = this.readReadmeContent(workspacePath);
    const results: FeatureDetectionResult[] = [];

    const detectedFiles = routeResults.detectedRoutes.map((r) => r.filePath);

    for (const feature of features) {
      const parentName = feature.name;
      const subFeatureResults: SubFeatureEvaluationResult[] = [];

      // Evaluate sub-features if present
      if (feature.subFeatures && feature.subFeatures.length > 0) {
        for (const sub of feature.subFeatures) {
          const subRes = this.evaluateSingleFeatureOrSub(
            workspacePath,
            sub.name,
            sub.weight,
            readmeContent,
            repoAnalysis,
            routeResults,
            uiAnalysis,
            detectedFiles,
            sub.expectedRoutes,
            sub.expectedComponents,
            sub.expectedAPIs,
            sub.expectedPackages,
            sub.expectedUIElements,
            parentName
          );

          subFeatureResults.push({
            subFeatureId: sub.id || sub.name,
            subFeatureName: sub.name,
            weight: sub.weight,
            awardedScore: subRes.confidenceResult.weightedScore,
            confidenceResult: subRes.confidenceResult,
          });
        }
      }

      // Evaluate parent feature
      const parentRes = this.evaluateSingleFeatureOrSub(
        workspacePath,
        parentName,
        feature.weight,
        readmeContent,
        repoAnalysis,
        routeResults,
        uiAnalysis,
        detectedFiles,
        feature.expectedRoutes,
        feature.expectedComponents,
        feature.expectedAPIs,
        feature.expectedPackages,
        feature.expectedUIElements
      );

      let finalAwardedScore = parentRes.confidenceResult.weightedScore;
      let finalConfidence = parentRes.confidenceResult.confidencePercent;
      let finalStatus = parentRes.confidenceResult.implementationStatus;

      // If sub-features exist, sum sub-feature scores for fairer, fine-grained scoring
      if (subFeatureResults.length > 0) {
        const subAwardedSum = subFeatureResults.reduce((acc, sf) => acc + sf.awardedScore, 0);
        const subMaxSum = subFeatureResults.reduce((acc, sf) => acc + sf.weight, 0);
        finalAwardedScore = subMaxSum > 0 ? Math.min(feature.weight, subAwardedSum) : finalAwardedScore;
        finalConfidence = Math.round((finalAwardedScore / feature.weight) * 100);

        if (finalConfidence >= 75) finalStatus = "Implemented";
        else if (finalConfidence >= 40) finalStatus = "Partially Implemented";
        else finalStatus = "Not Implemented";
      }

      results.push({
        featureId: feature.id || feature.name,
        featureName: feature.name,
        mandatory: feature.mandatory,
        maxWeight: feature.weight,
        awardedScore: finalAwardedScore,
        implementationStatus: finalStatus,
        confidenceScore: finalConfidence,
        subFeatureResults,
        evidence: parentRes.evidence,
      });
    }

    return results;
  }

  private evaluateSingleFeatureOrSub(
    workspacePath: string,
    name: string,
    weight: number,
    readmeContent: string | null,
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    detectedFiles: string[],
    expRoutes?: string[],
    expComponents?: string[],
    expAPIs?: string[],
    expPackages?: string[],
    expUIElements?: string[],
    parentFeatureName?: string
  ) {
    const readmeMatches: string[] = [];
    const fileMatches: string[] = [];
    const routeMatches: string[] = [];
    const componentMatches: string[] = [];
    const uiMatches: string[] = [];
    const packageMatches: string[] = [];

    // 1. Readme
    const inReadme = !!(readmeContent && this.synonymEngine.matchesTermOrSynonym(readmeContent, name));
    if (inReadme) readmeMatches.push(`README mentions '${name}'`);

    // 2. Routes
    const inRoutes = routeResults.detectedRoutes.some((r) => this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
    if (inRoutes) routeMatches.push(`Route detected matching '${name}'`);

    // 3. Components
    const inComponents = repoAnalysis.detectedComponents.some((c) => this.synonymEngine.matchesTermOrSynonym(c, name));
    if (inComponents) componentMatches.push(`Component detected matching '${name}'`);

    // 4. UI Elements
    const inUI = uiAnalysis.detectedUIComponents.some((uiComp) => this.synonymEngine.matchesTermOrSynonym(uiComp, name));
    if (inUI) uiMatches.push(`UI element detected matching '${name}'`);

    // 5. Packages
    const inPackages = repoAnalysis.allDependencies.some((pkg) => this.synonymEngine.matchesTermOrSynonym(pkg, name));
    if (inPackages) packageMatches.push(`Package dependency matching '${name}'`);

    // 6. AST & Folder Structure
    const inFolder = detectedFiles.some((f) => this.synonymEngine.matchesTermOrSynonym(path.basename(f), name));
    const inAPI = routeResults.detectedRoutes.some((r) => r.type === "api" && this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
    const inAST = repoAnalysis.astPatterns.detectedHooks.some((h) => this.synonymEngine.matchesTermOrSynonym(h, name)) ||
                  repoAnalysis.astPatterns.detectedForms.some((fm) => this.synonymEngine.matchesTermOrSynonym(fm, name));
    const inProtected = routeResults.detectedRoutes.some((r) => r.pattern.includes("dashboard") || r.pattern.includes("admin"));

    const signals = {
      readmeMention: inReadme,
      folderStructureMatch: inFolder,
      routeMatch: inRoutes,
      componentMatch: inComponents,
      uiDetection: inUI,
      apiRouteMatch: inAPI,
      packageDependencyMatch: inPackages,
      codeASTMatch: inAST,
      protectedRouteMatch: inProtected,
      envVarMatch: true,
      configMatch: repoAnalysis.hasTailwind || repoAnalysis.hasTsConfig,
    };

    const confidenceResult = this.confidenceEngine.calculateMultiEvidenceConfidence(
      name,
      weight,
      signals,
      parentFeatureName
    );

    return {
      confidenceResult,
      evidence: {
        readmeMatches,
        fileMatches: fileMatches.slice(0, 5),
        routeMatches,
        componentMatches,
        uiMatches,
        packageMatches,
        rejectedClaims: confidenceResult.rejectedClaims,
      },
    };
  }

  private readReadmeContent(workspacePath: string): string | null {
    const candidatePaths = [
      path.join(workspacePath, "README.md"),
      path.join(workspacePath, "readme.md"),
      path.join(workspacePath, "README.txt"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p, "utf-8");
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
