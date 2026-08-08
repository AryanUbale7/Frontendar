import { FAIEOrchestrator } from "../../../evaluation-engine/intelligence-engine";

async function runAuditPipelineTests() {
  console.log("================================================================");
  console.log("FAIE v3 Blueprint Single-Source-Of-Truth Verification Suite");
  console.log("================================================================\n");

  const orchestrator = new FAIEOrchestrator();
  const repoUrl = "https://github.com/aryanubale7/test_hw.git";

  // ---------------------------------------------------------------------------
  // BLUEPRINT A: Enterprise SaaS Challenge (High Feature & Tech Weights)
  // ---------------------------------------------------------------------------
  const blueprintA: any = {
    version: 1,
    problemStatement: {
      id: "ps_saas_101",
      title: "Enterprise SaaS Portal Challenge",
      description: "Build an enterprise dashboard with auth and analytics.",
    },
    requiredFeatures: [
      {
        name: "Authentication",
        mandatory: true,
        weight: 30,
        description: "User authentication & JWT sessions",
        keywords: ["auth", "login", "jwt"],
        synonyms: ["signin", "session"],
      },
      {
        name: "Analytics & Charting",
        mandatory: false,
        weight: 20,
        description: "Interactive data visualization widgets",
        keywords: ["analytics", "chart", "graph"],
        synonyms: ["recharts", "visualization"],
      },
    ],
    techStackRules: {
      allowed: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      required: ["TypeScript", "Next.js"],
      preferred: ["Tailwind CSS"],
      restricted: ["Angular", "jQuery"],
      frameworkRequirements: "Next.js",
      databaseRequirements: "Prisma",
    },
    submissionRequirements: {
      githubRepo: true,
      liveDeployment: true,
      readme: true,
    },
    codeQualityRules: {
      readme: 20,
      folders: 30,
      comments: 30,
      typescript: 20,
    },
    scoringSystem: {
      categories: [
        { name: "Problem Alignment & Required Features", weight: 50, maxMarks: 50, passingMarks: 30 },
        { name: "Technology Stack Compliance", weight: 30, maxMarks: 30, passingMarks: 18 },
        { name: "Code Quality & Architecture (FQE Audit)", weight: 20, maxMarks: 20, passingMarks: 12 },
      ],
    },
    autoPassFailRules: [
      { rule: "Missing Mandatory Feature", action: "fail" },
      { rule: "Restricted Technology", action: "fail" },
    ],
    bonusRules: [
      { name: "High Responsive Design", points: 5 },
      { name: "Comprehensive README", points: 5 },
    ],
    synonymDictionary: {
      authentication: ["login", "jwt", "session"],
      charting: ["chart", "recharts"],
    },
  };

  // ---------------------------------------------------------------------------
  // BLUEPRINT B: Lightweight UI/UX Challenge (High Quality & Responsive Weights)
  // ---------------------------------------------------------------------------
  const blueprintB: any = {
    version: 2,
    problemStatement: {
      id: "ps_ui_202",
      title: "Lightweight UI/UX Design Challenge",
      description: "Build an accessible responsive interface.",
    },
    requiredFeatures: [
      {
        name: "Interactive UI Components",
        mandatory: true,
        weight: 15,
        description: "Responsive modals and cards",
        keywords: ["button", "modal", "card"],
        synonyms: ["dialog", "component"],
      },
    ],
    techStackRules: {
      allowed: ["React", "Vue", "Tailwind CSS"],
      required: ["React"],
      preferred: ["Framer Motion"],
      restricted: ["PHP"],
      frameworkRequirements: "React",
    },
    submissionRequirements: {
      githubRepo: true,
      liveDeployment: false,
      readme: true,
      architectureDiagram: true,
    },
    codeQualityRules: {
      readme: 50,
      folders: 50,
    },
    scoringSystem: {
      categories: [
        { name: "UI/UX & Responsiveness", weight: 40, maxMarks: 40, passingMarks: 24 },
        { name: "Problem Alignment & Required Features", weight: 20, maxMarks: 20, passingMarks: 12 },
        { name: "Code Quality & Architecture (FQE Audit)", weight: 20, maxMarks: 20, passingMarks: 12 },
        { name: "Technology Stack Compliance", weight: 20, maxMarks: 20, passingMarks: 12 },
      ],
    },
    autoPassFailRules: [
      { rule: "Missing README", action: "fail" },
    ],
    bonusRules: [
      { name: "Animation Motion Bonus", points: 10 },
    ],
    synonymDictionary: {
      interactive: ["button", "modal", "card"],
    },
  };

  console.log("1. Evaluating Repository against Blueprint A (Enterprise SaaS)...");
  const reportA = await orchestrator.evaluate(repoUrl, repoUrl, blueprintA, "https://my-saas-demo.vercel.app");

  console.log("\n2. Evaluating SAME Repository against Blueprint B (Lightweight UI/UX)...");
  const reportB = await orchestrator.evaluate(repoUrl, repoUrl, blueprintB, undefined);

  console.log("\n================================================================");
  console.log("DIFFERENTIAL AUDIT RESULTS");
  console.log("================================================================\n");

  console.log(`Blueprint A Title:       ${reportA.hackathonTitle}`);
  console.log(`Blueprint A Score:       ${reportA.scoreSummary.finalScore}/100 [Status: ${reportA.status.toUpperCase()}]`);
  console.log(`Blueprint A Categories:  ${reportA.scoringDetails.map((c) => `${c.categoryName}: ${c.awardedMarks}/${c.maxMarks}`).join(" | ")}`);

  console.log("\n----------------------------------------------------------------\n");

  console.log(`Blueprint B Title:       ${reportB.hackathonTitle}`);
  console.log(`Blueprint B Score:       ${reportB.scoreSummary.finalScore}/100 [Status: ${reportB.status.toUpperCase()}]`);
  console.log(`Blueprint B Categories:  ${reportB.scoringDetails.map((c) => `${c.categoryName}: ${c.awardedMarks}/${c.maxMarks}`).join(" | ")}`);

  console.log("\n================================================================");
  if (reportA.scoreSummary.finalScore !== reportB.scoreSummary.finalScore || reportA.scoringDetails.length !== reportB.scoringDetails.length) {
    console.log("✅ SUCCESS: Evaluation is 100% DYNAMIC! Scores and category structures changed according to Blueprint configuration.");
  } else {
    console.log("❌ FAILURE: Scores remained identical across different blueprints.");
  }
  console.log("================================================================\n");
}

runAuditPipelineTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
