import * as fs from "fs";
import * as path from "path";

export interface Blueprint {
  problemStatement: {
    title: string;
    description: string;
    background?: string;
    objectives?: string;
    expectedSolution?: string;
    idealWorkflow?: string;
    targetAudience?: string;
    difficulty?: string;
  };
  requiredFeatures: Array<{
    name: string;
    description: string;
    mandatory: boolean;
    weight: number;
  }>;
  techStackRules: {
    allowed: string[];
    preferred: string[];
    restricted: string[];
    frameworkRequirements?: string;
    databaseRequirements?: string;
    hostingRequirements?: string;
  };
  submissionRequirements: Record<string, boolean>;
  codeQualityRules: Record<string, number>;
  performanceRules: {
    lighthouseMin: number;
    accessibilityMin: number;
    seoMin: number;
    bestPracticesMin: number;
    performanceWeight: number;
  };
  securityRules: Record<string, boolean>;
  scoringSystem: {
    categories: Array<{
      name: string;
      weight: number;
      maxMarks: number;
      passingMarks: number;
    }>;
  };
  autoPassFailRules: Array<{
    rule: string;
    action: "fail" | "deduct";
    points?: number;
  }>;
  bonusRules: Array<{
    name: string;
    points: number;
  }>;
  aiEvaluationPrompt: string;
}

// Structured output for the AI Engine (Semantic Evaluator only)
export interface AISemanticOutput {
  problemAlignment: {
    score: number;
    reason: string;
  };
  requiredFeatures: {
    implemented: string[];
    missing: string[];
    score: number;
  };
  innovation: {
    score: number;
    reason: string;
  };
  bonusSuggestions: string[];
}

// Tool-generated evidence items (Fully deterministic)
export interface ToolAuditResults {
  performance: {
    lighthouseScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    passedMinChecks: boolean;
    evidence: {
      metrics: string[];
      deductions: string[];
    };
  };
  security: {
    vulnerabilities: Array<{ package: string; severity: string; details: string }>;
    secretsFound: string[];
    passedScan: boolean;
    evidence: {
      vulnerabilitySummary: string;
      secretsLog: string;
    };
  };
  codeQuality: {
    detectedFilesCount: number;
    typescriptUsagePercent: number;
    readmeSize: number;
    commentsDensityPercent: number;
    folderStructureValid: boolean;
    evidence: {
      structureLog: string;
      typescriptLog: string;
      documentationLog: string;
    };
  };
  gitHealth: {
    isPublic: boolean;
    hasGitHistory: boolean;
    hasReadme: boolean;
  };
}

// Final Merged Auditable Report Card
export interface DynamicEvaluationReport {
  hackathonTitle: string;
  repoUrl: string;
  status: "pass" | "fail";
  scoreSummary: {
    finalScore: number;
    aiScoreTotal: number;
    toolScoreTotal: number;
    bonusPointsTotal: number;
    deductionsTotal: number;
  };
  aiEvaluation: AISemanticOutput;
  toolAudits: ToolAuditResults;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: "AI Judge" | "Deterministic Tool" | "Merged Engine";
    evidenceCitations: string[];
  }>;
  logs: string[];
  auditableReportId: string;
  timestamp: string;
}

// AI Semantic Judge Simulator
async function runAISemanticEvaluation(
  repoUrl: string,
  blueprint: Blueprint,
  detectedTech: string[],
  detectedFeatures: string[]
): Promise<AISemanticOutput> {
  // Simulate AI understanding. In production, this formats the prompt,
  // packages the README, folder structure, and calls the Gemini API.
  await delay(1200);

  // 1. Calculate Problem Alignment Score
  const alignmentMax = blueprint.scoringSystem.categories.find(c => c.name.toLowerCase().includes("alignment"))?.maxMarks || 20;
  const alignmentScore = Math.floor(alignmentMax * 0.9); // 90% alignment based on semantic reading

  // 2. Map required features
  const implemented: string[] = [];
  const missing: string[] = [];
  let featuresWeightAwarded = 0;
  let totalFeaturesWeight = 0;

  blueprint.requiredFeatures.forEach((f) => {
    totalFeaturesWeight += f.weight;
    // Semantically check if the feature was detected or fits the mock project
    const matchesDetected = detectedFeatures.some(df => df.toLowerCase().includes(f.name.toLowerCase()));
    if (matchesDetected || f.mandatory || Math.random() > 0.2) {
      implemented.push(f.name);
      featuresWeightAwarded += f.weight;
    } else {
      missing.push(f.name);
    }
  });

  const featuresMaxMarks = blueprint.scoringSystem.categories.find(c => c.name.toLowerCase().includes("feature") || c.name.toLowerCase().includes("ui"))?.maxMarks || 25;
  const featuresScore = totalFeaturesWeight > 0 
    ? Math.round((featuresWeightAwarded / totalFeaturesWeight) * featuresMaxMarks)
    : featuresMaxMarks;

  // 3. Innovation Score
  const innovationMax = blueprint.scoringSystem.categories.find(c => c.name.toLowerCase().includes("innovation"))?.maxMarks || 15;
  const innovationScore = Math.floor(innovationMax * 0.8); // 80% innovation marks

  return {
    problemAlignment: {
      score: alignmentScore,
      reason: `Semantically aligned with problem statement "${blueprint.problemStatement.title}". Successfully covers the core objectives of "${blueprint.problemStatement.expectedSolution}".`,
    },
    requiredFeatures: {
      implemented,
      missing,
      score: featuresScore,
    },
    innovation: {
      score: innovationScore,
      reason: "Excellent UI animations (Framer Motion detected) and intuitive glassmorphic visual hierarchy.",
    },
    bonusSuggestions: [
      "Offline cache support via Service Workers",
      "Dynamic dashboard widget personalization tools"
    ],
  };
}

// Deterministic Tool Evaluator (No AI interference)
async function runToolAudits(
  repoUrl: string,
  blueprint: Blueprint
): Promise<ToolAuditResults> {
  await delay(1000);

  // Simulated metrics based on repository metadata
  const lighthouseScore = 88;
  const accessibilityScore = 92;
  const seoScore = 85;
  const bestPracticesScore = 90;

  // Check performance minimums configured in blueprint
  const passedPerf = lighthouseScore >= blueprint.performanceRules.lighthouseMin;
  const passedAccess = accessibilityScore >= blueprint.performanceRules.accessibilityMin;
  const passedSeo = seoScore >= blueprint.performanceRules.seoMin;
  const passedBest = bestPracticesScore >= blueprint.performanceRules.bestPracticesMin;

  const performanceDeductions: string[] = [];
  if (!passedPerf) performanceDeductions.push(`Lighthouse score (${lighthouseScore}) below minimum required (${blueprint.performanceRules.lighthouseMin}).`);
  if (!passedAccess) performanceDeductions.push(`Accessibility score (${accessibilityScore}) below minimum required (${blueprint.performanceRules.accessibilityMin}).`);

  // Simulated security vulnerabilities
  const vulnerabilities = [
    { package: "lodash", severity: "moderate", details: "Prototype pollution vulnerability in lodash version <= 4.17.20" }
  ];

  return {
    performance: {
      lighthouseScore,
      accessibilityScore,
      seoScore,
      bestPracticesScore,
      passedMinChecks: passedPerf && passedAccess && passedSeo && passedBest,
      evidence: {
        metrics: [
          `Lighthouse Performance: ${lighthouseScore}/100`,
          `Lighthouse Accessibility: ${accessibilityScore}/100`,
          `Lighthouse SEO: ${seoScore}/100`,
          `Lighthouse Best Practices: ${bestPracticesScore}/100`
        ],
        deductions: performanceDeductions,
      }
    },
    security: {
      vulnerabilities: blueprint.securityRules.npmAudit ? vulnerabilities : [],
      secretsFound: [],
      passedScan: true,
      evidence: {
        vulnerabilitySummary: `Checked dependencies via npm audit. Found ${blueprint.securityRules.npmAudit ? 1 : 0} vulnerability.`,
        secretsLog: "Scanned files for API keys, private certificates, and raw env variables. No secrets leaked."
      }
    },
    codeQuality: {
      detectedFilesCount: 38,
      typescriptUsagePercent: 92,
      readmeSize: 1450,
      commentsDensityPercent: 12,
      folderStructureValid: true,
      evidence: {
        structureLog: "Standard layout folders found: src/components, src/hooks, app/routes.",
        typescriptLog: "Detected 32 ts/tsx files. TypeScript usage at 92%.",
        documentationLog: "Parsed README.md file. Size: 1450 bytes. Installation instructions block detected."
      }
    },
    gitHealth: {
      isPublic: true,
      hasGitHistory: true,
      hasReadme: true,
    }
  };
}

export async function evaluateSubmission(
  repoUrl: string,
  blueprint: Blueprint
): Promise<DynamicEvaluationReport> {
  const logs: string[] = [];
  logs.push(`[1/14] Submission received: ${repoUrl}`);
  logs.push(`[2/14] Loaded Evaluation Blueprint: "${blueprint.problemStatement.title}"`);

  // 1. Clone Repository (Simulated)
  logs.push(`[3/14] Cloning repository to temporary workspace...`);
  await delay(800);
  logs.push(`[3/14] Successfully cloned. Found package.json, tsconfig.json, and src directory.`);

  // 2. Deterministic Tool Audits (Code Quality, Security, Performance, Accessibility)
  logs.push(`[4/14] Running automated static checks...`);
  logs.push(`[5/14] Running deterministic Security Scan...`);
  logs.push(`[6/14] Running performance metrics scanner (Lighthouse)...`);
  logs.push(`[7/14] Running accessibility compliance audits...`);
  logs.push(`[8/14] Running README validation parser...`);
  
  const toolResults = await runToolAudits(repoUrl, blueprint);
  
  logs.push(`[8/14] Automated tool audits complete.`);

  // 3. Extract inputs for AI semantic evaluation (Exclude performance, security, and quality scores)
  logs.push(`[9/14] Extracting problem statement and required features list...`);
  
  const detectedTech = ["Next.js", "TailwindCSS", "TypeScript", "Zustand"];
  const detectedFeatures = ["Authentication", "Dashboard", "Charts"];

  // 4. Run AI Semantic Evaluation (Evaluate Alignment, Expected Solution, Features, Innovation ONLY)
  logs.push(`[10/14] Packaging semantic metadata for AI Judge...`);
  logs.push(`[11/14] Dispatching prompt to AI Engine for semantic alignment checks...`);
  
  const aiResults = await runAISemanticEvaluation(repoUrl, blueprint, detectedTech, detectedFeatures);
  
  logs.push(`[11/14] AI semantic evaluation complete.`);

  // 5. Merge AI & Tool Results (Score Engine calculations)
  logs.push(`[12/14] Score Engine: Merging tool scores and AI semantic scores...`);
  
  let status: "pass" | "fail" = "pass";
  let deductionsTotal = 0;

  // Apply Auto-Fail and deduction rules
  blueprint.autoPassFailRules.forEach((rule) => {
    if (rule.rule.includes("GitHub") && !repoUrl.includes("github.com")) {
      status = "fail";
      logs.push(`[12/14] AUTO-FAIL rule triggered: "${rule.rule}"`);
    }
    if (rule.rule.includes("Lighthouse") && !toolResults.performance.passedMinChecks) {
      deductionsTotal += rule.points || 15;
      logs.push(`[12/14] Rule Deduction: Lighthouse below min score. Deducting ${rule.points || 15} points.`);
    }
  });

  // Category Scoring Calculation
  const categoriesReport: any[] = [];
  let aiScoreTotal = 0;
  let toolScoreTotal = 0;

  blueprint.scoringSystem.categories.forEach((cat) => {
    let scoreAwarded = 0;
    let evaluatedBy: "AI Judge" | "Deterministic Tool" | "Merged Engine" = "Deterministic Tool";
    const citations: string[] = [];

    const nameLower = cat.name.toLowerCase();

    if (nameLower.includes("alignment") || nameLower.includes("problem")) {
      scoreAwarded = aiResults.problemAlignment.score;
      aiScoreTotal += scoreAwarded;
      evaluatedBy = "AI Judge";
      citations.push(`AI semantic check: ${aiResults.problemAlignment.reason}`);
    } else if (nameLower.includes("feature") || nameLower.includes("ui/ux") || nameLower.includes("ui")) {
      scoreAwarded = aiResults.requiredFeatures.score;
      aiScoreTotal += scoreAwarded;
      evaluatedBy = "AI Judge";
      citations.push(`AI feature verification: Implemented features [${aiResults.requiredFeatures.implemented.join(", ")}].`);
      if (aiResults.requiredFeatures.missing.length > 0) {
        citations.push(`Missing features: [${aiResults.requiredFeatures.missing.join(", ")}].`);
      }
    } else if (nameLower.includes("performance") || nameLower.includes("seo")) {
      scoreAwarded = Math.round((toolResults.performance.lighthouseScore / 100) * cat.maxMarks);
      toolScoreTotal += scoreAwarded;
      evaluatedBy = "Deterministic Tool";
      citations.push(...toolResults.performance.evidence.metrics);
      if (toolResults.performance.evidence.deductions.length > 0) {
        citations.push(...toolResults.performance.evidence.deductions);
      }
    } else if (nameLower.includes("accessibility")) {
      scoreAwarded = Math.round((toolResults.performance.accessibilityScore / 100) * cat.maxMarks);
      toolScoreTotal += scoreAwarded;
      evaluatedBy = "Deterministic Tool";
      citations.push(`Accessibility check: ${toolResults.performance.accessibilityScore}/100.`);
    } else if (nameLower.includes("innovation")) {
      scoreAwarded = aiResults.innovation.score;
      aiScoreTotal += scoreAwarded;
      evaluatedBy = "AI Judge";
      citations.push(`AI Innovation check: ${aiResults.innovation.reason}`);
    } else if (nameLower.includes("documentation") || nameLower.includes("readme")) {
      // Deterministic check of README presence and size
      scoreAwarded = toolResults.codeQuality.readmeSize > 1000 ? cat.maxMarks : Math.round(cat.maxMarks * 0.5);
      toolScoreTotal += scoreAwarded;
      evaluatedBy = "Deterministic Tool";
      citations.push(toolResults.codeQuality.evidence.documentationLog);
    } else {
      // General fall-through merged
      scoreAwarded = Math.round(cat.maxMarks * 0.8);
      evaluatedBy = "Merged Engine";
      citations.push("Evaluated dynamically by merging code density metrics and file scanner checks.");
    }

    categoriesReport.push({
      categoryName: cat.name,
      awardedMarks: scoreAwarded,
      maxMarks: cat.maxMarks,
      passingMarks: cat.passingMarks,
      evaluatedBy,
      evidenceCitations: citations,
    });
  });

  // Calculate Bonus Rules (e.g. Best UI, Best Animations)
  let bonusPointsTotal = 0;
  blueprint.bonusRules.forEach((bonus) => {
    // Determine bonus deterministically based on tool scores (e.g., high lighthouse -> performance bonus)
    if (bonus.name.includes("UI") && aiResults.requiredFeatures.score > 20) {
      bonusPointsTotal += bonus.points;
      logs.push(`[13/14] BONUS AWARDED: "${bonus.name}" (+${bonus.points} marks)`);
    } else if (bonus.name.includes("README") && toolResults.codeQuality.readmeSize > 1200) {
      bonusPointsTotal += bonus.points;
      logs.push(`[13/14] BONUS AWARDED: "${bonus.name}" (+${bonus.points} marks)`);
    }
  });

  // Calculate final score
  const sumScores = aiScoreTotal + toolScoreTotal + bonusPointsTotal;
  const finalScore = Math.max(0, Math.min(100, (status as string) === "fail" ? 0 : sumScores - deductionsTotal));

  logs.push(`[14/14] Merged final score computed: ${finalScore}/100. Storing result.`);

  return {
    hackathonTitle: blueprint.problemStatement.title,
    repoUrl,
    status,
    scoreSummary: {
      finalScore,
      aiScoreTotal,
      toolScoreTotal,
      bonusPointsTotal,
      deductionsTotal,
    },
    aiEvaluation: aiResults,
    toolAudits: toolResults,
    scoringDetails: categoriesReport,
    logs,
    auditableReportId: `rep_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
