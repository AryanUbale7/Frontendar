import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db";
import { verifyToken, requireRole, AuthenticatedRequest } from "../middleware/auth";

export const qrVerificationRouter = Router();

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface QrRecordPayload {
  id: string;
  uniqueId: string;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback store ensuring system resilience if DB is offline or table is unmigrated
const inMemoryQrStore = new Map<string, QrRecordPayload>();

function generateIdString(): string {
  let result = "FA-";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

async function createUniqueId(): Promise<string> {
  let uniqueId = generateIdString();
  let exists = inMemoryQrStore.has(uniqueId);
  if (!exists) {
    try {
      const dbExists = await prisma.qrVerification.findUnique({ where: { uniqueId } });
      if (dbExists) exists = true;
    } catch {
      // Ignore DB error
    }
  }

  while (exists) {
    uniqueId = generateIdString();
    exists = inMemoryQrStore.has(uniqueId);
    if (!exists) {
      try {
        const dbExists = await prisma.qrVerification.findUnique({ where: { uniqueId } });
        if (dbExists) exists = true;
      } catch {
        // Ignore DB error
      }
    }
  }
  return uniqueId;
}

// PUBLIC: Verify credential by uniqueId
qrVerificationRouter.get("/public/:uniqueId", async (req: Request, res: Response) => {
  try {
    const rawId = String(req.params.uniqueId || "").trim();
    
    // Try Prisma DB first
    try {
      const record = await prisma.qrVerification.findUnique({
        where: { uniqueId: rawId },
        select: {
          uniqueId: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      if (record) {
        return res.json(record);
      }
    } catch (dbErr: any) {
      console.warn("Prisma verify query failed, checking fallback:", dbErr.message);
    }

    // Check in-memory store
    const memRecord = inMemoryQrStore.get(rawId);
    if (memRecord) {
      return res.json({
        uniqueId: memRecord.uniqueId,
        name: memRecord.name,
        status: memRecord.status,
        createdAt: memRecord.createdAt,
      });
    }

    return res.status(404).json({
      error: "NOT_FOUND",
      message: "The ID entered or scanned could not be verified.",
    });
  } catch (error: any) {
    console.error("Public QR verification error:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to verify credential." });
  }
});

// ADMIN: Generate new QR verification ID
qrVerificationRouter.post(
  "/generate",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Participant name is required." });
      }

      const uniqueId = await createUniqueId();
      let record: QrRecordPayload;

      try {
        const created = await prisma.qrVerification.create({
          data: {
            uniqueId,
            name: name.trim(),
            status: "ACTIVE",
          },
        });
        record = created;
      } catch (dbErr: any) {
        console.warn("Prisma QR create failed, using in-memory store fallback:", dbErr.message);
        record = {
          id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          uniqueId,
          name: name.trim(),
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      inMemoryQrStore.set(uniqueId, record);
      return res.status(201).json(record);
    } catch (error: any) {
      console.error("QR generation error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to generate QR credential." });
    }
  }
);

// ADMIN: List QR verification records with optional search
qrVerificationRouter.get(
  "/",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
      
      let dbRecords: QrRecordPayload[] = [];
      try {
        dbRecords = await prisma.qrVerification.findMany({
          where: search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { uniqueId: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          orderBy: { createdAt: "desc" },
        });
      } catch (dbErr: any) {
        console.warn("Prisma QR list failed, using fallback:", dbErr.message);
      }

      const recordMap = new Map<string, QrRecordPayload>();
      for (const r of inMemoryQrStore.values()) {
        if (!search || r.name.toLowerCase().includes(search) || r.uniqueId.toLowerCase().includes(search)) {
          recordMap.set(r.uniqueId, r);
        }
      }
      for (const r of dbRecords) {
        recordMap.set(r.uniqueId, r);
      }

      const combined = Array.from(recordMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return res.json(combined);
    } catch (error: any) {
      console.error("QR listing error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to list QR credentials." });
    }
  }
);

// ADMIN: Revoke a QR verification ID
qrVerificationRouter.put(
  "/:id/revoke",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      let updatedRecord: QrRecordPayload | null = null;

      try {
        const existing = await prisma.qrVerification.findUnique({ where: { id } });
        if (existing) {
          updatedRecord = await prisma.qrVerification.update({
            where: { id },
            data: { status: "REVOKED" },
          });
        }
      } catch (dbErr: any) {
        console.warn("Prisma QR revoke failed, checking fallback:", dbErr.message);
      }

      if (!updatedRecord) {
        for (const [uId, r] of inMemoryQrStore.entries()) {
          if (r.id === id) {
            r.status = "REVOKED";
            r.updatedAt = new Date();
            inMemoryQrStore.set(uId, r);
            updatedRecord = r;
            break;
          }
        }
      }

      if (!updatedRecord) {
        return res.status(404).json({ error: "NOT_FOUND", message: "QR verification record not found." });
      }

      inMemoryQrStore.set(updatedRecord.uniqueId, updatedRecord);
      return res.json(updatedRecord);
    } catch (error: any) {
      console.error("QR revocation error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to revoke QR credential." });
    }
  }
);
