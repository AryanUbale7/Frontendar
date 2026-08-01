# PHASE 2 IMPLEMENTATION REPORT

Date: 2026-08-01 · Hackathon lifecycle engine, blueprint publication + versioning, leaderboard ranking integration (the items explicitly deferred from Phase 1).

Phase 3 scope (explicitly untouched): durable Redis/BullMQ queue, FAIE scoring weights, capability detectors.

---

## FILES MODIFIED

**Created (backend)**
- `backend/src/engine/lifecycle.ts` — pure lifecycle model: `LifecycleStatus` (DRAFT | UPCOMING | ACTIVE | COMPLETED | ARCHIVED), `resolveLifecycleStatus(hackathon)` (ARCHIVED wins → unpublished → DRAFT → endDate passed → COMPLETED → startDate future → UPCOMING → ACTIVE), `lifecycleToPersisted` (lowercase persistence form), `canAcceptSubmissions` (ACTIVE only), `canAcceptRegistrations` (UPCOMING or ACTIVE).
- `backend/src/engine/phase2.test.ts` — 16 end-to-end HTTP + DB tests (TEST 1–16, see Test Results).
- `backend/src/engine/_migrate-phase2.ts` — one-time migration: backfilled `published`/`archived` from legacy status strings, set Frontend Wars 2026 start/end dates (restored ACTIVE), stamped every existing blueprint `status="published"`, `version=1`, and snapshotted `BlueprintVersion` v1.
- `backend/src/engine/_backup-blueprint.ts` + `backups/frontend-wars-blueprint-pre-phase2.json` — pre-change backup of the Frontend Wars 2026 blueprint (id `74787c3e-813d-4ef7-a7ea-8c8c5afcf361`, "Life Dashboard Challenge").
- `backend/src/engine/_dbcheck.ts`, `_cleanup-p2.ts` — one-off DB inspection / test-data cleanup scripts. (`_dbg.ts` debug scratch removed after use.)

**Created (frontend)**
- `app/api/hackathons/[id]/publish/route.ts`, `app/api/hackathons/[id]/archive/route.ts` — thin proxies to the new backend publish/archive endpoints.

**Modified (schema) — `backend/prisma/schema.prisma`** (non-destructive, `prisma db push`)
- `Hackathon`: `published Boolean @default(false)`, `archived Boolean @default(false)`, `publishedAt DateTime?`.
- `Blueprint`: `status String @default("draft")`, `version Int @default(1)`, `publishedAt DateTime?`, `updatedAt DateTime @default(now())`.
- **New model `BlueprintVersion`**: `id`, `blueprintId`, `hackathonId`, `version`, `payload Json`, `publishedAt`, `createdAt` + indexes — immutable snapshot per publish.
- `Submission`: `blueprintId String?`, `blueprintVersion Int?`, `completedAt DateTime?`.

**Modified (backend)**
- `backend/src/server.ts` — see Changes.
- `backend/src/engine/in-memory-queue.system.ts` — `QueueJobPayload`/`addJob` gained `blueprintId?`, `blueprintVersion?`.
- `backend/src/engine/evaluation-runner.ts` — `EvaluationJobData` carries `blueprintId`/`blueprintVersion`; on completion persists `completedAt: new Date()` + the bound blueprint/version.

**Modified (frontend)**
- `app/api/blueprint/route.ts` — GET forwards `?includeDraft=true`.
- `app/(dashboard)/dashboard/admin/page.tsx` — lifecycle badge on each hackathon card (draft/upcoming/active/completed/archived), **Publish** button (unpublished) and **Archive** button (published, not archived); new hackathon form now creates drafts (`published:false`, `archived:false`).
- `app/register/page.tsx` — refreshLiveData refreshes the leaderboard when a submission completes; leaderboard tab polls every 15s (cleanup on unmount); lifecycle guard on submit; `Hackathon.lifecycle` typed (no `as any`).
- `features/admin/blueprint/BlueprintEditor.tsx` — loads `?includeDraft=true`; save action `draft` | `publish`; applies returned `version`; shows server message/error.
- `app/(dashboard)/dashboard/participant/page.tsx` — lifecycle tag.

---

## CHANGES MADE (backend `server.ts`)

1. **Lifecycle gates.** `POST /api/evaluate` → 409 unless lifecycle is ACTIVE; `POST /api/registrations` → 409 unless UPCOMING/ACTIVE. Frontend register page mirrors the guard.
2. **Blueprint publication + versioning.** `POST /api/blueprints` now requires ADMIN/SUPER_ADMIN (`requireRole`). `action:"draft"` saves the draft; `action:"publish"` flips to published, bumps `version` (1st publish v1, 2nd publish v2 …), records `publishedAt`, and snapshots the published payload into a new `BlueprintVersion`. `GET /api/blueprints/:hackathonId` is public but returns **published blueprints only** (draft → 404); `?includeDraft=true` is admin-only. `DELETE /api/blueprints/:hackathonId` is admin-only and cascades versions.
3. **Published blueprint is authoritative for evaluation.** `/api/evaluate` resolves the hackathon's published blueprint from the DB (`status="published"`, highest `version`); if none exists → 400 (no client fallback). A client-supplied `blueprint` is **ignored** for hackathon submissions. The submission row records `blueprintId` + `blueprintVersion`, and the queue job carries them through to the runner.
4. **Leaderboard ranking.** Rank order is now `score DESC → completedAt ASC (missing → MAX_SAFE_INTEGER) → id ASC`; removed the category tie-breakers. Fixed a real race: ranks are computed synchronously **before** the async `prisma.user.findUnique` enrichment (previously `rank` was read after the await → every entry ranked 6).
5. **Hackathon visibility + lifecycle field.** `GET /api/hackathons` uses `optionalAuth`: anonymous/participants see only `published && !archived`, each row annotated with the computed `lifecycle`; admins see everything. `POST /api/hackathons` (admin-only) now persists `published`/`archived`/`publishedAt`/`startDate`/`endDate` and stores the lifecycle-derived status string. New admin-only endpoints `POST /api/hackathons/:id/publish` and `POST /api/hackathons/:id/archive`. `DELETE /api/hackathons/:id` also deletes `BlueprintVersion` rows.
6. **completedAt.** The evaluation runner stamps `completedAt` when a submission reaches COMPLETED (raw material for completion-time tie-breaks).

---

## TEST RESULTS

| Check | Result |
|---|---|
| `backend/src/engine/phase2.test.ts` (16 tests: lifecycle resolver 1–4, blueprint security 7–9, draft/publish persistence 5–6 incl. v1/v2 snapshots, evaluate→published-blueprint binding 10, lifecycle gates 15–16, leaderboard flow/ties/isolation 11–14, public visibility 15b–d) | **PASS 16/16** against live backend |
| Phase 1 regression `integration.test.ts` | **PASS** (10/10) |
| Phase 1 regression `e2e-submission.test.ts` | **PASS** (full real evaluation, leaderboard sorted/ranked) |
| Backend `npm run build` (prisma generate + tsc) | **PASS** |
| Root `npx tsc --noEmit` | **PASS** (0 errors) |
| Root `npm run build` (Next 15, TS enforced) | **PASS** |
| Root `npm run lint` | 273 problems (156 errors, 117 warnings) vs Phase 1's 272 (155, 117): **all Phase 2 files lint-clean**; the +1 is a `catch (err: any)` matching server.ts's established pre-existing convention; Phase 2 also removed 2 errors from `admin/page.tsx` and `register/page.tsx` |

Key behaviors verified live: 2nd publish bumps v1→v2 with both snapshots intact; public GET hides drafts (404) and serves the latest published content; evaluate on a published blueprint records `blueprintId`/`blueprintVersion` (client blueprint ignored); draft/upcoming/completed gates return 409; 88-vs-88 ties order by completion time ASC and equal-time ties by stable id; Hackathon B's leaderboard never shows Hackathon A's rows; draft hackathons invisible to the public list but visible to admins.

---

## REMAINING ISSUES / DISCLOSURES

1. **Queue is still in-memory/non-durable** (Phase 1 decision, carried forward — durable Redis/BullMQ is Phase 3).
2. One-time migration scripts (`_migrate-phase2.ts`, `_backup-blueprint.ts`) are kept for provenance; `_dbcheck.ts`/`_cleanup-p2.ts` are disposable. Pre-Phase-2 blueprint backed up at `backups/frontend-wars-blueprint-pre-phase2.json`.
3. Pre-existing lint errors in `admin/page.tsx`, `register/page.tsx`, `google/route.ts`, `BlueprintEditor.tsx`, and the legacy `catch (err: any)` style remain; no new warnings introduced.
4. `app/api/auth/google/route.ts` still does a raw fetch (pre-existing; unchanged).
5. Phase 3 (untouched, as instructed): durable queue, FAIE scoring weights, capability detectors.

---

## PHASE 2 PASS/FAIL CHECKLIST

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Lifecycle model (draft/upcoming/active/completed/archived) | **PASS** | `lifecycle.ts` + gates on evaluate/registrations + `lifecycle` field on list API (TEST 1–4, 15–16, 15b–d) |
| 2 | Blueprint publication flow with immutable versions | **PASS** | publish→v1, re-publish→v2, `BlueprintVersion` snapshots, public 404 for drafts (TEST 5–6, 6h–j) |
| 3 | Evaluate binds to the hackathon's published blueprint (no client override) | **PASS** | 400 without published blueprint; 202 with binding persisted (TEST 10a–f) |
| 4 | Leaderboard ranking: score desc, completedAt asc, stable id; no rank race | **PASS** | TEST 11–14; rank computed pre-await |
| 5 | Public/admin visibility split + publish/archive admin endpoints | **PASS** | TEST 15b–d; new proxy routes |
| 6 | Frontend: admin publish/archive UI, editor draft/publish, register lifecycle guard + live leaderboard | **PASS** | lint-clean additions; tsc/build green |
| 7 | No FAIE scoring / capability-detector / durable-queue changes | **PASS** | untouched |
