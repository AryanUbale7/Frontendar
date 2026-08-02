import { EventEmitter } from "events";

export interface QueueJobPayload {
  jobId: string;
  repoUrl: string;
  deploymentUrl?: string;
  blueprint?: any;
  blueprintId?: string;
  blueprintVersion?: number;
  hackathonId?: string;
  userId?: string;
  submissionId?: string | null;
  problemStatementId?: string;
  status: "queued" | "processing" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  errorLog?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type QueueJobProcessor = (job: QueueJobPayload) => Promise<any>;

/**
 * In-memory (NON-DURABLE) evaluation queue.
 *
 * Phase 3 status: retained ONLY as an explicit local-development fallback
 * (EVALUATION_QUEUE_DRIVER=memory). Production uses the durable Redis/BullMQ
 * driver — see backend/src/engine/queue/.
 */
export class InMemoryEvaluationQueue extends EventEmitter {
  private queue: QueueJobPayload[] = [];
  private activeJobsCount = 0;
  private maxConcurrency: number;
  private processor?: QueueJobProcessor;
  private processing = false;

  constructor(maxConcurrency = 2) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  public setProcessor(processor: QueueJobProcessor): void {
    this.processor = processor;
  }

  public async addJob(
    repoUrl: string,
    blueprint?: any,
    userId?: string,
    submissionId?: string | null,
    blueprintId?: string,
    blueprintVersion?: number,
    hackathonId?: string,
    problemStatementId?: string
  ): Promise<QueueJobPayload> {
    const job: QueueJobPayload = {
      jobId: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      repoUrl,
      blueprint,
      blueprintId,
      blueprintVersion,
      hackathonId,
      userId,
      submissionId: submissionId || null,
      problemStatementId,
      status: "queued",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    this.emit("queued", job);
    setImmediate(() => {
      void this.processQueue();
    });
    return job;
  }

  public async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    const retriedThisBatch = new Set<string>();

    while (this.activeJobsCount < this.maxConcurrency) {
      const nextJob = this.queue.find((j) => j.status === "queued" && !retriedThisBatch.has(j.jobId));
      if (!nextJob) break;

      nextJob.status = "processing";
      nextJob.updatedAt = new Date();
      this.activeJobsCount++;
      this.emit("active", nextJob);
      void this.runJob(nextJob);

      const requeued = this.queue.find((j) => j.jobId === nextJob.jobId && j.status === "queued");
      if (requeued) {
        retriedThisBatch.add(nextJob.jobId);
      }
    }

    this.processing = false;
  }

  private async runJob(job: QueueJobPayload): Promise<void> {
    if (!this.processor) {
      this.failJob(job.jobId, "No job processor registered for the evaluation queue.");
      return;
    }

    try {
      const result = await this.processor(job);
      this.completeJob(job.jobId, result);
    } catch (err: any) {
      this.failJob(job.jobId, err?.message || "Evaluation job failed.");
    }
  }

  public completeJob(jobId: string, result?: any): QueueJobPayload | null {
    const job = this.queue.find((j) => j.jobId === jobId);
    if (job) {
      job.status = "completed";
      job.result = result;
      job.updatedAt = new Date();
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.emit("completed", job);
      setImmediate(() => {
        void this.processQueue();
      });
      return job;
    }
    return null;
  }

  public failJob(jobId: string, error: string): QueueJobPayload | null {
    const job = this.queue.find((j) => j.jobId === jobId);
    if (job) {
      job.errorLog = error;
      job.updatedAt = new Date();

      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = "queued";
        this.emit("failed_retry", job);
        setImmediate(() => {
          void this.processQueue();
        });
      } else {
        job.status = "failed";
        this.emit("failed", job);
        setImmediate(() => {
          void this.processQueue();
        });
      }
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      void this.processQueue();
      return job;
    }
    return null;
  }

  public getJob(jobId: string): QueueJobPayload | undefined {
    return this.queue.find((j) => j.jobId === jobId);
  }

  public getQueueMetrics() {
    return {
      transport: "in-memory",
      durable: false,
      redisConnection: { configured: false, note: "This queue is NOT Redis/BullMQ backed." },
      activeJobs: this.activeJobsCount,
      queuedJobs: this.queue.filter((j) => j.status === "queued").length,
      processingJobs: this.queue.filter((j) => j.status === "processing").length,
      completedJobs: this.queue.filter((j) => j.status === "completed").length,
      failedJobs: this.queue.filter((j) => j.status === "failed").length,
      totalJobs: this.queue.length,
    };
  }

  public getRecentJobs() {
    const sorted = [...this.queue].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sorted.slice(0, 100).map((j) => ({
      jobId: j.jobId,
      submissionId: j.submissionId || null,
      repoUrl: j.repoUrl,
      attemptsMade: j.retryCount,
      status: (j.status === "queued" ? "waiting" : j.status === "processing" ? "active" : j.status) as "waiting" | "active" | "completed" | "failed",
      queuedAt: j.createdAt.getTime(),
      startedAt: j.updatedAt.getTime(),
      completedAt: null,
      failedReason: j.errorLog || null,
    }));
  }
}
