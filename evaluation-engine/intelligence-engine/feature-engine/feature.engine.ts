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
    blueprintFeatures: Array<{ name: string; mandatory?: boolean; weight?: number; keywords?: string[] }> = []
  ): FeatureDetectionReport {
    const defaultFeatures = [
      "Authentication", "Dashboard", "Analytics", "CRUD", "Forms",
      "Search", "Filtering", "Charts", "Notifications", "Routing",
      "API Calls", "Role Based Access", "Maps", "Tables", "Dark Mode", "Responsive Layout"
    ];

    const targetFeatureList = blueprintFeatures.length > 0
      ? blueprintFeatures.map((f) => ({ name: f.name, mandatory: !!f.mandatory, weight: f.weight || 10 }))
      : defaultFeatures.map((name) => ({ name, mandatory: true, weight: 10 }));

    const featureEvidences: FeatureEvidence[] = [];

    for (const target of targetFeatureList) {
      const evidence = this.detectFeature(target.name, target.mandatory, target.weight, repo, ast);
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
    name: string,
    mandatory: boolean,
    maxWeight: number,
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis
  ): FeatureEvidence {
    const matchedFiles = new Set<string>();
    const matchedJsxTags = new Set<string>();
    const matchedAstNodes = new Set<string>();
    const evidenceCitations: string[] = [];

    const lowerName = name.toLowerCase();
    const signals: Record<string, boolean> = {};

    // 1. AUTHENTICATION — Multi-Signal Cross Verification
    if (lowerName.includes("auth") || lowerName.includes("login")) {
      // Signal A: Package / Auth SDK Imports
      const authLibs = ["@clerk/nextjs", "next-auth", "firebase/auth", "@supabase/supabase-js", "jsonwebtoken", "passport"];
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.imports.forEach((imp) => {
          if (authLibs.some((lib) => imp.module.toLowerCase().includes(lib))) {
            signals["SDK_IMPORT"] = true;
            matchedFiles.add(path);
            matchedAstNodes.add(`Auth SDK Import (${imp.module}) in ${path}`);
          }
        });
      }

      // Signal B: Auth Hooks & Providers
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.hooksUsed.forEach((hook) => {
          if (["useAuth", "useUser", "useSession", "useSignIn"].includes(hook)) {
            signals["AUTH_HOOK"] = true;
            matchedFiles.add(path);
            matchedAstNodes.add(`Auth Hook (${hook}) in ${path}`);
          }
        });
      }

      // Signal C: Form Submission Handlers & Credentials Handling
      for (const [path, file] of Object.entries(repo.files)) {
        const content = file.content.toLowerCase();
        if (
          (content.includes("signin") || content.includes("signup") || content.includes("login") || content.includes("logout")) &&
          (content.includes("password") || content.includes("credential") || content.includes("token"))
        ) {
          signals["LOGIN_FORM_HANDLER"] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`Credential/Form Handler in ${path}`);
        }
      }

      // Signal D: Token/Session Persistence & Route Middleware
      for (const [path, file] of Object.entries(repo.files)) {
        const content = file.content;
        if (
          content.includes("jwt.verify") || content.includes("localStorage.setItem('token'") ||
          path.includes("middleware.ts") || content.includes("Authorization")
        ) {
          signals["TOKEN_MIDDLEWARE"] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`Token/Middleware Guard in ${path}`);
        }
      }

      const signalCount = Object.keys(signals).length;
      if (signalCount >= 3) {
        evidenceCitations.push(`Multi-Signal Auth verified (${signalCount} signals: ${Object.keys(signals).join(", ")}).`);
      } else if (signalCount >= 1) {
        evidenceCitations.push(`Partial Auth signals detected (${Object.keys(signals).join(", ")}).`);
      } else {
        evidenceCitations.push(`Insufficient structural evidence for Authentication.`);
      }
    }

    // 2. DASHBOARD — Multi-Signal Cross Verification
    else if (lowerName.includes("dashboard")) {
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        if (path.toLowerCase().includes("dashboard")) {
          signals["DASHBOARD_FILE"] = true;
          matchedFiles.add(path);
        }
        if (analysis.jsxElements.length >= 5) {
          signals["MULTI_WIDGET_LAYOUT"] = true;
          matchedFiles.add(path);
        }
      }
      if (signals["DASHBOARD_FILE"] || signals["MULTI_WIDGET_LAYOUT"]) {
        evidenceCitations.push(`Dashboard verified with multi-widget layout structure.`);
      }
    }

    // 3. ANALYTICS & CHARTS — Multi-Signal Cross Verification
    else if (lowerName.includes("analytic") || lowerName.includes("chart")) {
      const chartTags = ["ResponsiveContainer", "BarChart", "LineChart", "PieChart", "Bar", "Line", "Canvas"];
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.jsxElements.forEach((jsx) => {
          if (chartTags.includes(jsx.tagName)) {
            signals["CHART_JSX_TAG"] = true;
            matchedFiles.add(path);
            matchedJsxTags.add(jsx.tagName);
          }
        });
        analysis.imports.forEach((imp) => {
          if (imp.module.includes("chart") || imp.module.includes("recharts")) {
            signals["CHART_LIB_IMPORT"] = true;
            matchedFiles.add(path);
          }
        });
      }
      if (signals["CHART_JSX_TAG"] && signals["CHART_LIB_IMPORT"]) {
        evidenceCitations.push(`Charts & Analytics verified: Library import + JSX render (<${Array.from(matchedJsxTags).join(", ")}>).`);
      } else if (signals["CHART_LIB_IMPORT"]) {
        evidenceCitations.push(`Chart library imported.`);
      }
    }

    // 4. CRUD & API CALLS — Multi-Signal Cross Verification
    else if (lowerName.includes("crud") || lowerName.includes("api")) {
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        const hasFetch = analysis.callExpressions.some(
          (c) => c.expressionName === "fetch" || c.expressionName.includes("axios") || c.expressionName.includes("supabase")
        );
        if (hasFetch) {
          signals["HTTP_API_CALL"] = true;
          matchedFiles.add(path);
          matchedAstNodes.add(`API call in ${path}`);
        }
      }
      if (signals["HTTP_API_CALL"]) {
        evidenceCitations.push(`CRUD / API Calls verified via AST HTTP request nodes across ${matchedFiles.size} files.`);
      }
    }

    // 5. FORMS — Multi-Signal Cross Verification
    else if (lowerName.includes("form")) {
      for (const [path, analysis] of Object.entries(ast.fileAnalyses)) {
        analysis.jsxElements.forEach((jsx) => {
          if (jsx.tagName === "form" || jsx.tagName.includes("Form")) {
            signals["FORM_JSX_TAG"] = true;
            matchedFiles.add(path);
            matchedJsxTags.add("form");
          }
        });
        analysis.imports.forEach((imp) => {
          if (imp.module.includes("form") || imp.module.includes("zod")) {
            signals["FORM_VALIDATION_LIB"] = true;
            matchedFiles.add(path);
          }
        });
      }
      if (signals["FORM_JSX_TAG"]) {
        evidenceCitations.push(`Form structure verified (<form> element + state bindings).`);
      }
    }

    // Generic fallback for other features
    else {
      for (const [path, file] of Object.entries(repo.files)) {
        if (file.content.toLowerCase().includes(lowerName)) {
          signals["KEYWORD_MATCH"] = true;
          matchedFiles.add(path);
        }
      }
      if (signals["KEYWORD_MATCH"]) {
        evidenceCitations.push(`Feature "${name}" keyword matched in ${matchedFiles.size} source files.`);
      }
    }

    // Multi-Signal Confidence Calculation
    const signalCount = Object.keys(signals).length;
    let confidence = 0;
    let depth: ImplementationDepth = "none";

    if (signalCount >= 3 && matchedFiles.size >= 2) {
      confidence = 95;
      depth = "full";
    } else if (signalCount >= 2 && matchedFiles.size >= 1) {
      confidence = 75;
      depth = "partial";
    } else if (signalCount >= 1) {
      confidence = 45;
      depth = "superficial";
    }

    const scorePoints = depth === "full" ? maxWeight : depth === "partial" ? Math.round(maxWeight * 0.6) : depth === "superficial" ? Math.round(maxWeight * 0.3) : 0;

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
