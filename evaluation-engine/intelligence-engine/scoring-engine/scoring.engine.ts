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
  public resolvePassingThreshold(blueprint: KnowledgeBlueprint): number {
    const rules = blueprint.autoPassFailRules || [];
    for (const r of rules) {
      const ruleLower = (r.rule || "").toLowerCase();
      if (
        ruleLower.includes("threshold") ||
        ruleLower.includes("passing score") ||
        ruleLower.includes("minimum score") ||
        ruleLower.includes("score below") ||
        ruleLower.includes("pass threshold")
      ) {
        if (typeof r.points === "number" && r.points > 0) {
          return r.points;
        }
        const match = r.rule.match(/\b(50|60|65|70|75|80|85|90)\b/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    }
    return 75; // Default fallback
  }

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
      } else if (lowerName.includes("submission") || lowerName.includes("requirement") || lowerName.includes("deliverable")) {
        evaluatorName = "FAIE Submission Requirements Validator";
        awardedMarks = Math.round((subReqReport.compliancePercent / 100) * maxMarks);
        catCitations.push(...subReqReport.evidenceCitations);
      } else if (lowerName.includes("innovation") || lowerName.includes("creativity")) {
        evaluatorName = "FAIE Innovation & Creativity Engine";
        const requiredFeatureNames = (blueprint.requiredFeatures || []).map((f: any) => f.name.toLowerCase());
        const detectedExtraFeatures = featureReport.features.filter(
          (f) => !f.mandatory && f.awardedScore > 0 && !requiredFeatureNames.includes(f.featureName.toLowerCase())
        ).length;
        const usesAnimations = techReport.detectedTechnologies.some((t) => t.technology === "Framer Motion");
        let scorePct = 50; // base score for fully meeting standard
        if (detectedExtraFeatures > 0) scorePct += 20;
        if (usesAnimations) scorePct += 20;
        if (astData && astData.totalJsxElements > 40) scorePct += 10;
        scorePct = Math.min(100, scorePct);
        awardedMarks = Math.round((scorePct / 100) * maxMarks);
        catCitations.push(
          `Innovation/Creativity evaluation: Extra features detected: ${detectedExtraFeatures}.`,
          `Animation libs used: ${usesAnimations ? "Yes" : "No"}.`,
          `JSX element density: ${astData ? astData.totalJsxElements : 0} tags.`
        );
      } else if (/\b(ui|ux|responsive)\b/.test(lowerName) || lowerName.includes("responsiveness")) {
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

      if (ruleLower.includes("github") || ruleLower.includes("no repository") || ruleLower.includes("no github")) {
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
      } else if (ruleLower.includes("mandatory") || ruleLower.includes("required feature")) {
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
      } else if (ruleLower.includes("lighthouse") || ruleLower.includes("performance")) {
        const threshold = parseInt(ruleLower.match(/\b\d+\b/)?.[0] || "70", 10);
        const score = fqeReport.performanceScore * (100 / 7);
        if (score < threshold) {
          triggered = true;
          detail = `Performance score (${Math.round(score)}) below threshold of ${threshold}.`;
        }
      } else if (ruleLower.includes("accessibility")) {
        const threshold = parseInt(ruleLower.match(/\b\d+\b/)?.[0] || "60", 10);
        const score = fqeReport.accessibilityScore * (100 / 7);
        if (score < threshold) {
          triggered = true;
          detail = `Accessibility score (${Math.round(score)}) below threshold of ${threshold}.`;
        }
      } else if (ruleLower.includes("seo")) {
        const threshold = parseInt(ruleLower.match(/\b\d+\b/)?.[0] || "70", 10);
        const score = fqeReport.modules.documentation.score * (100 / 6);
        if (score < threshold) {
          triggered = true;
          detail = `SEO score (${Math.round(score)}) below threshold of ${threshold}.`;
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

      const cond = (b.condition || b.name || "").toLowerCase();

      if (cond.includes("features >=") || cond.includes("feature coverage >=")) {
        const threshold = parseInt(cond.match(/\b\d+\b/)?.[0] || "90", 10);
        if (featureReport.totalFeatureCoveragePercent >= threshold) {
          awarded = true;
          detail = `Feature coverage reached ${featureReport.totalFeatureCoveragePercent}% (threshold: ${threshold}%).`;
        }
      } else if (cond.includes("responsive >=") || cond.includes("ui/ux >=")) {
        const threshold = parseInt(cond.match(/\b\d+\b/)?.[0] || "6", 10);
        if (fqeReport.responsiveScore >= threshold) {
          awarded = true;
          detail = `High responsive UI layout verified (${fqeReport.responsiveScore}/7, threshold: ${threshold}).`;
        }
      } else if (cond.includes("readme >=") || cond.includes("documentation >=")) {
        const threshold = parseInt(cond.match(/\b\d+\b/)?.[0] || "5", 10);
        if (fqeReport.documentationScore >= threshold) {
          awarded = true;
          detail = `Comprehensive README documentation verified (${fqeReport.documentationScore}/6, threshold: ${threshold}).`;
        }
      } else if (cond.includes("tech contains") || cond.includes("has tech") || cond.includes("animation") || cond.includes("motion")) {
        let techName = "framer motion";
        if (cond.includes("tech contains")) {
          const match = (b.condition || b.name || "").match(/tech contains\s+([a-zA-Z0-9\s\.\-_]+)/i);
          if (match) techName = match[1].toLowerCase().trim();
        }
        const hasTech = techReport.detectedTechnologies.some((t) => t.technology.toLowerCase().includes(techName));
        if (hasTech) {
          awarded = true;
          detail = `Required technology "${techName}" detected in source code.`;
        }
      } else if (cond.includes("accessibility >=")) {
        const threshold = parseInt(cond.match(/\b\d+\b/)?.[0] || "80", 10);
        const score = fqeReport.accessibilityScore * (100 / 7);
        if (score >= threshold) {
          awarded = true;
          detail = `Accessibility score reached ${Math.round(score)}% (threshold: ${threshold}%).`;
        }
      } else {
        // Fallback checks by name keywords
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
        } else {
          if (featureReport.totalFeatureCoveragePercent > 80) {
            awarded = true;
            detail = `Feature coverage high (${featureReport.totalFeatureCoveragePercent}%).`;
          }
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

    const passThreshold = this.resolvePassingThreshold(blueprint);
    const status: "pass" | "fail" = !autoFailTriggered && finalScore >= passThreshold ? "pass" : "fail";

    logs.push(`[Scoring Engine] Final Score computed: ${finalScore}/100 [${status.toUpperCase()}]. Pass Threshold: ${passThreshold}. Category sum: ${sumCategoryMarks}, Bonuses: +${totalBonusPoints}, Deductions: -${totalDeductions}.`);

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
