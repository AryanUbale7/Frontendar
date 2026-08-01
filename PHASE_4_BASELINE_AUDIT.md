# Phase 4 Baseline Audit — FAIE Scoring Intelligence, Evidence Depth & Calibration

**Phase:** 4
**Date:** 2026-08-01
**Status:** BASELINE CAPTURED (Steps 1–3 complete)
**Scope:** `evaluation-engine/intelligence-engine` (FAIE v2), `evaluation-engine/validation-suite`, production wiring in `backend/src/engine/evaluator.ts`

---

## 1. Architecture Map

Production scoring pipeline (12 stages, `faie.orchestrator.ts:92–629`):

```
RepositoryEngine.analyzeRepository()  → repoAnalysis (deps, files, AST patterns)
RouteEngine.detectRoutes()            → routeResults (coveragePercent)
UIEngine.analyzeUI()                  → uiAnalysis (STATIC scan; deploymentUrl never passed in prod)
ProjectClassifierEngine.classifyProject() → classification + selectedBlueprint
FeatureEngine.evaluateFeatures()      → featureResults (weightedScore per feature, evidence level 0–5)
FeatureEngine.evaluateCapabilities()  → capabilityVerifications (10 capabilities, level 0–5)
InferenceEngine.runInference()        → RULE RESULTS DISCARDED (orchestrator.ts:161)
EvidenceEngine                        → evidence citations
ReasoningEngine.generateReasoning()   → per-category scoreAwarded (dashboard vs regression branches)
ScoringEngine.calculateFinalScores()  → finalScore, status, coverage percentages
```

Three-layer score computation:
1. **Feature level** — ConfidenceEngine weighted signal sum (weights sum to **1.25**, not 1.0).
2. **Category level** — hardcoded additive rules in orchestrator (base points + bonus checks).
3. **Final level** — `rawScore = Σ category scoreAwarded ± bonuses/deductions`, then calibration curve.

Grade thresholds (production, `backend/src/engine/evaluation-runner.ts:5`): `score >= 75 → PASSED`.

---

## 2. Baseline Test Results (captured 2026-08-01, unmodified engine)

### 2.1 50-Benchmark Validation Suite (`npx ts-node validation-suite/run-validation.ts`)

| Metric | Result |
|---|---|
| Total benchmarks | 50 (10 categories × 5 frameworks) |
| Accuracy | **100%** (50/50) |
| Mean Absolute Error | **0.0 pts** |
| Precision / Recall / F1 | 100% / 100% / 100% |
| Confusion matrix | TP=15, TN=35, FP=0, FN=0 |

Score distribution: 75–89 → 10 repos (20%), 50–74 → 5 repos (10%), 0–24 → **35 repos (70%)**.

### 2.2 Adversarial Suite (`npx ts-node validation-suite/adversarial.fixtures.ts`)

| ID | Fixture | Expected | Actual | Match |
|---|---|---|---|---|
| A | Excellent Dashboard | 90–100 | **55** | FAIL |
| B | Good Dashboard | 75–89 | **48** | FAIL |
| C | Average Dashboard | 60–74 | **33** | FAIL |
| D | Weak Dashboard | 40–59 | **9** | FAIL |
| E | Broken Dashboard | 0–39 | 9 | PASS |
| F | Fake README | 0–39 | 9 | PASS |
| G | Keyword Stuffing | 0–39 | 9 | PASS |
| H | Empty Recharts | 0–50 | 9 | PASS |
| I | Fake Responsive | 0–50 | 9 | PASS |
| J | Fake Interaction | 0–50 | 9 | PASS |
| K | Copy/Paste Components | 0–59 | 11 | PASS |
| L | Excellent JS Dashboard | 70–85 | **51** | FAIL |

**Suite result: FAILURE (4/12 pass).** Capability levels for fixture A are strong (DATA_VISUALIZATION 5/5, METRIC_SUMMARY 5/5, INTERACTIVE_FILTERING 5/5, STATEFUL_INTERACTION 5/5) yet the final score is 55.

### 2.3 Baseline Diagnostics

- **Top-end compression:** Excellent (55) vs Broken (9) — only **46 points** of separation between a fully-implemented Level-5 dashboard and an empty directory. Broken fixtures all cluster at exactly **9**.
- **Failed-repo clustering:** 35/50 benchmark failures collapse to **16** and Fake-README failures to **7** — the fail path `Math.round(rawScore * 0.3)` capped at 25 (`scoring.engine.ts:208`) destroys granularity.
- **50-benchmark "perfect" accuracy is a calibration warning, not a strength:** only 4 distinct ground-truth scores exist (80/74/16/7) and the framework dimension is degenerate (identical expected scores across all 5 frameworks). The engine was evidently tuned to these exact fixtures — see §4.

---

## 3. Audit Findings (scoring weaknesses, with evidence)

### 3.1 Evidence Depth

| # | Finding | Location |
|---|---|---|
| E1 | Evidence levels 0–5 are computed in `evaluateCapabilities` and `calculateEvidenceLevel` but are NOT persisted into the report's feature tree; reports expose only `evidenceLevel` per feature while capability evidence levels are dumped as console rows. | `feature.engine.ts:696, 434–489`; `faie.orchestrator.ts:627` |
| E2 | `hasBrokenLayout` is **hardcoded `false`**; `consoleErrors`/`brokenLinks` always empty. | `ui.engine.ts:195–197` |
| E3 | When a `deploymentUrl` is supplied, UIEngine fabricates Playwright log lines and screenshot entries (no browser, no files written). Production passes `deploymentUrl = undefined` so the static path always runs. | `ui.engine.ts:152–173`; `backend/src/engine/evaluator.ts:526` |
| E4 | `hasErrorPages` is declared but never assigned (always false). | `ui.engine.ts:55` |
| E5 | Evidence items in `EvidenceEngine` have no dedup, no level attribution, and `formatCitations` only produces text. | `evidence.engine.ts` (36 lines) |
| E6 | README plugin regexes `/live/i`, `/run/i` match ordinary prose ("runtime", "live monitoring") and award marks with zero code linkage. | `plugins/readme.plugin.ts:41–72` |

### 3.2 Confidence & Signal Integrity

| # | Finding | Location |
|---|---|---|
| C1 | Confidence weights sum to **1.25**; ~80% of signals saturate at 100%. Not normalized. | `confidence.engine.ts:40–52, 83` |
| C2 | `envVarMatch: true` is **always true** (free +0.05). `configMatch` is true for any repo with Tailwind/tsconfig (free +0.05). | `feature.engine.ts:576–577` |
| C3 | Synonym matching is substring containment; short aliases ("form", "card", "user", "map", "chart") inflate matches. | `synonym.engine.ts:35`; `alias-dictionary.ts` |
| C4 | `functionalComponentsCount` counts any file containing `"const "` as a component. | `repository.engine.ts:134` |
| C5 | Two competing thresholds: ConfidenceEngine uses 75 (orchestrator default) while sub-feature status uses `blueprint.confidenceThreshold \|\| 65`. Blueprint-level `confidenceThreshold` never reaches the ConfidenceEngine. | `faie.orchestrator.ts:86, 143`; `feature.engine.ts:289–291` |
| C6 | Reported category `confidencePercent` is hardcoded **95** for every category. | `faie.orchestrator.ts:193` |
| C7 | Inference Engine rule results are computed and **discarded**. | `faie.orchestrator.ts:161` |

### 3.3 Scoring & Calibration

| # | Finding | Location |
|---|---|---|
| S1 | Blanket `* 0.85` fallback for any unmatched category (both dashboard and regression branches); `* 0.85` tech fallback; `* 0.6` docs fallback. | `faie.orchestrator.ts:510, 537, 529, 533` |
| S2 | Success curve `rawScore * (1 - 0.11*(raw/100)) * 0.92`, capped at **96** — crushes top-end scores (Excellent Dashboard → 55). | `scoring.engine.ts:210–211` |
| S3 | Fail path `rawScore * 0.3` capped at 25 → all failures collapse to ~16/7/9. | `scoring.engine.ts:208` |
| S4 | Tech compliance grants flat **+40** bonus. Folder compliance is binary `>3 files ? 100 : 40`. UI compliance = `components*20 + responsive*30`. | `scoring.engine.ts:62–63, 66, 69–72` |
| S5 | **Unreachable code:** dashboard-specific penalties in ScoringEngine (TS −15, rejected-claims −15, auto-fails) never fire because the orchestrator calls `calculateFinalScores` with 6 args and `isDashboardChallenge` defaults `false`. The 8-category Dashboard blueprint's category rules live entirely in the orchestrator, not the scoring engine. | `scoring.engine.ts:41, 104–167`; `faie.orchestrator.ts:563–570` |
| S6 | `repositoryCoveragePercent` assumes 50 files = 100%. | `scoring.engine.ts:157, 220` |
| S7 | Route coverage is always 100% in practice: no registry blueprint defines `expectedRoutes`. | `route.engine.ts:72`; registry grep |
| S8 | `bonusPointsTotal` is always 0 in the dashboard branch; bonuses capped at 10 in regression branch. | `scoring.engine.ts:198–200` |
| S9 | Performance/accessibility category scores use a neutral default of 3 when Lighthouse is UNAVAILABLE; only dashboard branch consumes `toolResults`. | `faie.orchestrator.ts:443–483` |
| S10 | Classifier confidence divides by magic 60; `General Web App` seeded at 1 to win ties; `uiAnalysis` parameter is never read by `classifyProject`. | `project-classifier.engine.ts:36, 311` |

### 3.4 Benchmark / Ground-Truth Integrity

| # | Finding | Location |
|---|---|---|
| B1 | 50-benchmark ground truths use only 4 distinct scores; framework dimension is identical across all 5 frameworks. | `benchmark.repository.builder.ts:41–181` |
| B2 | Real-world suite has all 6 repos pinned to `humanScore: 80, humanStatus: "pass"` (degenerate human baseline). | `github.repository.collector.ts:21–115` |
| B3 | Benchmark matches are scored against a single expected number rather than a human-tolerable range; MAE 0 signals overfit ground truths, not engine quality. | `faie.validation.suite.ts:149–154` |
| B4 | No overfitting guard: no held-out set, no seed variation, no cross-domain validation. | suite files |
| B5 | Validation suites are console-only (no persisted report artifacts). | `run-validation.ts`; `adversarial.fixtures.ts:387` |

### 3.5 Production Wiring

| # | Finding | Location |
|---|---|---|
| P1 | The 9 legacy plugins are **dead code in production** — backend uses only FAIE. Plugin calibration effort would not move scores. | `backend/src/engine/evaluator.ts:6`; grep of `app/` and `backend/` |
| P2 | Backend Lighthouse audit is real (local static server, 45s) but `toolResults` is only consumed by the dashboard performance/accessibility categories. `security.vulnerabilities` hardcoded `[]`. | `backend/src/engine/evaluator.ts:222–283, 428` |
| P3 | `deploymentUrl` never passed to FAIE → live-browser evidence impossible in production; no fabrication path should be relied upon. | `backend/src/engine/evaluator.ts:526` |

---

## 4. Overfitting Evidence (50-Benchmark Suite)

The 100%/MAE-0 result is **not** evidence of a calibrated engine:

1. Only 4 distinct expected scores exist; the engine's two calibration levers (0.92 coefficient, `0.11*(raw/100)` curve) and the `*0.3` fail path were evidently tuned so the known fixture sets land on those 4 numbers.
2. All 35 failure benchmarks resolve to exactly 16 or 7 — a signature of fixture-specific tuning, not behaviorally meaningful scoring.
3. The adversarial suite (12 fixtures with *ranges*, mostly built independently) fails 8/12 — the strongest available signal that real-world generalization is poor.
4. Real-world suite human baselines are degenerate (all 80) — no useful calibration signal.

**Conclusion:** current accuracy metrics measure memorization of the fixture set. Phase 4 must introduce held-out, cross-domain, range-based calibration and treat any "perfect" result as a red flag.

---

## 5. Phase 4 Implementation Plan (mapped to requirements)

| # | Requirement | Work items |
|---|---|---|
| 1 | Evidence levels 0–5 | Normalize level computation into one authoritative function; attach levels + capability verifications to report; wire EvidenceEngine items with level attribution; remove fabricated UI evidence paths (static-only, honest `UNAVAILABLE` states). |
| 2 | Implementation depth | Replace binary Implemented/Partial/Not-Implemented with depth dimension (Full / Partial / Superficial) derived from evidence level + AST/data-flow/render/runtime signals; Superficial cannot earn full marks. |
| 3 | Granular category scoring | Replace blanket 0.85 / 0.6 / 0.85 fallbacks and the +40 flat bonus with per-category evidence-derived award rules; make dashboard path reachable by passing `isDashboardChallenge` through to ScoringEngine; normalize confidence weights to 1.0; remove free signals (`envVarMatch`, loose `configMatch`). |
| 4 | Explainable traces | Add `scoreTrace` (every contributing signal, weight, level, formula step) and `penaltyTrace` (every deduction with rule + amount) to `FAIEReportV2`; derive category `confidencePercent` from evidence, not hardcoded 95. |
| 5 | Adversarial fixtures | Keep A–L; ensure A–E (broken→exceptional spectrum) assert correct bands; add fixtures for forbidden-word vectors ("recharts" in comments, README-only claims, keyword-stuffed filenames). |
| 6 | Cross-domain fixtures | Add 6 domains (Todo, E-Commerce, Chat, Finance, Hospital, Landing) × quality levels with `humanExpectedRange`; run engine against them to prove no domain-specific scoring hacks. |
| 7 | Calibration benchmarks | Convert expected-score metrics to `humanExpectedRange` (min/max); report MAE vs range midpoints, within-range accuracy, per-category/framework breakdowns; keep MAE target ≤ 5.0. |
| 8 | Overfitting scan | Held-out validation (train set ≠ eval set), seed/template variation, cross-domain generalization check, score-distribution sanity (broken < weak < average < good < excellent strictly separated). |
| 9 | Regressions | 50-benchmark suite, adversarial suite, real-world suite, backend Phase 1–3 tests, root tsc + lint + build. |
| 10 | Report | `PHASE_4_IMPLEMENTATION_REPORT.md` with before/after tables. |

## 6. Safety Constraints (binding)

- **No participant-specific or repo-specific scoring hacks** in production code (`backend/`, `evaluation-engine/intelligence-engine/`).
- **No domain-specific scoring hacks:** production scoring must be blueprint-driven; domain knowledge lives only in blueprint registries and test fixtures.
- **Forbidden words** (e.g. "recharts", "chart") may exist in test fixtures but must NOT appear as scoring triggers in production scoring logic.
- **Never fabricate Lighthouse** results; keep honest `UNAVAILABLE` handling.
- **Score cap 100**, never exceed.
- **Blueprint precedence:** explicit published blueprint > generic classification (already implemented; must not regress).
- Do not redesign Phase 3 infrastructure (queue/worker/Redis/DB).
