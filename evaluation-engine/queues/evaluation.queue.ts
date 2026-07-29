export interface EvaluationJob {
  jobId: string;
  repoUrl: string;
  deploymentUrl?: string;
  status: "queued" | "processing" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  errorLog?: string;
  createdAt: Date;
}

export class EvaluationQueue {
  private jobs: EvaluationJob[] = [];
  private activeCount = 0;
  private maxConcurrency = 3;

  addJob(repoUrl: string, deploymentUrl?: string): EvaluationJob {
    const job: EvaluationJob = {
      jobId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      repoUrl,
      deploymentUrl,
      status: "queued",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date()
    };
    this.jobs.push(job);
    return job;
  }

  getNextJob(): EvaluationJob | null {
    if (this.activeCount >= this.maxConcurrency) return null;
    
    const next = this.jobs.find(j => j.status === "queued");
    if (next) {
      next.status = "processing";
      this.activeCount++;
      return next;
    }
    return null;
  }

  completeJob(jobId: string) {
    const job = this.jobs.find(j => j.jobId === jobId);
    if (job) {
      job.status = "completed";
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  failJob(jobId: string, error: string) {
    const job = this.jobs.find(j => j.jobId === jobId);
    if (job) {
      job.errorLog = error;
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = "queued"; // Re-queue
      } else {
        job.status = "failed";
      }
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  getJobsStatus() {
    return this.jobs.map(j => ({
      jobId: j.jobId,
      repo: j.repoUrl,
      status: j.status,
      retries: j.retryCount
    }));
  }
}
