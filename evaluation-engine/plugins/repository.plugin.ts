import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class RepositoryPlugin implements IEvaluationPlugin {
  name = "Repository Analyzer";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      // 1. Detect Package Manager
      const lockFiles = [
        { file: "package-lock.json", manager: "npm" },
        { file: "yarn.lock", manager: "yarn" },
        { file: "pnpm-lock.yaml", manager: "pnpm" }
      ];

      let detectedManager = "npm (Default)";
      for (const lf of lockFiles) {
        if (fs.existsSync(path.join(workspacePath, lf.file))) {
          detectedManager = lf.manager;
          evidence.push(`Detected package manager: ${lf.manager} via lockfile ${lf.file}`);
          break;
        }
      }
      if (detectedManager.includes("Default")) {
        warnings.push("No lockfile found (package-lock.json, yarn.lock, pnpm-lock.yaml missing).");
        recommendations.push("Commit your package lockfile to ensure repeatable dependency builds.");
        score -= 2;
      }

      // 2. Read package.json to detect Framework / Language
      const packageJsonPath = path.join(workspacePath, "package.json");
      let framework = "Vanilla HTML/JS";
      let language = "JavaScript";

      if (fs.existsSync(packageJsonPath)) {
        const pkgContent = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        const deps = { ...pkgContent.dependencies, ...pkgContent.devDependencies };

        if (deps["next"]) {
          framework = "Next.js";
        } else if (deps["vite"]) {
          framework = "Vite App";
        } else if (deps["react"]) {
          framework = "React SPA";
        }

        if (deps["typescript"]) {
          language = "TypeScript";
        }

        evidence.push(`Project dependencies parsed: Framework: ${framework}, Language: ${language}`);
      } else {
        errors.push("package.json is missing in root folder.");
        recommendations.push("Create a package.json file to manage node modules and scripts.");
        score = 0;
      }

      // 3. Count codebase files & folders
      let fileCount = 0;
      const walk = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file === "node_modules" || file === ".git" || file === ".next") continue;
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else {
            fileCount++;
          }
        }
      };

      if (fs.existsSync(workspacePath)) {
        walk(workspacePath);
        evidence.push(`Total source files detected: ${fileCount} files.`);
      }

      // 4. Folder structure check
      const expectedDirs = ["src", "components", "app", "pages"];
      const detectedDirs = expectedDirs.filter(d => fs.existsSync(path.join(workspacePath, d)));
      if (detectedDirs.length > 0) {
        evidence.push(`Detected directory structure paths: ${detectedDirs.join(", ")}`);
      } else {
        warnings.push("Non-standard workspace directory layout. Missing standard src/ or components/ structure.");
        score = Math.max(0, score - 1);
      }

    } catch (e: any) {
      errors.push(`Directory scanner error: ${e.message}`);
      score = 0;
    }

    return {
      score,
      maxScore,
      evidence,
      warnings,
      errors,
      recommendations
    };
  }
}
