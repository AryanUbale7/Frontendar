import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { prisma } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-frontend-arena";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "PARTICIPANT" | "ADMIN" | "SUPER_ADMIN" | string;
  };
}

export async function maintenanceGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
  if (!isMutation) return next();

  const pathLower = req.path.toLowerCase();
  const isAuthOrConfig = pathLower.includes("/api/auth") || pathLower.includes("/api/system/config");
  if (isAuthOrConfig) return next();

  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: "global" } });
    if (config?.maintenanceMode) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN") {
            req.user = decoded;
            return next();
          }
        } catch {}
      }
      return res.status(503).json({
        error: "MAINTENANCE_MODE",
        message: "The platform is currently in maintenance mode. Operations are read-only."
      });
    }
  } catch (err) {
    console.error("Maintenance guard check failed:", err);
  }
  next();
}

export function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized access role permissions." });
    }
    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided at all → true anonymous access (public browsing).
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    // Token WAS provided but is invalid/expired. Return 401 so the upstream
    // proxy (Vercel backend-proxy.ts) can trigger automatic token refresh
    // using the refresh-token cookie. Without this, expired admin sessions
    // silently downgrade to anonymous, hiding draft/unpublished hackathons.
    return res.status(401).json({ error: "Token expired or invalid." });
  }
}
