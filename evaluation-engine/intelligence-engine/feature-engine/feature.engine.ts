import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";

export type ImplementationDepth = "full" | "partial" | "superficial" | "none";

export interface FeatureEvidence {
  featureName: string;
  mandatory: boolean;
  maxWeight: number;
  awardedScore: number;
  implementationDepth: ImplementationDepth;
  implementationStatus?: "Implemented" | "Partially Implemented" | "Not Implemented";
  confidencePercent: number;
  confidenceScore?: number;
  matchedFiles: string[];
  matchedJsxTags: string[];
  matchedAstNodes: string[];
  evidenceCitations: string[];
  evidence?: {
    readmeMatches?: string[];
    fileMatches?: string[];
    routeMatches?: string[];
    componentMatches?: string[];
    uiMatches?: string[];
    packageMatches?: string[];
    rejectedClaims?: string[];
    evidenceLevel?: number;
    astEvidence?: string[];
    dataFlowEvidence?: string[];
    renderEvidence?: string[];
    runtimeEvidence?: string[];
  };
}

export type FeatureDetectionResult = FeatureEvidence;

export interface FeatureDetectionReport {
  features: FeatureEvidence[];
  totalFeatureCoveragePercent: number;
  mandatoryFeaturesPassed: boolean;
}

export class FeatureEngine {
  public evaluateFeatures(
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis,
    blueprintFeatures: Array<{
      name: string;
      mandatory?: boolean;
      weight?: number;
      keywords?: string[];
      expectedComponents?: string[];
      expectedAPIs?: string[];
      expectedRoutes?: string[];
    }> = []
  ): FeatureDetectionReport {
    const defaultFeatures = [
      { name: "Authentication", mandatory: true, weight: 10, keywords: ["auth", "login", "jwt", "session"] },
      { name: "Dashboard", mandatory: true, weight: 10, keywords: ["dashboard", "metrics", "grid", "panel"] },
      { name: "Analytics", mandatory: false, weight: 10, keywords: ["analytics", "chart", "graph", "stats"] },
      { name: "CRUD Operations", mandatory: false, weight: 10, keywords: ["create", "update", "delete", "post", "fetch"] },
      { name: "Interactive UI", mandatory: false, weight: 10, keywords: ["button", "modal", "card", "badge", "nav"] }
    ];

    const targetFeatureList = blueprintFeatures.length > 0
      ? blueprintFeatures.map((f) => ({
          name: f.name,
          mandatory: !!f.mandatory,
          weight: f.weight || 10,
          keywords: f.keywords || [],
          expectedComponents: f.expectedComponents || [],
          expectedAPIs: f.expectedAPIs || [],
          expectedRoutes: f.expectedRoutes || []
        }))
      : defaultFeatures;

    const featureEvidences: FeatureEvidence[] = [];

    for (const target of targetFeatureList) {
      const evidence = this.detectFeature(target, repo, ast);
      featureEvidences.push(evidence);
    }

    const mandatoryFeatures = featureEvidences.filter((f) => f.mandatory);
    const mandatoryPassed = mandatoryFeatures.every((f) => f.awardedScore > 0);

    const totalWeight = featureEvidences.reduce((sum, f) => sum + f.maxWeight, 0);
    const awardedWeight = featureEvidences.reduce((sum, f) => sum + f.awardedScore, 0);
    const coveragePercent = totalWeight > 0 ? Math.round((awardedWeight / totalWeight) * 100) : 100;

    return {
      features: featureEvidences,
      totalFeatureCoveragePercent: coveragePercent,
      mandatoryFeaturesPassed: mandatoryPassed
    };
  }

  private detectFeature(
    target: {
      name: string;
      mandatory: boolean;
      weight: number;
      keywords?: string[];
      expectedComponents?: string[];
      expectedAPIs?: string[];
      expectedRoutes?: string[];
    },
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis
  ): FeatureEvidence {
    const { name, mandatory, weight: maxWeight, keywords = [], expectedComponents = [], expectedAPIs = [], expectedRoutes = [] } = target;
    const matchedFiles = new Set<string>();
    const matchedJsxTags = new Set<string>();
    const matchedAstNodes = new Set<string>();
    const evidenceCitations: string[] = [];

    const lowerName = name.toLowerCase();
    const signals: Record<string, boolean> = {};

    const allFiles = Object.values(repo.files || {});
    const allFileEntries = Object.entries(repo.files || {});

    // 1. AUTHENTICATION — Multi-Signal Cross Verification
    if (lowerName.includes("auth") || lowerName.includes("login") || lowerName.includes("security")) {
      const authLibs = ["@clerk/nextjs", "next-auth", "firebase/auth", "@supabase/supabase-js", "jsonwebtoken", "passport", "bcrypt"];
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.imports.forEach((imp) => {
          if (authLibs.some((lib) => imp.module.toLowerCase().includes(lib))) {
            signals["SDK_IMPORT"] = true;
            matchedFiles.add(path);
            matchedAstNodes.add(`Auth SDK Import (${imp.module}) in ${path}`);
          }
        });
        analysis.hooksUsed.forEach((hook) => {
          if (["useAuth", "useUser", "useSession", "useSignIn"].includes(hook)) {
            signals["AUTH_HOOK"] = true;
            matchedFiles.add(path);
            matchedAstNodes.add(`Auth Hook (${hook}) in ${path}`);
          }
        });
      }

      for (const [path, file] of allFileEntries) {
        const content = file.content.toLowerCase();
        if (
          (content.includes("signin") || content.includes("signup") || content.includes("login") || content.includes("logout") || content.includes("auth")) &&
          (content.includes("password") || content.includes("credential") || content.includes("token") || content.includes("session"))
        ) {
          signals["LOGIN_FORM_HANDLER"] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`Credential/Form Handler in ${path}`);
        }
        if (
          content.includes("jwt.verify") || content.includes("localstorage.setitem('token'") ||
          path.includes("middleware.ts") || content.includes("authorization")
        ) {
          signals["TOKEN_MIDDLEWARE"] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`Token/Middleware Guard in ${path}`);
        }
      }

      const signalCount = Object.keys(signals).length;
      if (signalCount >= 2) {
        evidenceCitations.push(`Multi-Signal Auth verified (${signalCount} signals: ${Object.keys(signals).join(", ")}).`);
      } else if (signalCount === 1) {
        evidenceCitations.push(`Partial Auth signal detected (${Object.keys(signals).join(", ")}).`);
      }
    }

    // 2. DASHBOARD & ANALYTICS — Multi-Signal Cross Verification
    if (lowerName.includes("dashboard") || lowerName.includes("analytic") || lowerName.includes("chart")) {
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        if (path.toLowerCase().includes("dashboard") || path.toLowerCase().includes("analytic")) {
          signals["DASHBOARD_FILE"] = true;
          matchedFiles.add(path);
        }
        if (analysis.jsxElements.length >= 5) {
          signals["MULTI_WIDGET_LAYOUT"] = true;
          matchedFiles.add(path);
        }
      }
      const chartTags = ["ResponsiveContainer", "BarChart", "LineChart", "PieChart", "Bar", "Line", "Canvas"];
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.jsxElements.forEach((jsx) => {
          if (chartTags.includes(jsx.tagName)) {
            signals["CHART_JSX_TAG"] = true;
            matchedFiles.add(path);
            matchedJsxTags.add(jsx.tagName);
          }
        });
      }
      if (signals["DASHBOARD_FILE"] || signals["MULTI_WIDGET_LAYOUT"] || signals["CHART_JSX_TAG"]) {
        evidenceCitations.push(`Dashboard/Analytics verified with layout structure & widgets.`);
      }
    }

    // 3. KEYWORD & COMPONENT ADVANCED HEURISTICS SEARCH
    const searchTokens = new Set<string>();
    name.toLowerCase().split(/[\s,_\-\/]+/).forEach((t) => { if (t.length > 2) searchTokens.add(t); });
    keywords.forEach((k) => searchTokens.add(k.toLowerCase()));
    expectedComponents.forEach((c) => searchTokens.add(c.toLowerCase()));
    expectedAPIs.forEach((a) => searchTokens.add(a.toLowerCase()));

    for (const [path, file] of allFileEntries) {
      const lowerPath = path.toLowerCase();
      const lowerContent = file.content.toLowerCase();

      for (const token of searchTokens) {
        if (lowerPath.includes(token)) {
          signals[`PATH_MATCH_${token.toUpperCase()}`] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`Path match "${token}" in ${path}`);
        }
        if (lowerContent.includes(token)) {
          signals[`CONTENT_MATCH_${token.toUpperCase()}`] = true;
          matchedFiles.add(path);
        }
      }
    }

    // Check AST Call Expressions & HTTP API calls
    for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
      const hasHttp = analysis.callExpressions.some(
        (c) => c.expressionName === "fetch" || c.expressionName.includes("axios") || c.expressionName.includes("supabase") || c.expressionName.includes("api")
      );
      if (hasHttp && (lowerName.includes("api") || lowerName.includes("client") || lowerName.includes("crud"))) {
        signals["HTTP_API_CALL"] = true;
        matchedFiles.add(path);
        matchedAstNodes.add(`HTTP API Client call in ${path}`);
      }
    }

    // Multi-Signal Confidence & Implementation Depth Calculation
    const signalCount = Object.keys(signals).length;
    let confidence = 0;
    let depth: ImplementationDepth = "none";

    if (signalCount >= 3 && matchedFiles.size >= 1) {
      confidence = 95;
      depth = "full";
    } else if (signalCount >= 2 && matchedFiles.size >= 1) {
      confidence = 80;
      depth = "full";
    } else if (signalCount === 1) {
      confidence = 60;
      depth = "partial";
    }

    if (evidenceCitations.length === 0 && signalCount > 0) {
      evidenceCitations.push(`Feature "${name}" verified via ${signalCount} structural code signals across ${matchedFiles.size} files.`);
    }

    const scorePoints = depth === "full" ? maxWeight : depth === "partial" ? Math.round(maxWeight * 0.7) : 0;

    return {
      featureName: name,
      mandatory,
      maxWeight,
      awardedScore: scorePoints,
      implementationDepth: depth,
      confidencePercent: confidence,
      matchedFiles: Array.from(matchedFiles),
      matchedJsxTags: Array.from(matchedJsxTags),
      matchedAstNodes: Array.from(matchedAstNodes),
      evidenceCitations
    };
  }
}
