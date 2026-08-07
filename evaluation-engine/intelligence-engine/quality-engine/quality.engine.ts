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

  public evaluateQuality(repo: VirtualRepository, ast: ASTRepositoryAnalysis): FQEReport {
    const perfReport = this.perfModule.evaluate(repo, ast);
    const accessReport = this.accessModule.evaluate(repo, ast);
    const respReport = this.respModule.evaluate(repo, ast);
    const codeReport = this.codeModule.evaluate(repo, ast);
    const archReport = this.archModule.evaluate(repo, ast);
    const docReport = this.docModule.evaluate(repo, ast);

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
