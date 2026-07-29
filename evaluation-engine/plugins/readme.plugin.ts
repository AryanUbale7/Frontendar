import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class ReadmePlugin implements IEvaluationPlugin {
  name = "README Analyzer";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 10;
    const maxScore = 10;

    const readmePaths = [
      path.join(workspacePath, "README.md"),
      path.join(workspacePath, "readme.md"),
      path.join(workspacePath, "README.txt")
    ];

    let foundPath = "";
    for (const p of readmePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      errors.push("README.md is missing from repository root.");
      recommendations.push("Add a README.md file in Markdown format containing local development setup steps.");
      return { score: 0, maxScore, evidence, warnings, errors, recommendations };
    }

    try {
      const content = fs.readFileSync(foundPath, "utf-8");
      evidence.push(`Found README.md file (${content.length} characters long).`);

      // 1. Check for installation guide
      if (/install|setup|npm install|yarn install/i.test(content)) {
        evidence.push("README contains installation setup steps.");
      } else {
        warnings.push("No setup or installation guidelines detected in README.");
        recommendations.push("Include an 'Installation' header in your README with commands to launch the workspace.");
        score -= 2;
      }

      // 2. Check for usage guide
      if (/usage|run|npm run|start|npm start/i.test(content)) {
        evidence.push("README contains usage/run guidelines.");
      } else {
        warnings.push("No running instructions detected (e.g. 'npm run dev').");
        recommendations.push("Include a section showing how to start the development server locally.");
        score -= 2;
      }

      // 3. Check for environment variables
      if (/env|variables|secrets|credentials/i.test(content)) {
        evidence.push("README contains environment variables setup guidelines.");
      } else {
        warnings.push("No environment variables setups or .env references mentioned.");
        score -= 1;
      }

      // 4. Check for deployment URL references
      if (/deploy|vercel|netlify|live/i.test(content)) {
        evidence.push("README refers to deployment hosting links.");
      } else {
        warnings.push("No live deployment URL references found in README.");
        score -= 1;
      }

    } catch (e: any) {
      errors.push(`README parser error: ${e.message}`);
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
