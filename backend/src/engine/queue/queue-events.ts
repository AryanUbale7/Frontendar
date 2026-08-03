import { QueueEvents } from "bullmq";
import { getSharedRedisConfig } from "./redis-connection";
import { EVALUATION_QUEUE_NAME } from "./queue-constants";
import { LIGHTHOUSE_QUEUE_NAME } from "./lighthouse-constants";

export function createEvaluationQueueEvents(): QueueEvents {
  const { connection } = getSharedRedisConfig();
  return new QueueEvents(EVALUATION_QUEUE_NAME, { connection });
}

export function createLighthouseQueueEvents(): QueueEvents {
  const { connection } = getSharedRedisConfig();
  return new QueueEvents(LIGHTHOUSE_QUEUE_NAME, { connection });
}