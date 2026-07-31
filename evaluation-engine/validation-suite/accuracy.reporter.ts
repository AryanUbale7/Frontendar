import { ComprehensiveValidationReport } from "./faie.validation.suite";

export class AccuracyReporter {
  public formatReport(report: ComprehensiveValidationReport): string {
    const lines: string[] = [];

    lines.push("=========================================================================");
    lines.push("        FRONTEND ARENA INTELLIGENCE ENGINE (FAIE v2) — VALIDATION SUITE        ");
    lines.push("                  50-BENCHMARK ACCURACY & PERFORMANCE REPORT                   ");
    lines.push("=========================================================================");
    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Total Benchmark Repositories Evaluated: ${report.totalBenchmarksTested}`);
    lines.push(`Overall Accuracy Rate: ${report.overallAccuracyRatePercent}% (${report.passedBenchmarkMatches}/${report.totalBenchmarksTested} matches)`);
    lines.push(`Mean Absolute Error (MAE): ${report.meanAbsoluteError} pts`);
    lines.push(`Precision: ${report.precisionPercent}% | Recall: ${report.recallPercent}% | F1-Score: ${report.f1ScorePercent}%`);
    lines.push("-------------------------------------------------------------------------");

    lines.push("\n--- CONFUSION MATRIX ---");
    lines.push("                  +---------------------+---------------------+");
    lines.push("                  | Predicted PASS      | Predicted FAIL      |");
    lines.push("  +---------------+---------------------+---------------------+");
    lines.push(`  | Actual PASS   | TP = ${String(report.confusionMatrix.truePositives).padStart(3, " ")}           | FN = ${String(report.confusionMatrix.falseNegatives).padStart(3, " ")}           |`);
    lines.push(`  | Actual FAIL   | FP = ${String(report.confusionMatrix.falsePositives).padStart(3, " ")}           | TN = ${String(report.confusionMatrix.trueNegatives).padStart(3, " ")}           |`);
    lines.push("  +---------------+---------------------+---------------------+");

    lines.push("\n--- SCORE DISTRIBUTION ---");
    report.scoreDistribution.forEach((sd) => {
      const bar = "█".repeat(Math.round(sd.percentage / 5));
      lines.push(`  ${sd.range.padEnd(25, " ")} | ${String(sd.count).padStart(2, " ")} repos (${String(sd.percentage).padStart(2, " ")}%) ${bar}`);
    });

    lines.push("\n--- FRAMEWORK ACCURACY BREAKDOWN ---");
    lines.push("Framework".padEnd(20, " ") + " | Total | Matches | Accuracy | MAE");
    lines.push("-".repeat(60));
    report.frameworkAccuracyBreakdown.forEach((fw) => {
      lines.push(
        `${fw.framework.padEnd(20, " ")} | ${String(fw.totalBenchmarks).padStart(5, " ")} | ${String(fw.matchesCount).padStart(7, " ")} | ${String(fw.accuracyPercent).padStart(7, " ")}% | ${fw.mae.toFixed(1)} pts`
      );
    });

    lines.push("\n--- CATEGORY ACCURACY BREAKDOWN ---");
    lines.push("Category".padEnd(30, " ") + " | Total | Matches | Accuracy | MAE");
    lines.push("-".repeat(70));
    report.categoryAccuracyBreakdown.forEach((cat) => {
      lines.push(
        `${cat.category.padEnd(30, " ")} | ${String(cat.totalBenchmarks).padStart(5, " ")} | ${String(cat.matchesCount).padStart(7, " ")} | ${String(cat.accuracyPercent).padStart(7, " ")}% | ${cat.mae.toFixed(1)} pts`
      );
    });

    lines.push("\n--- TOP 20 LARGEST SCORE DIFFERENCES ---");
    lines.push("Benchmark Name".padEnd(45, " ") + " | Exp Score | Act Score | Diff | Status");
    lines.push("-".repeat(85));
    report.top20LargestDifferences.forEach((bm) => {
      const statusStr = bm.statusMatch ? "MATCH" : "MISMATCH";
      lines.push(
        `${bm.benchmarkName.slice(0, 44).padEnd(45, " ")} | ${String(bm.expectedScore).padStart(9, " ")} | ${String(bm.actualScore).padStart(9, " ")} | ${String(bm.scoreDifference).padStart(4, " ")} | ${statusStr}`
      );
    });

    lines.push("\n--- SYSTEM RULE TUNING RECOMMENDATIONS ---");
    report.systemTuningRecommendations.forEach((rec) => lines.push(`  • ${rec}`));
    lines.push("=========================================================================");

    return lines.join("\n");
  }
}
