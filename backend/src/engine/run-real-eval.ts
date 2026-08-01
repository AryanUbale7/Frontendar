import { prisma } from "../config/db";

async function runRealEval() {
  const repoUrl = "https://github.com/piyushdahatonde2007-tech/agrovision-analytics";

  // Get Frontend Wars 2026 blueprint
  const hackathon = await prisma.hackathon.findFirst({
    where: { name: "Frontend Wars 2026" }
  });

  if (!hackathon) {
    console.error("Frontend Wars 2026 hackathon not found in database.");
    process.exit(1);
  }

  const blueprint = await prisma.blueprint.findUnique({
    where: { hackathonId: hackathon.id }
  });

  if (!blueprint) {
    console.error("Blueprint not found.");
    process.exit(1);
  }

  console.log(`Sending real evaluation request for ${repoUrl}...`);
  try {
    const res = await fetch("http://localhost:4000/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoUrl,
        hackathonId: hackathon.id,
        userId: "real_piyush_user",
        projectName: "AgroVision Analytics",
        blueprint: blueprint
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`HTTP Error: ${res.status} - ${errText}`);
      process.exit(1);
    }

    const report = await res.json();
    console.log("=========================================");
    console.log("REAL FAIE REPORT CAPTURED");
    console.log("=========================================");
    console.log("Detected Project Type:", report.projectClassification?.detectedProjectType);
    console.log("Confidence:", report.projectClassification?.confidencePercent, "%");
    console.log("Final Score:", report.scoreSummary?.finalScore);
    console.log("Details:", JSON.stringify(report.scoringDetails, null, 2));
    console.log("Classification Evidence:", report.projectClassification?.evidenceSummary);
  } catch (err: any) {
    console.error("E2E Run failed:", err.message);
  }
}

runRealEval();
