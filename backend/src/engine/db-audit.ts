import { prisma } from "../config/db";

async function runAudit() {
  console.log("=========================================================");
  console.log("PHASE 1 — DATABASE RELATIONSHIP AUDIT");
  console.log("=========================================================");

  try {
    // 1. Fetch all hackathons
    const hackathons = await prisma.hackathon.findMany();
    if (hackathons.length === 0) {
      console.log("No hackathons found in database.");
      return;
    }

    for (const h of hackathons) {
      console.log(`\nHackathon Name: ${h.name}`);
      console.log(`Hackathon ID: ${h.id}`);
      console.log(`Hackathon Status: ${h.status}`);
      console.log(`Lifecycle Start: ${h.eventStart ? h.eventStart.toISOString() : "N/A"}`);
      console.log(`Lifecycle Close: ${h.eventClose ? h.eventClose.toISOString() : "N/A"}`);
      console.log(`Registration Start: ${h.registrationStart ? h.registrationStart.toISOString() : "N/A"}`);
      console.log(`Registration Close: ${h.registrationClose ? h.registrationClose.toISOString() : "N/A"}`);

      // 2. Fetch blueprint
      const bp = await prisma.blueprint.findUnique({ where: { hackathonId: h.id } });
      console.log(`Published Blueprint ID: ${bp ? bp.id : "None"}`);
      
      let bpVersion = "None";
      let problemTitle = "None";
      if (bp) {
        const bpJson = bp as any;
        bpVersion = bpJson.version || bpJson.problemStatement?.version || "1";
        problemTitle = bpJson.problemStatement?.title || "N/A";
      }
      console.log(`Blueprint Version: ${bpVersion}`);
      console.log(`Problem Statement: ${problemTitle}`);
      
      const rounds = h.rounds ? (h.rounds as any[]) : [];
      console.log(`Round IDs: ${rounds.map((r: any) => r.name || r.id).join(", ") || "None"}`);

      // 3. Submissions
      const submissions = await prisma.submission.findMany({ where: { hackathonId: h.id } });
      console.log(`Submission Count: ${submissions.length}`);
      console.log(`Queued Evaluations: ${submissions.filter(s => s.status === "QUEUED").length}`);
      console.log(`Processing/Evaluating: ${submissions.filter(s => s.status === "EVALUATING" || s.status === "PROCESSING").length}`);
      console.log(`Completed Evaluations: ${submissions.filter(s => s.status === "COMPLETED").length}`);
      console.log(`Failed Evaluations: ${submissions.filter(s => s.status === "FAILED").length}`);
      
      // Leaderboard eligible
      const eligible = submissions.filter(s => s.status === "COMPLETED" && s.score !== null);
      console.log(`Leaderboard Eligible Submissions: ${eligible.length}`);
    }
  } catch (err: any) {
    console.error("Audit failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
