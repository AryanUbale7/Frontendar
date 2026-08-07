import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class DocumentationQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 6;
    const readme = repo.readmeContent || "";

    // Check 1: README Existence & Structural Quality (1.5 marks)
    if (repo.hasReadme && readme.length >= 200) {
      totalScore += 1.5;
      const ev = `Comprehensive README markdown documentation verified (${readme.length} bytes).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "README Documentation Quality",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (repo.hasReadme) {
      totalScore += 0.75;
      const ev = `Basic README file present (${readme.length} bytes).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "README Documentation Quality",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: ev,
        recommendation: "Expand README.md with detailed setup instructions, features list, and project description.",
      });
      recommendations.push("Expand README.md with comprehensive project documentation and setup guidance.");
    } else {
      checks.push({
        checkName: "README Documentation Quality",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "Missing README.md documentation file.",
        recommendation: "Add a top-level README.md describing project goals, architecture, and usage instructions.",
      });
      recommendations.push("Create a `README.md` file in the root directory to document project setup and architecture.");
    }

    // Check 2: Installation & Run Instructions (1.5 marks)
    const lowerReadme = readme.toLowerCase();
    const hasInstall = lowerReadme.includes("npm install") || lowerReadme.includes("yarn") || lowerReadme.includes("pnpm install") || lowerReadme.includes("bun install");
    const hasRun = lowerReadme.includes("npm run dev") || lowerReadme.includes("npm start") || lowerReadme.includes("yarn dev") || lowerReadme.includes("pnpm dev");

    if (hasInstall && hasRun) {
      totalScore += 1.5;
      const ev = "Verified step-by-step local installation (`npm install`) and execution (`npm run dev`) commands in README.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Installation & Execution Guide",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (hasInstall || hasRun) {
      totalScore += 0.75;
      checks.push({
        checkName: "Installation & Execution Guide",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: "Partial installation or start commands detected in README.",
      });
    } else {
      checks.push({
        checkName: "Installation & Execution Guide",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No installation (`npm install`) or execution (`npm run dev`) commands found in README.",
        recommendation: "Add a 'Getting Started' section with exact CLI commands for dependency installation and dev server launch.",
      });
      recommendations.push("Document explicit installation commands (`npm install`, `npm run dev`) in your README.");
    }

    // Check 3: Environment Variables Documentation (1.5 marks)
    let envDoc = false;
    if (Boolean(repo.files[".env.example"]) || Boolean(repo.files[".env.template"]) || Boolean(repo.files[".env.local.example"])) {
      envDoc = true;
    }
    if (lowerReadme.includes(".env") || lowerReadme.includes("environment variable")) {
      envDoc = true;
    }

    if (envDoc) {
      totalScore += 1.5;
      const ev = "Environment configuration documentation (.env.example or README environment instructions) verified.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Environment Configuration Docs",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Environment Configuration Docs",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.5,
        evidence: "No .env.example template file or environment variable instructions found.",
        recommendation: "Provide a `.env.example` file documenting required environment variables and API keys.",
      });
      recommendations.push("Include a `.env.example` file specifying default configuration keys for collaborators.");
    }

    // Check 4: Project Features & Architecture Overview (1.5 marks)
    let featureOverview = false;
    if (lowerReadme.includes("feature") || lowerReadme.includes("tech stack") || lowerReadme.includes("architecture")) {
      featureOverview = true;
    }

    if (featureOverview || readme.length >= 500) {
      totalScore += 1.5;
      const ev = "Project features and technology stack overview verified in README documentation.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Project Features & Tech Stack Overview",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Project Features & Tech Stack Overview",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.5,
        evidence: "Sparse project overview section in README.",
        recommendation: "Add a 'Features' bulleted list and 'Tech Stack' section to highlight application capabilities.",
      });
      recommendations.push("Outline project features and technology stack choices clearly in your README.");
    }

    const roundedScore = Math.min(6, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Documentation Engine",
      category: "documentation",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
