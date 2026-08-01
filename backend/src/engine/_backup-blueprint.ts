import { prisma } from "../config/db";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const hack = await prisma.hackathon.findFirst({ where: { name: "Frontend Wars 2026" } });
  if (!hack) {
    console.error("Frontend Wars 2026 not found — aborting backup.");
    process.exit(1);
  }
  const bp = await prisma.blueprint.findUnique({ where: { hackathonId: hack.id } });
  if (!bp) {
    console.error("Frontend Wars blueprint not found — aborting backup.");
    process.exit(1);
  }

  const backupDir = path.resolve(process.cwd(), "../backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const file = path.join(backupDir, "frontend-wars-blueprint-pre-phase2.json");
  const snapshot = {
    exportedAt: new Date().toISOString(),
    hackathon: {
      id: hack.id,
      name: hack.name,
      status: hack.status,
      startDate: hack.startDate,
      endDate: hack.endDate,
      submissionEnabled: hack.submissionEnabled,
      leaderboardEnabled: hack.leaderboardEnabled,
    },
    blueprint: bp,
  };
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`Backup written: ${file}`);
  console.log(`Blueprint id: ${bp.id}`);
  console.log(`Problem title: ${(bp.problemStatement as Record<string, unknown>)?.title || (bp.problemStatements as Record<string, unknown>[])?.[0]?.title}`);
}

main().finally(() => prisma.$disconnect());
