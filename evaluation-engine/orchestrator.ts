import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Evaluator } from "./evaluator";
import { ScoreEngine } from "./score-engine";
import { ReportGenerator } from "./report-generator";
import { evaluateSubmission as runAISemanticEvaluation } from "../backend/src/engine/evaluator";

export type JobStatus =
  | "PENDING"
  | "QUEUED"
  | "CLONING"
  | "ANALYZING"
  | "AI_EVALUATION"
  | "CALCULATING_SCORE"
  | "GENERATING_REPORT"
  | "UPDATING_LEADERBOARD"
  | "COMPLETED"
  | "FAILED";

export interface EvaluationJob {
  jobId: string;
  repoUrl: string;
  deploymentUrl?: string;
  blueprint: any;
  userId: string;
  status: JobStatus;
  progress: number; // 0 to 100
  retryCount: number;
  maxRetries: number;
  errorLog?: string;
  report?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type StatusChangeCallback = (job: EvaluationJob) => void;

export class EvaluationOrchestrator {
  private jobs: Map<string, EvaluationJob> = new Map();
  private evaluator = new Evaluator();
  private scoreEngine = new ScoreEngine();
  private reportGenerator = new ReportGenerator();
  private statusListeners: StatusChangeCallback[] = [];

  // Concurrency controls
  private activeJobsCount = 0;
  private maxConcurrency = 3;
  private queue: string[] = [];

  // Register listener for event-driven updates
  onStatusChange(callback: StatusChangeCallback) {
    this.statusListeners.push(callback);
  }

  private emitStatusChange(job: EvaluationJob) {
    job.updatedAt = new Date();
    this.statusListeners.forEach((listener) => {
      try {
        listener(job);
      } catch (err) {
        console.error(`Error in status listener:`, err);
      }
    });
  }

  // Submit a new evaluation job
  async submitJob(
    repoUrl: string,
    deploymentUrl: string | undefined,
    blueprint: any,
    userId: string
  ): Promise<string> {
    const jobId = `job_orch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const job: EvaluationJob = {
      jobId,
      repoUrl,
      deploymentUrl,
      blueprint,
      userId,
      status: "PENDING",
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.jobs.set(jobId, job);
    this.emitStatusChange(job);

    this.queueJob(jobId);
    return jobId;
  }

  private queueJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "QUEUED";
    job.progress = 5;
    this.emitStatusChange(job);
    
    this.queue.push(jobId);
    this.processNext();
  }

  private async processNext() {
    if (this.activeJobsCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const nextJobId = this.queue.shift();
    if (!nextJobId) return;

    const job = this.jobs.get(nextJobId);
    if (!job) return;

    this.activeJobsCount++;
    
    // Execute job asynchronously
    this.runWorkflow(job)
      .catch((err) => {
        console.error(`Orchestrator workflow error for job ${job.jobId}:`, err);
      })
      .finally(() => {
        this.activeJobsCount--;
        this.processNext(); // Process next in line
      });
  }

  private async runWorkflow(job: EvaluationJob): Promise<void> {
    const tempDir = path.join(os.tmpdir(), `fa_orch_${job.jobId}`);
    
    try {
      // 1. CLONING STAGE
      job.status = "CLONING";
      job.progress = 15;
      this.emitStatusChange(job);

      // Create sandboxed workspace directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Simulate git clone with a timeout check (10 seconds timeout limit)
      await this.withTimeout(delay(1000), 10000, "Repository cloning timed out.");
      
      // Write mock workspace files for deterministic pipeline tools
      fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({
        name: "orchestrated-test-project",
        dependencies: { "react": "^18.2.0", "next": "^14.0.0" }
      }));
      fs.writeFileSync(path.join(tempDir, "README.md"), "# Orchestrated Demo\n\n## Installation\nnpm install\n\n## Usage\nnpm run dev");
      const srcPath = path.join(tempDir, "src");
      fs.mkdirSync(srcPath, { recursive: true });
      fs.writeFileSync(path.join(srcPath, "index.ts"), "// compiled index");

      // 2. ANALYZING STAGE (Deterministic Automated Tool Audits)
      job.status = "ANALYZING";
      job.progress = 35;
      this.emitStatusChange(job);

      const toolReport = await this.withTimeout(
        this.evaluator.runPipeline(tempDir, job.repoUrl, job.deploymentUrl, job.blueprint),
        30000,
        "Static code analyzing timed out."
      );

      // 3. AI_EVALUATION STAGE (Semantic Checks Only)
      job.status = "AI_EVALUATION";
      job.progress = 60;
      this.emitStatusChange(job);

      const aiReport = await this.withTimeout(
        runAISemanticEvaluation(job.repoUrl, job.blueprint),
        25000,
        "AI Semantic evaluation timed out."
      );

      // 4. CALCULATING_SCORE STAGE (Merge Engine)
      job.status = "CALCULATING_SCORE";
      job.progress = 80;
      this.emitStatusChange(job);

      const metadata = { isPrivate: false };
      const mergedScore = this.scoreEngine.combineAndScore(toolReport, aiReport, job.blueprint, metadata);

      // 5. GENERATING_REPORT STAGE
      job.status = "GENERATING_REPORT";
      job.progress = 90;
      this.emitStatusChange(job);

      const finalReport = {
        hackathonTitle: job.blueprint.problemStatement?.title || "Hackathon",
        repoUrl: job.repoUrl,
        status: mergedScore.status === "PASSED" ? "pass" : "fail",
        timestamp: new Date().toISOString(),
        auditableReportId: `rep_orch_${Date.now()}`,
        scoreSummary: {
          finalScore: mergedScore.finalScore,
          aiScoreTotal: mergedScore.aiScore,
          toolScoreTotal: mergedScore.toolScore,
          bonusPointsTotal: mergedScore.bonus,
          deductionsTotal: mergedScore.penalty
        },
        aiEvaluation: aiReport,
        toolAudits: toolReport,
        scoringDetails: aiReport.scoringDetails || [],
        deductions: mergedScore.deductions,
        bonuses: mergedScore.bonuses
      };

      // 6. UPDATING_LEADERBOARD STAGE
      job.status = "UPDATING_LEADERBOARD";
      job.progress = 95;
      this.emitStatusChange(job);
      await delay(500);

      // 7. COMPLETED STAGE
      job.status = "COMPLETED";
      job.progress = 100;
      job.report = finalReport;
      this.emitStatusChange(job);

      // Save submission report to local database simulate
      localStorage.setItem(`fa_submission_report_${job.blueprint.hackathonId || "default"}`, JSON.stringify(finalReport));

    } catch (err: any) {
      console.error(`Workflow failure for job ${job.jobId}: ${err.message}`);
      
      // Retry strategy
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = "QUEUED";
        job.progress = 5;
        this.emitStatusChange(job);
        
        console.log(`Retrying job ${job.jobId} (Attempt ${job.retryCount}/${job.maxRetries})...`);
        this.queue.push(job.jobId);
      } else {
        job.status = "FAILED";
        job.errorLog = err.message;
        this.emitStatusChange(job);
      }
    } finally {
      // 8. Workspace Cleanup (Always runs)
      this.cleanupWorkspace(tempDir);
    }
  }

  private cleanupWorkspace(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to cleanup orchestrator temp path: ${dirPath}`, e);
      }
    }
  }

  // Cancel an active or queued job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      return false;
    }

    // Remove from queue if present
    this.queue = this.queue.filter(id => id !== jobId);
    
    job.status = "FAILED";
    job.errorLog = "Job cancelled by user.";
    this.emitStatusChange(job);
    return true;
  }

  // Retrieve current status of a job
  getJobStatus(jobId: string): EvaluationJob | undefined {
    return this.jobs.get(jobId);
  }

  // Helper with Timeout
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutErrorMsg: string
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(timeoutErrorMsg));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutHandle!);
      return result;
    } catch (err) {
      clearTimeout(timeoutHandle!);
      throw err;
    }
  }
}

// Helper localstorage polyfill for node CLI
const localStorageMock: Record<string, string> = {};
const localStorage = {
  getItem: (key: string) => localStorageMock[key] || null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value; }
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
