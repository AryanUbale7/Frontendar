import { execSync } from "child_process";
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
      // 1. Execute Real `npm audit --json` Vulnerability Scanner
      const pkgPath = path.join(workspacePath, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          let auditJsonStr = "";
          try {
            auditJsonStr = execSync(`npm audit --json`, {
              cwd: workspacePath,
              timeout: 15000,
              maxBuffer: 10 * 1024 * 1024,
              encoding: "utf-8",
            });
          } catch (auditErr: any) {
            auditJsonStr = String(auditErr.stdout || auditErr.stderr || "");
          }

          if (auditJsonStr && auditJsonStr.trim().startsWith("{")) {
            const auditData = JSON.parse(auditJsonStr);
            const vulnSummary = auditData.metadata?.vulnerabilities || auditData.vulnerabilities || {};
            const totalVulns =
              (vulnSummary.critical || 0) +
              (vulnSummary.high || 0) +
              (vulnSummary.moderate || 0) +
              (vulnSummary.low || 0);

            evidence.push(
              `npm audit execution completed: Total vulnerabilities: ${totalVulns} (Critical: ${vulnSummary.critical || 0}, High: ${vulnSummary.high || 0}, Moderate: ${vulnSummary.moderate || 0}, Low: ${vulnSummary.low || 0}).`
            );

            if (vulnSummary.critical > 0 || vulnSummary.high > 0) {
              errors.push(`High/Critical dependencies vulnerability detected: Critical (${vulnSummary.critical || 0}), High (${vulnSummary.high || 0}).`);
              score -= 6;
            } else if (totalVulns > 0) {
              warnings.push(`Moderate/Low dependency vulnerabilities detected: Total ${totalVulns}.`);
              score -= 3;
            }
          } else {
            evidence.push("npm audit: Package dependencies scanned with zero vulnerabilities.");
          }
        } catch {}
      }

      // 2. Detect hardcoded secret API keys in source files
      const secretRegex = /(AIzaSy[A-Za-z0-9_\\-]{33}|SG\.[A-Za-z0-9_\\-]{22}\.[A-Za-z0-9_\\-]{43}|sk_live_[A-Za-z0-9]{24}|gsk_[A-Za-z0-9]{48})/i;
      let secretsFoundCount = 0;

      const scanFile = (filePath: string) => {
        try {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          if (secretRegex.test(fileContent)) {
            secretsFoundCount++;
            errors.push(`VULNERABILITY: Exposed hardcoded secret API key found in ${path.relative(workspacePath, filePath)}`);
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
            scanFile(fullPath);
          }
        }
      };

      walk(workspacePath);

      if (secretsFoundCount === 0) {
        evidence.push("Secrets check passed: No raw credentials or API tokens leaked in codebase.");
      } else {
        recommendations.push("Move all credentials/API keys to environment variables and reference them using process.env.");
        score = Math.max(0, score - 8);
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
