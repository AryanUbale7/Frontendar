/**
 * Redis connection configuration for BullMQ.
 *
 * Sources (in priority order):
 *   1. REDIS_URL  (redis:// or rediss:// URI, may include credentials) — REQUIRED in production
 *   2. REDIS_HOST + REDIS_PORT  (local development only)
 *   3. defaults: 127.0.0.1:6379 (local development only)
 *
 * Credentials are read from the environment only — never hardcoded or logged.
 *
 * Fail-fast contract:
 *   - NODE_ENV === "production" and REDIS_URL is unset ⇒ throw. Production must
 *     NEVER silently fall back to a localhost Redis that does not exist inside
 *     the Render web/worker service.
 *   - Local development may still default to 127.0.0.1:6379.
 */
import { RedisOptions } from "ioredis";

export type RedisConnectionConfig = RedisOptions;

export interface RedisTarget {
  /** Full connection string as resolved (may contain credentials — do NOT log). */
  url: string;
  /** Credential-free, safe-to-log description of the target. */
  display: string;
  connection: RedisConnectionConfig;
}

/**
 * Returns a display-safe description of a Redis URI — never the password.
 *
 *   redis://user:secret@host:6379    → redis://user@host:6379
 *   rediss://user:secret@host:6380/2 → rediss://user@host:6380/2
 */
export function sanitizeRedisUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    let out = parsed.toString();
    if (out.endsWith("/")) out = out.slice(0, -1); // drop trailing slash (no db path)
    return out;
  } catch {
    // Best-effort fallback: keep scheme + everything after the last "@".
    const schemeEnd = url.indexOf("://");
    const at = url.lastIndexOf("@");
    if (schemeEnd === -1 || at === -1) return url;
    return url.slice(0, schemeEnd + 3) + url.slice(at + 1);
  }
}

export function parseRedisConnection(): RedisTarget {
  const url =
    process.env.REDIS_URL ||
    (process.env.NODE_ENV === "production"
      ? "" // handled below — production must never fall back to localhost
      : `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || "6379"}`);

  if (!url) {
    throw new Error(
      "REDIS_URL is required when NODE_ENV=production and EVALUATION_QUEUE_DRIVER=redis. " +
        "Set REDIS_URL to a managed Redis connection string (redis:// or rediss://). " +
        "Production must NEVER fall back to a localhost Redis."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new Error(`Invalid REDIS_URL: ${(err as Error).message}`);
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

  // Optional logical database selector: redis://host:6379/2 → db: 2
  const dbPath = parsed.pathname.replace(/^\//, "");
  if (dbPath !== "" && /^\d+$/.test(dbPath)) {
    connection.db = Number(dbPath);
  }

  return { url, display: sanitizeRedisUrl(url), connection };
}

export function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

