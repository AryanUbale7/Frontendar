import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";
import { FeatureDetectionResult } from "../feature-engine/feature.engine";
import { RepositoryAnalysisResult } from "../repository-engine/repository.engine";
import { RouteMappingResult } from "../route-engine/route.engine";
import { UIDetectionResult } from "../ui-engine/ui.engine";
import { CategoryReasoning } from "../reasoning-engine/reasoning.engine";

export interface TraceEntry {
  rule: string;
  points: number;
  detail: string;
}

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
  scoreTrace: TraceEntry[];
  penaltyTrace: TraceEntry[];
  logs: string[];
}

export class ScoringEngine {
  public calculateFinalScores(
    blueprint: KnowledgeBlueprint,
    featureResults: FeatureDetectionResult[],
    repoAnalysis: RepositoryAnalysisResult,
    routeResults: RouteMappingResult,
    uiAnalysis: UIDetectionResult,
    reasonings: CategoryReasoning[],
    isDashboardChallenge: boolean = false
  ): FAIEReportSummary {
    const logs: string[] = [];
    const scoreTrace: TraceEntry[] = [];
    const penaltyTrace: TraceEntry[] = [];
    logs.push("FAIE Scoring Engine v3 Calibrated: Transparent deterministic calculations with full trace.");

    // 1. Feature Coverage (marks-based: only features earning marks count as implemented)
    const activeProblem = blueprint.problemStatements && blueprint.problemStatements.length > 0
      ? (blueprint.problemStatements[blueprint.selectedProblemIndex ?? 0] || blueprint.problemStatements[0])
      : blueprint.problemStatement;
    const activeProblemId = activeProblem?.id || activeProblem?.title || "default";

    const activeFeatures = (blueprint.requiredFeatures || []).filter((f: any) => {
      if (!f.problemStatementId) {
        const firstProblem = blueprint.problemStatements?.[0] || blueprint.problemStatement;
        const firstProblemId = firstProblem?.id || firstProblem?.title || "default";
        return activeProblemId === firstProblemId;
      }
      return f.problemStatementId === activeProblemId;
    });

    const totalReqFeatures = activeFeatures.length || 1;
    const implementedCount = featureResults.filter((f) => f.awardedScore > 0).length;
    const featureCoveragePercent = Math.round((implementedCount / totalReqFeatures) * 100);
    logs.push(`Feature Coverage computed: ${featureCoveragePercent}% (${implementedCount}/${totalReqFeatures} features).`);

    // 2. Repository Coverage & Tech Compliance (no flat bonus)
    const allowedTech = (blueprint.techStackRules.allowed || []).map((t) => t.toLowerCase());
    let matchedTechCount = 0;
    if (allowedTech.length > 0) {
      repoAnalysis.allDependencies.forEach((dep) => {
        if (allowedTech.some((at) => dep.toLowerCase().includes(at))) matchedTechCount++;
      });
    }
    const technologyCompliancePercent =
      allowedTech.length > 0
        ? Math.min(100, Math.round((matchedTechCount / allowedTech.length) * 100))
        : 100;
    logs.push(`Technology Compliance: ${matchedTechCount}/${allowedTech.length} allowed technologies detected (${technologyCompliancePercent}%).`);

    // 3. Folder Compliance (evidence tiers)
    const fileCount = repoAnalysis.detectedFilesCount;
    const folderCompliancePercent =
      fileCount === 0 ? 0 : fileCount <= 3 ? 35 : fileCount <= 10 ? 65 : fileCount <= 25 ? 85 : 100;

    // 4. UI Compliance (evidence tiers)
    const uiComponentCount = uiAnalysis.detectedUIComponents.length;
    const uiCompliancePercent =
      uiComponentCount === 0
        ? 0
        : Math.min(100, (uiComponentCount <= 2 ? 40 : uiComponentCount <= 5 ? 70 : 90) + (uiAnalysis.isResponsive ? 10 : 0));

    // 5. Module & Overall Alignment
    const moduleCoveragePercent = routeResults.coveragePercent;
    const rawAlignmentPercent = Math.round(
      featureCoveragePercent * 0.4 +
        technologyCompliancePercent * 0.2 +
        uiCompliancePercent * 0.2 +
        moduleCoveragePercent * 0.2
    );
    const overallAlignmentPercent = Math.min(100, rawAlignmentPercent);
    logs.push(`Overall alignment computed: ${overallAlignmentPercent}% (features ${featureCoveragePercent}%, tech ${technologyCompliancePercent}%, ui ${uiCompliancePercent}%, modules ${moduleCoveragePercent}%).`);

    // Sum category awarded marks
    let sumCategoryScore = 0;
    reasonings.forEach((r) => {
      sumCategoryScore += r.scoreAwarded;
      scoreTrace.push({
        rule: r.ruleApplied,
        points: r.scoreAwarded,
        detail: `${r.categoryName}: ${r.scoreAwarded}/${r.maxMarks} awarded (passing ${r.passingMarks}). ${r.reason}`,
      });
    });

    let deductionsTotal = 0;
    let bonusPointsTotal = 0;
    let status: "pass" | "fail" = "pass";

    // Count false positive claims
    let rejectedClaimsCount = 0;
    featureResults.forEach((fr) => {
      if (fr.evidence?.rejectedClaims && fr.evidence.rejectedClaims.length > 0) {
        rejectedClaimsCount += fr.evidence.rejectedClaims.length;
      }
    });

    if (isDashboardChallenge) {
      // TypeScript compliance check
      let tsRequired = false;
      if (blueprint.techStackRules && blueprint.techStackRules.required) {
        tsRequired = blueprint.techStackRules.required.some((t) => t.toLowerCase() === "typescript");
      }
      const hasTS = repoAnalysis.hasTsConfig || repoAnalysis.detectedLanguages.typescriptPercent > 0;
      if (tsRequired) {
        if (!hasTS) {
          deductionsTotal += 15;
          penaltyTrace.push({ rule: "TypeScript Compliance", points: 15, detail: "Blueprint requires TypeScript but no tsconfig / TS sources detected." });
          logs.push(`TypeScript Required: YES | TypeScript Detected: NO | Compliance: FAIL | Penalty: -15 pts`);
        } else {
          logs.push(`TypeScript Required: YES | TypeScript Detected: YES | Compliance: PASS`);
        }
      }

      if (rejectedClaimsCount > 0) {
        const penalty = rejectedClaimsCount * 15;
        deductionsTotal += penalty;
        penaltyTrace.push({ rule: "False-Positive Shield", points: penalty, detail: `${rejectedClaimsCount} documentation claim(s) rejected for lacking code evidence.` });
        logs.push(`False-Positive Shield Penalty: ${rejectedClaimsCount} claim(s) rejected (-${penalty} pts).`);
      }

      // Auto-fail conditions for dashboard challenge
      if (repoAnalysis.detectedFilesCount === 0) {
        status = "fail";
        penaltyTrace.push({ rule: "Auto-Fail", points: 0, detail: "Missing or inaccessible repository source code." });
        logs.push("Automatic Fail Triggered: Missing or inaccessible GitHub repository source code.");
      }

      const restricted = blueprint.techStackRules.restricted || [];
      if (restricted.length > 0) {
        const deps = repoAnalysis.allDependencies.map((d) => d.toLowerCase());
        for (const res of restricted) {
          if (deps.some((d) => d.includes(res.toLowerCase()))) {
            status = "fail";
            penaltyTrace.push({ rule: "Restricted Technology", points: 0, detail: `Prohibited technology detected: ${res}` });
            logs.push(`Automatic Fail Triggered: Prohibited technology detected: ${res}`);
          }
        }
      }

      if (rejectedClaimsCount >= 3) {
        status = "fail";
        penaltyTrace.push({ rule: "False-Positive Shield", points: 0, detail: "Excessive fraudulent documentation claims (>= 3) rejected." });
        logs.push("Automatic Fail Triggered: Excessive fraudulent documentation claims rejected by False-Positive Shield.");
      }

      const rawScore = sumCategoryScore - deductionsTotal;
      const finalScore =
        status === "fail"
          ? Math.min(25, Math.max(0, rawScore))
          : Math.max(0, Math.min(100, rawScore));

      logs.push(`FAIE Final Score: ${finalScore}/100. Status: ${status.toUpperCase()}`);

      return {
        finalScore,
        status,
        featureCoveragePercent,
        repositoryCoveragePercent: Math.min(100, Math.round((repoAnalysis.detectedFilesCount / 50) * 100)),
        moduleCoveragePercent,
        technologyCompliancePercent,
        folderCompliancePercent,
        uiCompliancePercent,
        overallAlignmentPercent,
        bonusPointsTotal,
        deductionsTotal,
        categoryReasonings: reasonings,
        scoreTrace,
        penaltyTrace,
        logs,
      };
    } else {
      // --- GENERAL BLUEPRINT PATH (all non-dashboard blueprints) ---
      if (rejectedClaimsCount > 0) {
        const penalty = rejectedClaimsCount * 15;
        deductionsTotal += penalty;
        penaltyTrace.push({ rule: "False-Positive Shield", points: penalty, detail: `${rejectedClaimsCount} documentation claim(s) rejected for lacking code evidence.` });
        logs.push(`False-Positive Shield Penalty: ${rejectedClaimsCount} claim(s) rejected (-${penalty} pts).`);
      }

      if (overallAlignmentPercent < 45 && implementedCount === 0) {
        status = "fail";
        penaltyTrace.push({ rule: "Auto-Fail", points: 0, detail: "Zero implemented features detected (no code evidence)." });
        logs.push("Automatic Fail Triggered: Zero implemented features detected.");
      }

      if (rejectedClaimsCount >= 2 || (rejectedClaimsCount > 0 && implementedCount === 0)) {
        status = "fail";
        penaltyTrace.push({ rule: "False-Positive Shield", points: 0, detail: "Multiple documentation claims rejected without code support." });
        logs.push("Automatic Fail Triggered: Multiple documentation claims rejected by False-Positive Shield.");
      }

      const restricted = blueprint.techStackRules.restricted || [];
      if (restricted.length > 0) {
        const deps = repoAnalysis.allDependencies.map((d) => d.toLowerCase());
        for (const res of restricted) {
          if (deps.some((d) => d.includes(res.toLowerCase()))) {
            status = "fail";
            penaltyTrace.push({ rule: "Restricted Technology", points: 0, detail: `Prohibited technology detected: ${res}` });
            logs.push("Automatic Fail Triggered: Prohibited technology detected: " + res);
          }
        }
      }

      if (status === "pass") {
        if (repoAnalysis.hasTsConfig) {
          bonusPointsTotal += 5;
          scoreTrace.push({ rule: "TypeScript Bonus", points: 5, detail: "tsconfig.json present." });
        }
        if (repoAnalysis.hasTailwind) {
          bonusPointsTotal += 5;
          scoreTrace.push({ rule: "Tailwind Bonus", points: 5, detail: "Tailwind CSS configured." });
        }
        bonusPointsTotal = Math.min(10, bonusPointsTotal);
        if (bonusPointsTotal > 0) logs.push(`Bonus Awarded (Capped): +${bonusPointsTotal} pts`);
      }

      const rawScore = sumCategoryScore + bonusPointsTotal - deductionsTotal;
      let finalScore = 0;

      if (status === "fail") {
        finalScore = Math.min(25, Math.max(0, Math.round(rawScore * 0.3)));
      } else {
        finalScore = Math.max(0, Math.min(100, rawScore));
      }

      logs.push(`FAIE Final Score: ${finalScore}/100. Status: ${status.toUpperCase()}`);

      return {
        finalScore,
        status,
        featureCoveragePercent,
        repositoryCoveragePercent: Math.min(100, Math.round((repoAnalysis.detectedFilesCount / 50) * 100)),
        moduleCoveragePercent,
        technologyCompliancePercent,
        folderCompliancePercent,
        uiCompliancePercent,
        overallAlignmentPercent,
        bonusPointsTotal,
        deductionsTotal,
        categoryReasonings: reasonings,
        scoreTrace,
        penaltyTrace,
        logs,
      };
    }
  }
}
