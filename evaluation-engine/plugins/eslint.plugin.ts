import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class EslintPlugin implements IEvaluationPlugin {
  name = "Static Analysis & Linter";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 20;
    const maxScore = 20;

    try {
      // 1. Check for ESLint configuration files
      const eslintFiles = [
        "eslint.config.mjs",
        "eslint.config.js",
        ".eslintrc.json",
        ".eslintrc.js",
        ".eslintrc"
      ];

      let hasConfig = false;
      for (const f of eslintFiles) {
        if (fs.existsSync(path.join(workspacePath, f))) {
          hasConfig = true;
          evidence.push(`Found ESLint configuration: ${f}`);
          break;
        }
      }

      if (!hasConfig) {
        warnings.push("ESLint configuration file is missing in workspace root.");
        recommendations.push("Add an eslint config file (e.g. eslint.config.mjs) to enforce code style linting.");
        score -= 4;
      }

      // 2. Scan code files for TS usage ratio
      let tsFilesCount = 0;
      let jsFilesCount = 0;
      let totalLinesCount = 0;
      let commentsLinesCount = 0;

      const analyzeFile = (filePath: string) => {
        const ext = path.extname(filePath);
        if (ext === ".ts" || ext === ".tsx") {
          tsFilesCount++;
        } else if (ext === ".js" || ext === ".jsx") {
          jsFilesCount++;
        } else {
          return;
        }

        const lines = fs.readFileSync(filePath, "utf-8").split("\n");
        totalLinesCount += lines.length;
        for (const line of lines) {
          if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
            commentsLinesCount++;
          }
        }
      };

      const walk = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file === "node_modules" || file === ".git" || file === ".next" || file === "dist") continue;
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else {
            analyzeFile(fullPath);
          }
        }
      };

      if (fs.existsSync(workspacePath)) {
        walk(workspacePath);
      }

      const totalSourceFiles = tsFilesCount + jsFilesCount;
      if (totalSourceFiles > 0) {
        const tsPercent = Math.round((tsFilesCount / totalSourceFiles) * 100);
        evidence.push(`Source files found: ${totalSourceFiles} (TypeScript: ${tsPercent}%, JavaScript: ${100 - tsPercent}%).`);
        
        if (tsPercent < 80) {
          warnings.push(`Low TypeScript usage (${tsPercent}%). The blueprint prefers TypeScript.`);
          score -= 3;
        }
      }

      if (totalLinesCount > 0) {
        const commentsDensity = Math.round((commentsLinesCount / totalLinesCount) * 100);
        evidence.push(`Codebase line metrics: Total lines: ${totalLinesCount}, Comment lines: ${commentsLinesCount} (Density: ${commentsDensity}%).`);
        
        if (commentsDensity < 5) {
          warnings.push(`Low comments density (${commentsDensity}%). Code might be harder to audit.`);
          recommendations.push("Provide descriptive block comments on core helper hooks and components.");
          score -= 2;
        }
      }

    } catch (e: any) {
      errors.push(`Static analyzer execution failed: ${e.message}`);
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
