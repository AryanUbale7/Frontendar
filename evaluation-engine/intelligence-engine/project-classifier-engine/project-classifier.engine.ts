import * as fs from "fs";
import * as path from "path";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";
import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";
import { ProjectType, ClassificationResult, ClassificationEvidence } from "./project-type.interface";
import { PROJECT_BLUEPRINTS } from "./project-blueprints.registry";

export class ProjectClassifierEngine {
  public classifyProject(
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    defaultBlueprint?: KnowledgeBlueprint,
    workspacePath?: string
  ): ClassificationResult {
    const evidenceScores: Record<ProjectType, ClassificationEvidence> = {
      "Todo App": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Landing Page": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Dashboard": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Admin Panel": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "E-Commerce": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Chat App": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Hospital": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Education": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "SaaS": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "CRM": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Finance": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Analytics": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Blog": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Documentation Site": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Developer Portfolio": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Portfolio": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "Clone Project": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 0 },
      "General Web App": { matchedRoutes: [], matchedComponents: [], matchedPackages: [], matchedModels: [], readmeKeywords: [], score: 1 },
    };

    // Normalize text sources
    const routePaths = routeResults.detectedRoutes.map((r) => `${r.filePath.toLowerCase()} ${r.pattern.toLowerCase()}`);
    const components = repoAnalysis.detectedComponents.map((c) => c.toLowerCase());
    const packages = repoAnalysis.allDependencies.map((p) => p.toLowerCase());
    const models = (repoAnalysis.astPatterns?.detectedDBModels || []).map((m) => m.toLowerCase());
    
    let readmeText = "";
    if (workspacePath && fs.existsSync(path.join(workspacePath, "README.md"))) {
      try {
        readmeText = fs.readFileSync(path.join(workspacePath, "README.md"), "utf-8").toLowerCase();
      } catch {}
    }

    // Helper: evaluate category match rules
    const addScore = (
      type: ProjectType,
      pts: number,
      reason: string,
      targetArray: "matchedRoutes" | "matchedComponents" | "matchedPackages" | "matchedModels" | "readmeKeywords"
    ) => {
      evidenceScores[type].score += pts;
      evidenceScores[type][targetArray].push(reason);
    };

    // --- 1. Todo App Indicators ---
    routePaths.forEach((r) => { if (r.includes("todo") || r.includes("task")) addScore("Todo App", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("todo") || c.includes("tasklist") || c.includes("addtask") || c.includes("taskitem")) {
        addScore("Todo App", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    models.forEach((m) => { if (m.includes("todo") || m.includes("task")) addScore("Todo App", 25, `Model: ${m}`, "matchedModels"); });
    if (readmeText.includes("todo") || readmeText.includes("task manager") || readmeText.includes("todolist")) {
      addScore("Todo App", 25, "README: Todo keywords", "readmeKeywords");
    }

    // --- 2. Landing Page Indicators ---
    components.forEach((c) => {
      if (c.includes("hero") || c.includes("banner") || c.includes("featuregrid") || c.includes("pricingtable") || c.includes("cta")) {
        addScore("Landing Page", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("landing page") || readmeText.includes("product page") || readmeText.includes("hero section")) {
      addScore("Landing Page", 25, "README: Landing Page keywords", "readmeKeywords");
    }

    // --- 3. Dashboard Indicators ---
    routePaths.forEach((r) => { if (r.includes("dashboard") || r.includes("analytics") || r.includes("metrics")) addScore("Dashboard", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("dashboard") || c.includes("chart") || c.includes("statcard") || c.includes("kpi") || c.includes("datatable") || c.includes("metrics")) {
        addScore("Dashboard", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    packages.forEach((p) => {
      if (p.includes("recharts") || p.includes("chart.js") || p.includes("apexcharts") || p.includes("d3") || p.includes("victory")) {
        addScore("Dashboard", 25, `Package: ${p}`, "matchedPackages");
        addScore("Analytics", 20, `Package: ${p}`, "matchedPackages");
      }
    });
    if (readmeText.includes("dashboard") || readmeText.includes("kpi metrics") || readmeText.includes("data visualization")) {
      addScore("Dashboard", 25, "README: Dashboard keywords", "readmeKeywords");
    }

    // --- 4. Admin Panel Indicators ---
    routePaths.forEach((r) => { if (r.includes("admin") || r.includes("roles") || r.includes("users")) addScore("Admin Panel", 20, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("usertable") || c.includes("roleselector") || c.includes("adminsidebar") || c.includes("auditlog")) {
        addScore("Admin Panel", 25, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("admin panel") || readmeText.includes("admin dashboard") || readmeText.includes("user management")) {
      addScore("Admin Panel", 25, "README: Admin keywords", "readmeKeywords");
    }

    // --- 5. E-Commerce Indicators ---
    routePaths.forEach((r) => {
      if (r.includes("cart") || r.includes("checkout") || r.includes("product") || r.includes("shop") || r.includes("order")) {
        addScore("E-Commerce", 15, `Route: ${r}`, "matchedRoutes");
      }
    });
    components.forEach((c) => {
      if (c.includes("product") || c.includes("cart") || c.includes("checkout") || c.includes("price") || c.includes("quantity")) {
        addScore("E-Commerce", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    packages.forEach((p) => {
      if (p.includes("stripe") || p.includes("paypal") || p.includes("commerce") || p.includes("snipcart")) {
        addScore("E-Commerce", 30, `Package: ${p}`, "matchedPackages");
      }
    });
    models.forEach((m) => {
      if (m.includes("product") || m.includes("order") || m.includes("cart") || m.includes("inventory")) {
        addScore("E-Commerce", 25, `Model: ${m}`, "matchedModels");
      }
    });
    if (readmeText.includes("e-commerce") || readmeText.includes("shopping cart") || readmeText.includes("storefront") || readmeText.includes("shop")) {
      addScore("E-Commerce", 25, "README: E-Commerce keywords", "readmeKeywords");
    }

    // --- 6. Chat App Indicators ---
    routePaths.forEach((r) => { if (r.includes("chat") || r.includes("messages") || r.includes("channel") || r.includes("room")) addScore("Chat App", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("chat") || c.includes("message") || c.includes("channel") || c.includes("conversation") || c.includes("avatar")) {
        addScore("Chat App", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    packages.forEach((p) => {
      if (p.includes("socket.io") || p.includes("pusher") || p.includes("stream-chat") || p.includes("ably")) {
        addScore("Chat App", 30, `Package: ${p}`, "matchedPackages");
      }
    });
    models.forEach((m) => { if (m.includes("message") || m.includes("conversation") || m.includes("room")) addScore("Chat App", 25, `Model: ${m}`, "matchedModels"); });
    if (readmeText.includes("chat app") || readmeText.includes("messaging") || readmeText.includes("realtime chat")) {
      addScore("Chat App", 25, "README: Chat keywords", "readmeKeywords");
    }

    // --- 7. Hospital Indicators ---
    routePaths.forEach((r) => {
      if (r.includes("patient") || r.includes("doctor") || r.includes("appointment") || r.includes("medical") || r.includes("hospital")) {
        addScore("Hospital", 20, `Route: ${r}`, "matchedRoutes");
      }
    });
    components.forEach((c) => {
      if (c.includes("patient") || c.includes("doctor") || c.includes("appointment") || c.includes("medical") || c.includes("prescription")) {
        addScore("Hospital", 25, `Component: ${c}`, "matchedComponents");
      }
    });
    models.forEach((m) => { if (m.includes("patient") || m.includes("doctor") || m.includes("appointment")) addScore("Hospital", 30, `Model: ${m}`, "matchedModels"); });
    if (readmeText.includes("hospital") || readmeText.includes("patient management") || readmeText.includes("healthcare") || readmeText.includes("doctor")) {
      addScore("Hospital", 30, "README: Hospital keywords", "readmeKeywords");
    }

    // --- 8. Education Indicators ---
    routePaths.forEach((r) => {
      if (r.includes("course") || r.includes("lesson") || r.includes("quiz") || r.includes("student") || r.includes("learn")) {
        addScore("Education", 20, `Route: ${r}`, "matchedRoutes");
      }
    });
    components.forEach((c) => {
      if (c.includes("course") || c.includes("lesson") || c.includes("quiz") || c.includes("syllabus") || c.includes("videoplayer")) {
        addScore("Education", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    models.forEach((m) => { if (m.includes("course") || m.includes("lesson") || m.includes("quiz") || m.includes("enrollment")) addScore("Education", 25, `Model: ${m}`, "matchedModels"); });
    if (readmeText.includes("course") || readmeText.includes("learning platform") || readmeText.includes("education") || readmeText.includes("lms")) {
      addScore("Education", 25, "README: Education keywords", "readmeKeywords");
    }

    // --- 9. SaaS Indicators ---
    routePaths.forEach((r) => { if (r.includes("billing") || r.includes("pricing") || r.includes("subscription") || r.includes("workspace")) addScore("SaaS", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("pricing") || c.includes("subscription") || c.includes("plan") || c.includes("billing") || c.includes("workspace")) {
        addScore("SaaS", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("saas") || readmeText.includes("subscription") || readmeText.includes("pro plan")) {
      addScore("SaaS", 25, "README: SaaS keywords", "readmeKeywords");
    }

    // --- 10. CRM Indicators ---
    routePaths.forEach((r) => { if (r.includes("leads") || r.includes("contacts") || r.includes("pipeline") || r.includes("deals")) addScore("CRM", 20, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("lead") || c.includes("contact") || c.includes("pipeline") || c.includes("kanban") || c.includes("deal")) {
        addScore("CRM", 25, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("crm") || readmeText.includes("lead management") || readmeText.includes("sales pipeline")) {
      addScore("CRM", 30, "README: CRM keywords", "readmeKeywords");
    }

    // --- 11. Finance Indicators ---
    routePaths.forEach((r) => { if (r.includes("bank") || r.includes("transfer") || r.includes("transaction") || r.includes("wallet")) addScore("Finance", 20, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("balance") || c.includes("transaction") || c.includes("bankcard") || c.includes("wallet") || c.includes("expense")) {
        addScore("Finance", 25, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("finance") || readmeText.includes("fintech") || readmeText.includes("bank") || readmeText.includes("wallet")) {
      addScore("Finance", 30, "README: Finance keywords", "readmeKeywords");
    }

    // --- 12. Analytics Indicators ---
    routePaths.forEach((r) => { if (r.includes("traffic") || r.includes("funnel") || r.includes("visitors") || r.includes("metrics")) addScore("Analytics", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("realtime") || c.includes("visitor") || c.includes("funnel") || c.includes("bounce")) {
        addScore("Analytics", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("analytics") || readmeText.includes("web traffic") || readmeText.includes("real-time metrics")) {
      addScore("Analytics", 25, "README: Analytics keywords", "readmeKeywords");
    }

    // --- 13. Blog Indicators ---
    routePaths.forEach((r) => { if (r.includes("blog") || r.includes("post") || r.includes("article") || r.includes("author")) addScore("Blog", 15, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("postcard") || c.includes("articlebody") || c.includes("featuredpost") || c.includes("authorcard")) {
        addScore("Blog", 20, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("blog") || readmeText.includes("articles") || readmeText.includes("posts")) {
      addScore("Blog", 20, "README: Blog keywords", "readmeKeywords");
    }

    // --- 14. Documentation Site Indicators ---
    routePaths.forEach((r) => { if (r.includes("docs") || r.includes("documentation") || r.includes("guide")) addScore("Documentation Site", 20, `Route: ${r}`, "matchedRoutes"); });
    components.forEach((c) => {
      if (c.includes("docssidebar") || c.includes("codeblock") || c.includes("tableofcontents") || c.includes("docsearch")) {
        addScore("Documentation Site", 25, `Component: ${c}`, "matchedComponents");
      }
    });
    packages.forEach((p) => {
      if (p.includes("@mdx-js") || p.includes("docusaurus") || p.includes("nextra") || p.includes("prismjs")) {
        addScore("Documentation Site", 30, `Package: ${p}`, "matchedPackages");
      }
    });
    if (readmeText.includes("documentation") || readmeText.includes("docs site") || readmeText.includes("api docs")) {
      addScore("Documentation Site", 25, "README: Docs keywords", "readmeKeywords");
    }

    // --- 15. Developer Portfolio & Portfolio Indicators ---
    components.forEach((c) => {
      if (c.includes("aboutme") || c.includes("skill") || c.includes("experience") || c.includes("resume") || c.includes("projects")) {
        addScore("Developer Portfolio", 20, `Component: ${c}`, "matchedComponents");
        addScore("Portfolio", 15, `Component: ${c}`, "matchedComponents");
      }
    });
    if (readmeText.includes("developer portfolio") || readmeText.includes("personal website") || readmeText.includes("software engineer portfolio")) {
      addScore("Developer Portfolio", 30, "README: Developer Portfolio keywords", "readmeKeywords");
    } else if (readmeText.includes("portfolio")) {
      addScore("Portfolio", 25, "README: Portfolio keywords", "readmeKeywords");
    }

    // --- 16. Clone Project Indicators ---
    if (
      readmeText.includes("clone") ||
      readmeText.includes("replica") ||
      readmeText.includes("spotify clone") ||
      readmeText.includes("netflix clone") ||
      readmeText.includes("twitter clone") ||
      readmeText.includes("youtube clone") ||
      readmeText.includes("airbnb clone")
    ) {
      addScore("Clone Project", 40, "README: Clone Project keywords", "readmeKeywords");
    }

    // --- Select Winner Category ---
    let highestType: ProjectType = "General Web App";
    let highestScore = 0;
    const categoryScores: Record<string, number> = {};

    (Object.keys(evidenceScores) as ProjectType[]).forEach((type) => {
      const item = evidenceScores[type];
      categoryScores[type] = item.score;
      if (item.score > highestScore) {
        highestScore = item.score;
        highestType = type;
      }
    });

    // If default blueprint was provided with an explicit title that matches a problem statement, check for user override.
    // The override only applies when the repo shows real evidence — an empty or unrelated repo must not
    // be auto-classified as the challenge type (that would fabricate Problem Alignment marks).
    if (defaultBlueprint && defaultBlueprint.problemStatement && defaultBlueprint.problemStatement.title) {
      const titleLower = defaultBlueprint.problemStatement.title.toLowerCase();
      const hasRepoEvidence =
        repoAnalysis.detectedFilesCount > 0 ||
        routeResults.detectedRoutes.length > 0 ||
        repoAnalysis.detectedComponents.length > 0;
      (Object.keys(PROJECT_BLUEPRINTS) as ProjectType[]).forEach((type) => {
        if (titleLower.includes(type.toLowerCase())) {
          const hasTypeSignals = evidenceScores[type].score > 0;
          if (hasRepoEvidence && hasTypeSignals) {
            highestType = type;
            highestScore = Math.max(highestScore, 50);
            addScore(type, 50, `Blueprint explicit title match: "${defaultBlueprint.problemStatement.title}"`, "readmeKeywords");
          }
        }
      });
    }

    // Calculate confidence percentage
    const confidencePercent = Math.min(100, Math.round((highestScore / 60) * 100));

    // Summary citations
    const winnerEvidence = evidenceScores[highestType];
    const evidenceSummary: string[] = [
      ...winnerEvidence.matchedRoutes,
      ...winnerEvidence.matchedComponents,
      ...winnerEvidence.matchedPackages,
      ...winnerEvidence.matchedModels,
      ...winnerEvidence.readmeKeywords,
    ];

    if (evidenceSummary.length === 0) {
      evidenceSummary.push("General Web App fallback applied due to neutral component & route structure.");
    }

    const selectedBlueprint = PROJECT_BLUEPRINTS[highestType] || PROJECT_BLUEPRINTS["General Web App"];

    return {
      detectedProjectType: highestType,
      confidencePercent,
      evidenceSummary,
      categoryScores,
      selectedBlueprint,
    };
  }
}
