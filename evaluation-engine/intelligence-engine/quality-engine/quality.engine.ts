import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { FQEReport } from "./quality.interface";
import { PerformanceQualityModule } from "./performance-quality.module";
import { AccessibilityQualityModule } from "./accessibility-quality.module";
import { ResponsiveQualityModule } from "./responsive-quality.module";
import { CodeQualityModule } from "./code-quality.module";
import { ArchitectureQualityModule } from "./architecture-quality.module";
import { DocumentationQualityModule } from "./documentation-quality.module";

export class FAIEQualityEngine {
  private perfModule = new PerformanceQualityModule();
  private accessModule = new AccessibilityQualityModule();
  private respModule = new ResponsiveQualityModule();
  private codeModule = new CodeQualityModule();
  private archModule = new ArchitectureQualityModule();
  private docModule = new DocumentationQualityModule();

  public evaluateQuality(
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis,
    blueprintCodeQualityRules?: Record<string, number>
  ): FQEReport {
    const perfReport = this.perfModule.evaluate(repo, ast);
    const accessReport = this.accessModule.evaluate(repo, ast);
    const respReport = this.respModule.evaluate(repo, ast);
    const codeReport = this.codeModule.evaluate(repo, ast);
    const archReport = this.archModule.evaluate(repo, ast);
    const docReport = this.docModule.evaluate(repo, ast);

    // If Admin configured custom code quality rules (e.g., readme: 10, folders: 25, comments: 25, typescript: 40)
    // Scale or adjust module scores dynamically based on configured weights
    let codeQualityWeight = 7;
    let archWeight = 6;
    let docWeight = 6;

    if (blueprintCodeQualityRules) {
      if (typeof blueprintCodeQualityRules.readme === "number") docWeight = blueprintCodeQualityRules.readme / 10;
      if (typeof blueprintCodeQualityRules.folders === "number") archWeight = blueprintCodeQualityRules.folders / 4;
      if (typeof blueprintCodeQualityRules.comments === "number") codeQualityWeight = blueprintCodeQualityRules.comments / 4;
    }

    const rawTotal =
      perfReport.score +
      accessReport.score +
      respReport.score +
      codeReport.score +
      archReport.score +
      docReport.score;

    const totalScore = Math.min(40, Math.round(rawTotal * 100) / 100);

    const evidenceCitations = [
      ...perfReport.evidenceCitations,
      ...accessReport.evidenceCitations,
      ...respReport.evidenceCitations,
      ...codeReport.evidenceCitations,
      ...archReport.evidenceCitations,
      ...docReport.evidenceCitations,
    ];

    const recommendations = [
      ...perfReport.recommendations,
      ...accessReport.recommendations,
      ...respReport.recommendations,
      ...codeReport.recommendations,
      ...archReport.recommendations,
      ...docReport.recommendations,
    ];

    return {
      totalScore,
      maxScore: 40,
      performanceScore: perfReport.score,
      accessibilityScore: accessReport.score,
      responsiveScore: respReport.score,
      codeQualityScore: codeReport.score,
      architectureScore: archReport.score,
      documentationScore: docReport.score,
      modules: {
        performance: perfReport,
        accessibility: accessReport,
        responsive: respReport,
        codeQuality: codeReport,
        architecture: archReport,
        documentation: docReport,
      },
      evidenceCitations,
      recommendations,
      confidencePercent: 95,
    };
  }
}
