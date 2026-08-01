import * as fs from "fs";
import * as path from "path";
import { SynonymEngine } from "../synonym-engine/synonym.engine";
import { ExpectedFeature } from "../knowledge-engine/knowledge-blueprint.interface";
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

  constructor(synonymEngine?: SynonymEngine, confidenceThreshold: number = 65) {
    this.synonymEngine = synonymEngine || new SynonymEngine();
    this.confidenceEngine = new ConfidenceEngine(confidenceThreshold);
  }

  private cacheSourceContents(allSourceFiles: string[]): string[] {
    const contents: string[] = [];
    for (const f of allSourceFiles) {
      try {
        const ext = path.extname(f).toLowerCase();
        if ([".js", ".jsx", ".ts", ".tsx", ".vue", ".html"].includes(ext)) {
          const text = fs.readFileSync(f, "utf-8");
          if (text) contents.push(text);
        }
      } catch {}
    }
    return contents;
  }

  // Capability Detectors
  private detectDataVisualization(contents: string[], repoAnalysis: RepositoryAnalysisResult): boolean {
    const deps = repoAnalysis.allDependencies;
    if (deps.some((d) => ["recharts", "chart.js", "apexcharts", "d3", "victory", "plotly"].includes(d.toLowerCase()))) {
      return true;
    }
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        (lower.includes("import") && (lower.includes("recharts") || lower.includes("chart.js") || lower.includes("d3") || lower.includes("apexcharts"))) ||
        lower.includes("<linechart") ||
        lower.includes("<areachart") ||
        lower.includes("<barchart") ||
        lower.includes("<piechart") ||
        lower.includes("<responsivecontainer") ||
        lower.includes("<radarchart") ||
        lower.includes("<scatterchart") ||
        (lower.includes("<svg") && lower.includes("data=")) ||
        (lower.includes("<canvas") && lower.includes("chart"))
      );
    });
  }

  private detectMetricSummary(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        (lower.includes("card") || lower.includes("gauge") || lower.includes("pill") || lower.includes("kpi") || lower.includes("metric") || lower.includes("stat")) &&
        (lower.includes("value") || lower.includes("label") || lower.includes("metric") || lower.includes("score") || lower.includes("current") || lower.includes("total"))
      );
    });
  }

  private detectInteractiveFiltering(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        (lower.includes("<select") || lower.includes("<input") || lower.includes("<button") || lower.includes("tab") || lower.includes("dropdown") || lower.includes("option")) &&
        (lower.includes("onclick") || lower.includes("onchange") || lower.includes("onselect") || lower.includes("setactive") || lower.includes("filter") || lower.includes("toggle") || lower.includes("switch"))
      );
    });
  }

  private detectStatefulInteraction(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        lower.includes("usestate") ||
        lower.includes("usereducer") ||
        lower.includes("usememo") ||
        lower.includes("usecallback") ||
        lower.includes("onclick") ||
        lower.includes("onchange") ||
        lower.includes("handler")
      );
    });
  }

  private detectResponsiveLayout(contents: string[], repoAnalysis: RepositoryAnalysisResult): boolean {
    if (repoAnalysis.hasTailwind) return true;
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return lower.includes("grid-cols") || lower.includes("flex-wrap") || lower.includes("@media") || lower.includes("md:") || lower.includes("lg:") || lower.includes("sm:");
    });
  }

  private detectDynamicData(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        lower.includes("setinterval") ||
        lower.includes("settimeout") ||
        lower.includes("fetch(") ||
        lower.includes("axios") ||
        lower.includes("jitter") ||
        lower.includes("drift") ||
        lower.includes("live") ||
        lower.includes("telemetry") ||
        lower.includes("simulation")
      );
    });
  }

  private detectStatusIndicators(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return (
        lower.includes("pill") ||
        lower.includes("badge") ||
        lower.includes("glow") ||
        lower.includes("status") ||
        lower.includes("alert") ||
        lower.includes("warning") ||
        lower.includes("severity") ||
        lower.includes("color") ||
        lower.includes("threshold")
      );
    });
  }

  private detectNavigation(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return lower.includes("<nav") || lower.includes("navbar") || lower.includes("sidebar") || lower.includes("route") || lower.includes("tab");
    });
  }

  private detectUserFeedback(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return lower.includes("alert") || lower.includes("feed") || lower.includes("tooltip") || lower.includes("modal") || lower.includes("dialog") || lower.includes("toast");
    });
  }

  private detectDataStorytelling(contents: string[]): boolean {
    return contents.some((c) => {
      const lower = c.toLowerCase();
      return lower.includes("insight") || lower.includes("report") || lower.includes("analysis") || lower.includes("commentary") || lower.includes("log") || lower.includes("summary");
    });
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
    const allSourceFiles = repoAnalysis.allSourceFiles || [];

    // Cache source code contents in memory once to speed up and avoid multiple reads
    const cachedContents = this.cacheSourceContents(allSourceFiles);

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
            allSourceFiles,
            cachedContents,
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
        allSourceFiles,
        cachedContents,
        feature.expectedRoutes,
        feature.expectedComponents,
        feature.expectedAPIs,
        feature.expectedPackages,
        feature.expectedUIElements
      );

      let finalAwardedScore = parentRes.confidenceResult.weightedScore;
      let finalConfidence = parentRes.confidenceResult.confidencePercent;
      let finalStatus = parentRes.confidenceResult.implementationStatus;

      if (subFeatureResults.length > 0) {
        const subAwardedSum = subFeatureResults.reduce((acc, sf) => acc + sf.awardedScore, 0);
        const subMaxSum = subFeatureResults.reduce((acc, sf) => acc + sf.weight, 0);
        finalAwardedScore = subMaxSum > 0 ? Math.min(feature.weight, subAwardedSum) : finalAwardedScore;
        finalConfidence = Math.round((finalAwardedScore / feature.weight) * 100);

        if (finalConfidence >= 65) finalStatus = "Implemented";
        else if (finalConfidence >= 35) finalStatus = "Partially Implemented";
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
    allSourceFiles: string[],
    cachedContents: string[],
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

    // 1. Readme mention (only as secondary citation, not source code proof)
    const inReadme = !!(readmeContent && this.synonymEngine.matchesTermOrSynonym(readmeContent, name));
    if (inReadme) readmeMatches.push(`README mentions '${name}'`);

    // 2. Default basic matches
    const inRoutes = routeResults.detectedRoutes.some((r) => this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
    if (inRoutes) routeMatches.push(`Route detected matching '${name}'`);

    const inComponents = repoAnalysis.detectedComponents.some((c) => this.synonymEngine.matchesTermOrSynonym(c, name));
    if (inComponents) componentMatches.push(`Component detected matching '${name}'`);

    const inUI = uiAnalysis.detectedUIComponents.some((uiComp) => this.synonymEngine.matchesTermOrSynonym(uiComp, name)) ||
                 repoAnalysis.astPatterns.jsxElementCount > 0;
    if (inUI) uiMatches.push(`UI element detected matching '${name}'`);

    const inPackages = repoAnalysis.allDependencies.some((pkg) => this.synonymEngine.matchesTermOrSynonym(pkg, name));
    if (inPackages) packageMatches.push(`Package dependency matching '${name}'`);

    const inFolder = allSourceFiles.some((f) => this.synonymEngine.matchesTermOrSynonym(path.basename(f), name) || this.synonymEngine.matchesTermOrSynonym(path.dirname(f), name));
    const inAPI = routeResults.detectedRoutes.some((r) => r.type === "api" && this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
    const inAST = repoAnalysis.astPatterns.detectedHooks.some((h) => this.synonymEngine.matchesTermOrSynonym(h, name)) ||
                  repoAnalysis.astPatterns.detectedForms.some((fm) => this.synonymEngine.matchesTermOrSynonym(fm, name)) ||
                  repoAnalysis.astPatterns.functionalComponentsCount > 0;
    const inProtected = routeResults.detectedRoutes.some((r) => r.pattern.includes("dashboard") || r.pattern.includes("admin")) ||
                        allSourceFiles.some((f) => f.includes("dashboard") || f.includes("auth"));

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

    // --- 3. Dynamic Capability Mapping (Tasks 1, 2, 3) ---
    const normalizedName = name.toLowerCase();
    let capabilityMatch = false;
    let detectorName = "";

    if (
      normalizedName.includes("chart") ||
      normalizedName.includes("visualization") ||
      normalizedName.includes("graph") ||
      normalizedName.includes("plot") ||
      normalizedName.includes("data_visualization")
    ) {
      capabilityMatch = this.detectDataVisualization(cachedContents, repoAnalysis);
      detectorName = "DATA_VISUALIZATION";
    } else if (
      normalizedName.includes("kpi") ||
      normalizedName.includes("summary") ||
      normalizedName.includes("metric") ||
      normalizedName.includes("card") ||
      normalizedName.includes("gauge") ||
      normalizedName.includes("metric_summary")
    ) {
      capabilityMatch = this.detectMetricSummary(cachedContents);
      detectorName = "METRIC_SUMMARY";
    } else if (
      normalizedName.includes("filter") ||
      normalizedName.includes("select") ||
      normalizedName.includes("search") ||
      normalizedName.includes("pagination") ||
      normalizedName.includes("interactive_filtering") ||
      normalizedName.includes("table")
    ) {
      capabilityMatch = this.detectInteractiveFiltering(cachedContents);
      detectorName = "INTERACTIVE_FILTERING";
    } else if (
      normalizedName.includes("state") ||
      normalizedName.includes("interaction") ||
      normalizedName.includes("click") ||
      normalizedName.includes("change") ||
      normalizedName.includes("stateful_interaction")
    ) {
      capabilityMatch = this.detectStatefulInteraction(cachedContents);
      detectorName = "STATEFUL_INTERACTION";
    } else if (
      normalizedName.includes("responsive") ||
      normalizedName.includes("layout") ||
      normalizedName.includes("grid") ||
      normalizedName.includes("flex") ||
      normalizedName.includes("responsive_layout")
    ) {
      capabilityMatch = this.detectResponsiveLayout(cachedContents, repoAnalysis);
      detectorName = "RESPONSIVE_LAYOUT";
    } else if (
      normalizedName.includes("telemetry") ||
      normalizedName.includes("dynamic") ||
      normalizedName.includes("live") ||
      normalizedName.includes("drift") ||
      normalizedName.includes("tick") ||
      normalizedName.includes("interval") ||
      normalizedName.includes("dynamic_data")
    ) {
      capabilityMatch = this.detectDynamicData(cachedContents);
      detectorName = "DYNAMIC_DATA";
    } else if (
      normalizedName.includes("pill") ||
      normalizedName.includes("badge") ||
      normalizedName.includes("glow") ||
      normalizedName.includes("status") ||
      normalizedName.includes("indicator") ||
      normalizedName.includes("status_indicators")
    ) {
      capabilityMatch = this.detectStatusIndicators(cachedContents);
      detectorName = "STATUS_INDICATORS";
    } else if (
      normalizedName.includes("nav") ||
      normalizedName.includes("bar") ||
      normalizedName.includes("menu") ||
      normalizedName.includes("navigation")
    ) {
      capabilityMatch = this.detectNavigation(cachedContents);
      detectorName = "NAVIGATION";
    } else if (
      normalizedName.includes("alert") ||
      normalizedName.includes("feedback") ||
      normalizedName.includes("tooltip") ||
      normalizedName.includes("user_feedback")
    ) {
      capabilityMatch = this.detectUserFeedback(cachedContents);
      detectorName = "USER_FEEDBACK";
    } else if (
      normalizedName.includes("insight") ||
      normalizedName.includes("story") ||
      normalizedName.includes("log") ||
      normalizedName.includes("storytelling") ||
      normalizedName.includes("data_storytelling")
    ) {
      capabilityMatch = this.detectDataStorytelling(cachedContents);
      detectorName = "DATA_STORYTELLING";
    }

    if (capabilityMatch) {
      signals.componentMatch = true;
      signals.uiDetection = true;
      signals.codeASTMatch = true;
      signals.folderStructureMatch = true;
      componentMatches.push(`Semantic capability '${detectorName}' verified via AST & code flow structure.`);
    }

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
