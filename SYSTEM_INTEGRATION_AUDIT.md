# SYSTEM INTEGRATION AUDIT — Frontend Arena

> Read-only system audit. No fixes applied. All findings verified against source code and build/lint/typecheck diagnostics as of this audit.

---

## 1. Executive Summary

Frontend Arena is a **Next.js 15 (App Router) frontend** proxying to a standalone **Express + Prisma (PostgreSQL) backend** on port 4000, which runs a **deterministic evaluation pipeline** (`backend/src/engine/evaluator.ts` → FAIE v2). The audit found **10 integration defects**, of which **4 are critical** (runtime crash, dead queue architecture, missing backend route, and an unauthorized/fake auth layer), **4 are high** (stale lifecycle status, broken blueprint publish semantics, N+1 queries, float→Int coercion), and **2 are medium**.

Builds pass (`backend`, `evaluation-engine`, both tsc clean). `npm run lint` reports **563 problems (401 errors, 162 warnings)** — the bulk from `dist/` compiled output not being ignored by ESLint, plus `no-explicit-any`. `npx tsc --noEmit` fails with **5 real type errors** that cause runtime crashes.

---

## 2. Architecture Overview

```
Browser
  │  (fetch, no auth headers, cookie: fa_session_active only)
  ▼
Next.js App Router  (app/api/* = thin proxies → BACKEND_URL || http://localhost:4000)
  │
  ▼
Express backend (backend/src/server.ts, port 4000)
  ├─ POST /api/evaluate          → evaluateSubmission() INLINE (sync)
  ├─ /api/blueprints/:hackathonId  GET | /api/blueprints POST
  ├─ /api/hackathons             GET | POST (upsert) | DELETE /:id
  ├─ /api/registrations          GET | POST   (NO PUT /:id !)
  ├─ /api/submissions            GET only (enrichment, N+1)
  ├─ /api/hackathons/:id/leaderboard GET
  └─ /api/auth/*                 JWT (plain-text passwords)
  │
  ▼
Prisma → PostgreSQL  (User, RefreshToken, Hackathon, Blueprint, Submission, EvaluationReport, Registration)
```

Key structural facts:

- `RealRedisBullQueue` (the name suggests Redis/BullMQ) is an **in-memory EventEmitter with an array** — no Redis connection is ever made (`backend/src/engine/redis-queue.system.ts:18-29`).
- **No worker, no orchestrator, and no queue consumption exists in the running system.** `POST /api/evaluate` executes `evaluateSubmission()` synchronously inside the HTTP request handler (`backend/src/server.ts:214`).
- The evaluation engine's own `EvaluationOrchestrator` and `EvaluationWorker` are defined but **never imported or instantiated anywhere** (`evaluation-engine/orchestrator.ts`, `evaluation-engine/workers/evaluation.worker.ts`).
- Frontend auth is **localStorage mock user + cookie**, never sent to the backend; backend JWT auth is dead in every proxied flow.

---

## 3. Diagnostic Results

| Check | Command | Result |
|---|---|---|
| Backend build | `npm run build` (backend/) | **PASS** — prisma generate + tsc clean, `dist/server.js` shim written |
| Engine build | `npm run build` (evaluation-engine/) | **PASS** — tsc clean |
| Typecheck (root) | `npx tsc --noEmit` | **FAIL — 5 errors** (see BUG 9) |
| Lint (root) | `npm run lint` | **FAIL — 563 problems (401 errors, 162 warnings)**; bulk in `backend/dist/**` + `evaluation-engine/dist/**` not excluded by `eslint.config.mjs` ignores; source errors are `no-explicit-any` |

Full lint output: `C:\Users\ARYAN\.local\share\opencode\tool-output\tool_fbc2194e7001tEsfAu7LEaXBfy`

---

## 4. Bugs

### BUG 1 — Hackathon lifecycle status is computed but never persisted or enforced

- **FILE/FUNCTION**: `lib/utils.ts:15` `resolveHackathonLifecycle` (frontend) + `backend/src/engine/utils.ts:8` (verbatim duplicate); `backend/src/server.ts:317` (`POST /api/hackathons`); `app/(dashboard)/dashboard/admin/page.tsx:457`; `app/(dashboard)/dashboard/participant/page.tsx:84`.
- **CURRENT BEHAVIOR**: Lifecycle (UPCOMING → REGISTRATION_OPEN → LIVE → EVALUATING → COMPLETED) is derived on-the-fly from dates only. The DB `Hackathon.status` column defaults to `"upcoming"` and is only ever written once on create (`server.ts:317`, `status || "upcoming"`). The admin page displays the *computed* status (line 1682), but the participant dashboard displays the *stale stored* status (`h.tag = h.status`, participant page line 84). `EVALUATING` requires a `submissionsStatus` argument that **no caller ever passes** (`admin/page.tsx:1682,1741` call with one argument).
- **EXPECTED BEHAVIOR**: A single authoritative status source, recomputed when submissions change, and used consistently everywhere.
- **ROOT CAUSE**: Duplicated date-only logic; no persistence path; `submissionsStatus` parameter dead.
- **FIX REQUIRED**: (1) Persist the computed lifecycle back to `Hackathon.status` after submission status changes (or compute once in a single shared module and return `{ status }` from `GET /api/hackathons`); (2) delete `backend/src/engine/utils.ts` duplicate; (3) wire `submissionsStatus` from `GET /api/submissions` counts; (4) no enforcement exists anywhere — the register page and backend accept registrations/submissions regardless of lifecycle (see BUG 3 note).
- **Severity**: HIGH · **Order**: 2

---

### BUG 2 — No client-side data invalidation/refetch after mutations (stale UI)

- **FILE/FUNCTION**: `app/providers.tsx:134` (QueryClientProvider mounted, `lib/queryClient.ts` exists) but **zero `useQuery`/`useMutation` calls** anywhere in `app/**` (grep-verified). `app/(dashboard)/dashboard/admin/page.tsx:93-122` (one-shot `useEffect([])` fetch), `:485-493` (manual refetch only on hackathon edit), `:231-242` (fetch-on-tab-open only).
- **CURRENT BEHAVIOR**: After a participant submits a project, the admin "Submissions" tab keeps stale data until manually re-opened. After a blueprint is saved in `BlueprintEditor`, no hackathon/portal state is refreshed. Registration status changes show stale rows until the tab is re-entered.
- **EXPECTED BEHAVIOR**: Mutations invalidate their queries; automatic refetch on focus/interval for evaluation progress.
- **ROOT CAUSE**: React Query is provisioned but unused; all pages use raw `fetch` + `useState` with no invalidation contracts.
- **FIX REQUIRED**: Either migrate pages to `useQuery`/`useMutation` with `invalidateQueries`, or add explicit `setTimeout`/polling refetch of submissions after evaluation completes (the `/api/evaluate` POST is synchronous, so a plain refetch after the await suffices today).
- **Severity**: MEDIUM · **Order**: 6

---

### BUG 3 — Admin registration status update always fails: `PUT /api/registrations/:id` does not exist on the backend

- **FILE/FUNCTION**: `app/(dashboard)/dashboard/admin/page.tsx:198-202` `handleUpdateRegStatus` (calls `PUT /api/registrations/${regId}`); `app/api/registrations/[id]/route.ts:5-23` (proxy exists and forwards); `backend/src/server.ts` (full route table read — **no PUT handler**).
- **CURRENT BEHAVIOR**: Express returns its default HTML 404 for `PUT /api/registrations/:id`; the proxy does `await response.json()` on the HTML body, which throws, and the catch returns `502 "Failed to connect to evaluation backend"`. Admin sees `alert("Failed to update registration status.")` on **every** shortlist/reject/approve attempt.
- **EXPECTED BEHAVIOR**: `PUT /api/registrations/:id { status }` persists the new status (PENDING/SHORTLISTED/REJECTED/APPROVED) and returns the updated row.
- **ROOT CAUSE**: Frontend contract (proxy + admin UI) and backend route table are out of sync.
- **FIX REQUIRED**: Add `app.put("/api/registrations/:id", ...)` in `backend/src/server.ts` validating the status and running `prisma.registration.update`; also make the proxy tolerate non-JSON responses (check `response.ok` before `json()`).
- **Severity**: CRITICAL · **Order**: 1

---

### BUG 4 — The "Redis/BullMQ queue" is a fake in-memory array; worker & orchestrator are dead code; evaluation runs inline in the HTTP request

- **FILE/FUNCTION**: `backend/src/engine/redis-queue.system.ts:18-110` (`RealRedisBullQueue` — `EventEmitter` + `QueueJobPayload[]`, `redisHost`/`redisPort` fields never used to connect); `backend/src/server.ts:12-28,200-217` (queue used only for log events; `evaluateSubmission` called synchronously at line 214); `evaluation-engine/queues/evaluation.queue.ts:1-2` (re-exports the fake queue); `evaluation-engine/workers/evaluation.worker.ts` (builds a **dummy mock project** in a temp dir — never clones the real repo; never imported); `evaluation-engine/orchestrator.ts:7` (imports `../backend/src/engine/evaluator` — cross-package boundary, creating a bidirectional coupling with `backend/src/engine/evaluator.ts:6` which imports `../../../evaluation-engine/intelligence-engine`).
- **CURRENT BEHAVIOR**: `processQueue()` marks a job "processing" but never executes anything (`redis-queue.system.ts:51-63`). Actual evaluation runs inside `POST /api/evaluate` (`server.ts:214`), so a slow evaluation blocks the HTTP thread for minutes (git clone + `npm install` + `npm run build` + real Lighthouse with 45s/30s timeouts). `completeJob`/`failJob` fire log events only. The worker/orchestrator would run the mock-project pipeline if ever wired — evaluating a fake project, not the user's repo.
- **EXPECTED BEHAVIOR**: A real async queue (BullMQ + Redis or in-process worker) consuming jobs, cloning the actual repo, with the HTTP handler returning a job id immediately.
- **ROOT CAUSE**: Queue/worker/orchestrator were scaffolded but the route handler bypasses them entirely.
- **FIX REQUIRED**: Wire `POST /api/evaluate` to enqueue and return `{ jobId }` immediately; make the worker clone the submitted `repoUrl` (reuse `backend/src/engine/evaluator.ts`); either add real Redis/BullMQ or rename/refactor to an honest in-process queue; break the `evaluation-engine` → `backend` import cycle.
- **Severity**: CRITICAL · **Order**: 3

---

### BUG 5 — Leaderboard & submissions endpoints: N+1 queries, float→Int coercion, no gating

- **FILE/FUNCTION**: `backend/src/server.ts:448-468` (`GET /api/submissions` — per-row `user`, `hackathon`, `evaluationReport` queries inside `Promise.all`); `backend/src/server.ts:546-574` (leaderboard — per-row user lookup); `server.ts:225` (score write); `app/register/page.tsx:234-247` (leaderboard loaded regardless of `leaderboardEnabled`); `backend/prisma/schema.prisma:94` (`score Int?`).
- **CURRENT BEHAVIOR**:
  - `GET /api/submissions` performs **3 queries per submission** (N+1) — O(3N) DB round-trips.
  - `score: report.scoreSummary.finalScore` is a float written into a Prisma `Int` column — PostgreSQL rounds it, so two projects scoring 74.5 vs 75.4 can both round to 75 and tie at rank 1.
  - `grade` computed by `finalScore >= 75` in **four places** (`server.ts:226`, `:569`; `register/page.tsx:197,412`) with no shared constant — a score-scheme change silently diverges.
  - Leaderboard returns only `status: "COMPLETED"` rows; `EVALUATING`/`QUEUED` entries are invisible even to admins.
  - No checks on `leaderboardEnabled`/`submissionEnabled` at the API layer.
- **EXPECTED BEHAVIOR**: Enriched queries via Prisma `include`, one pass; float score persisted accurately (e.g., `Decimal` or round-once); single shared pass-grade constant; admin visibility of in-flight submissions.
- **FIX REQUIRED**: Replace manual enrichment with `include: { user: ..., hackathon: ..., reports: ... }`; change `score` to `Decimal`/`Float` or round deterministically before write; centralize the 75-threshold; add lifecycle/permission gating server-side.
- **Severity**: HIGH · **Order**: 5

---

### BUG 6 — Blueprint "publish" is cosmetic: draft/published/version live only in localStorage; backend upsert drops `problemStatements` on update

- **FILE/FUNCTION**: `features/admin/blueprint/BlueprintEditor.tsx:443-486` `handleSaveBlueprint` (writes `fa_blueprint_${id}` to localStorage; sends `{hackathonId, blueprint}` to `/api/blueprint` and **ignores the response** — the fetch result is never checked, and on failure only a `console.warn` fires while the UI toasts success); `backend/src/server.ts:64-92` (`POST /api/blueprints` upsert — the **update branch omits `problemStatements`**, lines 66-77, while the create branch stores it, line 81).
- **CURRENT BEHAVIOR**: Clicking "Save Draft" vs "Publish" has identical server-side effect; `blueprintId`, `version`, and `status` fields from the payload are **never persisted** (Prisma `Blueprint` model has no such columns — `schema.prisma:59-74`). The register page and `/api/evaluate` read only from the DB (`backend/src/server.ts:127`), so draft/published semantics and versioning are lost. Updating an existing blueprint silently retains stale `problemStatements` from the first save.
- **EXPECTED BEHAVIOR**: A publish step that atomically marks the hackathon's active blueprint (e.g., a `status`/`isPublished` column), and updates preserving `problemStatements`.
- **FIX REQUIRED**: Add `status`/`version` to the `Blueprint` model; honor the update payload fully (add `problemStatements: blueprint.problemStatements || []` to the update branch); surface backend failures in the UI instead of toasting success.
- **Severity**: HIGH · **Order**: 4

---

### BUG 7 — Blueprint resolution ambiguity: DB blueprint silently wins over the submitted one

- **FILE/FUNCTION**: `backend/src/server.ts:123-140` (`POST /api/evaluate` — `if (dbBlueprint) blueprint = dbBlueprint;` else falls back to `req.body.blueprint`); `app/register/page.tsx:332-365` (client builds a full blueprint fallback when none loaded).
- **CURRENT BEHAVIOR**: If a hackathon has any saved blueprint in the DB, the DB version **always** overrides the blueprint the participant just fetched/constructed — even if the admin edited the blueprint 5 minutes ago and the DB copy is stale, or if the DB copy is an old draft. The `selectedProblemIndex` the participant chose (attached at `register/page.tsx:368`) survives, but every other field comes from the DB. The client-side fallback blueprint (lines 343-364) is only used when no DB blueprint exists.
- **EXPECTED BEHAVIOR**: Evaluate against the current published blueprint for that hackathon (single source of truth), or explicitly honor a versioned blueprint reference from the client.
- **ROOT CAUSE**: No versioning/isPublished semantics (see BUG 6) plus an unconditional DB override.
- **FIX REQUIRED**: After BUG 6 (published flag), resolve `published` blueprint server-side and drop the client-supplied `blueprint` from the contract (or require it to match the published version).
- **Severity**: HIGH · **Order**: 7

---

### BUG 8 — Auth is split-brained: frontend mock identity vs backend JWT; role enums don't match; proxies send no credentials

- **FILE/FUNCTION**: `lib/auth/auth-service.ts:4-18,103-137` (mock sign-in: role derived from email containing "admin"/"org"; `DEFAULT_MOCK_USER` id `usr_arena_9921`); `types/auth.ts:1` (`participant | org_admin | platform_admin`); `backend/prisma/schema.prisma:17` (`PARTICIPANT | ADMIN | SUPER_ADMIN`); `backend/src/middleware/auth.ts` (`verifyToken`, `requireRole` — never attached to any `server.ts` route); `app/api/*/route.ts` proxies (no `Authorization` header, no cookie forwarding); `backend/src/routes/auth.ts` (passwords stored **plain text**, comment claims bcrypt "in prod"); `app/(dashboard)/dashboard/page.tsx:19-24` (frontend role redirect); `components/auth/RequireRole.tsx`.
- **CURRENT BEHAVIOR**: The frontend believes identity from localStorage (`fa_session_user` + `fa_session_active` cookie); the backend's JWT + role middleware is applied to **zero** proxied endpoints — every API call is effectively unauthenticated. Role strings are incompatible across layers (a mapping only exists in `auth-service.ts:74-80` for Google). All mock users share `usr_arena_9921`, so `Registration.@@unique([hackathonId, userId])` and the submission upsert (`server.ts:146-171`) **collapse every participant into one row per hackathon**.
- **EXPECTED BEHAVIOR**: One identity source (JWT), forwarded by proxies, with consistent role enums and unique mock user ids.
- **FIX REQUIRED**: Attach `verifyToken` to backend routes; forward `Authorization` in proxies; make mock sign-in generate unique user ids (or accept the single mock-user model explicitly); reconcile `UserRole` with backend roles; hash passwords.
- **Severity**: CRITICAL · **Order**: 8

---

### BUG 9 — TypeScript errors that crash at runtime + lint baseline

- **FILE/FUNCTION**: `app/(dashboard)/dashboard/admin/page.tsx:956,1022,1842` — `RefreshCw` used in JSX but **absent from the `lucide-react` import list** (lines 5-33); `app/register/page.tsx:378,403` — `user.id` dereferenced when `user` is possibly `null` in `handleProjectSubmit`.
- **CURRENT BEHAVIOR**: `npx tsc --noEmit` fails with 5 errors. Because `next.config.ts` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`, `npm run build` succeeds anyway and ships broken code. At runtime, rendering any of the three `RefreshCw` loading spinners throws `ReferenceError: RefreshCw is not defined` → React unmounts the page (admin submissions/leaderboard tabs crash while loading); submitting a project as an unauthenticated user (`user === null`) throws on `user.id`. Note `handleRegisterSubmit` guards `user` (line 257) while `handleProjectSubmit` does not — inconsistent.
- **EXPECTED BEHAVIOR**: Zero TS errors; `next build` must not mask them.
- **FIX REQUIRED**: Add `RefreshCw` to the import list; guard `user` in `handleProjectSubmit` (early return with alert, mirroring line 257); remove `typescript.ignoreBuildErrors`/`eslint.ignoreDuringBuilds` from `next.config.ts`; add `dist/**` to ESLint ignores.
- **Severity**: CRITICAL · **Order**: 9

---

### BUG 10 — Prisma schema integrity: missing relations/FKs, single-report constraint vs multi-attempt design, unindexed join columns

- **FILE/FUNCTION**: `backend/prisma/schema.prisma` (`Hackathon` has **no relation fields** to `Blueprint`/`Submission`/`Registration`; `Submission.hackathonId`/`userId` are bare strings; `Blueprint.hackathonId String @unique` with no FK to `Hackathon`; `EvaluationReport.submissionId @unique`); `backend/src/server.ts:337-353` (DELETE cascades hand-rolled with three `deleteMany` calls because no FKs exist); `server.ts:146-171` (submission upsert keyed `hackathonId+userId`).
- **CURRENT BEHAVIOR**: Referential integrity is enforced only by application code; a hackathon deletion depends on the DELETE route's manual cascade order (any future write path that forgets the cascade leaves orphans). The `EvaluationReport.submissionId @unique` allows **one report per submission**, but the product supports re-submission (`version` increments, `server.ts:169`) — each re-submit **overwrites** the previous report (`upsert` at `server.ts:230-234`), destroying attempt history that the UI displays (`register/page.tsx:191-206` lists versions, but only the latest report survives). Join columns `hackathonId`/`userId` are unindexed → full scans on leaderboard/submissions at scale.
- **EXPECTED BEHAVIOR**: FK relations with `onDelete: Cascade`, `@@index` on join columns, and per-attempt report rows (or a `version` column on `EvaluationReport`).
- **FIX REQUIRED**: Add `Blueprint.hackathon Hackathon @relation(...)`, `Submission.hackathon/user` relations, `Hackathon.submissions/registrations/blueprint` back-refs, `@@index([hackathonId, userId])` on Submission/Registration; relax the `@unique` on `EvaluationReport.submissionId` to a `(submissionId, version)` composite or store per-attempt reports.
- **Severity**: HIGH · **Order**: 10

---

## 5. SYSTEM HEALTH SUMMARY

| Flow | Status | Notes |
|---|---|---|
| Hackathon CRUD (admin create/edit/delete) | **PASS** (with caveats) | Works end-to-end; edit does a manual refetch; DELETE manual cascade OK today |
| Blueprint save/load | **FAIL** | "Publish" not persisted (BUG 6); update drops `problemStatements`; DB always wins over client (BUG 7) |
| Registration (participant) | **PASS** (partially) | POST works, mock user auto-created; no lifecycle gate; all mock users share one id (BUG 8) |
| Registration admin status update | **FAIL** | `PUT /api/registrations/:id` missing → always 502 (BUG 3) |
| Submission + evaluation | **FAIL** | Runs inline (blocking HTTP), queue/worker dead (BUG 4); `user` null crash (BUG 9) |
| Report persistence | **FAIL** | Single report per submission overwrites history (BUG 10) |
| Submissions portal (admin) | **FAIL** | Crashes on load (RefreshCw, BUG 9); stale data (BUG 2) |
| Leaderboard | **PARTIAL** | Works for COMPLETED only; N+1; float rounding ties (BUG 5) |
| Auth | **FAIL** | Mock identity never reaches backend; no protected routes; plain-text passwords (BUG 8) |
| Builds (backend + engine) | **PASS** | tsc clean in both packages |
| Typecheck / lint (root) | **FAIL** | 5 TS errors; 563 lint problems (BUG 9) |

---

## 6. Severity & Implementation Order

| # | Bug | Severity | Order |
|---|---|---|---|
| 3 | Missing `PUT /api/registrations/:id` (admin status update 502s) | CRITICAL | 1 |
| 1 | Lifecycle status never persisted / enforced | HIGH | 2 |
| 4 | Fake queue + dead worker/orchestrator + inline blocking eval | CRITICAL | 3 |
| 6 | Blueprint publish not persisted; upsert drops problemStatements | HIGH | 4 |
| 5 | N+1 queries, float→Int score coercion, duplicated pass-grade constant | HIGH | 5 |
| 2 | No data invalidation / stale admin UI | MEDIUM | 6 |
| 7 | DB blueprint silently overrides client blueprint | HIGH | 7 |
| 8 | Split-brain auth (mock vs JWT), role mismatch, shared mock user id | CRITICAL | 8 |
| 9 | `RefreshCw` + `user`-null TS errors shipped by lenient build config | CRITICAL | 9 |
| 10 | Prisma missing relations/indices; single report per submission | HIGH | 10 |

Recommended order rationale: 3, 1, 4 first unblock the primary admin + evaluation flows; 6/7/5 fix data-correctness; 2 improves UX; 8/9 fix the crash & security layers; 10 hardens the data model. BUG 4 and BUG 8 are the largest refactors — schedule them as dedicated work items.

---

## 7. Appendix — Key Evidence File:Line References

- `backend/src/server.ts:214` — synchronous `await evaluateSubmission(...)` inside the request handler
- `backend/src/engine/redis-queue.system.ts:18-29` — `class RealRedisBullQueue extends EventEmitter`, array-backed
- `backend/src/server.ts:12-28` — queue used only for logging events
- `evaluation-engine/workers/evaluation.worker.ts` — mock temp project, never imported
- `evaluation-engine/orchestrator.ts:7` — `import { evaluateSubmission } from "../backend/src/engine/evaluator"` (cross-package)
- `backend/src/engine/evaluator.ts:6` — `import { FAIEOrchestrator } from "../../../evaluation-engine/intelligence-engine"` (cycle with above)
- `app/(dashboard)/dashboard/admin/page.tsx:198` — `PUT /api/registrations/${regId}`
- `app/api/registrations/[id]/route.ts:12-16` — proxy forwards PUT; `response.json()` on non-JSON 404 throws
- `lib/utils.ts:15` / `backend/src/engine/utils.ts:8` — duplicated date-only lifecycle resolver
- `backend/src/server.ts:317` — `status: status || "upcoming"` (persisted once)
- `app/(dashboard)/dashboard/participant/page.tsx:84` — displays stale `h.status`
- `app/providers.tsx:134` — QueryClientProvider present; zero `useQuery` usages in repo
- `features/admin/blueprint/BlueprintEditor.tsx:443-486` — publish ignored server-side; `localStorage` draft flag
- `backend/src/server.ts:64-92` — upsert update branch omits `problemStatements`
- `backend/src/server.ts:448-468` — N+1 enrichment in GET /api/submissions
- `backend/src/server.ts:225-226` — float `finalScore` → `Int`, threshold 75
- `backend/prisma/schema.prisma:59-101` — no FK relations; `EvaluationReport.submissionId @unique`
- `app/(dashboard)/dashboard/admin/page.tsx:5-33` vs `:956,1022,1842` — `RefreshCw` used, not imported
- `app/register/page.tsx:378,403` — `user.id` on possibly-null `user`
- `lib/auth/auth-service.ts:4-18,103-137` — mock identity, `usr_arena_9921`
- `backend/src/routes/auth.ts` — plain-text password storage
- `types/auth.ts:1` vs `backend/prisma/schema.prisma:17` — role enum mismatch
