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
    blueprintCodeQualityRules?: Record<string, number>,
    blueprint?: any
  ): FQEReport {
    const responsiveRules = blueprint?.performanceRules?.responsiveRules || blueprint?.responsiveRules;

    const perfReport = this.perfModule.evaluate(repo, ast);
    const accessReport = this.accessModule.evaluate(repo, ast);
    const respReport = this.respModule.evaluate(repo, ast, responsiveRules);
    const codeReport = this.codeModule.evaluate(repo, ast);
    const archReport = this.archModule.evaluate(repo, ast);
    const docReport = this.docModule.evaluate(repo, ast);

    // Dynamic weights from admin blueprint configuration
    let codeQualityWeight = 7;
    let archWeight = 6;
    let docWeight = 6;

    if (blueprintCodeQualityRules) {
      const readmeVal = blueprintCodeQualityRules.readmeQuality ?? blueprintCodeQualityRules.readme;
      const foldersVal = blueprintCodeQualityRules.folderStructure ?? blueprintCodeQualityRules.folders;
      const commentsVal = blueprintCodeQualityRules.comments;

      // Scale to match typical quality module ranges (0-7, 0-6)
      if (typeof readmeVal === "number") docWeight = readmeVal / 1.5;
      if (typeof foldersVal === "number") archWeight = foldersVal / 1.5;
      if (typeof commentsVal === "number") codeQualityWeight = commentsVal / 1.5;
    }

    const rawTotal =
      perfReport.score +
      accessReport.score +
      respReport.score +
      (codeReport.score / codeReport.maxScore) * codeQualityWeight +
      (archReport.score / archReport.maxScore) * archWeight +
      (docReport.score / docReport.maxScore) * docWeight;

    const maxPossible =
      perfReport.maxScore +
      accessReport.maxScore +
      respReport.maxScore +
      codeQualityWeight +
      archWeight +
      docWeight;

    const totalScore = Math.min(40, Math.round((rawTotal / maxPossible) * 40 * 100) / 100);

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
