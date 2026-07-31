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
  public calculateFinalScores(
    blueprint: KnowledgeBlueprint,
    featureResults: FeatureDetectionResult[],
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    reasonings: CategoryReasoning[]
  ): FAIEReportSummary {
    const logs: string[] = [];
    logs.push("FAIE Scoring Engine initialized: Executing deterministic score calculations.");

    // 1. Feature Coverage
    const totalReqFeatures = blueprint.requiredFeatures.length || 1;
    const implementedCount = featureResults.filter((f) => f.implementationStatus === "Implemented" || f.implementationStatus === "Partially Implemented").length;
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
    const uiCompliancePercent = uiAnalysis.detectedUIComponents.length > 0
      ? Math.min(100, uiAnalysis.detectedUIComponents.length * 20 + (uiAnalysis.isResponsive ? 30 : 0))
      : 20;

    // 5. Module & Overall Alignment
    const moduleCoveragePercent = routeResults.coveragePercent;
    const overallAlignmentPercent = Math.round(
      featureCoveragePercent * 0.4 +
      technologyCompliancePercent * 0.2 +
      uiCompliancePercent * 0.2 +
      moduleCoveragePercent * 0.2
    );

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
      logs.push(`False-Positive Shield Penalty: ${rejectedClaimsCount} claim(s) rejected without supporting codebase/UI (-${penalty} pts).`);
    }

    // Mandatory pass/fail rules
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

    // Check bonus rules
    let bonusPointsTotal = 0;
    if (status === "pass") {
      if (repoAnalysis.hasTsConfig) {
        bonusPointsTotal += 10;
        logs.push("Bonus Awarded: TypeScript configured (+10 pts)");
      }
      if (repoAnalysis.hasTailwind) {
        bonusPointsTotal += 8;
        logs.push("Bonus Awarded: Tailwind CSS (+8 pts)");
      }
    }

    const unscaledScore = sumCategoryScore + bonusPointsTotal - deductionsTotal;
    const finalScore = status === "fail" ? Math.min(25, Math.max(0, Math.round(unscaledScore))) : Math.max(0, Math.min(100, Math.round(unscaledScore)));

    logs.push(`FAIE Final Deterministic Score: ${finalScore}/100. Status: ${status.toUpperCase()}`);

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
