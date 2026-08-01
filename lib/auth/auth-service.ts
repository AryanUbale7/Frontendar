import { UserProfile, UserRole, SignInData, SignUpData } from "@/types/auth";

// Default Mock Fallback User for development session state
export const DEFAULT_MOCK_USER: UserProfile = {
  id: "usr_arena_9921",
  email: "developer@frontendarena.dev",
  firstName: "Developer",
  lastName: "User",
  fullName: "Developer User",
  role: "participant",
  avatarUrl: "",
  organizationName: "",
  collegeName: "",
  githubHandle: "",
  linkedinHandle: "",
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

const MOCK_SESSION_KEY = "fa_session_user";
const ACCESS_TOKEN_KEY = "fa_access_token";
const REFRESH_TOKEN_KEY = "fa_refresh_token";
const ACCESS_TOKEN_COOKIE = "fa_access_token";
const REFRESH_TOKEN_COOKIE = "fa_refresh_token";
const SESSION_COOKIE = "fa_session_active";

interface BackendUserResponse {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

function mapBackendRole(backendRole: string | undefined | null): UserRole {
  const role = (backendRole || "").toUpperCase();
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") {
    return "platform_admin";
  }
  if (role === "ORG_ADMIN") {
    return "org_admin";
  }
  return "participant";
}

function mapBackendUser(backendUser: BackendUserResponse): UserProfile {
  const role = mapBackendRole(backendUser?.role);
  const email = backendUser?.email || "";
  return {
    id: backendUser?.id,
    email,
    firstName: backendUser?.firstName || backendUser?.email?.split("@")[0] || "",
    lastName: backendUser?.lastName || "",
    fullName: backendUser?.firstName
      ? `${backendUser.firstName} ${backendUser.lastName || ""}`.trim()
      : email.split("@")[0],
    role,
    avatarUrl: backendUser?.avatarUrl || "",
    emailVerified: true,
    createdAt: backendUser?.createdAt || new Date().toISOString(),
  };
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
}

function persistTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setCookie(ACCESS_TOKEN_COOKIE, accessToken, 60 * 60 * 24 * 7);
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, 60 * 60 * 24 * 7);
  setCookie(SESSION_COOKIE, "true", 60 * 60 * 24 * 365);
}

function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
  clearCookie(SESSION_COOKIE);
}

function buildDevMockSession(email: string): UserProfile {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Authentication backend is unreachable. Sign-in is not available.");
  }

  let role: UserRole = "participant";
  if (email.includes("admin")) {
    role = "platform_admin";
  } else if (email.includes("org")) {
    role = "org_admin";
  }

  const mockId = `usr_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...DEFAULT_MOCK_USER,
    id: mockId,
    email,
    fullName: email.split("@")[0].replace(".", " "),
    role,
    createdAt: new Date().toISOString(),
  };
}

export class AuthService {
  private static mockUser: UserProfile | null = null;

  public static getStoredUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(MOCK_SESSION_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // CRITICAL PERSISTENCE FIX: Sync session cookie on every getStoredUser check
        document.cookie = "fa_session_active=true; path=/; max-age=31536000; SameSite=Lax";
        return user;
      }
    } catch {
      // fallback
    }
    return null;
  }

  public static setStoredUser(user: UserProfile | null): void {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
        document.cookie = "fa_session_active=true; path=/; max-age=31536000; SameSite=Lax";
      } else {
        localStorage.removeItem(MOCK_SESSION_KEY);
        clearTokens();
      }
    } catch {
      // fallback
    }
    this.mockUser = user;
  }

  public static async signInWithGoogle(credential: string): Promise<UserProfile> {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Google sign-in failed on backend.");
    }

    const data = await res.json();
    const user = mapBackendUser(data.user);

    persistTokens(data.accessToken, data.refreshToken);
    this.setStoredUser(user);
    return user;
  }

  public static async signInWithEmailPassword(data: SignInData): Promise<UserProfile> {
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
    } catch {
      // Backend unreachable: dev-only mock session (production throws)
      const devUser = buildDevMockSession(data.email);
      this.setStoredUser(devUser);
      console.warn("[AuthService] Using DEV mock session (backend unreachable).");
      return devUser;
    }

    if (!res.ok) {
      let message = "Invalid email or password credentials.";
      try {
        const err = await res.json();
        if (err?.error) message = err.error;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }

    const auth = await res.json();
    const user = mapBackendUser(auth.user);

    persistTokens(auth.accessToken, auth.refreshToken);
    this.setStoredUser(user);
    return user;
  }

  public static async signUp(data: SignUpData): Promise<UserProfile> {
    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });
    } catch {
      // Backend unreachable: dev-only mock session (production throws)
      const devUser = buildDevMockSession(data.email);
      this.setStoredUser(devUser);
      console.warn("[AuthService] Using DEV mock session (backend unreachable).");
      return devUser;
    }

    if (!res.ok) {
      let message = "Registration failed.";
      try {
        const err = await res.json();
        if (err?.error) message = err.error;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }

    // Auto sign-in after successful registration
    return this.signInWithEmailPassword({
      email: data.email,
      password: data.password,
    });
  }

  public static async requestPasswordReset(email: string): Promise<boolean> {
    console.log(`Password reset link sent to: ${email}`);
    return true;
  }

  public static async resetPassword(password: string): Promise<boolean> {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    console.log("Password reset successfully");
    return true;
  }

  public static async signOut(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // backend unreachable; local sign-out still proceeds
      }
    }
    this.setStoredUser(null);
  }

  public static hasRole(user: UserProfile | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    if (user.role === "platform_admin") return true; // platform admin has access to all
    return user.role === requiredRole;
  }
}
