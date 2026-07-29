import { AuditResult } from "../plugins/plugin.interface";

export interface DeductionInfo {
  rule: string;
  reason: string;
  evidence: string;
  pointsDeducted: number;
}

export interface BonusInfo {
  rule: string;
  reason: string;
  evidence: string;
  pointsAwarded: number;
}

export interface ScoreSummary {
  finalToolScore: number;
  maxToolScore: number;
  percentageScore: number;
  categoryScores: Record<string, { awarded: number; max: number }>;
}

export interface MergedScoreOutput {
  toolScore: number;
  aiScore: number;
  bonus: number;
  penalty: number;
  finalScore: number;
  status: "PASSED" | "FAILED";
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  deductions: DeductionInfo[];
  bonuses: BonusInfo[];
  rankEligible: boolean;
}

export class ScoreEngine {
  calculateScore(results: Record<string, AuditResult>): ScoreSummary {
    let totalAwarded = 0;
    let totalMax = 0;
    const categoryScores: Record<string, { awarded: number; max: number }> = {};

    for (const [pluginName, result] of Object.entries(results)) {
      totalAwarded += result.score;
      totalMax += result.maxScore;
      categoryScores[pluginName] = {
        awarded: result.score,
        max: result.maxScore
      };
    }

    const percentageScore = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0;

    return {
      finalToolScore: totalAwarded,
      maxToolScore: totalMax,
      percentageScore,
      categoryScores
    };
  }

  combineAndScore(
    toolReport: any,
    aiReport: any,
    blueprint: any,
    metadata: any
  ): MergedScoreOutput {
    const deductions: DeductionInfo[] = [];
    const bonuses: BonusInfo[] = [];
    let isFailed = false;
    let failReason = "";

    // 1. Validate Mandatory Rules
    // Rule: If Repository is Private -> Fail
    if (metadata.isPrivate) {
      isFailed = true;
      failReason = "Repository visibility is Private.";
      deductions.push({
        rule: "Public Repository Enforcement",
        reason: "The repository must be public for evaluation.",
        evidence: `Metadata isPrivate: ${metadata.isPrivate}`,
        pointsDeducted: 100
      });
    }

    // Rule: If Build Failed -> Apply Blueprint / Auto-Fail Rule
    const buildAudit = toolReport.details?.["Build Verification"] || toolReport.toolAudits?.codeQuality;
    const buildSuccess = buildAudit ? !buildAudit.errors?.length : true;
    if (!buildSuccess) {
      const buildFailRule = blueprint.autoPassFailRules?.find((r: any) => r.rule.toLowerCase().includes("build"));
      if (buildFailRule?.action === "fail" || !buildFailRule) {
        isFailed = true;
        failReason = "Code compilation/build process failed.";
        deductions.push({
          rule: "Build Verification",
          reason: "Submitted codebase failed to compile or run the build script.",
          evidence: buildAudit.errors.join(", "),
          pointsDeducted: 100
        });
      }
    }

    // 2. Calculate AI scores based on blueprint weights
    let rawAiScore = 0;
    let maxAiScore = 0;

    // AI categories: Problem Alignment, Features, Innovation
    const alignmentMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("alignment"))?.maxMarks || 20;
    const featuresMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("feature"))?.maxMarks || 25;
    const innovationMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("innovation"))?.maxMarks || 15;

    maxAiScore = alignmentMax + featuresMax + innovationMax;
    rawAiScore = (aiReport.problemAlignment?.score || 0) +
                 (aiReport.requiredFeatures?.score || 0) +
                 (aiReport.innovation?.score || 0);

    // Check if any mandatory feature is missing
    const missingMandatoryFeatures = blueprint.requiredFeatures
      ?.filter((f: any) => f.mandatory)
      ?.filter((f: any) => aiReport.requiredFeatures?.missing?.includes(f.name));

    if (missingMandatoryFeatures && missingMandatoryFeatures.length > 0) {
      isFailed = true;
      failReason = `Missing mandatory feature(s): ${missingMandatoryFeatures.map((f: any) => f.name).join(", ")}`;
      missingMandatoryFeatures.forEach((f: any) => {
        deductions.push({
          rule: "Mandatory Feature Enforcement",
          reason: `Mandatory feature "${f.name}" is missing in the submission.`,
          evidence: `AI detected missing feature: ${f.name}`,
          pointsDeducted: f.weight
        });
      });
    }

    // 3. Calculate Tool scores (Performance, Accessibility, SEO, Documentation, Security)
    let rawToolScore = 0;
    let maxToolScore = 0;

    const perfMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("performance"))?.maxMarks || 15;
    const accessMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("accessibility"))?.maxMarks || 10;
    const docMax = blueprint.scoringSystem?.categories?.find((c: any) => c.name.toLowerCase().includes("documentation"))?.maxMarks || 10;

    maxToolScore = perfMax + accessMax + docMax;

    // Map tool scores based on tool audits
    const lighthouseReport = toolReport.details?.["Lighthouse Engine"] || toolReport.toolAudits?.performance;
    const accessibilityReport = toolReport.details?.["Accessibility Engine"] || toolReport.toolAudits?.accessibility;
    const readmeReport = toolReport.details?.["README Analyzer"] || toolReport.toolAudits?.codeQuality;

    const perfScore = lighthouseReport ? Math.round((lighthouseReport.score / (lighthouseReport.maxScore || 15)) * perfMax) : perfMax;
    const accessScore = accessibilityReport ? Math.round((accessibilityReport.score / (accessibilityReport.maxScore || 10)) * accessMax) : accessMax;
    const docScore = readmeReport ? Math.round((readmeReport.score / (readmeReport.maxScore || 10)) * docMax) : docMax;

    rawToolScore = perfScore + accessScore + docScore;

    // 4. Apply Auto Pass / Fail Penalties (Lighthouse score below minimum)
    let penaltyTotal = 0;
    const minLighthouse = blueprint.performanceRules?.lighthouseMin || 70;
    const actualLighthouse = lighthouseReport?.score || lighthouseReport?.lighthouseScore || 88;

    if (actualLighthouse < minLighthouse) {
      const penaltyRule = blueprint.autoPassFailRules?.find((r: any) => r.rule.toLowerCase().includes("lighthouse"));
      const penaltyPoints = penaltyRule?.points || 15;
      penaltyTotal += penaltyPoints;
      deductions.push({
        rule: "Lighthouse Performance Threshold Check",
        reason: `Lighthouse score (${actualLighthouse}) is below blueprint threshold of ${minLighthouse}.`,
        evidence: `Lighthouse score check: ${actualLighthouse} < ${minLighthouse}`,
        pointsDeducted: penaltyPoints
      });
    }

    // 5. Apply Bonus Marks
    let bonusTotal = 0;
    blueprint.bonusRules?.forEach((b: any) => {
      // Award bonus if criteria matches (simulated checks based on high scores)
      if (b.name.toLowerCase().includes("ui") && perfScore > 12) {
        bonusTotal += b.points;
        bonuses.push({
          rule: "UI Polish Bonus",
          reason: `Awarded bonus points for matching high UI quality standards.`,
          evidence: `Tool Performance Score: ${perfScore}/${perfMax}`,
          pointsAwarded: b.points
        });
      }
      if (b.name.toLowerCase().includes("readme") && docScore >= docMax) {
        bonusTotal += b.points;
        bonuses.push({
          rule: "Documentation Quality Bonus",
          reason: `Exemplary README documentation file compiled.`,
          evidence: `README Analyzer Score: ${docScore}/${docMax}`,
          pointsAwarded: b.points
        });
      }
    });

    // 6. Calculate Final Merged Score
    const finalScore = isFailed 
      ? 0 
      : Math.max(0, Math.min(100, (rawToolScore + rawAiScore + bonusTotal) - penaltyTotal));

    // Determine status & grade
    const status = (finalScore >= 50 && !isFailed) ? "PASSED" : "FAILED";
    
    let grade: "A" | "B" | "C" | "D" | "F" = "F";
    if (finalScore >= 90) grade = "A";
    else if (finalScore >= 80) grade = "B";
    else if (finalScore >= 70) grade = "C";
    else if (finalScore >= 50) grade = "D";

    // Summary description
    const summary = isFailed
      ? `Evaluation failed: ${failReason}`
      : `Project successfully compiled with a grade of ${grade}. Combined performance tools evaluated at ${rawToolScore} points, and AI semantic alignment evaluated at ${rawAiScore} points.`;

    return {
      toolScore: rawToolScore,
      aiScore: rawAiScore,
      bonus: bonusTotal,
      penalty: penaltyTotal,
      finalScore,
      status,
      grade,
      summary,
      deductions,
      bonuses,
      rankEligible: status === "PASSED"
    };
  }
}
