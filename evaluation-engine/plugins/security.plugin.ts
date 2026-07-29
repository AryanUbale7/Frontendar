import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class SecurityPlugin implements IEvaluationPlugin {
  name = "Security Engine";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 15;
    const maxScore = 15;

    try {
      // 1. Detect raw secrets / API keys patterns in source files
      // Pattern matches typical API keys: e.g. AIzaSy..., SG...., secret_key...
      const secretRegex = /(AIzaSy[A-Za-z0-9_\\-]{33}|SG\.[A-Za-z0-9_\\-]{22}\.[A-Za-z0-9_\\-]{43}|sk_live_[A-Za-z0-9]{24})/i;

      let secretsFoundCount = 0;
      const scanFile = (filePath: string) => {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        if (secretRegex.test(fileContent)) {
          secretsFoundCount++;
          errors.push(`VULNERABILITY: Exposed hardcoded secret API key found in ${path.relative(workspacePath, filePath)}`);
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
            scanFile(fullPath);
          }
        }
      };

      if (fs.existsSync(workspacePath)) {
        walk(workspacePath);
      }

      if (secretsFoundCount === 0) {
        evidence.push("Secrets check passed: No raw credentials or API tokens leaked in codebase.");
      } else {
        recommendations.push("Move all credentials/API keys to environment variables and reference them using process.env.");
        score = Math.max(0, score - 8);
      }

      // 2. Scan for env files committed in workspace
      const forbiddenEnvFiles = [".env", ".env.local", ".env.production", ".env.development"];
      let hasEnvLeaked = false;
      for (const envFile of forbiddenEnvFiles) {
        if (fs.existsSync(path.join(workspacePath, envFile))) {
          hasEnvLeaked = true;
          errors.push(`VULNERABILITY: Environment file '${envFile}' is committed to repository.`);
        }
      }

      if (hasEnvLeaked) {
        recommendations.push("Add all .env files to your .gitignore to prevent committing credentials.");
        score = Math.max(0, score - 5);
      } else {
        evidence.push("Environment variable protection: No raw config variables or secrets committed in root directory.");
      }

    } catch (e: any) {
      errors.push(`Security scanner execution error: ${e.message}`);
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
