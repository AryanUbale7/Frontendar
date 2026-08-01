import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";
import { FeatureDetectionResult } from "../feature-engine/feature.engine";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";
import { CategoryReasoning } from "../reasoning-engine/reasoning.engine";

export interface FAIEReportSummary {
  finalScore: number;
  status: "pass" | "fail";
  featureCoveragePercent: number;
  repositoryCoveragePercent: number;
  moduleCoveragePercent: number;
  technologyCompliancePercent: number;
  folderCompliancePercent: number;
  uiCompliancePercent: number;
  overallAlignmentPercent: number;
  bonusPointsTotal: number;
  deductionsTotal: number;
  categoryReasonings: CategoryReasoning[];
  logs: string[];
}

export class ScoringEngine {
  // Human Alignment Calibration Coefficients
  private alignmentCoefficients = {
    repository: 0.92,
    documentation: 0.95,
    security: 1.0,
    performance: 0.9,
    alignment: 0.95,
  };

  public calculateFinalScores(
    blueprint: KnowledgeBlueprint,
    featureResults: FeatureDetectionResult[],
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    reasonings: CategoryReasoning[]
  ): FAIEReportSummary {
    const logs: string[] = [];
    logs.push("FAIE Scoring Engine v2 Calibrated: Executing Human-Aligned Deterministic Calculations.");

    // 1. Feature Coverage
    const totalReqFeatures = blueprint.requiredFeatures.length || 1;
    const implementedCount = featureResults.filter(
      (f) => f.implementationStatus === "Implemented" || f.implementationStatus === "Partially Implemented"
    ).length;
    const featureCoveragePercent = Math.round((implementedCount / totalReqFeatures) * 100);
    logs.push(`Feature Coverage computed: ${featureCoveragePercent}% (${implementedCount}/${totalReqFeatures} features).`);

    // 2. Repository Coverage & Tech Compliance
    const allowedTech = (blueprint.techStackRules.allowed || []).map((t) => t.toLowerCase());
    let matchedTechCount = 0;
    if (allowedTech.length > 0) {
      repoAnalysis.allDependencies.forEach((dep) => {
        if (allowedTech.some((at) => dep.toLowerCase().includes(at))) matchedTechCount++;
      });
    }
    const technologyCompliancePercent =
      allowedTech.length > 0 ? Math.min(100, Math.round((matchedTechCount / allowedTech.length) * 100) + 40) : 100;

    // 3. Folder Compliance
    const folderCompliancePercent = repoAnalysis.detectedFilesCount > 3 ? 100 : 40;

    // 4. UI Compliance
    const uiCompliancePercent =
      uiAnalysis.detectedUIComponents.length > 0
        ? Math.min(100, uiAnalysis.detectedUIComponents.length * 20 + (uiAnalysis.isResponsive ? 30 : 0))
        : 50;

    // 5. Module & Overall Alignment
    const moduleCoveragePercent = routeResults.coveragePercent;
    const rawAlignmentPercent = Math.round(
      featureCoveragePercent * 0.4 +
        technologyCompliancePercent * 0.2 +
        uiCompliancePercent * 0.2 +
        moduleCoveragePercent * 0.2
    );

    // Apply Human Alignment Calibration Coefficient
    const overallAlignmentPercent = Math.round(rawAlignmentPercent * this.alignmentCoefficients.alignment);

    // Sum category awarded marks
    let sumCategoryScore = 0;
    reasonings.forEach((r) => {
      sumCategoryScore += r.scoreAwarded;
    });

    let deductionsTotal = 0;

    // TypeScript compliance check (Task 9)
    let tsRequired = false;
    if (blueprint.techStackRules && blueprint.techStackRules.required) {
      tsRequired = blueprint.techStackRules.required.some((t) => t.toLowerCase() === "typescript");
    }
    const hasTS = repoAnalysis.hasTsConfig || repoAnalysis.detectedLanguages.typescriptPercent > 0;
    if (tsRequired) {
      if (!hasTS) {
        deductionsTotal += 15;
        logs.push(`TypeScript Required: YES | TypeScript Detected: NO | Compliance: FAIL | Penalty: -15 pts`);
      } else {
        logs.push(`TypeScript Required: YES | TypeScript Detected: YES | Compliance: PASS`);
      }
    }

    // Check false positive rejected claims
    let rejectedClaimsCount = 0;
    featureResults.forEach((fr) => {
      if (fr.evidence.rejectedClaims && fr.evidence.rejectedClaims.length > 0) {
        rejectedClaimsCount += fr.evidence.rejectedClaims.length;
      }
    });

    if (rejectedClaimsCount > 0) {
      const penalty = rejectedClaimsCount * 15;
      deductionsTotal += penalty;
      logs.push(`False-Positive Shield Penalty: ${rejectedClaimsCount} claim(s) rejected (-${penalty} pts).`);
    }

    // Pass/Fail status determination (Task 8 - Minimize Auto-Fail)
    let status: "pass" | "fail" = "pass";

    if (repoAnalysis.detectedFilesCount === 0) {
      status = "fail";
      logs.push("Automatic Fail Triggered: Missing or inaccessible GitHub repository source code.");
    }

    const restricted = blueprint.techStackRules.restricted || [];
    if (restricted.length > 0) {
      const deps = repoAnalysis.allDependencies.map((d) => d.toLowerCase());
      for (const res of restricted) {
        if (deps.some((d) => d.includes(res.toLowerCase()))) {
          status = "fail";
          logs.push(`Automatic Fail Triggered: Prohibited technology detected: ${res}`);
        }
      }
    }

    if (rejectedClaimsCount >= 3) {
      status = "fail";
      logs.push("Automatic Fail Triggered: Excessive fraudulent documentation claims rejected by False-Positive Shield.");
    }

    // Score sum (Task 7 - Score emerges naturally from evidence, capped at 100)
    let rawScore = sumCategoryScore - deductionsTotal;
    let finalScore = status === "fail" ? Math.min(25, Math.max(0, rawScore)) : Math.max(0, Math.min(100, rawScore));

    logs.push(`FAIE Final Score: ${finalScore}/100. Status: ${status.toUpperCase()}`);

    return {
      finalScore,
      status,
      featureCoveragePercent,
      repositoryCoveragePercent: Math.round((repoAnalysis.detectedFilesCount / 50) * 100),
      moduleCoveragePercent,
      technologyCompliancePercent,
      folderCompliancePercent,
      uiCompliancePercent,
      overallAlignmentPercent,
      bonusPointsTotal: 0,
      deductionsTotal,
      categoryReasonings: reasonings,
      logs,
    };
  }
}
