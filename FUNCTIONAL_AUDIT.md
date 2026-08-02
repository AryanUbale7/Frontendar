# Frontend Arena Functional & Hardening Audit

This document summarizes the comprehensive baseline audit of the Frontend Arena platform. Each feature, toggle, restriction, and workflow configured in the user interface has been traced from the React components down to the API routes, database schemas, and background worker queues.

---

## 1. Feature Configuration Audit Matrix

| Feature | UI Exists? | Persisted? | Backend Enforced? | Participant Effect? | Security Impact? | Status | Files Involved | Required Fix |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **Max Submissions** | Yes | Yes | No | None | High | Persisted but never consumed | `features/admin/blueprint/BlueprintEditor.tsx`, `backend/src/server.ts` | Count attempts on `/api/evaluate` and reject with `409 SUBMISSION_LIMIT_REACHED` if the limit is exceeded. |
| **Submission Enabled** | Yes | Yes | No | None | Low | Persisted but never consumed | `backend/src/server.ts`, `backend/src/engine/lifecycle.ts` | Modify `canAcceptSubmissions` in `lifecycle.ts` to check the `submissionEnabled` boolean flag. |
| **Submission Start/End** | Yes | Yes | Partially | None | Low | Partially enforced | `backend/src/engine/lifecycle.ts`, `backend/src/server.ts` | Ensure both blueprint-level dates and hackathon-level dates are evaluated during submission gate checks. |
| **Resubmission Policy** | Yes | Yes | No | None | Low | UI-only / Persisted but never consumed | `backend/src/server.ts` | Check `resubmissionPolicy` inside blueprint; if false and submission already exists, reject evaluation request. |
| **Multiple Submissions** | Yes | Yes | No | None | Low | UI-only / Persisted but never consumed | `backend/src/server.ts` | If `allowMultiple` is false, reject submissions with version > 1. |
| **GitHub Repo Req.** | Yes | Yes | No | None | High | Persisted but not validated | `backend/src/server.ts` | Implement strict regex checking on the backend to validate that repository URLs are valid GitHub URLs. |
| **Live Deploy Req.** | Yes | Yes | No | None | Low | Persisted but never enforced | `backend/src/server.ts` | If required in the blueprint, return a validation error if `deploymentUrl` is missing or empty. |
| **README Requirement** | Yes | Yes | No | None | Low | Persisted but never enforced | `backend/src/engine/evaluator.ts` | Enforce presence of `README.md` file in cloned repo during static audit if required, applying scoring deduction or failure. |
| **Installation Guide** | Yes | Yes | No | None | Low | Persisted but never enforced | `backend/src/engine/evaluator.ts` | Scan `README.md` content for installation commands if required in blueprint; deduct score if missing. |
| **Presentation PDF** | Yes | Yes | No | None | Low | Persisted but never enforced | `backend/src/server.ts` | If required in blueprint, reject submission if `presentationPdf` link is missing or empty. |
| **Architecture Diagram** | Yes | Yes | No | None | Low | Persisted but never enforced | `backend/src/server.ts` | If required in blueprint, reject submission if `architectureDiagram` is missing or empty. |
| **Final Lock** | Yes | Yes | No | None | Low | UI-only / Persisted but never consumed | `backend/src/server.ts` | If `finalLock` is enabled, block any subsequent submission updates once the user has made their first submission. |
| **Late Policy** | Yes | Yes | No | None | Low | UI-only / Persisted but never consumed | `backend/src/server.ts` | Check late submission criteria against the hackathon deadline; reject or apply penalty score rules if late. |
| **Evaluation Mode** | Yes | Yes | No | None | Low | UI-only / Persisted but never consumed | `backend/src/server.ts` | If evaluation mode is set to manual/offline, skip queue enqueueing or mark score as pending manual review. |
| **Problem Statements** | Yes | Yes | No | None | Medium | Partially implemented (Not chosen or locked) | `backend/src/server.ts`, `backend/src/engine/evaluator.ts`, `app/register/page.tsx` | Add `problemStatementId` to `Submission` schema, build a selection workflow screen in frontend, and pass ID to worker/evaluator. |
| **Required Features** | Yes | Yes | Yes | Yes | Low | Enforced | `evaluation-engine/intelligence-engine/faie.orchestrator.ts`, `backend/src/engine/evaluator.ts` | None (FAIE correctly matches features). |
| **Tech Stack Rules** | Yes | Yes | Yes | Yes | Low | Enforced | `evaluation-engine/intelligence-engine/faie.orchestrator.ts` | None (FAIE correctly validates technology rules). |
| **Code Quality Config** | Yes | Yes | Yes | Yes | Low | Enforced | `evaluation-engine/intelligence-engine/faie.orchestrator.ts` | None (Code quality scoring weights are consumed). |
| **Performance Thresholds**| Yes | Yes | Yes | Yes | Low | Enforced | `backend/src/engine/evaluator.ts` | None (Min checks are validated against Lighthouse results). |
| **Innovation Config** | Yes | Yes | Yes | Yes | Low | Enforced | `evaluation-engine/intelligence-engine/faie.orchestrator.ts` | None (Bonus rules and scoring systems are consumed). |
| **FAIE Configuration** | Yes | Yes | Yes | Yes | Low | Enforced | `evaluation-engine/intelligence-engine/faie.orchestrator.ts` | None. |
| **Judging Config** | No | No | No | None | Low | Static / UI-only | `app/(dashboard)/dashboard/admin/page.tsx` | Implement the Virtual Judging Center fully, displaying real submissions, statistics, and retry functionality. |
| **Leaderboard** | Yes | Yes | Partially | Yes | Low | Partially implemented | `backend/src/server.ts` | Update query to group ranks by user/team (showing only best score) and allow filtering by problemStatementId. |
| **Registrations** | Yes | Yes | Yes | Yes | Low | Enforced | `backend/src/server.ts` | Harden security checks to prevent arbitrary user-end role overrides. |
| **Metrics / Logs** | Yes | No | No | None | Low | Static / UI-only | `app/(dashboard)/dashboard/admin/page.tsx` | Connect UI tab to fetch queue metrics and evaluation statistics from backend queue/database. |
| **System Config** | Yes | No | No | None | High | Static / UI-only | `app/(dashboard)/dashboard/admin/page.tsx` | Create `SystemConfig` table in PostgreSQL, add config get/post routes, and hook them up in the frontend. |
| **AST Evaluation Toggle** | Yes | No | No | None | Low | Static / UI-only | `backend/src/engine/evaluator.ts` | Read `enableAstEvaluation` flag from PostgreSQL and skip AST analysis if set to false. |
| **Maintenance Mode** | Yes | No | No | None | High | Static / UI-only | `backend/src/server.ts` | Block all write operations with a `503 Service Unavailable` response for non-admin requests when active. |
| **Registration Toggle** | Yes | No | No | None | High | Static / UI-only | `backend/src/routes/auth.ts` | Reject new registrations if `allowRegistration` is disabled in system config. |
| **Strict Email Verif.** | Yes | No | No | None | Medium | Static / UI-only | `backend/src/routes/auth.ts`, `backend/src/server.ts` | Reject submissions for users whose email verification flag is not true when toggled on. |

---

## 2. Identified Security Vulnerabilities

1. **Role Escalation in Registration API**:
   The `/api/auth/register` POST endpoint accepts a `role` parameter directly from the request body without validation. Any user can register as an `ADMIN` or `SUPER_ADMIN` and obtain full access to administrative control routes.
2. **Missing SSRF Protections on Deployed Url**:
   The Lighthouse runner queries the user-provided `deploymentUrl` without verifying if it points to a private network (like `localhost`, `127.0.0.1`, `::1`, cloud metadata endpoints, or private RFC1918 subnets). A malicious participant could perform Server-Side Request Forgery.
3. **No Command Injection Safety in Git Clone**:
   The evaluator clones repositories using `execFileSync("git", ["clone", "--depth", "1", safeRepoUrl, tempDir])`. Although some basic repository validation exists, if any untrusted branch or repo URL input is interpolated, it could lead to potential injection vectors if not strictly normalized.

---

## 3. Database Schema Changes Required

1. **Add `problemStatementId` to `Submission`**:
   To establish a first-class, locked relationship between the participant's submission track and a specific problem statement.
2. **Create `SystemConfig` Table**:
   ```prisma
   model SystemConfig {
     id                     String   @id @default("global")
     allowRegistration      Boolean  @default(true)
     enableAstEvaluation    Boolean  @default(true)
     maintenanceMode        Boolean  @default(false)
     forceEmailVerification Boolean  @default(false)
     updatedAt              DateTime @updatedAt
   }
   ```
3. **Add `emailVerified` to `User`**:
   To support the strict email verification toggle.

---

## 4. Planned Frontend Enhancements

1. **Email Verification Toggle UI & User verified state**:
   Support user verification in profile and database.
2. **Problem Statement Selection Screen**:
   If a hackathon has multiple problem statements, display a selection screen to lock in their choice before their first submission.
3. **Immutability Displays**:
   Visually indicate that the Repository URL, Deployment URL, and Problem Statement are locked once the first submission attempt is created.
4. **Judging and Admin Statistics**:
   Connect the Virtual Judging Center, Metrics & Logs, and System Config panels to real backend endpoints.
