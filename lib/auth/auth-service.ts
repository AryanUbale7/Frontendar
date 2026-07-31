import { UserProfile, UserRole, SignInData, SignUpData } from "@/types/auth";

// Default Mock Fallback User for development session state
export const DEFAULT_MOCK_USER: UserProfile = {
  id: "usr_arena_9921",
  email: "aryan.patel@frontendarena.dev",
  firstName: "Aryan",
  lastName: "Patel",
  fullName: "Aryan Patel",
  role: "platform_admin",
  avatarUrl: "",
  organizationName: "IIT Delhi",
  collegeName: "IIT Delhi",
  githubHandle: "aryanpatel",
  linkedinHandle: "aryanpatel-dev",
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

const MOCK_SESSION_KEY = "fa_session_user";

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
        localStorage.removeItem("fa_access_token");
        localStorage.removeItem("fa_refresh_token");
        document.cookie = "fa_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax";
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

    // Convert backend user schema response to frontend UserProfile schema
    let role: UserRole = "participant";
    const backendRole = (data.user.role || "").toUpperCase();
    if (backendRole === "ADMIN" || backendRole === "SUPER_ADMIN" || backendRole === "PLATFORM_ADMIN") {
      role = "platform_admin";
    } else if (backendRole === "ORG_ADMIN") {
      role = "org_admin";
    }

    const user: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || data.user.email.split("@")[0],
      lastName: data.user.lastName || "",
      fullName: data.user.firstName ? `${data.user.firstName} ${data.user.lastName || ""}`.trim() : data.user.email.split("@")[0],
      role,
      avatarUrl: data.user.avatarUrl || "",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("fa_access_token", data.accessToken);
      localStorage.setItem("fa_refresh_token", data.refreshToken);
    }

    this.setStoredUser(user);
    return user;
  }

  public static async signInWithEmailPassword(data: SignInData): Promise<UserProfile> {
    let role: UserRole = "participant";
    if (data.email.includes("admin")) {
      role = "platform_admin";
    } else if (data.email.includes("org")) {
      role = "org_admin";
    }

    const user: UserProfile = {
      ...DEFAULT_MOCK_USER,
      email: data.email,
      fullName: data.email.split("@")[0].replace(".", " "),
      role,
    };

    this.setStoredUser(user);
    return user;
  }

  public static async signUp(data: SignUpData): Promise<UserProfile> {
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      role: data.organizationName ? "org_admin" : "participant",
      organizationName: data.organizationName || "",
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.setStoredUser(user);
    return user;
  }

  public static async requestPasswordReset(email: string): Promise<boolean> {
    console.log(`Password reset link sent to: ${email}`);
    return true;
  }

  public static async resetPassword(password: string): Promise<boolean> {
    console.log(`Password reset successfully`);
    return true;
  }

  public static async signOut(): Promise<void> {
    this.setStoredUser(null);
  }

  public static hasRole(user: UserProfile | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    if (user.role === "platform_admin") return true; // platform admin has access to all
    return user.role === requiredRole;
  }
}
