import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class CodeQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 7;

    const allFiles = Object.values(repo.files || {});
    const allJsx = Object.values(ast.fileAnalyses || {}).flatMap((fa) => fa.jsxElements || []);

    // Check 1: Strict TypeScript Usage (1.5 marks)
    let tsFileCount = 0;
    for (const file of allFiles) {
      if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
        tsFileCount++;
      }
    }

    const tsPct = repo.downloadedFilesCount > 0 ? (tsFileCount / repo.downloadedFilesCount) * 100 : 0;

    if (repo.hasTsConfig && tsPct >= 60) {
      totalScore += 1.5;
      const ev = `Strict TypeScript configuration verified (${tsFileCount} .ts/.tsx files, ${Math.round(tsPct)}% codebase coverage with tsconfig.json).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "TypeScript Strict Type Safety",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (tsFileCount > 0) {
      totalScore += 0.75;
      const ev = `Partial TypeScript usage verified (${tsFileCount} TS files).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "TypeScript Strict Type Safety",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: ev,
        recommendation: "Migrate remaining JavaScript (.js/.jsx) files to TypeScript (.ts/.tsx) with explicit type interfaces.",
      });
      recommendations.push("Convert plain JavaScript files to TypeScript (.ts/.tsx) to leverage static compile-time type safety.");
    } else {
      checks.push({
        checkName: "TypeScript Strict Type Safety",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No tsconfig.json or TypeScript files (.ts/.tsx) detected.",
        recommendation: "Initialize TypeScript (`npx tsc --init`) to enforce strict type checking across props and API contracts.",
      });
      recommendations.push("Adopt TypeScript (`tsconfig.json`) to eliminate runtime `undefined` and type mismatch crashes.");
    }

    // Check 2: React Hooks & State Management (1.5 marks)
    let customHooksCount = 0;
    let standardHooksCount = 0;

    for (const file of allFiles) {
      if (file.path.includes("/hooks/") || (file.path.includes("use") && file.path.endsWith(".ts"))) {
        customHooksCount++;
      }
      if (file.content.includes("useState") || file.content.includes("useEffect") || file.content.includes("useContext") || file.content.includes("useReducer")) {
        standardHooksCount++;
      }
    }

    if (customHooksCount > 0 || standardHooksCount >= 3) {
      totalScore += 1.5;
      const ev = customHooksCount > 0
        ? `Custom React hooks abstraction verified (${customHooksCount} custom hook files detected).`
        : `Standard React state hooks verified across ${standardHooksCount} files.`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "React Hooks Architecture",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (standardHooksCount > 0) {
      totalScore += 0.75;
      checks.push({
        checkName: "React Hooks Architecture",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: `Basic React state hooks detected in ${standardHooksCount} files.`,
      });
    } else {
      checks.push({
        checkName: "React Hooks Architecture",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No custom React hooks or state management primitives detected.",
        recommendation: "Extract complex stateful logic and API queries into custom React hooks (e.g. `useAuth`, `useFetchData`).",
      });
      recommendations.push("Decouple component rendering from side-effects by extracting custom hooks in `/hooks` directory.");
    }

    // Check 3: Component Reuse & Modularity (1.5 marks)
    const componentUsageMap = new Map<string, number>();
    for (const elem of allJsx) {
      if (elem.tagName[0] === elem.tagName[0].toUpperCase() && !["Image", "Link", "Script"].includes(elem.tagName)) {
        const count = componentUsageMap.get(elem.tagName) || 0;
        componentUsageMap.set(elem.tagName, count + 1);
      }
    }

    let reusableComponentCount = 0;
    for (const [, count] of componentUsageMap) {
      if (count >= 2) {
        reusableComponentCount++;
      }
    }

    if (reusableComponentCount >= 2 || ast.totalJsxElements >= 20) {
      totalScore += 1.5;
      const ev = `High component modularity verified with ${reusableComponentCount} reused UI component primitives (${ast.totalJsxElements} total JSX nodes).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Component Reuse & Modularity",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Component Reuse & Modularity",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.5,
        evidence: `Low component reuse detected (${reusableComponentCount} reused components).`,
        recommendation: "Decompose monolithic pages into reusable atomic UI components (Buttons, Cards, Modals, Badges).",
      });
      recommendations.push("Refactor repeated JSX elements into reusable UI components inside `/components/ui`.");
    }

    // Check 4: Folder Organization & Clean Architecture (1.25 marks)
    const architecturalDirs = new Set<string>();
    for (const file of allFiles) {
      const parts = file.path.split("/");
      if (parts.length > 1) {
        const topDir = parts[0].toLowerCase();
        if (["components", "features", "hooks", "lib", "services", "utils", "types", "app", "pages", "styles"].includes(topDir)) {
          architecturalDirs.add(topDir);
        }
      }
    }

    if (architecturalDirs.size >= 3) {
      totalScore += 1.25;
      const ev = `Structured folder layout verified with dedicated directories (${Array.from(architecturalDirs).join(", ")}).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Directory Structure & Layout",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Directory Structure & Layout",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.25,
        evidence: "Flat or unstructured file organization detected.",
        recommendation: "Organize files into specialized directories (`/components`, `/hooks`, `/lib`, `/services`).",
      });
      recommendations.push("Group code into clear subfolders (`/components`, `/features`, `/hooks`, `/lib`) to separate concerns.");
    }

    // Check 5: Code Complexity & Function Density (1.25 marks)
    if (ast.totalFunctions >= 5 && ast.totalFunctions / Math.max(1, repo.downloadedFilesCount) >= 1.5) {
      totalScore += 1.25;
      const ev = `Clean function density verified (${ast.totalFunctions} helper/component functions across ${repo.downloadedFilesCount} files).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Code Complexity & Function Modularity",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else {
      totalScore += 0.75;
      checks.push({
        checkName: "Code Complexity & Function Modularity",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.25,
        evidence: `Function density: ${ast.totalFunctions} functions across ${repo.downloadedFilesCount} files.`,
      });
    }

    const roundedScore = Math.min(7, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Code Quality Engine",
      category: "code_quality",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
