import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class SeoPlugin implements IEvaluationPlugin {
  name = "SEO Engine";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      let hasMetaDesc = false;
      let hasTitleTag = false;
      let h1Count = 0;

      const scanHtml = (filePath: string) => {
        const content = fs.readFileSync(filePath, "utf-8");
        
        if (/<title>/i.test(content) || /title:\s*['"]/i.test(content)) {
          hasTitleTag = true;
        }

        if (/<meta[^>]*name=["']description["']/i.test(content) || /description:\s*['"]/i.test(content)) {
          hasMetaDesc = true;
        }

        const h1Matches = content.match(/<h1[^>]*>/gi);
        if (h1Matches) {
          h1Count += h1Matches.length;
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
            const ext = path.extname(file);
            if (ext === ".html" || ext === ".tsx" || ext === ".jsx" || ext === ".js") {
              scanHtml(fullPath);
            }
          }
        }
      };

      if (fs.existsSync(workspacePath)) {
        walk(workspacePath);
      }

      if (hasTitleTag) {
        evidence.push("SEO Audit: Document contains descriptive page title tags.");
      } else {
        warnings.push("Document is missing page title headers.");
        recommendations.push("Ensure every landing route exports unique meta titles.");
        score -= 3;
      }

      if (hasMetaDesc) {
        evidence.push("SEO Audit: Document contains page description metadata.");
      } else {
        warnings.push("Document is missing meta descriptions.");
        recommendations.push("Include a descriptive meta tag for search engines.");
        score -= 3;
      }

      if (h1Count === 1) {
        evidence.push("SEO Heading structure: Found exactly one single <h1> per page layout.");
      } else if (h1Count > 1) {
        warnings.push(`Multiple <h1> headings found (${h1Count}). Standard SEO guidelines prefer one single <h1> per page.`);
        score -= 1;
      } else {
        warnings.push("No <h1> heading detected in HTML body layout.");
        score -= 1;
      }

    } catch (e: any) {
      errors.push(`SEO audit failed: ${e.message}`);
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
