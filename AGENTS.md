# AGENTS.md

## Repository layout

- Root: Next.js 15 app (App Router, Turbopack, Tailwind v4, Zustand, React Query). Routes in `app/`, UI in `components/`, features in `features/`.
- `backend/`: standalone Express + Prisma (PostgreSQL) evaluation API, listens on port 4000. Real business logic lives here; most Next.js `app/api/*` routes are thin proxies that forward to `BACKEND_URL || http://localhost:4000` (see `app/api/evaluate/route.ts`).
- `evaluation-engine/`: deterministic audit pipeline (9 plugins in `plugins/`, score-engine, report-generator). Note: `orchestrator.ts` imports `../backend/src/engine/evaluator` across package boundaries — changes there affect both.

## Commands

- Frontend: `npm run dev`, `npm run build`, `npm start`, `npm run lint`
- Backend (`backend/`): `npm run dev` (ts-node), `npm run build` (prisma generate && tsc + writes `dist/server.js` shim), `npm start`
- Evaluation engine (`evaluation-engine/`): `npm run build` (tsc), `npm test` (runs `evaluator.ts` CLI pipeline; requires working playwright/lighthouse tooling)

## Gotchas

- `next.config.ts` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to `true` — `npm run build` does NOT validate TS/ESLint. Run `npm run lint` (and `npx tsc --noEmit` for typecheck) manually.
- Auth is custom JWT + cookie: root `middleware.ts` guards `/dashboard`, `/register`, `/profile` by checking cookie `fa_session_active`; tokens verified in `backend/src/middleware/auth.ts`. `@clerk/nextjs` is installed but unused (only referenced as a detection heuristic in the intelligence engine).
- `backend/src/engine/redis-queue.system.ts` (`RealRedisBullQueue`) is NOT Redis/BullMQ despite the name — an in-memory EventEmitter queue.
- DB is PostgreSQL via Prisma (`backend/prisma/schema.prisma`); requires `backend/.env` with `DATABASE_URL` (default `postgresql://postgres:postgres@localhost:5432/frontendarena`). Run `prisma generate` after schema changes (part of backend build).
- Env files: `backend/.env` (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAILS), root `.env.local` (NEXT_PUBLIC_GOOGLE_CLIENT_ID). Both are gitignored.
- No frontend test framework and no CI configured. Backend has ad-hoc tests in `backend/src/engine/*.test.ts` run manually via ts-node.

## Verification workflow

For frontend changes: `npm run lint` then `npx tsc --noEmit`. For backend changes: build with `npm run build` (also regenerates Prisma client) before `npm start`.
