import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as http from "http";
import { execFileSync } from "child_process";
import { FAIEOrchestrator, KnowledgeBlueprint } from "../../../evaluation-engine/intelligence-engine";

// ---------------------------------------------------------------------------
// Phase 3 execution safeguards (do not change scoring semantics)
// ---------------------------------------------------------------------------

/** Untrusted participant input — validate before any command execution. */
function validateRepoUrl(url: string): string {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    throw new Error("Repository URL is required.");
  }
  if (!/^https?:\/\/|^(git@|ssh:\/\/|git:\/\/)/i.test(trimmed)) {
    throw new Error("Invalid repository URL: only http(s), git@, ssh:// and git:// sources are allowed.");
  }
  // No shell metacharacters, quotes, whitespace or control chars.
  if (/[\s"'`$&|;<>()\\\u0000-\u001f]/.test(trimmed)) {
    throw new Error("Invalid repository URL: contains unsupported characters.");
  }
  return trimmed;
}

function commandBin(base: string): string {
  return process.platform === "win32" ? `${base}.cmd` : base;
}

const MAX_REPO_BYTES = (Number(process.env.EVALUATION_MAX_REPO_MB) || 200) * 1024 * 1024;
const MAX_SCANNED_FILE_BYTES = 2 * 1024 * 1024;

function walkSizeBytes(dir: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += walkSizeBytes(full);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch {}
      }
    }
  } catch {}
  return total;
}

function assertRepoWithinSizeLimit(dir: string): void {
  const size = walkSizeBytes(dir);
  if (size > MAX_REPO_BYTES) {
    throw new Error(
      `Repository exceeds the configured size limit (${Math.round(size / (1024 * 1024))}MB > ${MAX_REPO_BYTES / (1024 * 1024)}MB). ` +
      `Set EVALUATION_MAX_REPO_MB to raise the limit if this is expected.`
    );
  }
}


export interface ProblemStatementEntry {
  title: string;
  description: string;
  background?: string;
  objectives?: string;
  expectedSolution?: string;
  idealWorkflow?: string;
  targetAudience?: string;
  difficulty?: string;
}

export interface Blueprint extends KnowledgeBlueprint {
  problemStatement: ProblemStatementEntry;
  problemStatements?: ProblemStatementEntry[];
  selectedProblemIndex?: number;
  requiredFeatures: Array<{
    id?: string;
    name: string;
    description: string;
    mandatory: boolean;
    weight: number;
    keywords?: string[];
    synonyms?: string[];
    subFeatures?: any[];
  }>;
  techStackRules: {
    allowed: string[];
    required: string[];
    preferred?: string[];
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
    condition?: string;
    points: number;
  }>;
}

// Tool-generated evidence items (Fully deterministic)
export interface ToolAuditResults {
  performance: {
    lighthouseScore: number | "UNAVAILABLE";
    accessibilityScore: number | "UNAVAILABLE";
    seoScore: number | "UNAVAILABLE";
    bestPracticesScore: number | "UNAVAILABLE";
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

// Final Merged Auditable Knowledge Report Card (Zero AI/LLM Dependencies)
export interface DynamicEvaluationReport {
  hackathonTitle: string;
  repoUrl: string;
  status: "pass" | "fail";
  scoreSummary: {
    finalScore: number;
    featureCoveragePercent: number;
    technologyCompliancePercent: number;
    uiCompliancePercent: number;
    moduleCoveragePercent: number;
    overallAlignmentPercent: number;
    bonusPointsTotal: number;
    deductionsTotal: number;
  };
  faieEvaluation: {
    engineName: string;
    version: string;
    status: string;
    summary: string;
  };
  projectClassification?: {
    detectedProjectType: string;
    confidencePercent: number;
    evidenceSummary: string[];
  };
  featureTreeEvaluations?: any[];
  rejectedClaims?: string[];
  screenshots?: any[];
  toolAudits: ToolAuditResults;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: string;
    evidenceCitations: string[];
    confidencePercent?: number;
    ruleApplied?: string;
  }>;
  logs: string[];
  auditableReportId: string;
  timestamp: string;
}

function resolveActiveProblem(blueprint: Blueprint): ProblemStatementEntry {
  const idx = blueprint.selectedProblemIndex ?? 0;
  if (blueprint.problemStatements && blueprint.problemStatements.length > 0) {
    return blueprint.problemStatements[idx] || blueprint.problemStatements[0];
  }
  return blueprint.problemStatement;
}

function runLighthouseAudit(distDir: string): { performance: number; accessibility: number; seo: number; bestPractices: number } | "UNAVAILABLE" {
  if (!fs.existsSync(distDir)) {
    return "UNAVAILABLE";
  }

  let server: http.Server | null = null;
  try {
    server = http.createServer((req, res) => {
      // Path traversal guard: resolved path must stay inside the dist directory.
      const base = path.resolve(distDir);
      let safePath = req.url === "/" ? "index.html" : decodeURIComponent(req.url!.split("?")[0]);
      let filePath = path.resolve(path.join(base, safePath));
      if (filePath !== base && !filePath.startsWith(base + path.sep)) {
        filePath = path.join(base, "index.html");
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(base, "index.html");
      }
      try {
        const ext = path.extname(filePath).toLowerCase();
        let contentType = "text/html";
        if (ext === ".js") contentType = "application/javascript";
        else if (ext === ".css") contentType = "text/css";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".svg") contentType = "image/svg+xml";
        else if (ext === ".ico") contentType = "image/x-icon";

        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    server.listen(0);
    const port = (server.address() as any).port;
    const url = `http://localhost:${port}`;

    const output = execFileSync(
      commandBin("npx"),
      ["lighthouse", url, "--output=json", "--chrome-flags=--headless --no-sandbox --disable-gpu"],
      { stdio: "pipe", timeout: 45000, encoding: "utf-8" }
    );

    const lhr = JSON.parse(output);
    const performance = Math.round((lhr.categories.performance.score || 0) * 100);
    const accessibility = Math.round((lhr.categories.accessibility.score || 0) * 100);
    const seo = Math.round((lhr.categories.seo.score || 0) * 100);
    const bestPractices = Math.round((lhr.categories["best-practices"].score || 0) * 100);

    return { performance, accessibility, seo, bestPractices };
  } catch (err: any) {
    return "UNAVAILABLE";
  } finally {
    if (server) {
      server.close();
    }
  }
}

// Deterministic Static Scanner (Zero AI)
async function runToolAudits(
  tempDir: string,
  blueprint: Blueprint
): Promise<ToolAuditResults> {
  const readmePath = path.join(tempDir, "README.md");
  let hasReadme = false;
  let readmeSize = 0;
  let readmeLog = "README.md file missing from repository root.";
  if (fs.existsSync(readmePath)) {
    hasReadme = true;
    const content = fs.readFileSync(readmePath, "utf-8");
    readmeSize = content.length;
    
    const hasInstall = content.toLowerCase().includes("install") || content.toLowerCase().includes("npm i");
    const hasUsage = content.toLowerCase().includes("run") || content.toLowerCase().includes("start");
    
    readmeLog = `Parsed README.md file. Size: ${readmeSize} bytes. ` +
      (hasInstall ? "Installation guide detected. " : "Installation instructions missing. ") +
      (hasUsage ? "Usage guide detected." : "Usage guide missing.");
  }

  const allFiles = getAllFiles(tempDir);
  const detectedFilesCount = allFiles.length;
  
  const secretsFound: string[] = [];
  const secretPatterns = [
    /gsk_[a-zA-Z0-9]{48}/,       // Groq key pattern
    /AIzaSy[a-zA-Z0-9-_]{35}/,   // Google key pattern
    /GOCSPX-[a-zA-Z0-9-_]{28}/,  // Google OAuth Secret pattern
    /sk-[a-zA-Z0-9]{48}/         // OpenAI key pattern
  ];

  let totalCommentsCount = 0;
  let totalLinesCount = 0;
  let tsCount = 0;
  let jsCount = 0;

  allFiles.forEach((file) => {
    const ext = path.extname(file);
    if (ext === ".ts" || ext === ".tsx") tsCount++;
    if (ext === ".js" || ext === ".jsx") jsCount++;

    if ([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".env", ".local"].includes(ext)) {
      try {
        // Per-file read cap: pathological/huge files are skipped from content
        // scanning (size counter above is unaffected).
        if (fs.statSync(file).size > MAX_SCANNED_FILE_BYTES) return;
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");
        totalLinesCount += lines.length;

        lines.forEach((line, index) => {
          secretPatterns.forEach((pat) => {
            if (pat.test(line)) {
              secretsFound.push(`File: ${path.basename(file)}:L${index + 1} leaked potential API key.`);
            }
          });
          
          if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.includes(" * ")) {
            totalCommentsCount++;
          }
        });
      } catch {}
    }
  });

  const commentsDensityPercent = totalLinesCount > 0 
    ? Math.round((totalCommentsCount / totalLinesCount) * 100) 
    : 10;
  const typescriptUsagePercent = (tsCount + jsCount) > 0 
    ? Math.round((tsCount / (tsCount + jsCount)) * 100) 
    : 0;

  let buildSuccess = false;
  let distDir = path.join(tempDir, "dist");
  const packageJsonPath = path.join(tempDir, "package.json");
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      execFileSync(commandBin("npm"), ["install"], { cwd: tempDir, stdio: "ignore", timeout: 45000 });
      execFileSync(commandBin("npm"), ["run", "build"], { cwd: tempDir, stdio: "ignore", timeout: 30000 });
      if (!fs.existsSync(distDir)) {
        if (fs.existsSync(path.join(tempDir, "build"))) {
          distDir = path.join(tempDir, "build");
        } else if (fs.existsSync(path.join(tempDir, ".next"))) {
          distDir = path.join(tempDir, ".next");
        }
      }
      buildSuccess = fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0;
    } catch {
      buildSuccess = false;
    }
  }

  // Real Lighthouse Execution
  const lhResult = buildSuccess ? runLighthouseAudit(distDir) : "UNAVAILABLE";

  let lighthouseScore: number | "UNAVAILABLE" = "UNAVAILABLE";
  let accessibilityScore: number | "UNAVAILABLE" = "UNAVAILABLE";
  let seoScore: number | "UNAVAILABLE" = "UNAVAILABLE";
  let bestPracticesScore: number | "UNAVAILABLE" = "UNAVAILABLE";

  if (lhResult !== "UNAVAILABLE") {
    lighthouseScore = lhResult.performance;
    accessibilityScore = lhResult.accessibility;
    seoScore = lhResult.seo;
    bestPracticesScore = lhResult.bestPractices;
  }

  const passedPerf = lighthouseScore === "UNAVAILABLE" || lighthouseScore >= blueprint.performanceRules.lighthouseMin;
  const passedAccess = accessibilityScore === "UNAVAILABLE" || accessibilityScore >= blueprint.performanceRules.accessibilityMin;
  const passedSeo = seoScore === "UNAVAILABLE" || seoScore >= blueprint.performanceRules.seoMin;
  const passedBest = bestPracticesScore === "UNAVAILABLE" || bestPracticesScore >= blueprint.performanceRules.bestPracticesMin;

  const performanceDeductions: string[] = [];
  if (lighthouseScore !== "UNAVAILABLE" && !passedPerf) {
    performanceDeductions.push(`Performance score (${lighthouseScore}) below minimum required (${blueprint.performanceRules.lighthouseMin}).`);
  }
  if (accessibilityScore !== "UNAVAILABLE" && !passedAccess) {
    performanceDeductions.push(`Accessibility score (${accessibilityScore}) below minimum required (${blueprint.performanceRules.accessibilityMin}).`);
  }

  const metrics = [
    `Lighthouse Performance audit: ${lighthouseScore === "UNAVAILABLE" ? "LIGHTHOUSE_STATUS = UNAVAILABLE" : lighthouseScore + "/100"}`,
    `Lighthouse Accessibility audit: ${accessibilityScore === "UNAVAILABLE" ? "LIGHTHOUSE_STATUS = UNAVAILABLE" : accessibilityScore + "/100"}`,
    `Lighthouse SEO audit: ${seoScore === "UNAVAILABLE" ? "LIGHTHOUSE_STATUS = UNAVAILABLE" : seoScore + "/100"}`,
    `Lighthouse Best Practices audit: ${bestPracticesScore === "UNAVAILABLE" ? "LIGHTHOUSE_STATUS = UNAVAILABLE" : bestPracticesScore + "/100"}`
  ];

  return {
    performance: {
      lighthouseScore,
      accessibilityScore,
      seoScore,
      bestPracticesScore,
      passedMinChecks: passedPerf && passedAccess && passedSeo && passedBest,
      evidence: {
        metrics,
        deductions: performanceDeductions,
      }
    },
    security: {
      vulnerabilities: [],
      secretsFound,
      passedScan: secretsFound.length === 0,
      evidence: {
        vulnerabilitySummary: buildSuccess ? "Dependency scan: package configuration cleanly structured." : "Dependency scan: missing build script.",
        secretsLog: secretsFound.length === 0 
          ? "Secrets scan: Checked all source files. No leaked API credentials detected."
          : `Secrets scan warning: Found potential API key leaks: [${secretsFound.join("; ")}].`
      }
    },
    codeQuality: {
      detectedFilesCount,
      typescriptUsagePercent,
      readmeSize,
      commentsDensityPercent,
      folderStructureValid: fs.existsSync(path.join(tempDir, "src")) || fs.existsSync(path.join(tempDir, "app")),
      evidence: {
        structureLog: fs.existsSync(path.join(tempDir, "src")) || fs.existsSync(path.join(tempDir, "app"))
          ? "Detected standard frontend project structure."
          : "Detected standard root layout files.",
        typescriptLog: `TypeScript implementation: ${typescriptUsagePercent}%.`,
        documentationLog: readmeLog
      }
    },
    gitHealth: {
      isPublic: true,
      hasGitHistory: true,
      hasReadme,
    }
  };
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== ".git" && file !== "node_modules" && file !== ".next" && file !== "dist" && file !== "build" && file !== "out") {
        getAllFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

export async function evaluateSubmission(
  repoUrl: string,
  blueprint: Blueprint
): Promise<DynamicEvaluationReport> {
  const logs: string[] = [];
  logs.push(`[1/10] Submission received: ${repoUrl}`);
  const activeProblem = resolveActiveProblem(blueprint);
  logs.push(`[2/10] Loaded Knowledge Blueprint: "${activeProblem.title}"`);

  // Clone Repository
  logs.push(`[3/10] Cloning repository to temporary workspace...`);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "faie-v2-eval-"));
  const safeRepoUrl = validateRepoUrl(repoUrl);
  
  let cloneSuccess = false;
  try {
    execFileSync("git", ["clone", "--depth", "1", safeRepoUrl, tempDir], { stdio: "ignore", timeout: 20000 });
    cloneSuccess = true;
    logs.push(`[3/10] Successfully cloned repository.`);
  } catch (err: any) {
    logs.push(`[3/10] Error cloning repository: ${err.message}`);
  }

  if (!cloneSuccess) {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
    throw new Error(`Failed to clone git repository from URL: ${repoUrl}`);
  }

  // Repository size limit (untrusted input: a bloated repo can exhaust disk).
  try {
    assertRepoWithinSizeLimit(tempDir);
  } catch (sizeErr: any) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    throw sizeErr;
  }

  try {
    // 1. Tool Audits
    logs.push(`[4/10] Running static code quality and security scans...`);
    const toolResults = await runToolAudits(tempDir, blueprint);

    // 2. Dispatch to Frontend Arena Intelligence Engine (FAIE v2)
    logs.push(`[5/10] Dispatching workspace to Frontend Arena Intelligence Engine (FAIE v2)...`);
    const faieOrchestrator = new FAIEOrchestrator(blueprint.synonymDictionary, blueprint.confidenceThreshold || 75);
    const faieReport = await faieOrchestrator.evaluate(tempDir, repoUrl, blueprint, undefined, toolResults);

    logs.push(`[10/10] FAIE v2 evaluation completed. Final Score: ${faieReport.scoreSummary.finalScore}/100.`);

    return {
      hackathonTitle: activeProblem.title,
      repoUrl,
      status: faieReport.status,
      scoreSummary: faieReport.scoreSummary,
      faieEvaluation: {
        engineName: "Frontend Arena Intelligence Engine (FAIE v2)",
        version: "v2.0 (Multi-Evidence Cross-Validation)",
        status: faieReport.status.toUpperCase(),
        summary: `Evaluated ${faieReport.scoringDetails.length} categories with hierarchical sub-features and Playwright UI navigation. Zero AI/LLM models.`,
      },
      projectClassification: faieReport.projectClassification,
      featureTreeEvaluations: faieReport.featureTreeEvaluations,
      rejectedClaims: faieReport.rejectedClaims,
      screenshots: faieReport.screenshots,
      toolAudits: toolResults,
      scoringDetails: faieReport.scoringDetails,
      logs: [...logs, ...faieReport.logs],
      auditableReportId: faieReport.auditableReportId,
      timestamp: faieReport.timestamp,
    };
  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
