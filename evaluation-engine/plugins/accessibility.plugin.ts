import * as fs from "fs";
import * as path from "path";
import { IEvaluationPlugin, AuditResult } from "./plugin.interface";

export class AccessibilityPlugin implements IEvaluationPlugin {
  name = "Accessibility Engine";

  async run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult> {
    const evidence: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 10;
    const maxScore = 10;

    try {
      let ariaLabelsFound = 0;
      let altTextMissing = 0;
      let htmlTagsCount = 0;

      const scanHtmlFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, "utf-8");
        
        // Count ARIA attributes
        const ariaMatches = content.match(/aria-[a-z]+/gi);
        if (ariaMatches) {
          ariaLabelsFound += ariaMatches.length;
        }

        // Count image tags missing alt text
        const imgTags = content.match(/<img[^>]*>/gi);
        if (imgTags) {
          for (const img of imgTags) {
            if (!/alt\s*=/i.test(img)) {
              altTextMissing++;
            }
          }
        }

        // Count semantic HTML5 tags
        const semanticTags = ["header", "nav", "main", "article", "section", "aside", "footer"];
        for (const tag of semanticTags) {
          const regex = new RegExp(`<${tag}[^>]*>`, "gi");
          const tagMatches = content.match(regex);
          if (tagMatches) {
            htmlTagsCount += tagMatches.length;
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
            const ext = path.extname(file);
            if (ext === ".html" || ext === ".tsx" || ext === ".jsx") {
              scanHtmlFile(fullPath);
            }
          }
        }
      };

      if (fs.existsSync(workspacePath)) {
        walk(workspacePath);
      }

      evidence.push(`Accessibility audit: Found ${ariaLabelsFound} ARIA attributes and ${htmlTagsCount} semantic HTML5 elements.`);

      if (altTextMissing > 0) {
        warnings.push(`Detected ${altTextMissing} image tag(s) missing 'alt' attributes.`);
        recommendations.push("Provide descriptive alt descriptions to all <img> tags to assist screen readers.");
        score -= 2;
      } else {
        evidence.push("All detected image tags contain alt descriptions.");
      }

      if (htmlTagsCount === 0) {
        warnings.push("No semantic HTML5 layout tags (nav, main, footer) detected in page structures.");
        recommendations.push("Replace basic container divs with semantic elements (e.g., <nav>, <main>) to support page structure navigation.");
        score -= 2;
      }

    } catch (e: any) {
      errors.push(`Accessibility scanner execution failed: ${e.message}`);
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
