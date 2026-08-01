import { BenchmarkRepositoryBuilder } from "./benchmark.repository.builder";
import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";

async function test() {
  const builder = new BenchmarkRepositoryBuilder();
  const benchmarks = builder.createBenchmarkSuite();
  
  // Pick Perfect Next.js app
  const bm = benchmarks[0];
  const workspacePath = builder.prepareBenchmarkWorkspace(bm);
  
  const defaultBlueprint: KnowledgeBlueprint = {
    problemStatement: {
      title: "50-Benchmark Validation Suite Problem Statement",
      description: "Verify authentication, responsive layouts, and database architecture across frameworks.",
    },
    requiredFeatures: [
      {
        id: "auth",
        name: "Authentication",
        description: "Login/Signup page",
        mandatory: true,
        weight: 20,
        expectedRoutes: ["/auth", "/login"],
        expectedComponents: ["AuthPage", "Login", "Auth"],
        expectedUIElements: ["Forms", "Buttons"],
        subFeatures: [
          { id: "login", name: "Login", weight: 10, expectedRoutes: ["/auth"] },
          { id: "signup", name: "Signup", weight: 10, expectedRoutes: ["/auth"] },
        ],
      },
      {
        id: "dash",
        name: "Responsive Dashboard",
        description: "Analytics layout",
        mandatory: true,
        weight: 20,
        expectedRoutes: ["/dashboard"],
        expectedComponents: ["Dashboard", "Navbar"],
        expectedUIElements: ["Navigation", "Cards"],
        subFeatures: [
          { id: "analytics", name: "Analytics", weight: 10, expectedRoutes: ["/dashboard"] },
          { id: "cards", name: "Cards", weight: 10, expectedRoutes: ["/dashboard"] },
        ],
      },
    ],
    techStackRules: {
      allowed: ["Next.js", "React", "Vue", "Angular", "TypeScript", "TailwindCSS"],
      required: ["React"],
      restricted: ["jQuery"],
    },
    confidenceThreshold: 70,
    scoringSystem: {
      categories: [
        { name: "Problem Alignment", weight: 20, maxMarks: 20, passingMarks: 12 },
        { name: "UI/UX & Features", weight: 30, maxMarks: 30, passingMarks: 18 },
        { name: "Performance & SEO", weight: 20, maxMarks: 20, passingMarks: 12 },
        { name: "Code Architecture", weight: 30, maxMarks: 30, passingMarks: 18 },
      ],
    },
    mandatoryRules: [],
    bonusRules: [],
  };

  defaultBlueprint.scoringSystem.categories.forEach(c => {
    const cl = c.name.toLowerCase();
    console.log(`Checking category name: "${c.name}" -> lower: "${cl}"`);
    console.log(`- contains "code quality": ${cl.includes("code quality")}`);
    console.log(`- contains "architecture": ${cl.includes("architecture")}`);
  });

  const orchestrator = new FAIEOrchestrator();
  const report = await orchestrator.evaluate(
    workspacePath,
    `https://github.com/benchmark/${bm.id}`,
    defaultBlueprint
  );

  console.log("=== EVALUATION REPORT ===");
  console.log("Benchmark Name:", bm.name);
  console.log("Actual Score:", report.scoreSummary.finalScore);
  console.log("Status:", report.status);
  console.log("Category Reasonings:");
  report.scoringDetails.forEach((cr: any) => {
    console.log(`- ${cr.categoryName}: ${cr.awardedMarks}/${cr.maxMarks} (Passing: ${cr.passingMarks}) - Rule: ${cr.ruleApplied}`);
  });

  builder.cleanupBenchmarkWorkspace(workspacePath);
}

test().catch(console.error);
