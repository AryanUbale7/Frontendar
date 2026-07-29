import { RepositoryPlugin } from "./plugins/repository.plugin";
import { ReadmePlugin } from "./plugins/readme.plugin";
import { EslintPlugin } from "./plugins/eslint.plugin";
import { SecurityPlugin } from "./plugins/security.plugin";
import { LighthousePlugin } from "./plugins/lighthouse.plugin";
import { PlaywrightPlugin } from "./plugins/playwright.plugin";
import { AccessibilityPlugin } from "./plugins/accessibility.plugin";
import { SeoPlugin } from "./plugins/seo.plugin";
import { PerformancePlugin } from "./plugins/performance.plugin";
import { IEvaluationPlugin, AuditResult } from "./plugins/plugin.interface";
import { ScoreEngine } from "./score-engine";
import { ReportGenerator, AuditableReport } from "./report-generator";

export class Evaluator {
  private plugins: IEvaluationPlugin[] = [];
  private scoreEngine = new ScoreEngine();
  private reportGenerator = new ReportGenerator();

  constructor() {
    // Register all 9 plugins sequentially
    this.plugins = [
      new RepositoryPlugin(),
      new ReadmePlugin(),
      new EslintPlugin(),
      new SecurityPlugin(),
      new LighthousePlugin(),
      new PlaywrightPlugin(),
      new AccessibilityPlugin(),
      new SeoPlugin(),
      new PerformancePlugin()
    ];
  }

  async runPipeline(
    workspacePath: string,
    repoUrl: string,
    deploymentUrl?: string,
    config?: any
  ): Promise<AuditableReport> {
    const results: Record<string, AuditResult> = {};

    for (const plugin of this.plugins) {
      try {
        const result = await plugin.run(workspacePath, deploymentUrl, config);
        results[plugin.name] = result;
      } catch (err: any) {
        results[plugin.name] = {
          score: 0,
          maxScore: 10,
          evidence: [],
          warnings: [],
          errors: [`Plugin execution crashed: ${err.message}`],
          recommendations: []
        };
      }
    }

    const scores = this.scoreEngine.calculateScore(results);
    const report = this.reportGenerator.generateReport(workspacePath, results, scores, deploymentUrl);

    return report;
  }
}

// Inline CLI execution entrypoint for testing
if (require.main === module) {
  const evaluator = new Evaluator();
  evaluator.runPipeline("./", "https://github.com/test/demo", "https://demo.vercel.app")
    .then(report => {
      console.log("=== AUTOMATED EVALUATION PIPELINE REPORT ===");
      console.log(JSON.stringify(report, null, 2));
    })
    .catch(err => {
      console.error("Pipeline crashed:", err);
    });
}
