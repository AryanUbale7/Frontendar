export type UserRole = "participant" | "org_admin" | "platform_admin";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  organizationName?: string;
  collegeName?: string;
  githubHandle?: string;
  linkedinHandle?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName?: string;
  acceptTerms: boolean;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
