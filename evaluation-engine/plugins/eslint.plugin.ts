import { execSync } from "child_process";
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
      // 1. ESLint Real CLI Execution & JSON Parsing
      let totalLintErrors = 0;
      let totalLintWarnings = 0;

      try {
        const eslintOutput = execSync(`npx -y eslint "${workspacePath}" --format json`, {
          timeout: 10000,
          maxBuffer: 10 * 1024 * 1024,
          encoding: "utf-8",
        });
        const parsed = JSON.parse(eslintOutput);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            totalLintErrors += item.errorCount || 0;
            totalLintWarnings += item.warningCount || 0;
          });
        }
      } catch (err: any) {
        if (err.stdout) {
          try {
            const parsed = JSON.parse(err.stdout);
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                totalLintErrors += item.errorCount || 0;
                totalLintWarnings += item.warningCount || 0;
              });
            }
          } catch {}
        }
      }

      evidence.push(`Real ESLint Audit Results: ${totalLintErrors} errors, ${totalLintWarnings} warnings detected.`);

      if (totalLintErrors > 0) {
        warnings.push(`ESLint static check found ${totalLintErrors} syntax/rule error(s).`);
        score -= Math.min(6, totalLintErrors);
      }

      // 2. TypeScript Compiler Real CLI Execution (tsc --noEmit)
      let tsErrorsCount = 0;
      const tsconfigPath = path.join(workspacePath, "tsconfig.json");

      if (fs.existsSync(tsconfigPath)) {
        evidence.push("Found tsconfig.json file in root workspace.");
        try {
          execSync(`npx -y tsc --noEmit --project "${workspacePath}"`, { timeout: 10000, stdio: "pipe" });
          evidence.push("TypeScript Compiler API Check: 0 type errors detected (Clean build!).");
        } catch (tscErr: any) {
          const tscLogs = String(tscErr.stdout || tscErr.stderr || "");
          const matches = tscLogs.match(/error TS\d+/g);
          tsErrorsCount = matches ? matches.length : 1;
          warnings.push(`TypeScript Compiler API Check: Detected ${tsErrorsCount} type/syntax error(s).`);
          score -= Math.min(5, tsErrorsCount);
        }
      } else {
        warnings.push("tsconfig.json configuration file missing.");
        score -= 3;
      }

      // 3. Scan code files for TS usage ratio and comment density
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

        try {
          const lines = fs.readFileSync(filePath, "utf-8").split("\n");
          totalLinesCount += lines.length;
          for (const line of lines) {
            if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
              commentsLinesCount++;
            }
          }
        } catch {}
      };

      const walk = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file === "node_modules" || file === ".git" || file === ".next" || file === "dist" || file === "build") continue;
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
          } else {
            analyzeFile(fullPath);
          }
        }
      };

      walk(workspacePath);

      const totalSourceFiles = tsFilesCount + jsFilesCount;
      if (totalSourceFiles > 0) {
        const tsPercent = Math.round((tsFilesCount / totalSourceFiles) * 100);
        evidence.push(`Source files metrics: ${totalSourceFiles} files (TypeScript: ${tsPercent}%, JavaScript: ${100 - tsPercent}%).`);
      }

      if (totalLinesCount > 0) {
        const commentsDensity = Math.round((commentsLinesCount / totalLinesCount) * 100);
        evidence.push(`Codebase line metrics: Total lines: ${totalLinesCount}, Comment density: ${commentsDensity}%.`);
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
