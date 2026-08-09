import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db";
import { verifyToken, requireRole, AuthenticatedRequest } from "../middleware/auth";

export const qrVerificationRouter = Router();

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
  let exists = await prisma.qrVerification.findUnique({ where: { uniqueId } });
  while (exists) {
    uniqueId = generateIdString();
    exists = await prisma.qrVerification.findUnique({ where: { uniqueId } });
  }
  return uniqueId;
}

// PUBLIC: Verify credential by uniqueId
qrVerificationRouter.get("/public/:uniqueId", async (req: Request, res: Response) => {
  try {
    const { uniqueId } = req.params;
    const record = await prisma.qrVerification.findUnique({
      where: { uniqueId: String(uniqueId).trim() },
      select: {
        uniqueId: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    if (!record) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "The ID entered or scanned could not be verified.",
      });
    }

    return res.json(record);
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
      const record = await prisma.qrVerification.create({
        data: {
          uniqueId,
          name: name.trim(),
          status: "ACTIVE",
        },
      });

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
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      
      const records = await prisma.qrVerification.findMany({
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

      return res.json(records);
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
      const existing = await prisma.qrVerification.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "NOT_FOUND", message: "QR verification record not found." });
      }

      const updated = await prisma.qrVerification.update({
        where: { id },
        data: { status: "REVOKED" },
      });

      return res.json(updated);
    } catch (error: any) {
      console.error("QR revocation error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to revoke QR credential." });
    }
  }
);
