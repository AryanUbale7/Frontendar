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

    // Check false positive rejected claims
    let deductionsTotal = 0;
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

    // Pass/Fail status determination
    let status: "pass" | "fail" = "pass";

    if (overallAlignmentPercent < 45 && implementedCount === 0) {
      status = "fail";
      logs.push("Automatic Fail Triggered: Zero implemented features detected.");
    }

    if (rejectedClaimsCount >= 2 || (rejectedClaimsCount > 0 && implementedCount === 0)) {
      status = "fail";
      logs.push("Automatic Fail Triggered: Multiple documentation claims rejected by False-Positive Shield.");
    }

    if (blueprint.mandatoryRules) {
      for (const rule of blueprint.mandatoryRules) {
        if (rule.autoFail && overallAlignmentPercent < 50) {
          status = "fail";
          logs.push(`Mandatory Rule Triggered AUTO-FAIL: ${rule.rule}`);
        } else if (rule.penalty > 0 && !uiAnalysis.isResponsive) {
          deductionsTotal += rule.penalty;
          logs.push(`Mandatory Rule Penalty: ${rule.rule} (-${rule.penalty} pts)`);
        }
      }
    }

    // Capped Bonus Points (Max 10 pts max under diminishing returns)
    let bonusPointsTotal = 0;
    if (status === "pass") {
      if (repoAnalysis.hasTsConfig) bonusPointsTotal += 5;
      if (repoAnalysis.hasTailwind) bonusPointsTotal += 5;
      bonusPointsTotal = Math.min(10, bonusPointsTotal);
      if (bonusPointsTotal > 0) logs.push(`Bonus Awarded (Capped): +${bonusPointsTotal} pts`);
    }

    // Score Calibration Curve (Diminishing returns to eliminate score inflation)
    const rawScore = sumCategoryScore + bonusPointsTotal - deductionsTotal;
    let finalScore = 0;

    if (status === "fail") {
      finalScore = Math.min(25, Math.max(0, Math.round(rawScore * 0.3)));
    } else {
      // Diminishing returns curve: Score = RawScore * (1 - 0.12 * (RawScore / 100)) * HumanCoef
      const calibrated = rawScore * (1.0 - 0.11 * (rawScore / 100.0)) * this.alignmentCoefficients.repository;
      finalScore = Math.max(0, Math.min(96, Math.round(calibrated)));
    }

    logs.push(`FAIE Calibrated Final Score: ${finalScore}/100. Status: ${status.toUpperCase()}`);

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
      bonusPointsTotal,
      deductionsTotal,
      categoryReasonings: reasonings,
      logs,
    };
  }
}
