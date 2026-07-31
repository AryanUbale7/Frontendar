import { RealRedisBullQueue } from "../../backend/src/engine/redis-queue.system";
import type { QueueJobPayload } from "../../backend/src/engine/redis-queue.system";

export { RealRedisBullQueue as EvaluationQueue };
export type { QueueJobPayload as EvaluationJob };
