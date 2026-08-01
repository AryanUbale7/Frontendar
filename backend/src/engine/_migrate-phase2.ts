import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";
import { resolveLifecycleStatus, lifecycleToPersisted } from "./lifecycle";

async function main() {
  // 1. Hackathons: derive published/archived from legacy status strings
  const hacks = await prisma.hackathon.findMany();
  for (const h of hacks) {
    const published = ["upcoming", "live", "active", "completed"].includes(h.status);
    const archived = h.status === "archived";
    const data: Record<string, boolean | Date> = { published, archived };
    if (published && !h.publishedAt) {
      data.publishedAt = h.createdAt;
    }
    if (h.id.includes("hack_1785555920967")) {
      // Frontend Wars 2026 (flagship demo): restore an ACTIVE window so the
      // product lifecycle and Phase 1 e2e evaluation flow work end-to-end.
      data.startDate = new Date("2026-01-01T00:00:00Z");
      data.endDate = new Date("2026-12-31T23:59:59Z");
    }
    const updated = await prisma.hackathon.update({ where: { id: h.id }, data });
    const derived = resolveLifecycleStatus(updated);
    await prisma.hackathon.update({
      where: { id: h.id },
      data: { status: lifecycleToPersisted(derived) },
    });
    console.log(`[Hackathon] ${h.name}: published=${published} archived=${archived} lifecycle=${derived} (stored ${lifecycleToPersisted(derived)})`);
  }

  // 2. Blueprints: existing rows are the currently-effective blueprints → mark published + snapshot v1
  const blueprints = await prisma.blueprint.findMany();
  for (const bp of blueprints) {
    const existingVersion = await prisma.blueprintVersion.findFirst({
      where: { blueprintId: bp.id },
      orderBy: { version: "desc" },
    });
    if (!existingVersion) {
      await prisma.blueprintVersion.create({
        data: {
          blueprintId: bp.id,
          hackathonId: bp.hackathonId,
          version: 1,
          payload: bp as unknown as Prisma.InputJsonValue,
          publishedAt: bp.createdAt,
        },
      });
    }
    await prisma.blueprint.update({
      where: { id: bp.id },
      data: { status: "published", version: existingVersion ? existingVersion.version + 1 : 1, publishedAt: bp.publishedAt || bp.createdAt, updatedAt: new Date() },
    });
    console.log(`[Blueprint] ${bp.id} (hack ${bp.hackathonId}): status=published version=${existingVersion ? existingVersion.version + 1 : 1}`);
  }

  console.log("Data migration complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
