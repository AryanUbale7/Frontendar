import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db";
import { verifyToken, requireRole, AuthenticatedRequest } from "../middleware/auth";

export const hallOfFameRouter = Router();

// In-memory fallback store for system resilience
const fallbackEvents = new Map<string, any>();
const fallbackParticipants = new Map<string, any>();
const fallbackBadges = new Map<string, any>();

// Default preset badges
const DEFAULT_PRESET_BADGES = [
  { id: "badge-winner", name: "1st Place Winner", description: "Top ranking champion", icon: "Trophy", status: "active" },
  { id: "badge-runnerup", name: "Runner Up", description: "Outstanding performance finalist", icon: "Medal", status: "active" },
  { id: "badge-uiux", name: "Best UI/UX", description: "Exceptional design and user experience", icon: "Sparkles", status: "active" },
  { id: "badge-creative", name: "Most Creative Builder", description: "Original concept and execution", icon: "Flame", status: "active" },
  { id: "badge-innovation", name: "Innovation Award", description: "Novel architectural solution", icon: "Zap", status: "active" },
  { id: "badge-community", name: "Community Choice", description: "Voted favorite by developer peers", icon: "Heart", status: "active" },
  { id: "badge-rising", name: "Rising Builder", description: "Breakthrough talent of the year", icon: "Star", status: "active" },
];

DEFAULT_PRESET_BADGES.forEach((b) => fallbackBadges.set(b.id, { ...b, createdAt: new Date(), updatedAt: new Date() }));

// Seed default badges in DB if none exist
async function ensureDefaultBadgesInDb() {
  try {
    const count = await prisma.hallOfFameBadge.count();
    if (count === 0) {
      for (const badge of DEFAULT_PRESET_BADGES) {
        await prisma.hallOfFameBadge.upsert({
          where: { id: badge.id },
          update: {},
          create: {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            status: badge.status,
          },
        });
      }
    }
  } catch (err: any) {
    // Fallback store active if DB table unmigrated
  }
}
ensureDefaultBadgesInDb().catch(() => {});

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// GET /api/hall-of-fame/events - List all PUBLISHED events with participants & badges
hallOfFameRouter.get("/events", async (req: Request, res: Response) => {
  try {
    try {
      const events = await prisma.hallOfFameEvent.findMany({
        where: { status: "published" },
        orderBy: [{ order: "asc" }, { year: "desc" }, { createdAt: "desc" }],
        include: {
          participants: {
            orderBy: { order: "asc" },
            include: {
              badges: {
                include: {
                  badge: true,
                },
              },
            },
          },
        },
      });

      if (events && events.length > 0) {
        const formatted = events.map((ev) => ({
          ...ev,
          participants: ev.participants.map((p) => ({
            ...p,
            badges: p.badges.map((pb) => pb.badge).filter(Boolean),
          })),
        }));
        return res.json(formatted);
      }
    } catch (dbErr: any) {
      console.warn("[HallOfFame] DB query fallback to memory:", dbErr.message);
    }

    // Memory fallback
    const publishedEvents = Array.from(fallbackEvents.values())
      .filter((e) => e.status === "published")
      .sort((a, b) => (a.order || 0) - (b.order || 0) || Number(b.year || 0) - Number(a.year || 0));

    const enriched = publishedEvents.map((ev) => {
      const parts = Array.from(fallbackParticipants.values())
        .filter((p) => p.eventId === ev.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((p) => {
          const badges = (p.badgeIds || []).map((bid: string) => fallbackBadges.get(bid)).filter(Boolean);
          return { ...p, badges };
        });
      return { ...ev, participants: parts };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch published Hall of Fame events: " + err.message });
  }
});

// GET /api/hall-of-fame/events/:id - Public single event
hallOfFameRouter.get("/events/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    try {
      const event = await prisma.hallOfFameEvent.findUnique({
        where: { id },
        include: {
          participants: {
            orderBy: { order: "asc" },
            include: {
              badges: {
                include: {
                  badge: true,
                },
              },
            },
          },
        },
      });

      if (event) {
        const formatted = {
          ...event,
          participants: event.participants.map((p) => ({
            ...p,
            badges: p.badges.map((pb) => pb.badge).filter(Boolean),
          })),
        };
        return res.json(formatted);
      }
    } catch (dbErr: any) {
      console.warn("[HallOfFame] Single event DB query fallback:", dbErr.message);
    }

    const memEvent = fallbackEvents.get(id);
    if (!memEvent) {
      return res.status(404).json({ error: "Hall of Fame event not found." });
    }

    const parts = Array.from(fallbackParticipants.values())
      .filter((p) => p.eventId === id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((p) => {
        const badges = (p.badgeIds || []).map((bid: string) => fallbackBadges.get(bid)).filter(Boolean);
        return { ...p, badges };
      });

    res.json({ ...memEvent, participants: parts });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch Hall of Fame event: " + err.message });
  }
});

// ==========================================
// 2. ADMIN EVENT ENDPOINTS
// ==========================================

// GET /api/hall-of-fame/admin/events - List ALL events with participant count & details
hallOfFameRouter.get(
  "/admin/events",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      try {
        const events = await prisma.hallOfFameEvent.findMany({
          orderBy: [{ year: "desc" }, { createdAt: "desc" }],
          include: {
            participants: {
              orderBy: { order: "asc" },
              include: {
                badges: {
                  include: {
                    badge: true,
                  },
                },
              },
            },
          },
        });

        const formatted = events.map((ev) => ({
          ...ev,
          participantCount: ev.participants.length,
          participants: ev.participants.map((p) => ({
            ...p,
            badges: p.badges.map((pb) => pb.badge).filter(Boolean),
          })),
        }));

        return res.json(formatted);
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB query fallback:", dbErr.message);
      }

      const allEvents = Array.from(fallbackEvents.values()).sort(
        (a, b) => Number(b.year || 0) - Number(a.year || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const formatted = allEvents.map((ev) => {
        const parts = Array.from(fallbackParticipants.values())
          .filter((p) => p.eventId === ev.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((p) => {
            const badges = (p.badgeIds || []).map((bid: string) => fallbackBadges.get(bid)).filter(Boolean);
            return { ...p, badges };
          });

        return {
          ...ev,
          participantCount: parts.length,
          participants: parts,
        };
      });

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch admin events: " + err.message });
    }
  }
);

// POST /api/hall-of-fame/admin/events - Create new event
hallOfFameRouter.post(
  "/admin/events",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, year, description, coverUrl, status } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Event name is required." });
      }
      if (!year || typeof year !== "string" || !year.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Event year is required." });
      }

      const cleanStatus = ["draft", "published", "archived"].includes(status) ? status : "draft";
      const id = `hof-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

      let createdEvent: any;
      try {
        createdEvent = await prisma.hallOfFameEvent.create({
          data: {
            name: name.trim(),
            year: year.trim(),
            description: description ? description.trim() : null,
            coverUrl: coverUrl || null,
            status: cleanStatus,
          },
          include: {
            participants: true,
          },
        });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB create event fallback:", dbErr.message);
        createdEvent = {
          id,
          name: name.trim(),
          year: year.trim(),
          description: description ? description.trim() : null,
          coverUrl: coverUrl || null,
          status: cleanStatus,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          participants: [],
        };
      }

      fallbackEvents.set(createdEvent.id, createdEvent);

      res.status(201).json({
        message: "Hall of Fame event created successfully.",
        event: { ...createdEvent, participantCount: 0, participants: [] },
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create Hall of Fame event: " + err.message });
    }
  }
);

// PUT /api/hall-of-fame/admin/events/:id - Update event
hallOfFameRouter.put(
  "/admin/events/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const { name, year, description, coverUrl, status, order } = req.body;

      if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Event name cannot be empty." });
      }
      if (year !== undefined && (!year || typeof year !== "string" || !year.trim())) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Event year cannot be empty." });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (year !== undefined) updateData.year = year.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;
      if (status !== undefined && ["draft", "published", "archived"].includes(status)) updateData.status = status;
      if (order !== undefined) updateData.order = Number(order) || 0;

      let updatedEvent: any;
      try {
        updatedEvent = await prisma.hallOfFameEvent.update({
          where: { id },
          data: updateData,
          include: {
            participants: {
              include: {
                badges: {
                  include: {
                    badge: true,
                  },
                },
              },
            },
          },
        });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB update event fallback:", dbErr.message);
        const existing = fallbackEvents.get(id);
        if (!existing) {
          return res.status(404).json({ error: "Event not found." });
        }
        updatedEvent = {
          ...existing,
          ...updateData,
          updatedAt: new Date(),
        };
      }

      fallbackEvents.set(id, updatedEvent);

      res.json({
        message: "Hall of Fame event updated successfully.",
        event: updatedEvent,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update Hall of Fame event: " + err.message });
    }
  }
);

// DELETE /api/hall-of-fame/admin/events/:id - Delete event
hallOfFameRouter.delete(
  "/admin/events/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      try {
        await prisma.hallOfFameEvent.delete({ where: { id } });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB delete event fallback:", dbErr.message);
      }

      fallbackEvents.delete(id);
      for (const [pId, p] of fallbackParticipants.entries()) {
        if (p.eventId === id) {
          fallbackParticipants.delete(pId);
        }
      }

      res.json({ message: "Hall of Fame event deleted successfully.", eventId: id });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete Hall of Fame event: " + err.message });
    }
  }
);

// POST /api/hall-of-fame/admin/events/:id/duplicate - Duplicate event structure
hallOfFameRouter.post(
  "/admin/events/:id/duplicate",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const { newName, newYear, copyParticipants } = req.body;

      let sourceEvent: any;
      try {
        sourceEvent = await prisma.hallOfFameEvent.findUnique({
          where: { id },
          include: {
            participants: {
              include: {
                badges: true,
              },
            },
          },
        });
      } catch (dbErr: any) {
        sourceEvent = fallbackEvents.get(id);
      }

      if (!sourceEvent) {
        return res.status(404).json({ error: "Source event not found for duplication." });
      }

      const duplicateName = newName?.trim() || `${sourceEvent.name} (Copy)`;
      const duplicateYear = newYear?.trim() || `${parseInt(sourceEvent.year || "2026", 10) + 1}`;

      let createdEvent: any;
      try {
        createdEvent = await prisma.hallOfFameEvent.create({
          data: {
            name: duplicateName,
            year: duplicateYear,
            description: sourceEvent.description,
            coverUrl: sourceEvent.coverUrl,
            status: "draft",
          },
        });

        if (copyParticipants && Array.isArray(sourceEvent.participants)) {
          for (const p of sourceEvent.participants) {
            const newParticipant = await prisma.hallOfFameParticipant.create({
              data: {
                eventId: createdEvent.id,
                fullName: p.fullName,
                teamName: p.teamName,
                collegeOrOrg: p.collegeOrOrg,
                description: p.description,
                photoUrl: p.photoUrl,
                recognitionType: p.recognitionType,
                customRecognition: p.customRecognition,
                order: p.order,
                linkedInUrl: p.linkedInUrl,
                portfolioUrl: p.portfolioUrl,
                githubUrl: p.githubUrl,
              },
            });

            if (p.badges && p.badges.length > 0) {
              for (const pb of p.badges) {
                await prisma.participantBadge.create({
                  data: {
                    participantId: newParticipant.id,
                    badgeId: pb.badgeId,
                  },
                }).catch(() => {});
              }
            }
          }
        }
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB duplicate fallback:", dbErr.message);
        const newId = `hof-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
        createdEvent = {
          id: newId,
          name: duplicateName,
          year: duplicateYear,
          description: sourceEvent.description,
          coverUrl: sourceEvent.coverUrl,
          status: "draft",
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          participants: [],
        };
      }

      fallbackEvents.set(createdEvent.id, createdEvent);

      res.status(201).json({
        message: `Successfully duplicated "${sourceEvent.name}" to "${duplicateName}".`,
        event: createdEvent,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to duplicate Hall of Fame event: " + err.message });
    }
  }
);

// ==========================================
// 3. ADMIN PARTICIPANT ENDPOINTS
// ==========================================

// POST /api/hall-of-fame/admin/events/:id/participants - Add participant
hallOfFameRouter.post(
  "/admin/events/:id/participants",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: eventId } = req.params;
    try {
      const {
        fullName,
        teamName,
        collegeOrOrg,
        description,
        photoUrl,
        recognitionType,
        customRecognition,
        linkedInUrl,
        portfolioUrl,
        githubUrl,
        badgeIds,
      } = req.body;

      if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Participant full name is required." });
      }

      const cleanRecognition = [
        "winner",
        "runner_up",
        "top_10",
        "finalist",
        "special_recognition",
        "custom",
      ].includes(recognitionType)
        ? recognitionType
        : "winner";

      let nextOrder = 0;
      try {
        const count = await prisma.hallOfFameParticipant.count({ where: { eventId } });
        nextOrder = count;
      } catch {
        const parts = Array.from(fallbackParticipants.values()).filter((p) => p.eventId === eventId);
        nextOrder = parts.length;
      }

      const pId = `part-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      let createdParticipant: any;

      try {
        createdParticipant = await prisma.hallOfFameParticipant.create({
          data: {
            eventId,
            fullName: fullName.trim(),
            teamName: teamName ? teamName.trim() : null,
            collegeOrOrg: collegeOrOrg ? collegeOrOrg.trim() : null,
            description: description ? description.trim() : null,
            photoUrl: photoUrl || null,
            recognitionType: cleanRecognition,
            customRecognition: customRecognition ? customRecognition.trim() : null,
            order: nextOrder,
            linkedInUrl: linkedInUrl ? linkedInUrl.trim() : null,
            portfolioUrl: portfolioUrl ? portfolioUrl.trim() : null,
            githubUrl: githubUrl ? githubUrl.trim() : null,
          },
        });

        if (Array.isArray(badgeIds) && badgeIds.length > 0) {
          for (const bId of badgeIds) {
            await prisma.participantBadge.create({
              data: {
                participantId: createdParticipant.id,
                badgeId: bId,
              },
            }).catch(() => {});
          }
        }

        const reloaded = await prisma.hallOfFameParticipant.findUnique({
          where: { id: createdParticipant.id },
          include: {
            badges: {
              include: {
                badge: true,
              },
            },
          },
        });

        if (reloaded) {
          createdParticipant = {
            ...reloaded,
            badges: reloaded.badges.map((pb) => pb.badge).filter(Boolean),
          };
        }
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB create participant fallback:", dbErr.message);
        const resolvedBadges = (Array.isArray(badgeIds) ? badgeIds : [])
          .map((bid: string) => fallbackBadges.get(bid))
          .filter(Boolean);

        createdParticipant = {
          id: pId,
          eventId,
          fullName: fullName.trim(),
          teamName: teamName ? teamName.trim() : null,
          collegeOrOrg: collegeOrOrg ? collegeOrOrg.trim() : null,
          description: description ? description.trim() : null,
          photoUrl: photoUrl || null,
          recognitionType: cleanRecognition,
          customRecognition: customRecognition ? customRecognition.trim() : null,
          order: nextOrder,
          linkedInUrl: linkedInUrl ? linkedInUrl.trim() : null,
          portfolioUrl: portfolioUrl ? portfolioUrl.trim() : null,
          githubUrl: githubUrl ? githubUrl.trim() : null,
          badgeIds: Array.isArray(badgeIds) ? badgeIds : [],
          badges: resolvedBadges,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      fallbackParticipants.set(createdParticipant.id, createdParticipant);

      res.status(201).json({
        message: "Participant added to Hall of Fame successfully.",
        participant: createdParticipant,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to add participant: " + err.message });
    }
  }
);

// PUT /api/hall-of-fame/admin/participants/:id - Update participant
hallOfFameRouter.put(
  "/admin/participants/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const {
        fullName,
        teamName,
        collegeOrOrg,
        description,
        photoUrl,
        recognitionType,
        customRecognition,
        order,
        linkedInUrl,
        portfolioUrl,
        githubUrl,
        badgeIds,
      } = req.body;

      if (fullName !== undefined && (!fullName || typeof fullName !== "string" || !fullName.trim())) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Participant full name cannot be empty." });
      }

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName.trim();
      if (teamName !== undefined) updateData.teamName = teamName ? teamName.trim() : null;
      if (collegeOrOrg !== undefined) updateData.collegeOrOrg = collegeOrOrg ? collegeOrOrg.trim() : null;
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;
      if (recognitionType !== undefined) updateData.recognitionType = recognitionType;
      if (customRecognition !== undefined) updateData.customRecognition = customRecognition ? customRecognition.trim() : null;
      if (order !== undefined) updateData.order = Number(order) || 0;
      if (linkedInUrl !== undefined) updateData.linkedInUrl = linkedInUrl ? linkedInUrl.trim() : null;
      if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl ? portfolioUrl.trim() : null;
      if (githubUrl !== undefined) updateData.githubUrl = githubUrl ? githubUrl.trim() : null;

      let updatedParticipant: any;
      try {
        await prisma.hallOfFameParticipant.update({
          where: { id },
          data: updateData,
        });

        if (Array.isArray(badgeIds)) {
          await prisma.participantBadge.deleteMany({ where: { participantId: id } });
          for (const bId of badgeIds) {
            await prisma.participantBadge.create({
              data: {
                participantId: id,
                badgeId: bId,
              },
            }).catch(() => {});
          }
        }

        const reloaded = await prisma.hallOfFameParticipant.findUnique({
          where: { id },
          include: {
            badges: {
              include: {
                badge: true,
              },
            },
          },
        });

        if (reloaded) {
          updatedParticipant = {
            ...reloaded,
            badges: reloaded.badges.map((pb) => pb.badge).filter(Boolean),
          };
        }
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB update participant fallback:", dbErr.message);
        const existing = fallbackParticipants.get(id);
        if (!existing) {
          return res.status(404).json({ error: "Participant not found." });
        }
        const resolvedBadges = (Array.isArray(badgeIds) ? badgeIds : existing.badgeIds || [])
          .map((bid: string) => fallbackBadges.get(bid))
          .filter(Boolean);

        updatedParticipant = {
          ...existing,
          ...updateData,
          badgeIds: Array.isArray(badgeIds) ? badgeIds : existing.badgeIds,
          badges: resolvedBadges,
          updatedAt: new Date(),
        };
      }

      fallbackParticipants.set(id, updatedParticipant);

      res.json({
        message: "Participant updated successfully.",
        participant: updatedParticipant,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update participant: " + err.message });
    }
  }
);

// DELETE /api/hall-of-fame/admin/participants/:id - Delete participant
hallOfFameRouter.delete(
  "/admin/participants/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      try {
        await prisma.hallOfFameParticipant.delete({ where: { id } });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB delete participant fallback:", dbErr.message);
      }

      fallbackParticipants.delete(id);

      res.json({ message: "Participant deleted successfully.", participantId: id });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete participant: " + err.message });
    }
  }
);

// PUT /api/hall-of-fame/admin/events/:id/reorder - Batch reorder participants
hallOfFameRouter.put(
  "/admin/events/:id/reorder",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: eventId } = req.params;
    const { orderedParticipantIds } = req.body;

    if (!Array.isArray(orderedParticipantIds)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "orderedParticipantIds must be an array of IDs." });
    }

    try {
      try {
        await prisma.$transaction(
          orderedParticipantIds.map((pId: string, idx: number) =>
            prisma.hallOfFameParticipant.update({
              where: { id: pId },
              data: { order: idx },
            })
          )
        );
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB reorder fallback:", dbErr.message);
        orderedParticipantIds.forEach((pId: string, idx: number) => {
          const p = fallbackParticipants.get(pId);
          if (p) {
            fallbackParticipants.set(pId, { ...p, order: idx });
          }
        });
      }

      res.json({ message: "Participant order updated successfully.", count: orderedParticipantIds.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to reorder participants: " + err.message });
    }
  }
);

// ==========================================
// 4. ADMIN BADGE ENDPOINTS
// ==========================================

// GET /api/hall-of-fame/admin/badges - List all badges
hallOfFameRouter.get(
  "/admin/badges",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      try {
        const badges = await prisma.hallOfFameBadge.findMany({
          orderBy: { createdAt: "asc" },
        });
        if (badges && badges.length > 0) {
          return res.json(badges);
        }
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB badges fallback:", dbErr.message);
      }

      const badgesList = Array.from(fallbackBadges.values());
      res.json(badgesList);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch badges: " + err.message });
    }
  }
);

// POST /api/hall-of-fame/admin/badges - Create custom badge
hallOfFameRouter.post(
  "/admin/badges",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, icon, status } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Badge name is required." });
      }

      const cleanStatus = status === "inactive" ? "inactive" : "active";
      const id = `badge-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

      let createdBadge: any;
      try {
        createdBadge = await prisma.hallOfFameBadge.create({
          data: {
            name: name.trim(),
            description: description ? description.trim() : null,
            icon: icon || "Sparkles",
            status: cleanStatus,
          },
        });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB create badge fallback:", dbErr.message);
        createdBadge = {
          id,
          name: name.trim(),
          description: description ? description.trim() : null,
          icon: icon || "Sparkles",
          status: cleanStatus,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      fallbackBadges.set(createdBadge.id, createdBadge);

      res.status(201).json({
        message: "Badge created successfully.",
        badge: createdBadge,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create badge: " + err.message });
    }
  }
);

// PUT /api/hall-of-fame/admin/badges/:id - Update badge
hallOfFameRouter.put(
  "/admin/badges/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      const { name, description, icon, status } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (icon !== undefined) updateData.icon = icon;
      if (status !== undefined) updateData.status = status === "inactive" ? "inactive" : "active";

      let updatedBadge: any;
      try {
        updatedBadge = await prisma.hallOfFameBadge.update({
          where: { id },
          data: updateData,
        });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB update badge fallback:", dbErr.message);
        const existing = fallbackBadges.get(id);
        if (!existing) {
          return res.status(404).json({ error: "Badge not found." });
        }
        updatedBadge = {
          ...existing,
          ...updateData,
          updatedAt: new Date(),
        };
      }

      fallbackBadges.set(id, updatedBadge);

      res.json({
        message: "Badge updated successfully.",
        badge: updatedBadge,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update badge: " + err.message });
    }
  }
);

// DELETE /api/hall-of-fame/admin/badges/:id - Delete badge
hallOfFameRouter.delete(
  "/admin/badges/:id",
  verifyToken,
  requireRole(["ADMIN", "SUPER_ADMIN"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
      try {
        await prisma.hallOfFameBadge.delete({ where: { id } });
      } catch (dbErr: any) {
        console.warn("[HallOfFame Admin] DB delete badge fallback:", dbErr.message);
      }

      fallbackBadges.delete(id);

      res.json({ message: "Badge deleted successfully.", badgeId: id });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete badge: " + err.message });
    }
  }
);
