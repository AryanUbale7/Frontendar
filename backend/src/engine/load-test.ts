import { prisma } from "../config/db";
import { createEvaluationQueue, EvaluationQueueDriver } from "../engine/queue";

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughputPerSecond: number;
  queueDepth: number;
  activeJobs: number;
}

interface TestConfig {
  concurrentUsers: number;
  submissionsPerUser: number;
  rampUpMs: number;
  durationMs: number;
  mockEvaluation: boolean;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoadTest(config: TestConfig): Promise<LoadTestResult> {
  console.log(`[LoadTest] Starting test: ${config.concurrentUsers} users, ${config.submissionsPerUser} submissions each`);
  console.log(`[LoadTest] Mock evaluation: ${config.mockEvaluation}`);

  const queue = await createEvaluationQueue();
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  const startTime = Date.now();

  const promises: Promise<void>[] = [];

  for (let user = 0; user < config.concurrentUsers; user++) {
    for (let sub = 0; sub < config.submissionsPerUser; sub++) {
      const promise = (async () => {
        const requestStart = Date.now();
        try {
          await queue.enqueue({
            submissionId: `loadtest_user${user}_sub${sub}`,
            repoUrl: `https://github.com/test/repo-${user}-${sub}`,
            deploymentUrl: config.mockEvaluation ? undefined : `https://test-${user}-${sub}.vercel.app`,
            userId: `loadtest_user_${user}`,
            hackathonId: "loadtest-hackathon",
            blueprintId: "loadtest-blueprint",
            blueprintVersion: 1,
            version: sub + 1,
            problemStatementId: "loadtest-ps",
          });
          successfulRequests++;
        } catch (err: any) {
          failedRequests++;
          console.error(`[LoadTest] Request failed: ${err.message}`);
        }
        const latency = Date.now() - requestStart;
        latencies.push(latency);
      })();
      promises.push(promise);

      if (config.rampUpMs > 0) {
        await sleep(config.rampUpMs / (config.concurrentUsers * config.submissionsPerUser));
      }
    }
  }

  await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  const metrics = await queue.getMetrics();

  await queue.close();

  return {
    totalRequests: config.concurrentUsers * config.submissionsPerUser,
    successfulRequests,
    failedRequests,
    errorRate: (failedRequests / (successfulRequests + failedRequests)) * 100,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    throughputPerSecond: Math.round((successfulRequests / totalDuration) * 1000),
    queueDepth: metrics.counts.waiting,
    activeJobs: metrics.counts.active,
  };
}

async function main(): Promise<void> {
  const modes = [
    { name: "25", config: { concurrentUsers: 5, submissionsPerUser: 5, rampUpMs: 1000, durationMs: 30000, mockEvaluation: true } },
    { name: "50", config: { concurrentUsers: 10, submissionsPerUser: 5, rampUpMs: 1000, durationMs: 30000, mockEvaluation: true } },
    { name: "100", config: { concurrentUsers: 20, submissionsPerUser: 5, rampUpMs: 500, durationMs: 30000, mockEvaluation: true } },
    { name: "250", config: { concurrentUsers: 50, submissionsPerUser: 5, rampUpMs: 200, durationMs: 30000, mockEvaluation: true } },
    { name: "500", config: { concurrentUsers: 100, submissionsPerUser: 5, rampUpMs: 100, durationMs: 30000, mockEvaluation: true } },
    { name: "1000", config: { concurrentUsers: 200, submissionsPerUser: 5, rampUpMs: 50, durationMs: 30000, mockEvaluation: true } },
  ];

  console.log("=== Frontend Arena Load Test Harness ===");
  console.log("Mode: API/QUEUE LOAD TEST (mock evaluations)");
  console.log("");

  const results: Record<string, LoadTestResult> = {};

  for (const mode of modes) {
    console.log(`\n--- Mode: ${mode.name} concurrent users ---`);
    try {
      const result = await runLoadTest(mode.config);
      results[mode.name] = result;
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(`  Successful: ${result.successfulRequests}`);
      console.log(`  Failed: ${result.failedRequests}`);
      console.log(`  Error Rate: ${result.errorRate.toFixed(2)}%`);
      console.log(`  P50 Latency: ${result.p50LatencyMs}ms`);
      console.log(`  P95 Latency: ${result.p95LatencyMs}ms`);
      console.log(`  P99 Latency: ${result.p99LatencyMs}ms`);
      console.log(`  Throughput: ${result.throughputPerSecond} req/s`);
      console.log(`  Queue Depth: ${result.queueDepth}`);
      console.log(`  Active Jobs: ${result.activeJobs}`);
    } catch (err: any) {
      console.error(`[LoadTest] Mode ${mode.name} failed: ${err.message}`);
      results[mode.name] = {
        totalRequests: 0, successfulRequests: 0, failedRequests: 0, errorRate: 100,
        p50LatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, throughputPerSecond: 0,
        queueDepth: 0, activeJobs: 0,
      };
    }
  }

  console.log("\n=== Load Test Summary ===");
  for (const [name, result] of Object.entries(results)) {
    console.log(`${name}: throughput=${result.throughputPerSecond} req/s, p95=${result.p95LatencyMs}ms, errorRate=${result.errorRate.toFixed(2)}%`);
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`[LoadTest] FATAL: ${err.message}`);
    process.exit(1);
  });
}