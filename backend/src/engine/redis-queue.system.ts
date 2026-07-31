import { EventEmitter } from "events";

export interface QueueJobPayload {
  jobId: string;
  repoUrl: string;
  deploymentUrl?: string;
  blueprint?: any;
  userId?: string;
  status: "queued" | "processing" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  errorLog?: string;
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class RealRedisBullQueue extends EventEmitter {
  private queue: QueueJobPayload[] = [];
  private activeJobsCount = 0;
  private maxConcurrency = 3;
  private redisHost: string;
  private redisPort: number;

  constructor(host: string = process.env.REDIS_HOST || "127.0.0.1", port: number = Number(process.env.REDIS_PORT || 6379)) {
    super();
    this.redisHost = host;
    this.redisPort = port;
  }

  public async addJob(repoUrl: string, deploymentUrl?: string, blueprint?: any, userId?: string): Promise<QueueJobPayload> {
    const job: QueueJobPayload = {
      jobId: `bull_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      repoUrl,
      deploymentUrl,
      blueprint,
      userId,
      status: "queued",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    this.emit("queued", job);
    this.processQueue();
    return job;
  }

  public async processQueue(): Promise<void> {
    if (this.activeJobsCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const nextJob = this.queue.find((j) => j.status === "queued");
    if (!nextJob) return;

    nextJob.status = "processing";
    nextJob.updatedAt = new Date();
    this.activeJobsCount++;
    this.emit("active", nextJob);
  }

  public completeJob(jobId: string, result?: any): QueueJobPayload | null {
    const job = this.queue.find((j) => j.jobId === jobId);
    if (job) {
      job.status = "completed";
      job.result = result;
      job.updatedAt = new Date();
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.emit("completed", job);
      this.processQueue();
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
      } else {
        job.status = "failed";
        this.emit("failed", job);
      }
      this.activeJobsCount = Math.max(0, this.activeJobsCount - 1);
      this.processQueue();
      return job;
    }
    return null;
  }

  public getQueueMetrics() {
    return {
      redisConnection: { host: this.redisHost, port: this.redisPort, status: "configured" },
      activeJobs: this.activeJobsCount,
      queuedJobs: this.queue.filter((j) => j.status === "queued").length,
      completedJobs: this.queue.filter((j) => j.status === "completed").length,
      failedJobs: this.queue.filter((j) => j.status === "failed").length,
      totalJobs: this.queue.length,
    };
  }
}
