import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { SynonymEngine } from "../synonym-engine/synonym.engine";

export type ImplementationDepth = "full" | "partial" | "superficial" | "none";

export interface FeatureEvidence {
  featureName: string;
  mandatory: boolean;
  maxWeight: number;
  awardedScore: number;
  description?: string;
  implementationDepth: ImplementationDepth;
  implementationStatus?: "Implemented" | "Partially Implemented" | "Not Implemented";
  confidencePercent: number;
  confidenceScore?: number;
  matchedFiles: string[];
  matchedJsxTags: string[];
  matchedAstNodes: string[];
  evidenceCitations: string[];
}

export type FeatureDetectionResult = FeatureEvidence;

export interface FeatureDetectionReport {
  features: FeatureEvidence[];
  totalFeatureCoveragePercent: number;
  mandatoryFeaturesPassed: boolean;
  missingMandatoryFeatures: string[];
}

export class FeatureEngine {
  private synonymEngine = new SynonymEngine();

  public evaluateFeatures(
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis,
    blueprintFeatures: Array<{
      name: string;
      mandatory?: boolean;
      weight?: number;
      description?: string;
      keywords?: string[];
      synonyms?: string[];
      expectedComponents?: string[];
      expectedAPIs?: string[];
      expectedRoutes?: string[];
    }> = [],
    customSynonymDict?: Record<string, string[]>
  ): FeatureDetectionReport {
    if (customSynonymDict) {
      this.synonymEngine.updateDictionary(customSynonymDict);
    }

    const defaultFeatures = [
      { name: "Authentication", mandatory: true, weight: 10, description: "User login and session management", keywords: ["auth", "login", "jwt", "session"] },
      { name: "Dashboard", mandatory: true, weight: 10, description: "Main overview panel and widgets", keywords: ["dashboard", "metrics", "grid", "panel"] },
      { name: "Analytics", mandatory: false, weight: 10, description: "Data visualizations and charts", keywords: ["analytics", "chart", "graph", "stats"] },
      { name: "CRUD Operations", mandatory: false, weight: 10, description: "Data management operations", keywords: ["create", "update", "delete", "post", "fetch"] },
      { name: "Interactive UI", mandatory: false, weight: 10, description: "Responsive UI components", keywords: ["button", "modal", "card", "badge", "nav"] }
    ];

    const targetFeatureList = blueprintFeatures.length > 0
      ? blueprintFeatures.map((f) => {
          this.synonymEngine.addFeatureSynonyms(f.name, f.synonyms);
          return {
            name: f.name,
            mandatory: !!f.mandatory,
            weight: f.weight || 10,
            description: f.description || "",
            keywords: f.keywords || [],
            synonyms: f.synonyms || [],
            expectedComponents: f.expectedComponents || [],
            expectedAPIs: f.expectedAPIs || [],
            expectedRoutes: f.expectedRoutes || []
          };
        })
      : defaultFeatures;

    const featureEvidences: FeatureEvidence[] = [];

    for (const target of targetFeatureList) {
      const evidence = this.detectFeature(target, repo, ast);
      featureEvidences.push(evidence);
    }

    const mandatoryFeatures = featureEvidences.filter((f) => f.mandatory);
    const missingMandatory = mandatoryFeatures.filter((f) => f.awardedScore === 0).map((f) => f.featureName);
    const mandatoryPassed = missingMandatory.length === 0;

    const totalWeight = featureEvidences.reduce((sum, f) => sum + f.maxWeight, 0);
    const awardedWeight = featureEvidences.reduce((sum, f) => sum + f.awardedScore, 0);
    const coveragePercent = totalWeight > 0 ? Math.round((awardedWeight / totalWeight) * 100) : 100;

    return {
      features: featureEvidences,
      totalFeatureCoveragePercent: coveragePercent,
      mandatoryFeaturesPassed: mandatoryPassed,
      missingMandatoryFeatures: missingMandatory
    };
  }

  private detectFeature(
    target: {
      name: string;
      mandatory: boolean;
      weight: number;
      description?: string;
      keywords?: string[];
      synonyms?: string[];
      expectedComponents?: string[];
      expectedAPIs?: string[];
      expectedRoutes?: string[];
    },
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis
  ): FeatureEvidence {
    const { name, mandatory, weight: maxWeight, description = "", keywords = [], synonyms = [], expectedComponents = [], expectedAPIs = [], expectedRoutes = [] } = target;
    const matchedFiles = new Set<string>();
    const matchedJsxTags = new Set<string>();
    const matchedAstNodes = new Set<string>();
    const evidenceCitations: string[] = [];

    const lowerName = name.toLowerCase();
    const signals: Record<string, boolean> = {};

    const allFileEntries = Object.entries(repo.files || {});

    // Expand search terms using SynonymEngine and aliases
    const searchTokens = new Set<string>();
    name.toLowerCase().split(/[\s,_\-\/]+/).forEach((t) => { if (t.length > 2) searchTokens.add(t); });
    keywords.forEach((k) => searchTokens.add(k.toLowerCase()));
    synonyms.forEach((s) => searchTokens.add(s.toLowerCase()));
    expectedComponents.forEach((c) => searchTokens.add(c.toLowerCase()));
    expectedAPIs.forEach((a) => searchTokens.add(a.toLowerCase()));
    expectedRoutes.forEach((r) => searchTokens.add(r.toLowerCase()));

    // Add synonyms from SynonymEngine
    const synonymAliases = this.synonymEngine.getAliases(name);
    synonymAliases.forEach((alias) => searchTokens.add(alias.toLowerCase()));

    // 1. Specialized Multi-Signal Checks for Authentication / Login / Auth
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
      }
    }

    // 2. Specialized Multi-Signal Checks for Dashboard & Analytics
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
    }

    // 3. Keyword, Component, API, Route, and AST Evidence Search across repository files
    for (const [path, file] of allFileEntries) {
      const lowerPath = path.toLowerCase();
      const lowerContent = file.content.toLowerCase();

      for (const token of searchTokens) {
        if (token.length < 2) continue;
        if (lowerPath.includes(token)) {
          signals[`PATH_MATCH_${token.toUpperCase()}`] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`File path match for term "${token}" in ${path}`);
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
      if (hasHttp && (lowerName.includes("api") || lowerName.includes("client") || lowerName.includes("crud") || lowerName.includes("data"))) {
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

    if (signalCount > 0) {
      const fileListStr = Array.from(matchedFiles).slice(0, 3).join(", ");
      evidenceCitations.push(
        `Feature "${name}" verified: ${depth.toUpperCase()} implementation depth (${signalCount} signal matches across files [${fileListStr}]).`
      );
    } else {
      evidenceCitations.push(
        `Feature "${name}" FAILED: No source-code, component, or AST evidence detected in repository.`
      );
    }

    const scorePoints = depth === "full" ? maxWeight : depth === "partial" ? Math.round(maxWeight * 0.7) : 0;

    return {
      featureName: name,
      mandatory,
      maxWeight,
      description,
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
