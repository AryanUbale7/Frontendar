import { FAIEValidationSuite } from "./faie.validation.suite";
import { AccuracyReporter } from "./accuracy.reporter";

async function main() {
  console.log("Initializing FAIE v2 Accuracy Validation Suite...");
  const suite = new FAIEValidationSuite();
  const reporter = new AccuracyReporter();

  const report = await suite.runValidationSuite();
  const output = reporter.formatReport(report);
  console.log(output);
}

main().catch((err) => {
  console.error("Validation suite error:", err);
});
