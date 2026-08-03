import { Queue } from "bullmq";
import { LIGHTHOUSE_QUEUE_NAME } from "./lighthouse-constants";
import { getSharedRedisConfig, intFromEnv } from "./redis-connection";

export class LighthouseQueue {
  readonly name = "lighthouse" as const;
  private queue: Queue;

  constructor() {
    const { connection } = getSharedRedisConfig();
    this.queue = new Queue(LIGHTHOUSE_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: intFromEnv("LIGHTHOUSE_MAX_ATTEMPTS", 2),
        backoff: { type: "exponential", delay: intFromEnv("LIGHTHOUSE_BACKOFF_MS", 5000) },
        removeOnComplete: { age: 7 * 24 * 3600, count: 200 },
        removeOnFail: { age: 7 * 24 * 3600, count: 500 },
      },
    });
    this.queue.on("error", (err) => {
      console.error(`[LighthouseQueue] Redis/BullMQ error: ${err.message}`);
    });
  }

  async addJob(data: { submissionId: string; repoUrl: string; deploymentUrl: string; version: number }): Promise<{ jobId: string }> {
    const jobId = `lh_${data.submissionId}_v${data.version}`;
    const job = await this.queue.add("lighthouse", data, { jobId });
    return { jobId: job.id || jobId };
  }

  async getMetrics() {
    const counts = await this.queue.getJobCounts();
    return {
      driver: "redis" as const,
      counts: {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      },
    };
  }

  async close() {
    await this.queue.close();
  }
}