"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = void 0;
class ScoringEngine {
    calculateFinalScores(blueprint, featureResults, repoAnalysis, routeResults, uiAnalysis, reasonings) {
        const logs = [];
        logs.push("FAIE Scoring Engine initialized: Executing deterministic score calculations.");
        // 1. Feature Coverage
        const totalReqFeatures = blueprint.requiredFeatures.length || 1;
        const implementedCount = featureResults.filter((f) => f.implementationStatus !== "Not Implemented").length;
        const featureCoveragePercent = Math.round((implementedCount / totalReqFeatures) * 100);
        logs.push(`Feature Coverage computed: ${featureCoveragePercent}% (${implementedCount}/${totalReqFeatures} features).`);
        // 2. Repository Coverage & Tech Compliance
        const allowedTech = (blueprint.techStackRules.allowed || []).map((t) => t.toLowerCase());
        let matchedTechCount = 0;
        if (allowedTech.length > 0) {
            repoAnalysis.allDependencies.forEach((dep) => {
                if (allowedTech.some((at) => dep.toLowerCase().includes(at)))
                    matchedTechCount++;
            });
        }
        const technologyCompliancePercent = allowedTech.length > 0 ? Math.min(100, Math.round((matchedTechCount / allowedTech.length) * 100) + 70) : 100;
        // 3. Folder Compliance
        const folderCompliancePercent = repoAnalysis.detectedFilesCount > 5 ? 100 : 50;
        // 4. UI Compliance
        const uiCompliancePercent = uiAnalysis.detectedUIComponents.length > 0
            ? Math.min(100, uiAnalysis.detectedUIComponents.length * 15 + (uiAnalysis.isResponsive ? 25 : 0))
            : 50;
        // 5. Module & Overall Alignment
        const moduleCoveragePercent = routeResults.coveragePercent;
        const overallAlignmentPercent = Math.round(featureCoveragePercent * 0.4 +
            technologyCompliancePercent * 0.2 +
            uiCompliancePercent * 0.2 +
            moduleCoveragePercent * 0.2);
        // Sum category awarded marks
        let sumCategoryScore = 0;
        reasonings.forEach((r) => {
            sumCategoryScore += r.scoreAwarded;
        });
        // Check mandatory pass/fail rules
        let status = "pass";
        let deductionsTotal = 0;
        if (blueprint.mandatoryRules) {
            for (const rule of blueprint.mandatoryRules) {
                if (rule.autoFail && overallAlignmentPercent < 40) {
                    status = "fail";
                    logs.push(`Mandatory Rule Triggered AUTO-FAIL: ${rule.rule}`);
                }
                else if (rule.penalty > 0 && !uiAnalysis.isResponsive) {
                    deductionsTotal += rule.penalty;
                    logs.push(`Mandatory Rule Penalty: ${rule.rule} (-${rule.penalty} pts)`);
                }
            }
        }
        // Check bonus rules
        let bonusPointsTotal = 0;
        if (blueprint.bonusRules) {
            for (const bonus of blueprint.bonusRules) {
                if (bonus.points > 0 && (repoAnalysis.hasTailwind || repoAnalysis.hasTsConfig)) {
                    bonusPointsTotal += bonus.points;
                    logs.push(`Bonus Awarded: ${bonus.name} (+${bonus.points} pts)`);
                }
            }
        }
        const unscaledScore = sumCategoryScore + bonusPointsTotal - deductionsTotal;
        const finalScore = status === "fail" ? 0 : Math.max(0, Math.min(100, Math.round(unscaledScore)));
        logs.push(`FAIE Final Deterministic Score: ${finalScore}/100.`);
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
exports.ScoringEngine = ScoringEngine;
