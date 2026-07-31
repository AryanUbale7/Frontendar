import { ValidationSuiteReport } from "./faie.validation.suite";

export class AccuracyReporter {
  public formatReport(report: ValidationSuiteReport): string {
    const lines: string[] = [];

    lines.push("=========================================================");
    lines.push("      FRONTEND ARENA INTELLIGENCE ENGINE (FAIE v2)      ");
    lines.push("               ACCURACY VALIDATION REPORT               ");
    lines.push("=========================================================");
    lines.push(`Timestamp: ${report.timestamp}`);
    lines.push(`Benchmarks Evaluated: ${report.totalBenchmarksTested}`);
    lines.push(`Overall Accuracy Rate: ${report.accuracyRatePercent}% (${report.passedBenchmarkMatches}/${report.totalBenchmarksTested} matches)`);
    lines.push(`Mean Absolute Error (MAE): ${report.meanAbsoluteError} pts`);
    lines.push(`Precision: ${report.precisionPercent}% | Recall: ${report.recallPercent}% | F1-Score: ${report.f1ScorePercent}%`);
    lines.push(`False Positives: ${report.totalFalsePositives} | False Negatives: ${report.totalFalseNegatives}`);
    lines.push("---------------------------------------------------------");

    lines.push("\n--- BENCHMARK EVALUATION BREAKDOWN ---");
    report.benchmarkDetails.forEach((bm, idx) => {
      lines.push(`\n[Benchmark #${idx + 1}] ${bm.benchmarkName}`);
      lines.push(`  - Expected Score vs Actual: ${bm.expectedScore} pts vs ${bm.actualScore} pts (Diff: ${bm.scoreDifference} pts)`);
      lines.push(`  - Expected Status vs Actual: ${bm.expectedStatus.toUpperCase()} vs ${bm.actualStatus.toUpperCase()} [${bm.statusMatch ? "MATCH" : "MISMATCH"}]`);
      lines.push(`  - Features Implemented: ${bm.actualFeaturesImplemented} / Expected: ${bm.expectedFeaturesCount}`);
      lines.push(`  - Rejected Claims Shield: ${bm.rejectedClaimsDetected} claim(s) rejected`);
      if (bm.tuningRecommendations.length > 0) {
        lines.push("  - Mismatches & Recommendations:");
        bm.tuningRecommendations.forEach((rec) => lines.push(`    * ${rec}`));
      }
    });

    lines.push("\n--- SYSTEM RULE TUNING RECOMMENDATIONS ---");
    report.systemTuningRecommendations.forEach((rec) => lines.push(`  • ${rec}`));
    lines.push("=========================================================");

    return lines.join("\n");
  }
}
