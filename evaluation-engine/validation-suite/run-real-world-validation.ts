import { RealWorldValidationSuite } from "./real.world.validation.suite";
import { RealWorldAccuracyReporter } from "./real.world.accuracy.reporter";

async function main() {
  console.log("Initializing FAIE Real-World GitHub Open-Source Validation Suite...");
  const suite = new RealWorldValidationSuite();
  const reporter = new RealWorldAccuracyReporter();

  const report = await suite.runRealWorldValidation();
  const output = reporter.formatReport(report);
  console.log(output);
}

main().catch((err) => {
  console.error("Real-world validation suite error:", err);
});
