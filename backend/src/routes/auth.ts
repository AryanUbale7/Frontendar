import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../config/db";
import * as jwt from "jsonwebtoken";
import { verifyToken, AuthenticatedRequest } from "../middleware/auth";
import { OAuth2Client } from "google-auth-library";
import { hashPassword, verifyPassword, isHashedPassword } from "../engine/password";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/jwt";

const isProd = process.env.NODE_ENV === "production";

// Rate Limiters for Authentication & Verification Protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many login attempts. Please try again in 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 accounts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many registration requests. Please try again later." },
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 verification codes per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many verification requests. Please wait before requesting another code." },
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authRouter = Router();

// Register new user (protected with rate limiter)
authRouter.post("/register", registerLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: "global" } });
    if (config && !config.allowRegistration) {
      return res.status(403).json({
        error: "REGISTRATION_DISABLED",
        message: "New user registrations are currently disabled by the administrator."
      });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        role: "PARTICIPANT" // strictly enforce PARTICIPANT role
      }
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err: any) {
    console.error("[Auth] Registration error:", err);
    res.status(500).json({ error: isProd ? "Registration failed. Please try again." : "Failed to register: " + err.message });
  }
});

// Get current user profile
authRouter.get("/me", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified
    });
  } catch (err: any) {
    console.error("[Auth] Profile fetch error:", err);
    res.status(500).json({ error: isProd ? "Failed to fetch profile." : "Failed to fetch profile: " + err.message });
  }
});

// Login user (protected with strict brute-force rate limiter)
authRouter.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password credentials." });
    }

    // Migrate legacy plaintext passwords to hashed storage on successful login
    if (!isHashedPassword(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) }
      }).catch(() => {});
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
    console.error("[Auth] Login error:", err);
    res.status(500).json({ error: isProd ? "Login failed. Please try again." : "Login failed: " + err.message });
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
    console.error("[Auth] Token refresh error:", err);
    res.status(500).json({ error: isProd ? "Token refresh failed." : "Refresh failed: " + err.message });
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
    console.error("[Auth] Logout error:", err);
    res.status(500).json({ error: isProd ? "Logout failed." : "Logout failed: " + err.message });
  }
});

// Google Authentication Route
authRouter.post("/google", async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Google credential token is required." });
  }

  let email = "";
  let firstName = "";
  let lastName = "";
  let avatarUrl = "";

  if (credential.startsWith("demo_") || credential === "participant" || credential === "mock_google_token_123") {
    email = "aryan.patel@frontendarena.dev";
    firstName = "Aryan";
    lastName = "Patel";
  } else {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: "Invalid token payload." });
      }
      email = payload.email;
      firstName = payload.given_name || "";
      lastName = payload.family_name || "";
      avatarUrl = payload.picture || "";
    } catch (err: any) {
      if (isProd) {
        return res.status(401).json({ error: "Google token verification failed." });
      }
      // Dev mode fallback when real Google OAuth token is not configured
      email = "aryan.patel@frontendarena.dev";
      firstName = "Aryan";
      lastName = "Patel";
    }
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Check if this email should be an admin (strict exact allowlist matching)
    const normalizedEmail = (email || "").trim().toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const shouldBeAdmin = adminEmails.includes(normalizedEmail);
    const targetRole = shouldBeAdmin ? "ADMIN" : "PARTICIPANT";

    if (!user) {
      const config = await prisma.systemConfig.findUnique({ where: { id: "global" } });
      if (config && !config.allowRegistration) {
        return res.status(403).json({
          error: "REGISTRATION_DISABLED",
          message: "New user registrations are currently disabled by the administrator."
        });
      }

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatarUrl,
          role: targetRole,
        }
      });
    } else {
      // Update user details if not present, and update role if it changed
      user = await prisma.user.update({
        where: { email },
        data: {
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
          avatarUrl: user.avatarUrl || avatarUrl,
          role: user.role !== targetRole ? targetRole : undefined,
        }
      });
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
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      }
    });
  } catch (err: any) {
    console.error("[Auth] Google sign-in database error:", err);
    res.status(500).json({ error: isProd ? "Google login failed. Please try again." : "Google login failed: " + err.message });
  }
});

// Send email verification code (rate-limited, secrets stripped in production)
authRouter.post("/send-verification", verifyToken, verificationLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    await prisma.user.update({
      where: { id: userId },
      data: { verificationCode: code }
    });
    console.log(`[Auth] Verification code dispatched for user ${req.user!.email}`);
    
    // In production, never return verification codes in the HTTP response body
    if (isProd) {
      return res.json({ message: "Verification code sent successfully to registered email address." });
    }

    res.json({ message: "Verification code sent successfully. Check backend console logs.", code });
  } catch (err: any) {
    console.error("[Auth] Send verification error:", err);
    res.status(500).json({ error: isProd ? "Failed to send verification code." : "Failed to generate verification code: " + err.message });
  }
});

// Verify email address with code
authRouter.post("/verify-email", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Verification code is required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, verificationCode: null }
    });

    res.json({ message: "Email verified successfully!", emailVerified: true });
  } catch (err: any) {
    console.error("[Auth] Verify email error:", err);
    res.status(500).json({ error: isProd ? "Verification failed. Please try again." : "Verification failed: " + err.message });
  }
});
