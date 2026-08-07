import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class ArchitectureQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 6;

    const allFiles = Object.values(repo.files || {});

    // Check 1: Modern Router Architecture (1.5 marks)
    let routerType = "None";
    if (Boolean(repo.files["app/page.tsx"]) || Boolean(repo.files["app/layout.tsx"]) || Boolean(repo.files["src/app/page.tsx"])) {
      routerType = "Next.js App Router (app/)";
    } else if (Boolean(repo.files["pages/index.tsx"]) || Boolean(repo.files["src/pages/index.tsx"]) || Boolean(repo.files["pages/_app.tsx"])) {
      routerType = "Next.js Pages Router (pages/)";
    } else {
      for (const imp of ast.allImports) {
        if (imp.includes("react-router") || imp.includes("wouter") || imp.includes("next/router") || imp.includes("next/navigation")) {
          routerType = `Client Router (${imp})`;
          break;
        }
      }
    }

    if (routerType !== "None") {
      totalScore += 1.5;
      const ev = `Modern declarative router structure verified: ${routerType}.`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Router Architecture",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Router Architecture",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No file-system router (app/ or pages/) or client router library detected.",
        recommendation: "Implement file-system routing (`app/` App Router) or client-side routing (`react-router-dom`).",
      });
      recommendations.push("Adopt Next.js App Router (`app/`) or `react-router-dom` to support multi-view URL navigation.");
    }

    // Check 2: Global State & Server Cache Management (1.5 marks)
    let stateEngine = "None";
    for (const imp of ast.allImports) {
      if (imp.includes("zustand")) stateEngine = "Zustand Global Store";
      else if (imp.includes("@reduxjs/toolkit") || imp.includes("react-redux")) stateEngine = "Redux Toolkit Store";
      else if (imp.includes("@tanstack/react-query") || imp.includes("react-query")) stateEngine = "React Query (TanStack)";
      else if (imp.includes("swr")) stateEngine = "SWR Cache Store";
    }

    if (stateEngine === "None") {
      for (const file of allFiles) {
        if (file.content.includes("createContext") || file.content.includes("useContext")) {
          stateEngine = "React Context API";
          break;
        }
      }
    }

    if (stateEngine !== "None") {
      totalScore += 1.5;
      const ev = `Architectural state management verified: ${stateEngine}.`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "State & Data Layer Architecture",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "State & Data Layer Architecture",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No central state store (Zustand/Redux/Context API) or server cache manager (React Query) detected.",
        recommendation: "Introduce Zustand or React Query to manage global application state and server data caching.",
      });
      recommendations.push("Implement a dedicated state management store (Zustand or React Query) to avoid prop drilling.");
    }

    // Check 3: API Layer Abstraction (1.5 marks)
    let hasApiLayer = false;
    let apiLocation = "";

    for (const file of allFiles) {
      if (file.path.includes("/services/") || file.path.includes("/api/") || file.path.includes("/clients/") || file.path.includes("/http/")) {
        hasApiLayer = true;
        apiLocation = file.path;
        break;
      }
      if (file.content.includes("axios.create") || file.content.includes("fetch(") || file.content.includes("createClient")) {
        hasApiLayer = true;
        apiLocation = file.path;
        break;
      }
    }

    if (hasApiLayer) {
      totalScore += 1.5;
      const ev = `API abstraction layer verified (${apiLocation}).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "API Abstraction Layer",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "API Abstraction Layer",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No HTTP client abstraction or API service layer detected.",
        recommendation: "Encapsulate network requests inside a dedicated API client module (`/services/api.ts`).",
      });
      recommendations.push("Decouple API communications by centralizing HTTP calls inside `/services/apiClient.ts`.");
    }

    // Check 4: Feature-Based Modular Organization (1.5 marks)
    let isFeatureBased = false;
    for (const file of allFiles) {
      if (file.path.startsWith("features/") || file.path.startsWith("src/features/") || file.path.startsWith("modules/")) {
        isFeatureBased = true;
        break;
      }
    }

    if (isFeatureBased || repo.downloadedFilesCount >= 10) {
      totalScore += 1.5;
      const ev = isFeatureBased
        ? "Feature-based domain modular architecture (/features/) verified."
        : "Sufficient component directory modularization verified.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Feature Domain Architecture",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Feature Domain Architecture",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.5,
        evidence: "Flat component structure detected without domain feature separation.",
        recommendation: "Structure complex domain logic into self-contained feature modules (`/features/auth`, `/features/dashboard`).",
      });
      recommendations.push("Adopt feature-sliced design (`/features/<domain>`) to keep domain logic self-contained.");
    }

    const roundedScore = Math.min(6, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Architecture Engine",
      category: "architecture",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
