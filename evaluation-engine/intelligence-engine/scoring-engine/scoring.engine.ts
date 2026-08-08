import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";
import { FeatureDetectionReport } from "../feature-engine/feature.engine";
import { TechnologyDetectionReport } from "../technology-engine/technology.engine";
import { FQEReport } from "../quality-engine/quality.interface";
import { SubmissionRequirementsReport } from "../submission-engine/submission-requirements.validator";

export interface CategoryResult {
  categoryName: string;
  awardedMarks: number;
  maxMarks: number;
  passingMarks: number;
  evaluatedBy: string;
  evidenceCitations: string[];
  passed: boolean;
}

export interface RuleEvaluationResult {
  ruleName: string;
  triggered: boolean;
  action: "fail" | "deduct";
  pointsDeducted: number;
  detail: string;
}

export interface BonusEvaluationResult {
  bonusName: string;
  awarded: boolean;
  pointsAwarded: number;
  detail: string;
}

export interface DynamicScoringReport {
  finalScore: number;
  status: "pass" | "fail";
  categoryResults: CategoryResult[];
  bonusResults: BonusEvaluationResult[];
  ruleResults: RuleEvaluationResult[];
  totalBonusPoints: number;
  totalDeductions: number;
  logs: string[];
  evidenceCitations: string[];
}

export class ScoringEngine {
  public calculateDynamicScores(
    blueprint: KnowledgeBlueprint,
    featureReport: FeatureDetectionReport,
    techReport: TechnologyDetectionReport,
    fqeReport: FQEReport,
    subReqReport: SubmissionRequirementsReport,
    astData?: any
  ): DynamicScoringReport {
    const logs: string[] = [];
    const citations: string[] = [];
    logs.push("[Scoring Engine] Executing Fully Dynamic Blueprint Category & Rule Evaluation...");

    // 1. Resolve Categories & Weights
    const configuredCategories = blueprint.scoringSystem?.categories || [];
    const defaultCategories = [
      { name: "Problem Alignment & Required Features", weight: 40, maxMarks: 40, passingMarks: 24 },
      { name: "Technology Stack Compliance", weight: 20, maxMarks: 20, passingMarks: 12 },
      { name: "Code Quality & Architecture (FQE Audit)", weight: 40, maxMarks: 40, passingMarks: 24 }
    ];

    const categoriesToEvaluate = configuredCategories.length > 0 ? configuredCategories : defaultCategories;

    // Validate total category maxMarks / weights
    const totalMaxMarks = categoriesToEvaluate.reduce((sum, c) => sum + (c.maxMarks || c.weight || 0), 0);
    logs.push(`[Scoring Engine] Evaluated ${categoriesToEvaluate.length} Blueprint Categories (Total Max Marks: ${totalMaxMarks}).`);

    const categoryResults: CategoryResult[] = [];

    // Map metrics to category names deterministically
    categoriesToEvaluate.forEach((cat) => {
      const lowerName = cat.name.toLowerCase();
      const maxMarks = cat.maxMarks || cat.weight || 20;
      const passingMarks = cat.passingMarks || Math.round(maxMarks * 0.6);
      let awardedMarks = 0;
      let evaluatorName = "FAIE v3 Deterministic Engine";
      const catCitations: string[] = [];

      if (lowerName.includes("feature") || lowerName.includes("alignment") || lowerName.includes("problem")) {
        evaluatorName = "FAIE Feature Detection Engine";
        awardedMarks = Math.round((featureReport.totalFeatureCoveragePercent / 100) * maxMarks);
        catCitations.push(
          ...featureReport.features.flatMap((f) => f.evidenceCitations)
        );
      } else if (lowerName.includes("tech") || lowerName.includes("stack") || lowerName.includes("framework")) {
        evaluatorName = "FAIE Technology Detection Engine";
        awardedMarks = Math.round((techReport.technologyScore / 100) * maxMarks);
        catCitations.push(...techReport.evidenceCitations);
      } else if (lowerName.includes("quality") || lowerName.includes("architecture") || lowerName.includes("fqe")) {
        evaluatorName = "FAIE Quality Engine (FQE 6 Modules)";
        awardedMarks = Math.round((fqeReport.totalScore / fqeReport.maxScore) * maxMarks);
        catCitations.push(...fqeReport.evidenceCitations);
      } else if (lowerName.includes("performance") || lowerName.includes("accessibility") || lowerName.includes("seo")) {
        evaluatorName = "FAIE Performance & Accessibility Module";
        const perfRatio = (fqeReport.performanceScore + fqeReport.accessibilityScore) / 14;
        awardedMarks = Math.round(perfRatio * maxMarks);
        catCitations.push(...fqeReport.modules.performance.evidenceCitations, ...fqeReport.modules.accessibility.evidenceCitations);
      } else if (lowerName.includes("ui") || lowerName.includes("ux") || lowerName.includes("responsiveness")) {
        evaluatorName = "FAIE Responsive UI Module";
        const respRatio = fqeReport.responsiveScore / 7;
        awardedMarks = Math.round(respRatio * maxMarks);
        catCitations.push(...fqeReport.modules.responsive.evidenceCitations);
      } else if (lowerName.includes("doc") || lowerName.includes("readme")) {
        evaluatorName = "FAIE Documentation Module";
        const docRatio = fqeReport.documentationScore / 6;
        awardedMarks = Math.round(docRatio * maxMarks);
        catCitations.push(...fqeReport.modules.documentation.evidenceCitations);
      } else {
        // General category ratio based on alignment
        evaluatorName = "FAIE Alignment Engine";
        const avgRatio = featureReport.totalFeatureCoveragePercent / 100;
        awardedMarks = Math.round(avgRatio * maxMarks);
        catCitations.push(`Evaluated general category "${cat.name}" based on feature alignment.`);
      }

      awardedMarks = Math.max(0, Math.min(maxMarks, awardedMarks));

      categoryResults.push({
        categoryName: cat.name,
        awardedMarks,
        maxMarks,
        passingMarks,
        evaluatedBy: evaluatorName,
        evidenceCitations: catCitations,
        passed: awardedMarks >= passingMarks,
      });

      citations.push(`Category "${cat.name}": Awarded ${awardedMarks}/${maxMarks} marks (Passing: ${passingMarks}).`);
    });

    const sumCategoryMarks = categoryResults.reduce((sum, c) => sum + c.awardedMarks, 0);

    // 2. Evaluate Dynamic Auto Pass/Fail & Penalty Rules
    const configuredRules = blueprint.autoPassFailRules || [];
    const ruleResults: RuleEvaluationResult[] = [];
    let totalDeductions = 0;
    let autoFailTriggered = false;

    // Check Auto Pass/Fail Rules
    configuredRules.forEach((r) => {
      const ruleLower = (r.rule || "").toLowerCase();
      let triggered = false;
      let detail = "";

      if (ruleLower.includes("github") || ruleLower.includes("no repository")) {
        const gh = subReqReport.requirements.find((req) => req.requirementKey === "githubRepo");
        if (gh && !gh.passed) {
          triggered = true;
          detail = "Missing valid GitHub repository link.";
        }
      } else if (ruleLower.includes("deployment") || ruleLower.includes("live link")) {
        const dep = subReqReport.requirements.find((req) => req.requirementKey === "liveDeployment");
        if (dep && !dep.passed) {
          triggered = true;
          detail = "Missing mandatory live deployment link.";
        }
      } else if (ruleLower.includes("mandatory") || ruleLower.includes("feature")) {
        if (!featureReport.mandatoryFeaturesPassed) {
          triggered = true;
          detail = `Missing mandatory features: [${featureReport.missingMandatoryFeatures.join(", ")}].`;
        }
      } else if (ruleLower.includes("readme")) {
        const rm = subReqReport.requirements.find((req) => req.requirementKey === "readme");
        if (rm && !rm.passed) {
          triggered = true;
          detail = "Missing README.md documentation file.";
        }
      } else if (ruleLower.includes("restricted") || ruleLower.includes("prohibited")) {
        if (techReport.restrictedTechViolations.length > 0) {
          triggered = true;
          detail = `Restricted technologies detected: [${techReport.restrictedTechViolations.join("; ")}].`;
        }
      }

      if (triggered) {
        const pts = r.action === "deduct" ? (r.points || 20) : 0;
        if (r.action === "fail") {
          autoFailTriggered = true;
        }
        totalDeductions += pts;
        ruleResults.push({
          ruleName: r.rule,
          triggered: true,
          action: r.action,
          pointsDeducted: pts,
          detail: detail || `Auto rule triggered: ${r.rule}`,
        });
        citations.push(`RULE TRIGGERED [${r.action.toUpperCase()}]: ${r.rule} — ${detail}`);
      }
    });

    // Mandatory features rule fallback
    if (!featureReport.mandatoryFeaturesPassed && !autoFailTriggered) {
      autoFailTriggered = true;
      ruleResults.push({
        ruleName: "Missing Mandatory Features",
        triggered: true,
        action: "fail",
        pointsDeducted: 0,
        detail: `Missing mandatory features: [${featureReport.missingMandatoryFeatures.join(", ")}].`,
      });
      citations.push(`AUTO-FAIL TRIGGERED: Missing mandatory features [${featureReport.missingMandatoryFeatures.join(", ")}].`);
    }

    // 3. Evaluate Dynamic Bonus Rules
    const configuredBonuses = blueprint.bonusRules || [];
    const bonusResults: BonusEvaluationResult[] = [];
    let totalBonusPoints = 0;

    configuredBonuses.forEach((b) => {
      const bLower = (b.name || "").toLowerCase();
      let awarded = false;
      let detail = "";

      if (bLower.includes("ui") || bLower.includes("design")) {
        if (fqeReport.responsiveScore >= 6) {
          awarded = true;
          detail = `High responsive UI layout verified (${fqeReport.responsiveScore}/7).`;
        }
      } else if (bLower.includes("readme") || bLower.includes("doc")) {
        if (fqeReport.documentationScore >= 5) {
          awarded = true;
          detail = `Comprehensive README documentation verified (${fqeReport.documentationScore}/6).`;
        }
      } else if (bLower.includes("animation") || bLower.includes("motion")) {
        const hasMotion = techReport.detectedTechnologies.some((t) => t.technology === "Framer Motion");
        if (hasMotion) {
          awarded = true;
          detail = `Framer Motion animation library detected in source code.`;
        }
      } else if (bLower.includes("coverage") || bLower.includes("feature")) {
        if (featureReport.totalFeatureCoveragePercent >= 90) {
          awarded = true;
          detail = `Feature coverage reached ${featureReport.totalFeatureCoveragePercent}%.`;
        }
      } else {
        // Generic fallback for bonus
        if (featureReport.totalFeatureCoveragePercent > 80) {
          awarded = true;
          detail = `Feature coverage high (${featureReport.totalFeatureCoveragePercent}%).`;
        }
      }

      if (awarded) {
        const pts = b.points || 5;
        totalBonusPoints += pts;
        bonusResults.push({
          bonusName: b.name,
          awarded: true,
          pointsAwarded: pts,
          detail,
        });
        citations.push(`BONUS AWARDED: "${b.name}" (+${pts} pts) — ${detail}`);
      }
    });

    // Compute raw & final score
    const rawScore = sumCategoryMarks + totalBonusPoints - totalDeductions;
    const finalScore = autoFailTriggered
      ? Math.min(30, Math.max(0, Math.round(rawScore * 0.3)))
      : Math.max(0, Math.min(100, Math.round(rawScore)));

    const status: "pass" | "fail" = !autoFailTriggered && finalScore >= 75 ? "pass" : "fail";

    logs.push(`[Scoring Engine] Final Score computed: ${finalScore}/100 [${status.toUpperCase()}]. Category sum: ${sumCategoryMarks}, Bonuses: +${totalBonusPoints}, Deductions: -${totalDeductions}.`);

    return {
      finalScore,
      status,
      categoryResults,
      bonusResults,
      ruleResults,
      totalBonusPoints,
      totalDeductions,
      logs,
      evidenceCitations: citations,
    };
  }
}
