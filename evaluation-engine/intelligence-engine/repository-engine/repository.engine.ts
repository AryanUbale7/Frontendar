import * as fs from "fs";
import * as path from "path";

export interface ASTPatternAnalysis {
  detectedHooks: string[];
  detectedContexts: string[];
  stateManagement: string[];
  detectedForms: string[];
  detectedValidationLibs: string[];
  detectedAuthLibs: string[];
  detectedChartLibs: string[];
  detectedAPICallPatterns: string[];
  detectedDBModels: string[];
  functionalComponentsCount: number;
  jsxElementCount: number;
}

export interface RepositoryAnalysisResult {
  framework: string;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown";
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  allDependencies: string[];
  allSourceFiles: string[];
  detectedLanguages: {
    typescriptPercent: number;
    javascriptPercent: number;
    cssPercent: number;
    htmlPercent: number;
  };
  detectedFilesCount: number;
  detectedComponents: string[];
  hasTsConfig: boolean;
  hasTailwind: boolean;
  buildScriptPresent: boolean;
  astPatterns: ASTPatternAnalysis;
}

export class RepositoryEngine {
  public analyzeRepository(workspacePath: string): RepositoryAnalysisResult {
    const allFiles = this.scanAllFiles(workspacePath);
    let packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown" = "npm";

    if (fs.existsSync(path.join(workspacePath, "pnpm-lock.yaml"))) packageManager = "pnpm";
    else if (fs.existsSync(path.join(workspacePath, "yarn.lock"))) packageManager = "yarn";
    else if (fs.existsSync(path.join(workspacePath, "bun.lockb"))) packageManager = "bun";

    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let buildScriptPresent = false;

    const pkgPath = path.join(workspacePath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        dependencies = pkgJson.dependencies || {};
        devDependencies = pkgJson.devDependencies || {};
        buildScriptPresent = !!(pkgJson.scripts && pkgJson.scripts.build);
      } catch {}
    }

    const allDepsKeys = Array.from(new Set([...Object.keys(dependencies), ...Object.keys(devDependencies)]));
    let framework = "Vanilla HTML/JS";

    if (allDepsKeys.includes("next")) framework = "Next.js";
    else if (allDepsKeys.includes("react")) framework = "React";
    else if (allDepsKeys.includes("vue")) framework = "Vue.js";
    else if (allDepsKeys.includes("@angular/core")) framework = "Angular";
    else if (allDepsKeys.includes("svelte")) framework = "Svelte";

    let tsFiles = 0;
    let jsFiles = 0;
    let cssFiles = 0;
    let htmlFiles = 0;
    const detectedComponents: string[] = [];

    const astPatterns: ASTPatternAnalysis = {
      detectedHooks: [],
      detectedContexts: [],
      stateManagement: [],
      detectedForms: [],
      detectedValidationLibs: [],
      detectedAuthLibs: [],
      detectedChartLibs: [],
      detectedAPICallPatterns: [],
      detectedDBModels: [],
      functionalComponentsCount: 0,
      jsxElementCount: 0,
    };

    if (allDepsKeys.includes("zustand")) astPatterns.stateManagement.push("Zustand");
    if (allDepsKeys.includes("redux") || allDepsKeys.includes("@reduxjs/toolkit")) astPatterns.stateManagement.push("Redux");
    if (allDepsKeys.includes("recharts")) astPatterns.detectedChartLibs.push("Recharts");
    if (allDepsKeys.includes("chart.js")) astPatterns.detectedChartLibs.push("Chart.js");
    if (allDepsKeys.includes("zod")) astPatterns.detectedValidationLibs.push("Zod");
    if (allDepsKeys.includes("yup")) astPatterns.detectedValidationLibs.push("Yup");
    if (allDepsKeys.includes("next-auth")) astPatterns.detectedAuthLibs.push("NextAuth");
    if (allDepsKeys.includes("@clerk/nextjs")) astPatterns.detectedAuthLibs.push("Clerk");
    if (allDepsKeys.includes("prisma")) astPatterns.detectedDBModels.push("Prisma ORM");

    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      const base = path.basename(file, ext);

      if (ext === ".ts" || ext === ".tsx") tsFiles++;
      if (ext === ".js" || ext === ".jsx") jsFiles++;
      if (ext === ".css" || ext === ".scss" || ext === ".less") cssFiles++;
      if (ext === ".html" || ext === ".htm") htmlFiles++;

      if (
        [".tsx", ".jsx", ".vue", ".ts", ".js"].includes(ext) &&
        base.charAt(0) === base.charAt(0).toUpperCase() &&
        base !== "Page" &&
        base !== "Layout"
      ) {
        if (!detectedComponents.includes(base)) {
          detectedComponents.push(base);
        }
      }

      if ([".ts", ".tsx", ".js", ".jsx", ".vue"].includes(ext)) {
        if (process.env.ENABLE_AST_EVALUATION === "false") {
          continue;
        }
        try {
          const content = fs.readFileSync(file, "utf-8");

          // Hook detection
          const hookMatches = content.match(/use[A-Z][a-zA-Z0-9]*/g);
          if (hookMatches) {
            hookMatches.forEach((h) => {
              if (!astPatterns.detectedHooks.includes(h)) astPatterns.detectedHooks.push(h);
            });
          }

          // Functional component detection
          if (content.includes("export default function") || content.includes("const ") || content.includes("class ")) {
            astPatterns.functionalComponentsCount++;
          }

          // JSX UI Elements
          const jsxMatches = content.match(/<[A-Za-z][A-Za-z0-9]*/g);
          if (jsxMatches) {
            astPatterns.jsxElementCount += jsxMatches.length;
          }

          if (content.includes("createContext") || content.includes("AuthContext") || content.includes("useContext")) {
            if (!astPatterns.detectedContexts.includes("React Context")) astPatterns.detectedContexts.push("React Context");
          }

          if (content.includes("<form") || content.includes("useForm") || content.includes("<input")) {
            if (!astPatterns.detectedForms.includes("HTML/React Forms")) astPatterns.detectedForms.push("HTML/React Forms");
          }

          if (content.includes("fetch(") || content.includes("axios.") || content.includes("useQuery")) {
            if (!astPatterns.detectedAPICallPatterns.includes("HTTP API Client")) astPatterns.detectedAPICallPatterns.push("HTTP API Client");
          }
        } catch {}
      }
    }

    const totalLangFiles = tsFiles + jsFiles + cssFiles + htmlFiles || 1;

    return {
      framework,
      packageManager,
      dependencies,
      devDependencies,
      allDependencies: allDepsKeys,
      allSourceFiles: allFiles,
      detectedLanguages: {
        typescriptPercent: Math.round((tsFiles / totalLangFiles) * 100),
        javascriptPercent: Math.round((jsFiles / totalLangFiles) * 100),
        cssPercent: Math.round((cssFiles / totalLangFiles) * 100),
        htmlPercent: Math.round((htmlFiles / totalLangFiles) * 100),
      },
      detectedFilesCount: allFiles.length,
      detectedComponents,
      hasTsConfig: fs.existsSync(path.join(workspacePath, "tsconfig.json")),
      hasTailwind:
        allDepsKeys.includes("tailwindcss") ||
        fs.existsSync(path.join(workspacePath, "tailwind.config.js")) ||
        fs.existsSync(path.join(workspacePath, "tailwind.config.ts")),
      buildScriptPresent,
      astPatterns,
    };
  }

  private scanAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return [];
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          if (
            file !== ".git" &&
            file !== "node_modules" &&
            file !== ".next" &&
            file !== "dist" &&
            file !== "build" &&
            file !== "out"
          ) {
            this.scanAllFiles(filePath, fileList);
          }
        } else {
          fileList.push(filePath);
        }
      }
    } catch {}
    return fileList;
  }
}
