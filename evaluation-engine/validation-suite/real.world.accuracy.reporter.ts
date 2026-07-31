import { RealWorldValidationReport } from "./real.world.validation.suite";

export class RealWorldAccuracyReporter {
  public formatReport(report: RealWorldValidationReport): string {
    const lines: string[] = [];

    lines.push("=========================================================================");
    lines.push("        FRONTEND ARENA INTELLIGENCE ENGINE (FAIE v2) — VALIDATION SUITE        ");
    lines.push("           REAL-WORLD GITHUB OPEN-SOURCE ACCURACY & HUMAN COMPARISON           ");
    lines.push("=========================================================================");
    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Real GitHub Repositories Cloned & Evaluated: ${report.totalRealWorldReposEvaluated}`);
    lines.push(`Overall Accuracy Rate vs Human Judge: ${report.overallAccuracyRatePercent}% (${report.matchesCount}/${report.totalRealWorldReposEvaluated} matches)`);
    lines.push(`Average Difference: ${report.averageDifference > 0 ? "+" : ""}${report.averageDifference} pts`);
    lines.push(`Mean Absolute Error (MAE): ${report.meanAbsoluteError} pts`);
    lines.push(`Median Error: ${report.medianError} pts | Std Deviation Error: ${report.stdDeviationError} pts`);
    lines.push(`95% Confidence Interval (MAE): [${report.confidenceInterval95.lowerBound} pts, ${report.confidenceInterval95.upperBound} pts] (Margin: ±${report.confidenceInterval95.marginOfError} pts)`);
    lines.push(`Precision: ${report.precisionPercent}% | Recall: ${report.recallPercent}% | F1-Score: ${report.f1ScorePercent}%`);
    lines.push(`False Positives: ${report.falsePositivesCount} | False Negatives: ${report.falseNegativesCount}`);
    lines.push(`Feature Detection Accuracy: ${report.featureDetectionAccuracyPercent}%`);
    lines.push("-------------------------------------------------------------------------");

    lines.push("\n--- REAL-WORLD REPOSITORY EVALUATION BREAKDOWN ---");
    lines.push("Repository Name".padEnd(45, " ") + " | Human | FAIE | Diff | Status");
    lines.push("-".repeat(80));
    report.benchmarkDetails.forEach((bm) => {
      const statusStr = bm.statusMatch ? "MATCH" : "MISMATCH";
      const diffStr = (bm.signedDifference > 0 ? "+" : "") + bm.signedDifference + " pts";
      lines.push(
        `${bm.name.slice(0, 44).padEnd(45, " ")} | ${String(bm.humanScore).padStart(5, " ")} | ${String(bm.faieScore).padStart(4, " ")} | ${diffStr.padStart(8, " ")} | ${statusStr}`
      );
    });

    lines.push("\n--- FRAMEWORK ACCURACY BREAKDOWN ---");
    lines.push("Framework".padEnd(20, " ") + " | Total | Matches | Accuracy | MAE");
    lines.push("-".repeat(60));
    report.frameworkAccuracyBreakdown.forEach((fw) => {
      lines.push(
        `${fw.framework.padEnd(20, " ")} | ${String(fw.total).padStart(5, " ")} | ${String(fw.matches).padStart(7, " ")} | ${String(fw.accuracyPercent).padStart(7, " ")}% | ${fw.mae.toFixed(1)} pts`
      );
    });

    lines.push("\n--- CATEGORY ACCURACY BREAKDOWN ---");
    lines.push("Category".padEnd(25, " ") + " | Total | Matches | Accuracy | MAE");
    lines.push("-".repeat(65));
    report.categoryAccuracyBreakdown.forEach((cat) => {
      lines.push(
        `${cat.category.padEnd(25, " ")} | ${String(cat.total).padStart(5, " ")} | ${String(cat.matches).padStart(7, " ")} | ${String(cat.accuracyPercent).padStart(7, " ")}% | ${cat.mae.toFixed(1)} pts`
      );
    });

    lines.push("\n--- SYSTEM RULE TUNING RECOMMENDATIONS ---");
    report.systemTuningRecommendations.forEach((rec) => lines.push(`  • ${rec}`));
    lines.push("=========================================================================");

    return lines.join("\n");
  }
}
