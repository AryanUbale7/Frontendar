import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";
import { resolveLifecycleStatus, lifecycleToPersisted, canAcceptSubmissions, canAcceptRegistrations } from "./lifecycle";
import { hashPassword } from "./password";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

const BASE = "http://localhost:4000";
const ts = Date.now();

interface LbEntry {
  submissionId: string;
  rank: number;
}

function snapshotTitle(payload: Prisma.JsonValue): string {
  const obj = payload as Record<string, unknown>;
  const ps = obj?.problemStatement as Record<string, unknown> | undefined;
  return typeof ps?.title === "string" ? ps.title : "";
}

async function serverAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  const data = await res.json();
  return data.accessToken;
}

async function runTests() {
  console.log("=========================================================");
  console.log("PHASE 2 — LIFECYCLE, BLUEPRINT PUBLISH & LEADERBOARD TESTS");
  console.log("=========================================================");

  const hackAId = `p2_hack_a_${ts}`;
  const hackBId = `p2_hack_b_${ts}`;
  const hackDraftId = `p2_hack_draft_${ts}`;
  const hackDraftGateId = `p2_hack_draft_gate_${ts}`;
  const hackUpcomingId = `p2_hack_upcoming_${ts}`;
  const hackCompletedId = `p2_hack_completed_${ts}`;

  const adminUserId = `p2_admin_${ts}`;
  const participantId = `p2_participant_${ts}`;
  const participant2Id = `p2_participant2_${ts}`;

  const createdHackIds: string[] = [];
  const createdUserIds: string[] = [];
  let failed = false;

  try {
    // ------------------------------------------------------------------
    // PART A — Lifecycle model (pure resolver + DB persistence)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 1-4: Lifecycle resolver ---");

    const draftHack = await prisma.hackathon.create({
      data: {
        id: hackDraftId,
        name: "P2 Draft Hackathon",
        description: "test",
        status: "draft",
        published: false,
        archived: false,
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackDraftId);
    assert(resolveLifecycleStatus(draftHack) === "DRAFT", "TEST 1: Unpublished hackathon resolves to DRAFT");
    assert(lifecycleToPersisted(resolveLifecycleStatus(draftHack)) === "draft", "TEST 1b: DRAFT persists as 'draft' status string");

    const upcomingHack = await prisma.hackathon.create({
      data: {
        id: hackUpcomingId,
        name: "P2 Upcoming Hackathon",
        description: "test",
        published: true,
        archived: false,
        startDate: new Date(Date.now() + 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 48 * 3600 * 1000),
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackUpcomingId);
    assert(resolveLifecycleStatus(upcomingHack) === "UPCOMING", "TEST 2: Published hackathon with future startDate resolves to UPCOMING");

    const activeHack = await prisma.hackathon.create({
      data: {
        id: hackAId,
        name: "P2 Active Hackathon",
        description: "test",
        published: true,
        archived: false,
        startDate: new Date(Date.now() - 3600 * 1000),
        endDate: new Date(Date.now() + 24 * 3600 * 1000),
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackAId);
    assert(resolveLifecycleStatus(activeHack) === "ACTIVE", "TEST 3: Published hackathon inside window resolves to ACTIVE");
    assert(canAcceptSubmissions(activeHack) === true, "TEST 3b: ACTIVE hackathon accepts submissions");

    const completedHack = await prisma.hackathon.create({
      data: {
        id: hackCompletedId,
        name: "P2 Completed Hackathon",
        description: "test",
        published: true,
        archived: false,
        startDate: new Date(Date.now() - 48 * 3600 * 1000),
        endDate: new Date(Date.now() - 24 * 3600 * 1000),
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackCompletedId);
    assert(resolveLifecycleStatus(completedHack) === "COMPLETED", "TEST 4: Past hackathon resolves to COMPLETED");
    assert(canAcceptSubmissions(completedHack) === false, "TEST 4b: COMPLETED hackathon rejects submissions");

    const activeB = await prisma.hackathon.create({
      data: {
        id: hackBId,
        name: "P2 Active Hackathon B (no blueprint)",
        description: "test",
        published: true,
        archived: false,
        startDate: new Date(Date.now() - 3600 * 1000),
        endDate: new Date(Date.now() + 24 * 3600 * 1000),
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackBId);
    assert(resolveLifecycleStatus(activeB) === "ACTIVE", "TEST 4g: Second active hackathon (no blueprint) is ACTIVE");

    const draftGateHack = await prisma.hackathon.create({
      data: {
        id: hackDraftGateId,
        name: "P2 Draft Gate Hackathon",
        description: "test",
        published: false,
        archived: false,
        rounds: [], testCases: [], rules: [], resources: [],
      },
    });
    createdHackIds.push(hackDraftGateId);
    assert(resolveLifecycleStatus(draftGateHack) === "DRAFT", "TEST 4h: Dedicated draft gate hackathon is DRAFT");

    const archivedHack = await prisma.hackathon.update({
      where: { id: hackDraftId },
      data: { published: true, archived: true },
    });
    assert(resolveLifecycleStatus(archivedHack) === "ARCHIVED", "TEST 4c: Archived hackathon resolves to ARCHIVED");

    // Registration gate
    assert(canAcceptRegistrations(upcomingHack) === true, "TEST 4d: UPCOMING hackathon accepts registrations");
    assert(canAcceptRegistrations(completedHack) === false, "TEST 4e: COMPLETED hackathon rejects registrations");
    assert(canAcceptRegistrations(draftHack) === false, "TEST 4f: DRAFT hackathon rejects registrations");

    const httpAvailable = await serverAvailable();
    if (!httpAvailable) {
      console.log("\n[SKIP] HTTP tests (TEST 5-16) not run: backend server not reachable on " + BASE);
      console.log("       Start the backend (npm start) and re-run this test for full coverage.");
      process.exit(0);
    }

    // ------------------------------------------------------------------
    // Setup users + tokens
    // ------------------------------------------------------------------
    await prisma.user.create({
      data: { id: adminUserId, email: `p2_admin_${ts}@test.dev`, password: hashPassword("admin123"), role: "ADMIN", firstName: "P2", lastName: "Admin" },
    });
    createdUserIds.push(adminUserId);
    await prisma.user.create({
      data: { id: participantId, email: `p2_participant_${ts}@test.dev`, password: hashPassword("participant123"), role: "PARTICIPANT", firstName: "P2", lastName: "Dev" },
    });
    createdUserIds.push(participantId);
    await prisma.user.create({
      data: { id: participant2Id, email: `p2_participant2_${ts}@test.dev`, password: hashPassword("participant123"), role: "PARTICIPANT", firstName: "P2", lastName: "Dev2" },
    });
    createdUserIds.push(participant2Id);

    const adminToken = await login(`p2_admin_${ts}@test.dev`, "admin123");
    const participantToken = await login(`p2_participant_${ts}@test.dev`, "participant123");
    assert(adminToken && adminToken.length > 20, "Admin login token obtained");
    assert(participantToken && participantToken.length > 20, "Participant login token obtained");

    const authHeaders = (token: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });

    // ------------------------------------------------------------------
    // TEST 7-9: Blueprint API authentication
    // ------------------------------------------------------------------
    console.log("\n--- TEST 7-9: Blueprint API security ---");

    const testBlueprint = {
      problemStatement: { title: "P2 Test Problem", description: "P2 draft" },
      problemStatements: [{ title: "P2 Test Problem", description: "P2 draft" }],
      requiredFeatures: [],
      techStackRules: { allowed: ["React"], preferred: [], restricted: [] },
      submissionRequirements: { githubRepo: true },
      codeQualityRules: { folders: 25, comments: 25 },
      performanceRules: { lighthouseMin: 70, accessibilityMin: 60, seoMin: 70, bestPracticesMin: 70, performanceWeight: 15 },
      securityRules: { secretsDetection: true },
      scoringSystem: { categories: [{ name: "Problem Alignment", maxMarks: 100, weight: 100, passingMarks: 50 }] },
      autoPassFailRules: [],
      bonusRules: [],
    };

    const unauthRes = await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hackathonId: hackAId, blueprint: testBlueprint }),
    });
    assert(unauthRes.status === 401, "TEST 7: Unauthenticated blueprint mutation returns 401");

    const participantRes = await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({ hackathonId: hackAId, blueprint: testBlueprint }),
    });
    assert(participantRes.status === 403, "TEST 8: Participant blueprint mutation returns 403");

    const adminRes = await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ hackathonId: hackAId, action: "draft", blueprint: testBlueprint }),
    });
    assert(adminRes.status === 200, "TEST 9: Admin blueprint mutation returns 200");
    const adminSave = await adminRes.json();
    assert(adminSave.status === "draft" && adminSave.blueprintId, "TEST 9b: Server persisted the blueprint as DRAFT");

    // Drafts are never exposed publicly
    const publicGet = await fetch(`${BASE}/api/blueprints/${hackAId}`);
    assert(publicGet.status === 404, "TEST 9c: Public GET does not expose unpublished drafts (404)");
    const adminGetDraft = await fetch(`${BASE}/api/blueprints/${hackAId}?includeDraft=true`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert(adminGetDraft.status === 200, "TEST 9d: Admin GET with includeDraft returns the draft");
    const draftJson = await adminGetDraft.json();
    assert(draftJson.status === "draft" && draftJson.problemStatement.title === "P2 Test Problem", "TEST 9e: Draft content persisted server-side");

    // ------------------------------------------------------------------
    // TEST 5-6: Draft / Publish persistence
    // ------------------------------------------------------------------
    console.log("\n--- TEST 5-6: Blueprint draft & publish persistence ---");

    const draftAgain = await fetch(`${BASE}/api/blueprints/${hackAId}?includeDraft=true`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const draftAgainJson = await draftAgain.json();
    assert(draftAgainJson.status === "draft" && draftAgainJson.problemStatement.title === "P2 Test Problem", "TEST 5: Blueprint draft persists across re-fetch (refresh-safe)");

    const publishRes = await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ hackathonId: hackAId, action: "publish", blueprint: testBlueprint }),
    });
    assert(publishRes.status === 200, "TEST 6: Publish blueprint returns 200");
    const publishJson = await publishRes.json();
    assert(publishJson.status === "published" && publishJson.version === 1, `TEST 6b: First publish is version 1 (got v${publishJson.version})`);
    assert(publishJson.publishedAt !== null, "TEST 6c: publishedAt recorded");

    // Second publish after a draft edit → version 2 + history snapshot
    const editV2 = { ...testBlueprint, problemStatement: { title: "P2 Published v2", description: "v2" }, problemStatements: [{ title: "P2 Published v2", description: "v2" }] };
    await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ hackathonId: hackAId, action: "draft", blueprint: editV2 }),
    });
    const publish2Res = await fetch(`${BASE}/api/blueprints`, {
      method: "POST",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ hackathonId: hackAId, action: "publish", blueprint: editV2 }),
    });
    assert(publish2Res.status === 200, "TEST 6f: Second publish returns 200");
    const publish2Json = await publish2Res.json();
    assert(publish2Json.version === 2, `TEST 6g: Second publish is version 2 (got v${publish2Json.version})`);

    const publishedGet = await fetch(`${BASE}/api/blueprints/${hackAId}`);
    assert(publishedGet.status === 200, "TEST 6d: Public GET now returns the published blueprint");
    const publishedJson = await publishedGet.json();
    assert(publishedJson.status === "published" && publishedJson.problemStatement.title === "P2 Published v2", "TEST 6e: Published state + latest content persists on re-fetch");

    const versionHistory = await prisma.blueprintVersion.findMany({
      where: { hackathonId: hackAId },
      orderBy: { version: "asc" },
    });
    assert(versionHistory.length === 2, `TEST 6h: BlueprintVersion snapshot recorded per publish (got ${versionHistory.length})`);
    assert(versionHistory.some((v) => v.version === 1 && snapshotTitle(v.payload) === "P2 Test Problem"), "TEST 6i: v1 snapshot preserves first published content");
    assert(versionHistory.some((v) => v.version === 2 && snapshotTitle(v.payload) === "P2 Published v2"), "TEST 6j: v2 snapshot preserves second published content");

    // ------------------------------------------------------------------
    // TEST 10: Evaluation → published blueprint binding
    // ------------------------------------------------------------------
    console.log("\n--- TEST 10: Evaluation resolves the hackathon's published blueprint ---");

    const noPublishedBpRes = await fetch(`${BASE}/api/evaluate`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({
        repoUrl: "https://github.com/p2-norepo-xyz/binding-test",
        hackathonId: hackBId,
        userId: participantId,
      }),
    });
    assert(noPublishedBpRes.status === 400, "TEST 10a: Evaluate without published blueprint is rejected (400, no fallback)");

    const bindingRes = await fetch(`${BASE}/api/evaluate`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({
        repoUrl: "https://github.com/p2-norepo-xyz/binding-test",
        hackathonId: hackAId,
        userId: participantId,
        projectName: "P2 Binding Test",
        blueprint: { problemStatement: { title: "EVIL CLIENT BLUEPRINT" } },
      }),
    });
    assert(bindingRes.status === 202, "TEST 10b: Evaluate against active hackathon returns 202");
    const bindingJson = await bindingRes.json();

    const boundSub = await prisma.submission.findUnique({ where: { id: bindingJson.submissionId } });
    const publishedBpRow = await prisma.blueprint.findUnique({ where: { hackathonId: hackAId } });
    assert(boundSub !== null, "TEST 10c: Submission persisted");
    assert(boundSub!.blueprintId === publishedBpRow!.id, "TEST 10d: Submission bound to the hackathon's published blueprint (client blueprint ignored)");
    assert(boundSub!.blueprintVersion === publishedBpRow!.version, "TEST 10e: Submission records the blueprint version");
    assert(boundSub!.repoUrl === "https://github.com/p2-norepo-xyz/binding-test", "TEST 10f: Submission repo URL persisted");

    // ------------------------------------------------------------------
    // TEST 15-16: Lifecycle gates on submission endpoint
    // ------------------------------------------------------------------
    console.log("\n--- TEST 15-16: Lifecycle enforcement on submissions ---");

    const draftGateRes = await fetch(`${BASE}/api/evaluate`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({ repoUrl: "https://github.com/p2-norepo-xyz/x", hackathonId: hackDraftGateId, userId: participantId }),
    });
    assert(draftGateRes.status === 409, "TEST 15: Draft hackathon rejects submission (409)");

    const completedGateRes = await fetch(`${BASE}/api/evaluate`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({ repoUrl: "https://github.com/p2-norepo-xyz/x", hackathonId: hackCompletedId, userId: participantId }),
    });
    assert(completedGateRes.status === 409, "TEST 16: Completed hackathon rejects new submission (409)");

    const upcomingGateRes = await fetch(`${BASE}/api/evaluate`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({ repoUrl: "https://github.com/p2-norepo-xyz/x", hackathonId: hackUpcomingId, userId: participantId }),
    });
    assert(upcomingGateRes.status === 409, "TEST 16b: Upcoming hackathon rejects submission (409)");

    // Registration gate on draft via HTTP
    const regGateRes = await fetch(`${BASE}/api/registrations`, {
      method: "POST",
      headers: authHeaders(participantToken),
      body: JSON.stringify({ hackathonId: hackDraftGateId, userId: participantId }),
    });
    assert(regGateRes.status === 409, "TEST 16c: Draft hackathon rejects registration (409)");

    // ------------------------------------------------------------------
    // TEST 11-14: Leaderboard data flow, ranking, ties, isolation
    // ------------------------------------------------------------------
    console.log("\n--- TEST 11-14: Leaderboard pipeline ---");

    const subs: Prisma.SubmissionCreateManyInput[] = [
      {
        id: `sub_p2_${ts}_a`,
        hackathonId: hackAId,
        userId: participantId,
        repoUrl: "https://github.com/p2/a",
        projectName: "P2 Project A",
        status: "COMPLETED",
        score: 80,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 3000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
      {
        id: `sub_p2_${ts}_b`,
        hackathonId: hackAId,
        userId: participant2Id,
        repoUrl: "https://github.com/p2/b",
        projectName: "P2 Project B",
        status: "COMPLETED",
        score: 90,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 2000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
      {
        id: `sub_p2_${ts}_tie1`,
        hackathonId: hackAId,
        userId: participantId,
        repoUrl: "https://github.com/p2/tie1",
        projectName: "P2 Tie 1",
        status: "COMPLETED",
        score: 88,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 5000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
      {
        id: `sub_p2_${ts}_tie2`,
        hackathonId: hackAId,
        userId: participant2Id,
        repoUrl: "https://github.com/p2/tie2",
        projectName: "P2 Tie 2",
        status: "COMPLETED",
        score: 88,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 4000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
      {
        id: `sub_p2_${ts}_tie3`,
        hackathonId: hackAId,
        userId: participantId,
        repoUrl: "https://github.com/p2/tie3",
        projectName: "P2 Tie 3 (id tiebreak)",
        status: "COMPLETED",
        score: 77,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 4000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
      {
        id: `sub_p2_${ts}_tie4`,
        hackathonId: hackAId,
        userId: participant2Id,
        repoUrl: "https://github.com/p2/tie4",
        projectName: "P2 Tie 4 (id tiebreak)",
        status: "COMPLETED",
        score: 77,
        grade: "PASSED",
        completedAt: new Date(Date.now() - 4000),
        blueprintId: publishedBpRow!.id,
        blueprintVersion: publishedBpRow!.version,
        features: [], techStack: {}, teamContributions: [],
      },
    ];
    await prisma.submission.createMany({ data: subs });

    const leaderboardRes = await fetch(`${BASE}/api/hackathons/${hackAId}/leaderboard`);
    assert(leaderboardRes.status === 200, "TEST 11: Leaderboard API returns 200");
    const lb = (await leaderboardRes.json()).leaderboard as LbEntry[];

    assert(lb.some((l) => l.submissionId === `sub_p2_${ts}_b`), "TEST 11b: Completed evaluation appears on the leaderboard without manual DB edits");

    const rankB = lb.find((l) => l.submissionId === `sub_p2_${ts}_b`)!.rank;
    const rankA = lb.find((l) => l.submissionId === `sub_p2_${ts}_a`)!.rank;
    assert(rankB === 1 && rankA > 1, "TEST 12: Two participants ranked correctly (90 first, 80 later)");

    const tie1Idx = lb.findIndex((l) => l.submissionId === `sub_p2_${ts}_tie1`);
    const tie2Idx = lb.findIndex((l) => l.submissionId === `sub_p2_${ts}_tie2`);
    assert(tie1Idx !== -1 && tie2Idx !== -1 && tie1Idx < tie2Idx, "TEST 13: Tie scores ordered by completion time ASC (earlier completion ranks first)");

    const tie3Idx = lb.findIndex((l) => l.submissionId === `sub_p2_${ts}_tie3`);
    const tie4Idx = lb.findIndex((l) => l.submissionId === `sub_p2_${ts}_tie4`);
    assert(
      tie3Idx !== -1 && tie4Idx !== -1 &&
      ((`sub_p2_${ts}_tie3` < `sub_p2_${ts}_tie4` && tie3Idx < tie4Idx) || (`sub_p2_${ts}_tie3` > `sub_p2_${ts}_tie4` && tie3Idx > tie4Idx)),
      "TEST 13b: Equal score + equal completion time ordered by stable submission ID"
    );

    const lbB = (await (await fetch(`${BASE}/api/hackathons/${hackBId}/leaderboard`)).json()).leaderboard as LbEntry[];
    assert(!lbB.some((l) => l.submissionId?.startsWith(`sub_p2_${ts}_`)), "TEST 14: Hackathon A submissions never appear in Hackathon B leaderboard");

    // Public visibility: draft hidden from public list, visible to admin
    interface PublicHack { id: string; lifecycle?: string }
    const publicHacks = await (await fetch(`${BASE}/api/hackathons`)).json() as PublicHack[];
    assert(Array.isArray(publicHacks) && !publicHacks.some((h) => h.id === hackDraftGateId), "TEST 15b: Draft hackathon is not publicly visible");
    assert(Array.isArray(publicHacks) && publicHacks.some((h) => h.id === hackAId && h.lifecycle === "ACTIVE"), "TEST 15c: Active hackathon publicly visible with backend lifecycle ACTIVE");
    const adminHacks = await (await fetch(`${BASE}/api/hackathons`, { headers: { Authorization: `Bearer ${adminToken}` } })).json() as PublicHack[];
    assert(Array.isArray(adminHacks) && adminHacks.some((h) => h.id === hackDraftGateId), "TEST 15d: Admin sees draft hackathons");

    console.log("\n=========================================================");
    console.log("PHASE 2 INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=========================================================");
  } catch (err: unknown) {
    failed = true;
    console.error("\n[FAIL] Phase 2 test suite failed:", err instanceof Error ? err.message : String(err));
  } finally {
    console.log("\nCleaning up Phase 2 test data...");
    const subIds = await prisma.submission.findMany({ where: { hackathonId: { in: createdHackIds } }, select: { id: true } });
    await prisma.evaluationReport.deleteMany({ where: { submissionId: { in: subIds.map((s) => s.id) } } }).catch(() => {});
    await prisma.submission.deleteMany({ where: { hackathonId: { in: createdHackIds } } }).catch(() => {});
    await prisma.blueprintVersion.deleteMany({ where: { hackathonId: { in: createdHackIds } } }).catch(() => {});
    await prisma.blueprint.deleteMany({ where: { hackathonId: { in: createdHackIds } } }).catch(() => {});
    await prisma.registration.deleteMany({ where: { hackathonId: { in: createdHackIds } } }).catch(() => {});
    await prisma.hackathon.deleteMany({ where: { id: { in: createdHackIds } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
    await prisma.$disconnect();
    if (failed) {
      process.exit(1);
    }
  }
}

runTests();
