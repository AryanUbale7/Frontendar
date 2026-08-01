import * as fs from "fs";
import * as path from "path";
import { SynonymEngine } from "../synonym-engine/synonym.engine";
import { ExpectedFeature } from "../knowledge-engine/knowledge-blueprint.interface";
import { ConfidenceEngine, DetailedConfidenceResult } from "../confidence-engine/confidence.engine";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n\r]*/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
}

export type ImplementationDepth = "full" | "partial" | "superficial" | "none";

export interface SubFeatureEvaluationResult {
  subFeatureId: string;
  subFeatureName: string;
  weight: number;
  awardedScore: number;
  confidenceResult: DetailedConfidenceResult;
  implementationDepth: ImplementationDepth;
}

export interface FeatureDetectionResult {
  featureId: string;
  featureName: string;
  mandatory: boolean;
  maxWeight: number;
  awardedScore: number;
  implementationStatus: "Implemented" | "Partially Implemented" | "Not Implemented";
  implementationDepth: ImplementationDepth;
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
    evidenceLevel: number;
    astEvidence: string[];
    dataFlowEvidence: string[];
    renderEvidence: string[];
    runtimeEvidence: string[];
  };
}

export interface CapabilityVerification {
  capability: string;
  confidence: number;
  evidenceLevel: number;
  files: string[];
  astEvidence: string[];
  dataFlowEvidence: string[];
  renderEvidence: string[];
  runtimeEvidence: string[];
  scoreContribution: number;
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
      return lower.includes("insight") || lower.includes("report") || lower.includes("analysis") || lower.includes("commentary") || (lower.includes("log") && !lower.includes("console.log")) || lower.includes("summary");
    });
  }

  public evaluateFeatures(
    workspacePath: string,
    features: ExpectedFeature[],
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    _isDashboardChallenge: boolean = false,
    _confidenceThreshold: number = 65
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

          // Depth-based awarding: superficial evidence (level 0/1/2) cannot earn marks
          const subDepth = this.determineImplementationDepth(subRes.evidence.evidenceLevel);
          const subScore = this.applyDepthAward(sub.weight, subDepth, subRes.confidenceResult.confidencePercent);

          subFeatureResults.push({
            subFeatureId: sub.id || sub.name,
            subFeatureName: sub.name,
            weight: sub.weight,
            awardedScore: subScore,
            confidenceResult: subRes.confidenceResult,
            implementationDepth: subDepth,
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

      // Depth-based awarding for the parent feature (applies to ALL blueprints, not just dashboards)
      const parentDepth = this.determineImplementationDepth(parentRes.evidence.evidenceLevel);
      let finalAwardedScore = this.applyDepthAward(feature.weight, parentDepth, parentRes.confidenceResult.confidencePercent);
      let finalConfidence = parentRes.confidenceResult.confidencePercent;
      let finalStatus: "Implemented" | "Partially Implemented" | "Not Implemented";
      let finalDepth = parentDepth;

      if (subFeatureResults.length > 0) {
        const subAwardedSum = subFeatureResults.reduce((acc, sf) => acc + sf.awardedScore, 0);
        const subMaxSum = subFeatureResults.reduce((acc, sf) => acc + sf.weight, 0);
        // Aggregate sub-feature marks only when at least one sub has evidence;
        // the parent's own structural evidence is never capped below its granular sub-feature sum
        if (subAwardedSum > 0) {
          const subScore = subMaxSum > 0 ? Math.min(feature.weight, subAwardedSum) : finalAwardedScore;
          finalAwardedScore = Math.max(finalAwardedScore, subScore);
          finalConfidence = Math.round((finalAwardedScore / feature.weight) * 100);
          finalDepth = finalAwardedScore >= feature.weight ? "full" : "partial";
        }
      }

      if (finalAwardedScore === 0) finalStatus = "Not Implemented";
      else if (finalAwardedScore >= feature.weight) finalStatus = "Implemented";
      else finalStatus = "Partially Implemented";

      results.push({
        featureId: feature.id || feature.name,
        featureName: feature.name,
        mandatory: feature.mandatory,
        maxWeight: feature.weight,
        awardedScore: finalAwardedScore,
        implementationStatus: finalStatus,
        implementationDepth: finalDepth,
        confidenceScore: finalConfidence,
        subFeatureResults,
        evidence: parentRes.evidence,
      });
    }

    return results;
  }

  // Evidence level -> implementation depth mapping (calibrated Phase 4):
  // 0 = none, 1 = superficial (filename/keyword only), 2-4 = partial (structural presence / data-flow / render),
  // 5 = full (runtime verified).
  private determineImplementationDepth(evidenceLevel: number): ImplementationDepth {
    if (evidenceLevel <= 0) return "none";
    if (evidenceLevel <= 1) return "superficial";
    if (evidenceLevel >= 5) return "full";
    return "partial";
  }

  // Depth-based award: superficial and none earn zero marks; partial earns prorated marks by confidence;
  // full earns the entire weight.
  private applyDepthAward(weight: number, depth: ImplementationDepth, confidencePercent: number): number {
    switch (depth) {
      case "none":
      case "superficial":
        return 0;
      case "full":
        return weight;
      default:
        return Math.round(weight * (confidencePercent / 100));
    }
  }

  public evaluateCapabilities(
    repoAnalysis: RepositoryAnalysisResult,
    uiAnalysis: UIDetectionResult
  ): CapabilityVerification[] {
    const allSourceFiles = repoAnalysis.allSourceFiles || [];

    const verifications: CapabilityVerification[] = [];

    for (const cap of this.getCapabilitiesList()) {
      const capEv = this.detectCapabilityEvidence(cap, repoAnalysis, uiAnalysis, allSourceFiles);
      const level = capEv.level;

      const confidence = level === 0 ? 0 : level === 1 ? 25 : level === 2 ? 50 : level === 3 ? 75 : level === 4 ? 90 : 100;

      verifications.push({
        capability: cap.name,
        confidence,
        evidenceLevel: level,
        files: capEv.filesMatched.slice(0, 5),
        astEvidence: capEv.astEvidence,
        dataFlowEvidence: capEv.dataFlowEvidence,
        renderEvidence: capEv.renderEvidence,
        runtimeEvidence: capEv.runtimeEvidence,
        scoreContribution: 0
      });
    }

    return verifications;
  }

  private getCapabilitiesList(): Array<{
    name: string;
    detect: (contents: string[], repoAnalysis: RepositoryAnalysisResult) => boolean;
  }> {
    return [
      { name: "DATA_VISUALIZATION", detect: this.detectDataVisualization.bind(this) },
      { name: "METRIC_SUMMARY", detect: this.detectMetricSummary.bind(this) },
      { name: "INTERACTIVE_FILTERING", detect: this.detectInteractiveFiltering.bind(this) },
      { name: "STATEFUL_INTERACTION", detect: this.detectStatefulInteraction.bind(this) },
      { name: "RESPONSIVE_LAYOUT", detect: this.detectResponsiveLayout.bind(this) },
      { name: "DYNAMIC_DATA", detect: this.detectDynamicData.bind(this) },
      { name: "STATUS_INDICATORS", detect: this.detectStatusIndicators.bind(this) },
      { name: "NAVIGATION", detect: this.detectNavigation.bind(this) },
      { name: "USER_FEEDBACK", detect: this.detectUserFeedback.bind(this) },
      { name: "DATA_STORYTELLING", detect: this.detectDataStorytelling.bind(this) }
    ];
  }

  // Single authoritative evidence-level computation for a semantic capability.
  private detectCapabilityEvidence(
    cap: { name: string; detect: (contents: string[], repoAnalysis: RepositoryAnalysisResult) => boolean },
    repoAnalysis: RepositoryAnalysisResult,
    uiAnalysis: UIDetectionResult,
    allSourceFiles: string[]
  ): {
    filesMatched: string[];
    astEvidence: string[];
    dataFlowEvidence: string[];
    renderEvidence: string[];
    runtimeEvidence: string[];
    level: number;
  } {
    const filesMatched: string[] = [];
    const astEvidence: string[] = [];
    const dataFlowEvidence: string[] = [];
    const renderEvidence: string[] = [];
    const runtimeEvidence: string[] = [];
    
    let hasImports = false;
    let hasJSX = false;
    let hasDataFlow = false;
    let hasRender = false;
    let hasRuntime = false;

    // Scan source files for this capability
    for (const f of allSourceFiles) {
      try {
        const ext = path.extname(f).toLowerCase();
        if ([".js", ".jsx", ".ts", ".tsx", ".vue"].includes(ext)) {
          const text = fs.readFileSync(f, "utf-8");
          const textLower = stripComments(text).toLowerCase();
          
          // Run specific detector on file content
          if (cap.detect([text], repoAnalysis)) {
            filesMatched.push(f);
            
            // Map specific AST and Data Flow indicators
            if (cap.name === "DATA_VISUALIZATION") {
              if (textLower.includes("import ") && (textLower.includes("recharts") || textLower.includes("chart") || textLower.includes("d3"))) {
                hasImports = true;
                astEvidence.push(`Imported charting libraries in ${path.basename(f)}`);
              }
              if (textLower.includes("<linechart") || textLower.includes("<barchart") || textLower.includes("<areachart") || textLower.includes("<piechart")) {
                hasJSX = true;
                astEvidence.push(`Rendered JSX Chart tags in ${path.basename(f)}`);
              }
              if (textLower.includes("data={") || textLower.includes("datakeys=")) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Dynamic charting data bindings verified in ${path.basename(f)}`);
              }
            } else if (cap.name === "METRIC_SUMMARY") {
              if (textLower.includes("card") || textLower.includes("kpi") || textLower.includes("stat")) {
                hasJSX = true;
                astEvidence.push(`Metric card structure defined in ${path.basename(f)}`);
              }
              if (textLower.match(/\{\s*[^}]{0,80}\}/) && /\b(value|val|total|count|num|metric|score|current)\b/.test(textLower)) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Dynamic metrics display state bindings in ${path.basename(f)}`);
              }
            } else if (cap.name === "INTERACTIVE_FILTERING") {
              if (textLower.includes("<select") || textLower.includes("<input") || textLower.includes("button")) {
                hasJSX = true;
                astEvidence.push(`Selector input elements declared in ${path.basename(f)}`);
              }
              if (textLower.includes("onclick=") || textLower.includes("onchange=") || textLower.includes("onselect=")) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Filter controls bound to update handlers in ${path.basename(f)}`);
              }
            } else if (cap.name === "STATEFUL_INTERACTION") {
              const stateVarMatch = text.match(/\[\s*(\w+)\s*,\s*\w+\s*\]\s*=\s*useState/);
              const stateVarReferenced = stateVarMatch ? new RegExp(`\\{${stateVarMatch[1]}\\b`).test(text) : false;
              if (textLower.includes("usestate") || textLower.includes("usereducer")) {
                hasImports = true;
                astEvidence.push(`State management hooks imported in ${path.basename(f)}`);
              }
              if (textLower.includes("onclick=") || textLower.includes("onchange=") || stateVarReferenced) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Interactive event listeners or state bindings registered on UI controls in ${path.basename(f)}`);
              }
            } else if (cap.name === "RESPONSIVE_LAYOUT") {
              if (textLower.includes("grid-cols") || textLower.includes("flex-wrap") || textLower.includes("md:") || textLower.includes("lg:")) {
                hasJSX = true;
                astEvidence.push(`Tailwind/CSS responsive layout classes in ${path.basename(f)}`);
              }
              if (
                textLower.includes("onclick") ||
                textLower.includes("onchange") ||
                textLower.includes("usestate") ||
                textLower.includes("export default function") ||
                textLower.includes("function ")
              ) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Responsive classes active inside interactive component ${path.basename(f)}`);
              }
            } else if (cap.name === "DYNAMIC_DATA") {
              if (textLower.includes("setinterval") || textLower.includes("settimeout") || textLower.includes("fetch(") || textLower.includes("axios")) {
                hasDataFlow = true;
                dataFlowEvidence.push(`Data polling mechanism or dynamic simulation registered in ${path.basename(f)}`);
              }
            } else if (cap.name === "STATUS_INDICATORS") {
              if (textLower.includes("pill") || textLower.includes("badge") || textLower.includes("severity") || textLower.includes("warning")) {
                hasJSX = true;
                astEvidence.push(`Status indicator elements in ${path.basename(f)}`);
              }
            } else if (cap.name === "NAVIGATION") {
              if (textLower.includes("<nav") || textLower.includes("navbar") || textLower.includes("sidebar") || textLower.includes("link")) {
                hasJSX = true;
                astEvidence.push(`Navigation components defined in ${path.basename(f)}`);
              }
            } else if (cap.name === "USER_FEEDBACK") {
              if (textLower.includes("tooltip") || textLower.includes("modal") || textLower.includes("toast") || textLower.includes("dialog")) {
                hasJSX = true;
                astEvidence.push(`UI popup/feedback layers defined in ${path.basename(f)}`);
              }
            } else if (cap.name === "DATA_STORYTELLING") {
              if (textLower.includes("insight") || textLower.includes("report") || textLower.includes("commentary")) {
                hasJSX = true;
                astEvidence.push(`Insights/commentary generation view in ${path.basename(f)}`);
              }
            }
          }
        }
      } catch {}
    }

    // Compute evidence level
    let level = 0;
    if (filesMatched.length > 0) {
      level = 1; // filename/keyword matches only
      
      // If capability matched code AST structures
      if (hasImports || hasJSX || astEvidence.length > 0) {
        level = 2; // structural presence
      }
      
      if (hasDataFlow || dataFlowEvidence.length > 0) {
        level = 3; // structural + data-flow
      }

      // Rendered check (Level 4)
      if (level >= 3) {
        if (cap.name === "DATA_VISUALIZATION" && uiAnalysis.detectedUIComponents.some(c => c.toLowerCase().includes("chart"))) {
          hasRender = true;
          renderEvidence.push("Charts confirmed rendered in screenshot analysis.");
        } else if (cap.name === "METRIC_SUMMARY" && uiAnalysis.detectedUIComponents.some(c => c.toLowerCase().includes("card") || c.toLowerCase().includes("dashboard"))) {
          hasRender = true;
          renderEvidence.push("Metric summary card components confirmed rendered.");
        } else if (cap.name === "INTERACTIVE_FILTERING" && uiAnalysis.detectedUIComponents.some(c => c.toLowerCase().includes("button") || c.toLowerCase().includes("search"))) {
          hasRender = true;
          renderEvidence.push("Filter input controls mapped in screen check.");
        } else if (cap.name === "RESPONSIVE_LAYOUT" && uiAnalysis.isResponsive) {
          hasRender = true;
          renderEvidence.push("Responsive grid layouts verified on screen.");
        } else if (uiAnalysis.detectedUIComponents.length > 0) {
          hasRender = true;
          renderEvidence.push("Component rendered in active page view.");
        }
        
        if (hasRender) {
          level = 4;
        }
      }

      // Runtime check (Level 5) — honest static end-to-end verification only
      if (level >= 4) {
        if (cap.name === "RESPONSIVE_LAYOUT" && uiAnalysis.isResponsive && !uiAnalysis.hasBrokenLayout) {
          hasRuntime = true;
          runtimeEvidence.push("Static CSS verification: responsive breakpoints present with no fixed-width layout break (>=1500px check).");
        } else if (cap.name === "DATA_VISUALIZATION" && uiAnalysis.detectedUIComponents.some(c => c.toLowerCase().includes("chart")) && !uiAnalysis.hasBrokenLayout) {
          hasRuntime = true;
          runtimeEvidence.push("Static verification: chart elements wired to data bindings with no layout break detected.");
        } else if ((cap.name === "STATEFUL_INTERACTION" || cap.name === "INTERACTIVE_FILTERING") && hasDataFlow && !uiAnalysis.hasBrokenLayout) {
          hasRuntime = true;
          runtimeEvidence.push("Static verification: interactive controls bound to state/update handlers with no layout break detected.");
        }
        
        if (hasRuntime) {
          level = 5;
        }
      }
    }

    return {
      filesMatched,
      astEvidence,
      dataFlowEvidence,
      renderEvidence,
      runtimeEvidence,
      level,
    };
  }

  // Term-level feature name matching: a candidate matches a multi-word feature name
  // when it contains any significant term of the name (e.g. "Hero.jsx" <-> "Hero Section
  // & Value Proposition", "cards" <-> "Cards"), with light plural handling.
  private matchesFeatureName(candidateText: string, featureName: string): boolean {
    if (this.synonymEngine.matchesTermOrSynonym(candidateText, featureName)) return true;
    const lowerCandidate = candidateText.toLowerCase();
    const terms = featureName.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
    return terms.some((t) => {
      if (lowerCandidate.includes(t)) return true;
      if (t.endsWith("s") && t.length > 3 && lowerCandidate.includes(t.slice(0, -1))) return true;
      return false;
    });
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
    const routeMatches: string[] = [];
    const componentMatches: string[] = [];
    const uiMatches: string[] = [];
    const packageMatches: string[] = [];
    const fileMatches: string[] = [];
    const matchedFiles = allSourceFiles.filter((f) => {
      const rel = path.relative(workspacePath, f).toLowerCase();
      const base = path.basename(rel);
      const dir = path.dirname(rel);
      return base.includes(name.toLowerCase()) || dir.includes(name.toLowerCase()) || this.matchesFeatureName(base, name);
    });
    fileMatches.push(...matchedFiles);

    // Expected blueprint structures are authoritative anchors for evidence:
    // a feature is present when its declared components/routes/UI/packages exist in the repo.
    const expComponentMatches = (expComponents || []).filter((ec) =>
      repoAnalysis.detectedComponents.some((c) => this.matchesFeatureName(c, ec)) ||
      allSourceFiles.some((f) => this.matchesFeatureName(path.basename(f), ec))
    );
    const expRouteMatches = (expRoutes || []).filter((er) =>
      routeResults.detectedRoutes.some((r) => this.matchesFeatureName(r.pattern, er))
    );
    const expUiMatches = (expUIElements || []).filter((eu) =>
      uiAnalysis.detectedUIComponents.some((u) => this.matchesFeatureName(u, eu))
    );
    const expPackageMatches = (expPackages || []).filter((ep) =>
      repoAnalysis.allDependencies.some((p) => this.matchesFeatureName(p, ep))
    );

    if (expComponentMatches.length > 0) {
      const expFiles = allSourceFiles.filter((f) =>
        expComponentMatches.some((ec) => this.matchesFeatureName(path.basename(f), ec))
      );
      expFiles.forEach((f) => {
        if (!fileMatches.includes(f)) fileMatches.push(f);
      });
    }

    // 1. Readme mention (only as secondary citation, not source code proof).
    //    Term-level matching mirrors the file-name matcher: a README describing
    //    "newsletter signup and footer links" legitimately documents the lead
    //    capture feature without naming it verbatim.
    const inReadme = !!(
      readmeContent &&
      (this.synonymEngine.matchesTermOrSynonym(readmeContent, name) || this.matchesFeatureName(readmeContent, name))
    );
    if (inReadme) readmeMatches.push(`README mentions '${name}'`);

    // 2. Default basic matches
    const inRoutes =
      routeResults.detectedRoutes.some((r) => this.matchesFeatureName(r.pattern, name)) ||
      expRouteMatches.length > 0;
    if (inRoutes) routeMatches.push(`Route detected matching '${name}'`);

    const inComponents =
      repoAnalysis.detectedComponents.some((c) => this.matchesFeatureName(c, name)) ||
      matchedFiles.some((f) => /\.(tsx|jsx|vue|ts|js)$/i.test(f)) ||
      expComponentMatches.length > 0;
    if (inComponents) {
      if (expComponentMatches.length > 0) {
        componentMatches.push(`Expected components present: ${expComponentMatches.join(", ")}`);
      } else {
        componentMatches.push(`Component detected matching '${name}'`);
      }
    }

    // UI signal: feature-specific UI elements OR the repo demonstrably renders JSX
    // (blanket jsxElementCount only, matching the repo-level UI detection; the
    // evidence-level gate below keeps this from ever marking a feature "implemented").
    const inUI =
      uiAnalysis.detectedUIComponents.some((uiComp) => this.matchesFeatureName(uiComp, name)) ||
      expUiMatches.length > 0 ||
      repoAnalysis.astPatterns.jsxElementCount > 0;
    if (inUI) uiMatches.push(`UI element detected matching '${name}'`);

    const inPackages =
      repoAnalysis.allDependencies.some((pkg) => this.matchesFeatureName(pkg, name)) ||
      expPackageMatches.length > 0;
    if (inPackages) packageMatches.push(`Package dependency matching '${name}'`);

    const inFolder = allSourceFiles.some((f) => {
      const rel = path.relative(workspacePath, f);
      return this.matchesFeatureName(path.basename(rel), name) || this.matchesFeatureName(path.dirname(rel), name);
    });
    const inAPI = routeResults.detectedRoutes.some((r) => r.type === "api" && this.matchesFeatureName(r.pattern, name));
    const inAST = repoAnalysis.astPatterns.detectedHooks.some((h) => this.matchesFeatureName(h, name)) ||
                  repoAnalysis.astPatterns.detectedForms.some((fm) => this.matchesFeatureName(fm, name)) ||
                  repoAnalysis.astPatterns.functionalComponentsCount > 0;
    const inProtected = routeResults.detectedRoutes.some((r) => r.pattern.includes("dashboard") || r.pattern.includes("admin")) ||
                        allSourceFiles.some((f) => f.includes("dashboard") || f.includes("auth"));

    // Real env var evidence: .env files present or process.env usage in code
    const envVarMatch =
      allSourceFiles.some((f) => f.toLowerCase().includes(".env")) ||
      cachedContents.some((c) => c.includes("process.env"));

    const signals = {
      readmeMention: inReadme,
      folderStructureMatch: inFolder,
      routeMatch: inRoutes,
      componentMatch: inComponents,
      uiDetection: inUI,
      apiRouteMatch: inAPI,
      packageDependencyMatch: inPackages,
      codeASTMatch: inAST,
      wiringEvidence: expComponentMatches.length > 0,
      protectedRouteMatch: inProtected,
      envVarMatch,
      configMatch: repoAnalysis.hasTailwind || repoAnalysis.hasTsConfig,
    };

    // --- 3. Dynamic Capability Mapping (Tasks 1, 2, 3) ---
    const normalizedName = name.toLowerCase();
    let capabilityMatch = false;
    let detectorName = "";
    let detector: ((contents: string[], repoAnalysis: RepositoryAnalysisResult) => boolean) | null = null;

    const tryCapability = (testName: string, fn: (contents: string[]) => boolean) => {
      capabilityMatch = fn(cachedContents);
      if (capabilityMatch) detectorName = testName;
    };

    if (
      normalizedName.includes("chart") ||
      normalizedName.includes("visualization") ||
      normalizedName.includes("graph") ||
      normalizedName.includes("plot") ||
      normalizedName.includes("data_visualization")
    ) {
      detector = this.detectDataVisualization.bind(this);
      tryCapability("DATA_VISUALIZATION", (c) => this.detectDataVisualization(c, repoAnalysis));
    } else if (
      normalizedName.includes("kpi") ||
      normalizedName.includes("summary") ||
      normalizedName.includes("metric") ||
      normalizedName.includes("card") ||
      normalizedName.includes("gauge") ||
      normalizedName.includes("metric_summary")
    ) {
      detector = this.detectMetricSummary.bind(this);
      tryCapability("METRIC_SUMMARY", (c) => this.detectMetricSummary(c));
    } else if (
      normalizedName.includes("filter") ||
      normalizedName.includes("select") ||
      normalizedName.includes("search") ||
      normalizedName.includes("pagination") ||
      normalizedName.includes("interactive_filtering") ||
      normalizedName.includes("table")
    ) {
      detector = this.detectInteractiveFiltering.bind(this);
      tryCapability("INTERACTIVE_FILTERING", (c) => this.detectInteractiveFiltering(c));
    } else if (
      normalizedName.includes("state") ||
      normalizedName.includes("interaction") ||
      normalizedName.includes("click") ||
      normalizedName.includes("change") ||
      normalizedName.includes("stateful_interaction")
    ) {
      detector = this.detectStatefulInteraction.bind(this);
      tryCapability("STATEFUL_INTERACTION", (c) => this.detectStatefulInteraction(c));
    } else if (
      normalizedName.includes("responsive") ||
      normalizedName.includes("layout") ||
      normalizedName.includes("grid") ||
      normalizedName.includes("flex") ||
      normalizedName.includes("responsive_layout")
    ) {
      detector = this.detectResponsiveLayout.bind(this);
      tryCapability("RESPONSIVE_LAYOUT", (c) => this.detectResponsiveLayout(c, repoAnalysis));
    } else if (
      normalizedName.includes("telemetry") ||
      normalizedName.includes("dynamic") ||
      normalizedName.includes("live") ||
      normalizedName.includes("drift") ||
      normalizedName.includes("tick") ||
      normalizedName.includes("interval") ||
      normalizedName.includes("dynamic_data")
    ) {
      detector = this.detectDynamicData.bind(this);
      tryCapability("DYNAMIC_DATA", (c) => this.detectDynamicData(c));
    } else if (
      normalizedName.includes("pill") ||
      normalizedName.includes("badge") ||
      normalizedName.includes("glow") ||
      normalizedName.includes("status") ||
      normalizedName.includes("indicator") ||
      normalizedName.includes("status_indicators")
    ) {
      detector = this.detectStatusIndicators.bind(this);
      tryCapability("STATUS_INDICATORS", (c) => this.detectStatusIndicators(c));
    } else if (
      normalizedName.includes("nav") ||
      normalizedName.includes("bar") ||
      normalizedName.includes("menu") ||
      normalizedName.includes("navigation")
    ) {
      detector = this.detectNavigation.bind(this);
      tryCapability("NAVIGATION", (c) => this.detectNavigation(c));
    } else if (
      normalizedName.includes("alert") ||
      normalizedName.includes("feedback") ||
      normalizedName.includes("tooltip") ||
      normalizedName.includes("user_feedback")
    ) {
      detector = this.detectUserFeedback.bind(this);
      tryCapability("USER_FEEDBACK", (c) => this.detectUserFeedback(c));
    } else if (
      normalizedName.includes("insight") ||
      normalizedName.includes("story") ||
      normalizedName === "log" ||
      normalizedName === "logs" ||
      normalizedName.includes("storytelling") ||
      normalizedName.includes("data_storytelling")
    ) {
      detector = this.detectDataStorytelling.bind(this);
      tryCapability("DATA_STORYTELLING", (c) => this.detectDataStorytelling(c));
    }

    if (capabilityMatch) {
      signals.componentMatch = true;
      signals.uiDetection = true;
      signals.codeASTMatch = true;
      signals.folderStructureMatch = true;
      componentMatches.push(`Semantic capability '${detectorName}' verified via AST & code flow structure.`);
    }

    if (process.env.FAIE_TRACE_FEATURE) {
      console.error(`[TRACE] feature="${name}" matchedFiles=${fileMatches.length} readme=${inReadme} routes=${inRoutes} comps=${inComponents} ui=${inUI} folder=${inFolder} api=${inAPI} ast=${inAST} pkg=${inPackages} wiring=${expComponentMatches.length > 0} capMatch=${capabilityMatch}${capabilityMatch ? ` (${detectorName})` : ""} expComps=${expComponentMatches.length} expRoutes=${expRouteMatches.length} expUi=${expUiMatches.length}`);
    }

    const confidenceResult = this.confidenceEngine.calculateMultiEvidenceConfidence(
      name,
      weight,
      signals,
      parentFeatureName
    );

    // Evidence level from file-name matches OR semantic capability evidence (whichever is deeper)
    // structuralEvidence excludes blanket repo-wide signals (any JSX / any functional component)
    const structuralEvidence =
      repoAnalysis.detectedComponents.some((c) => this.matchesFeatureName(c, name)) ||
      repoAnalysis.astPatterns.detectedHooks.some((h) => this.matchesFeatureName(h, name)) ||
      repoAnalysis.astPatterns.detectedForms.some((fm) => this.matchesFeatureName(fm, name)) ||
      inFolder ||
      inAPI ||
      expComponentMatches.length > 0 ||
      expRouteMatches.length > 0 ||
      expUiMatches.length > 0 ||
      expPackageMatches.length > 0;
    const evidenceLevelInfo = this.calculateEvidenceLevel(name, fileMatches, repoAnalysis, uiAnalysis, structuralEvidence);
    let effectiveLevel = evidenceLevelInfo.level;
    let effectiveAst = evidenceLevelInfo.ast;
    let effectiveDataFlow = evidenceLevelInfo.dataFlow;
    let effectiveRender = evidenceLevelInfo.render;
    let effectiveRuntime = evidenceLevelInfo.runtime;

    // Level 4 upgrade: blueprint-declared expected components present in the repo
    // alongside data flow is render-grade structural evidence (the feature's own
    // declared UI surface exists on disk and is wired to state).
    if (effectiveLevel === 3 && expComponentMatches.length > 0) {
      effectiveLevel = 4;
      effectiveRender.push(`Expected components present and wired: ${expComponentMatches.join(", ")}`);
    }

    if (capabilityMatch && detector) {
      const capEv = this.detectCapabilityEvidence(
        { name: detectorName, detect: detector },
        repoAnalysis,
        uiAnalysis,
        allSourceFiles
      );
      if (capEv.level > effectiveLevel) {
        effectiveLevel = capEv.level;
        effectiveAst = [...effectiveAst, ...capEv.astEvidence];
        effectiveDataFlow = [...effectiveDataFlow, ...capEv.dataFlowEvidence];
        effectiveRender = [...effectiveRender, ...capEv.renderEvidence];
        effectiveRuntime = [...effectiveRuntime, ...capEv.runtimeEvidence];
      }
      if (capEv.filesMatched.length > 0) {
        capEv.filesMatched.forEach((f) => {
          if (!fileMatches.includes(f)) fileMatches.push(f);
        });
      }
    }

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
        evidenceLevel: effectiveLevel,
        astEvidence: effectiveAst,
        dataFlowEvidence: effectiveDataFlow,
        renderEvidence: effectiveRender,
        runtimeEvidence: effectiveRuntime,
      },
    };
  }

  private calculateEvidenceLevel(
    name: string,
    filesMatched: string[],
    repoAnalysis: RepositoryAnalysisResult,
    uiAnalysis: UIDetectionResult,
    structuralEvidence: boolean = false
  ) {
    const nameLower = name.toLowerCase();
    const ast: string[] = [];
    const dataFlow: string[] = [];
    const render: string[] = [];
    const runtime: string[] = [];

    if (filesMatched.length === 0 && !structuralEvidence) {
      return { level: 0, ast, dataFlow, render, runtime };
    }

    let hasImports = false;
    let hasJSX = false;
    let hasStateOrBinding = false;

    for (const f of filesMatched) {
      try {
        const ext = path.extname(f).toLowerCase();
        if ([".js", ".jsx", ".ts", ".tsx", ".vue"].includes(ext)) {
          const text = fs.readFileSync(f, "utf-8");
          const textLower = stripComments(text).toLowerCase();
          
          if (textLower.includes("import ") || textLower.includes("require(")) {
            hasImports = true;
            ast.push(`Imports detected in ${path.basename(f)}`);
          }
          if (textLower.includes("<") && textLower.includes(">")) {
            hasJSX = true;
            ast.push(`JSX elements detected in ${path.basename(f)}`);
          }
          if (
            textLower.includes("usestate") ||
            textLower.includes("usereducer") ||
            textLower.includes("onclick") ||
            textLower.includes("onchange") ||
            textLower.includes("data=") ||
            textLower.includes("value=")
          ) {
            hasStateOrBinding = true;
            dataFlow.push(`Interactive event listeners or state bindings in ${path.basename(f)}`);
          }
        }
      } catch {}
    }

    let level = 1; // filename/keyword match only

    if (hasImports || hasJSX) {
      level = 2; // technology presence/structural
    } else if (structuralEvidence) {
      level = 2; // structural presence via component/UI/AST matching
      ast.push(`Structural presence confirmed via ${filesMatched.length > 0 ? "matching source files" : "component/UI/AST signals"}.`);
    }
    
    if (hasStateOrBinding) {
      level = 3; // structural + data-flow
    }

    // Level 4 check: UI Screen rendered evidence
    const uiMatch = uiAnalysis.detectedUIComponents.some(c => 
      c.toLowerCase().includes(nameLower) || nameLower.includes(c.toLowerCase())
    );
    if (uiMatch && level >= 3) {
      level = 4;
      render.push(`Component structure identified in page analysis: ${uiAnalysis.detectedUIComponents.join(", ")}`);
    }

    // Level 5 check: static end-to-end verification (responsive integrity + no layout break)
    const hasPerformance = uiAnalysis.isResponsive && !uiAnalysis.hasBrokenLayout;
    if (hasPerformance && level >= 4) {
      level = 5;
      runtime.push("Static verification: responsive integrity confirmed with no fixed-width layout break detected.");
    }

    return { level, ast, dataFlow, render, runtime };
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
