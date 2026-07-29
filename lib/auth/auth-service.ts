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
    if (typeof window === "undefined") return DEFAULT_MOCK_USER;
    try {
      const stored = localStorage.getItem(MOCK_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.role = "platform_admin";
        return parsed;
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_MOCK_USER, role: "platform_admin" };
  }

  public static setStoredUser(user: UserProfile | null): void {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(MOCK_SESSION_KEY);
      }
    } catch {
      // fallback
    }
    this.mockUser = user;
  }

  public static async signInWithGoogle(): Promise<UserProfile> {
    const user: UserProfile = {
      ...DEFAULT_MOCK_USER,
      email: "google.user@frontendarena.dev",
      fullName: "Google Verified Builder",
    };
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
