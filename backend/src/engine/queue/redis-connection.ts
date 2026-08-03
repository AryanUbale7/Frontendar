import { RedisOptions } from "ioredis";
import { parseRedisConnection, intFromEnv } from "./redis-config";

export interface SharedRedisConfig {
  connection: RedisOptions;
  display: string;
}

let cachedConfig: SharedRedisConfig | null = null;

export function getSharedRedisConfig(): SharedRedisConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const { connection, display } = parseRedisConnection();
  cachedConfig = { connection, display };
  return cachedConfig;
}

export function resetSharedRedisConfig(): void {
  cachedConfig = null;
}

export { intFromEnv };