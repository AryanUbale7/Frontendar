import { FeatureDetectionResult } from "../feature-engine/feature.engine";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";

export interface InferenceRuleResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  confidencePercent: number;
  reason: string;
  evidenceCitations: string[];
}

export class InferenceEngine {
  public runInference(
    features: FeatureDetectionResult[],
    repo: RepositoryAnalysisResult,
    routes: RouteMappingResult,
    ui: UIDetectionResult
  ): InferenceRuleResult[] {
    const rules: InferenceRuleResult[] = [];

    // Rule 1: Authentication Rule
    const hasAuthFiles = features.some((f) => f.featureName.toLowerCase().includes("auth") && f.implemented);
    const hasAuthUI = ui.hasAuthPages;
    const hasAuthRoutes = routes.detectedRoutes.some((r) => r.pattern.includes("login") || r.pattern.includes("auth"));
    const authTriggered = hasAuthFiles || hasAuthUI || hasAuthRoutes;
    rules.push({
      ruleId: "RULE_AUTH_VERIFICATION",
      ruleName: "Authentication Module Compliance",
      triggered: authTriggered,
      confidencePercent: authTriggered ? (hasAuthFiles && hasAuthUI && hasAuthRoutes ? 100 : 80) : 0,
      reason: authTriggered
        ? "IF Login Page exists AND Auth routes/UI exist THEN Authentication confidence = 100%"
        : "No authentication entry points or auth components detected.",
      evidenceCitations: authTriggered
        ? [
            hasAuthUI ? "Detected Login / Auth UI components" : "",
            hasAuthRoutes ? "Detected authentication route endpoints" : "",
          ].filter(Boolean)
        : ["Missing auth files and login pages."],
    });

    // Rule 2: Dashboard Analytics Rule
    const hasDashboardUI = ui.hasDashboard;
    const hasCharts = ui.hasCharts;
    const hasAnalyticsRoute = routes.detectedRoutes.some(
      (r) => r.pattern.includes("dashboard") || r.pattern.includes("analytics")
    );
    const dashTriggered = hasDashboardUI && (hasCharts || hasAnalyticsRoute);
    rules.push({
      ruleId: "RULE_DASHBOARD_VERIFICATION",
      ruleName: "Dashboard & Analytics Feature Compliance",
      triggered: dashTriggered,
      confidencePercent: dashTriggered ? 100 : hasDashboardUI ? 60 : 0,
      reason: dashTriggered
        ? "IF Dashboard detected AND Charts detected AND Analytics route detected THEN Dashboard feature = Implemented"
        : "Partial or missing analytics dashboard layout.",
      evidenceCitations: dashTriggered
        ? ["Verified interactive Dashboard Cards", "Verified Analytics Visualizations"]
        : ["Dashboard charts or analytics routes incomplete."],
    });

    // Rule 3: Framework & Architecture Rule
    const isModernFramework = repo.framework === "Next.js" || repo.framework === "React";
    const hasCleanStructure = repo.detectedLanguages.typescriptPercent > 50 || repo.hasTailwind;
    rules.push({
      ruleId: "RULE_ARCHITECTURE_COMPLIANCE",
      ruleName: "Modern Architecture Compliance",
      triggered: isModernFramework && hasCleanStructure,
      confidencePercent: isModernFramework && hasCleanStructure ? 100 : 70,
      reason: `IF Framework is ${repo.framework} AND TypeScript usage = ${repo.detectedLanguages.typescriptPercent}% THEN Architecture = Compliant`,
      evidenceCitations: [
        `Framework: ${repo.framework}`,
        `TypeScript usage: ${repo.detectedLanguages.typescriptPercent}%`,
        `Package manager: ${repo.packageManager}`,
      ],
    });

    return rules;
  }
}
