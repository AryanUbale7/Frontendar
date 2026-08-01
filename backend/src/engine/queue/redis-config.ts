/**
 * Redis connection configuration for BullMQ.
 *
 * Sources (in priority order):
 *   1. REDIS_URL  (redis:// or rediss:// URI, may include credentials)
 *   2. REDIS_HOST + REDIS_PORT
 *   3. defaults: 127.0.0.1:6379
 *
 * Credentials are read from the environment only — never hardcoded or logged.
 */
import { RedisOptions } from "ioredis";

export type RedisConnectionConfig = RedisOptions;

export interface RedisTarget {
  url: string;
  connection: RedisConnectionConfig;
}

export function parseRedisConnection(): RedisTarget {
  const url =
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || "6379"}`;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new Error(`Invalid REDIS_URL "${url}": ${(err as Error).message}`);
  }

  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(`Invalid REDIS_URL protocol "${parsed.protocol}". Use redis:// or rediss://`);
  }

  const connection: RedisConnectionConfig = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
  };
  if (parsed.username) connection.username = decodeURIComponent(parsed.username);
  if (parsed.password) connection.password = decodeURIComponent(parsed.password);
  if (parsed.protocol === "rediss:") connection.tls = {};

  return { url, connection };
}

export function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
