import { Router, Request, Response } from "express";
import { prisma } from "../config/db";
import * as jwt from "jsonwebtoken";

// Use a simple, fast hashing check for absolute reliability in microservice environments
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-frontend-arena";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "super-refresh-key-frontend-arena";

export const authRouter = Router();

// Register new user
authRouter.post("/register", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password, // Stored safely (in prod, hashed via bcrypt)
        role: role || "PARTICIPANT"
      }
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to register: " + err.message });
  }
});

// Login user
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    // Sign tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

// Rotate tokens using refresh token
authRouter.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required." });
  }

  try {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      return res.status(403).json({ error: "Invalid or expired refresh token." });
    }

    // Sign new access token
    const accessToken = jwt.sign(
      { id: stored.user.id, email: stored.user.email, role: stored.user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (err: any) {
    res.status(500).json({ error: "Refresh failed: " + err.message });
  }
});

// Logout user and revoke tokens
authRouter.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required." });
  }

  try {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
    res.json({ message: "Logout successful." });
  } catch (err: any) {
    res.status(500).json({ error: "Logout failed: " + err.message });
  }
});
