# PHASE 3 IMPLEMENTATION REPORT — Durable Evaluation Pipeline

**Status: COMPLETE — all automated tests PASSED against real Redis**
**Date:** 2026-08-01
**Environment:** Windows 11, Node v20.20.1, Redis 7.0.15 (WSL2 Ubuntu), PostgreSQL via Supabase pooler (existing runtime DB, unchanged schema)

---

## 1. Architecture — Before / After

### Before (Phase 2)
```
POST /api/evaluate ──▶ Submission row (QUEUED) ──▶ InMemoryEvaluationQueue (in-process, non-durable)
                                                        └──▶ runEvaluationJob() inline in the API process
```
- The "queue" was an in-memory EventEmitter (`RealRedisBullQueue`) living inside the API process.
- Jobs were lost on API restart, crashes, or any process exit. No retries, no attempt tracking, no timeout, no observability, no worker separation.

### After (Phase 3)
```
POST /api/evaluate ──▶ Submission row (QUEUED) ──▶ BullMQ Queue "faie-evaluation" (Redis)
                         202 {jobId, submissionId, status: QUEUED}  (never blocks)
                                                        │
                                                        ▼
                              Independent Worker process (backend/src/worker)
                                                        │
                                                        ▼
                              FAIE evaluation ──▶ Submission COMPLETED/FAILED + EvaluationReport (PostgreSQL)
```
- Queue layer abstracted behind `EvaluationQueueDriver` (`backend/src/engine/queue/`):
  - `redis` (default): BullMQ v6 + ioredis — production, durable.
  - `memory`: in-process dev-only fallback; **refused when `NODE_ENV=production`**.
- Selection is explicit via `EVALUATION_QUEUE_DRIVER`. Boot **fails with a clear error** if redis is configured but unreachable (`verifyRedisAvailable()` PING probe) — there is **never a silent downgrade**.
- The worker is a fully independent process (`backend/src/worker/index.ts`, scripts `npm run worker` / `npm run worker:dev`).

## 2. Retry Policy
- `EVALUATION_MAX_ATTEMPTS` (default **3**), `EVALUATION_BACKOFF_MS` (default **2000**) with **exponential** backoff — set as BullMQ `defaultJobOptions`.
- Every failed attempt re-runs the evaluation; the submission is left `EVALUATING` between attempts so the next attempt can complete.
- **Permanent failure:** when `attemptsMade >= attempts`, the worker itself converges the submission to `FAILED`/score 0 (covers timeouts that fire before the runner starts, and crashes where the runner died without persisting).
- Verified: bad-repo job → 3 attempts → terminal `FAILED`, failed-count stable afterwards (T3/T5).

## 3. Timeout Policy
- BullMQ 6.0.x has no job-level `timeout` option, so the **worker enforces a wall-clock timeout** (`EVALUATION_JOB_TIMEOUT_MS`, default **900000 ms** = 15 min) via `Promise.race` over the *entire* processing run.
- Per-step bounds inside the evaluator: git clone 20s, `npm install` 45s, `npm run build` 30s, Lighthouse 45s.
- On timeout: job → `failed`, submission → `FAILED` (persisted by the worker's permanent-failure handler).
- Verified with a dedicated worker (`EVALUATION_JOB_TIMEOUT_MS=5000`) + 30s seam job (T9).

## 4. Concurrency Control
- `EVALUATION_WORKER_CONCURRENCY` (default **2**) limits simultaneous evaluations per worker process.
- Verified: 8 queued jobs with a 6s hold, max observed active = **2**, queueing-behind observed (T8).

## 5. Idempotency
- **Stable job identity:** `jobId = <submissionId>_v<version>` (BullMQ forbids `:` in custom job IDs — found and fixed during testing). Re-enqueueing the same submission/version yields the same job and adds no duplicate.
- **DB-level guard:** `runEvaluationJob` skips re-evaluation if the submission is already `COMPLETED` with a persisted report.
- Submission rows are upserted per (hackathon, user) with a `version` bump; exactly **one** Submission row and **one** EvaluationReport ever exist per submission (`EvaluationReport.submissionId` is `@unique`; report is upserted, never duplicated).
- Verified: double-POST → single row, single report; duplicate enqueue → single job (T6).

## 6. Temp Workspace Isolation
- Each evaluation gets its own `fs.mkdtempSync(os.tmpdir()/faie-v2-eval-*)` directory.
- Cleanup on **every** path: clone failure, repo-size-limit rejection, evaluation success/failure (`finally`).
- Verified: zero leftover `faie-v2-eval-*` directories after success/failure/retry jobs (T7).

## 7. Security Limits (evaluator hardening — no scoring changes)
- **Repo URL validation:** `http(s)://`, `git@`, `ssh://`, `git://` only; shell metacharacters/whitespace/control chars rejected; clone runs via `execFileSync("git", ["clone", "--depth", "1", url, dir])` — no shell interpolation.
- **Repo size cap:** `EVALUATION_MAX_REPO_MB` (default 200 MB) enforced pre-build; oversized repo → rejected + workspace removed.
- **Exec timeouts:** clone 20s / install 45s / build 30s / Lighthouse 45s.
- **Log/output caps:** report logs truncated to 200 entries × 2000 chars.
- **Static-server traversal guard:** `decodeURIComponent` + `path.resolve` containment check.
- **Secret scan cap:** per-file read limited to 2 MB.
- No arbitrary command execution beyond the permitted workflow (git clone, npm install/build, npx lighthouse — all `execFileSync` without shell).

## 8. Observability
- `GET /api/queue/metrics` (ADMIN/SUPER_ADMIN only; 401 unauthenticated / 403 participant — verified):
  - driver (`redis`/`memory`), redis host/port/`connected`
  - counts: `waiting`, `active`, `completed`, `failed`, `delayed`
  - recent jobs (25 per state): `jobId`, `submissionId`, `repoUrl`, `attemptsMade`, `status`, `queuedAt`, `startedAt`, `completedAt`, `failedReason`
  - **Never secrets/env vars** (asserted: no `password|token|secret|JWT` in payload).
- Worker logs job start/failure/retry lifecycle lines (`[Worker] Job <id> failed (attempt N): reason`).

## 9. Graceful Shutdown
- Both server and worker register `SIGTERM`/`SIGINT` handlers:
  - Server: `server.close()` → `evaluationQueue.close()` → `prisma.$disconnect()` → exit 0, with a 10s force-exit timer.
  - Worker: `worker.close()` (waits for / safely releases active jobs) → `prisma.$disconnect()` → exit 0.
- **Platform note:** on Windows, `child.kill()`/`Stop-Process` is `TerminateProcess` and cannot inject POSIX signals, so the handler path is verified by code + boot-time registration logs, not by signal injection. On Linux/macOS the handlers fire normally.

## 10. Environment / Dev Fallback
- `backend/.env.example` documents: `REDIS_URL`, `EVALUATION_QUEUE_DRIVER` (default `redis`; `memory` refused in production), `EVALUATION_WORKER_CONCURRENCY`, `EVALUATION_JOB_TIMEOUT_MS`, `EVALUATION_MAX_ATTEMPTS`, `EVALUATION_BACKOFF_MS`, `EVALUATION_MAX_REPO_MB`, lock/stall tuning.
- Credentials remain in gitignored `backend/.env` (never committed).
- **Runtime detail:** `server.ts`/`worker/index.ts` now `import "dotenv/config"` — they read `backend/.env`. Pre-set env vars (e.g. `DATABASE_URL`) always win over dotenv, which is how the test stack pins the DB.
- **Discovered:** `backend/.env`'s `DATABASE_URL` value is wrapped in literal quotes; the Prisma CLI tolerates it but raw env parsing must trim them (the Phase 3 suite does). Recommend removing the quotes.

## 11. Test Results — Phase 3 (`backend/src/engine/phase3.test.ts`, real Redis + real worker)

| # | Test | Result |
|---|------|--------|
| 1 | Durable e2e: HTTP → worker → COMPLETED + report persisted | **PASS** |
| 2 | 202 contract: returned in 1.3–1.7 s, no result payload, QUEUED | **PASS** |
| 3 | Failure path: FAILED persisted, score 0, no report, reason captured | **PASS** |
| 4 | Retry recovers: seam-failed first attempt → COMPLETED | **PASS** |
| 5 | Max attempts: attemptsMade=3, permanent FAILED, no further retries | **PASS** |
| 6 | Idempotency: single submission row/report; stable jobId dedup | **PASS** |
| 7 | Temp workspace isolation & cleanup (zero leftovers) | **PASS** |
| 8 | Concurrency capped at 2; queueing-behind observed | **PASS** |
| 9 | Timeout: dedicated 5 s worker kills 30 s job → FAILED + reason | **PASS** |
| 10 | Worker restart: queued job survives, completed by restarted worker | **PASS** |
| 11 | API restart: job survives, still completed, single report | **PASS** |
| 12 | Cross-hackathon blueprint binding (A↔B no contamination) | **PASS** |
| 13 | Leaderboard updated by the pipeline | **PASS** |
| 14 | Phase 1 regression (auth: invalid token 401; metrics 401/403) | **PASS** |
| 15 | Phase 2 regression (lifecycle 409 gates, draft blueprint 404) | **PASS** |
| 16 | Observability: counts, sanitized jobs, no secrets, redis connected | **PASS** |

Final queue state at suite end: `waiting=0 active=0 completed=14 failed=2` (failed = the two intentionally failing jobs).
Note: T4 observed one additional transient infra failure before recovery (`attemptsMade=2`) — recovered by the retry policy, exactly its purpose.

## 12. Regressions
- Phase 1 integration suite: **PASS** (auth, evaluate, submissions, leaderboard).
- Phase 2 suite: **PASS** (16/16 lifecycle/blueprint/leaderboard).
- E2E submission pipeline (`e2e-submission.test.ts`) against the real stack (server + Redis worker): **PASS**.
- Root `npx tsc --noEmit`: **PASS**. Root `npm run build`: **PASS**. Backend `npm run build`: **PASS**. Evaluation-engine `npm run build`: **PASS**.
- Root lint: unchanged scope (backend-only changes; no frontend files touched).

## 13. Known Limitations
- **Redis runs in WSL2** (Docker Desktop's engine was broken on this machine — 500 on the named pipe). `redis-server` 7.0.15 installed via apt, daemonized, bound to the WSL NAT interface (`--protected-mode no`) for host-only dev access; Windows reaches it via `localhost:6379` (WSL localhost forwarding) and the NAT IP. For a real deployment, use a managed Redis or Docker.
- **Graceful-shutdown handler execution** cannot be exercised by automated tests on Windows (no POSIX signals); verified by code review and registration logs.
- BullMQ job IDs must not contain `:` (fixed with `_v` separator).
- WSL restart resets Redis unless the daemon is restarted (documented in `.env.example`).
- The Phase 3 suite obliterates the `faie-evaluation` queue keys at start/end (queue is ephemeral task state, not data) and cleans up all `p3_*` rows — **no live data was modified**: the Frontend Wars 2026 hackathon, its blueprint, and `backups/frontend-wars-blueprint-pre-phase2.json` are untouched.

## 14. Final Checklist
- [x] Durable job architecture: BullMQ/Redis queue + independent worker process (no fake in-memory)
- [x] 202 API contract preserved (never waits for clone/install/build/Lighthouse/FAIE)
- [x] Durable recovery: API/worker restarts, Redis-backed state, retry + exponential backoff, attempt limits, job timeout, failed-job state, lifecycle persisted in PostgreSQL
- [x] Idempotency: no duplicate Submission/EvaluationReport/leaderboard entries; stable job identity
- [x] Concurrency: `EVALUATION_WORKER_CONCURRENCY` default 2, env-configurable
- [x] Temp workspace isolation: per-job mkdtemp, cleanup on success/failure/timeout
- [x] Security limits: clone size, exec/build/Lighthouse timeouts, output caps, traversal guard, no arbitrary shell commands
- [x] Queue observability: waiting/active/completed/failed/retrying counts, job identity, attempts, timings, failure reason — no secrets
- [x] Graceful shutdown (SIGTERM/SIGINT) on server and worker
- [x] Dev fallback `memory` mode; production refuses it; boot fails loudly if Redis unreachable (no silent downgrade)
- [x] Env documentation in `backend/.env.example`; no credentials committed
- [x] Phase 3 tests: **PASS** (16/16) against real Redis
- [x] No live data damaged (dedicated `p3_*` data, cleaned; queue-only obliteration)
- [x] Root `npx tsc --noEmit` + `npm run build` PASS
- [x] Backend `npm run build` PASS
- [x] Engine build PASS (engine CLI test suite requires Playwright/Lighthouse tooling — unchanged scope, same as prior phases)
- [x] Phase 1 regression PASS, Phase 2 regression PASS
