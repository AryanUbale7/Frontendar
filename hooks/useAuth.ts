"use client";

import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/app/providers";
import { UserProfile, UserRole, SignInData, SignUpData } from "@/types/auth";
import { AuthService } from "@/lib/auth/auth-service";

export function useAuth() {
  const context = useContext(AuthContext);
  
  // Fallback for isolated components rendered without AuthContext
  const [localUser, setLocalUser] = useState<UserProfile | null>(() => AuthService.getStoredUser());
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  if (context) {
    return context;
  }

  return {
    user: localUser,
    role: localUser?.role || null,
    isAuthenticated: !!localUser,
    isLoading: localLoading,
    signIn: async (data: SignInData) => {
      setLocalLoading(true);
      try {
        const u = await AuthService.signInWithEmailPassword(data);
        setLocalUser(u);
        return u;
      } finally {
        setLocalLoading(false);
      }
    },
    signInWithGoogle: async (credential: string) => {
      setLocalLoading(true);
      try {
        const u = await AuthService.signInWithGoogle(credential);
        setLocalUser(u);
        return u;
      } finally {
        setLocalLoading(false);
      }
    },
    signUp: async (data: SignUpData) => {
      setLocalLoading(true);
      try {
        const u = await AuthService.signUp(data);
        setLocalUser(u);
        return u;
      } finally {
        setLocalLoading(false);
      }
    },
    signOut: async () => {
      setLocalLoading(true);
      try {
        await AuthService.signOut();
        setLocalUser(null);
      } finally {
        setLocalLoading(false);
      }
    },
    hasRole: (role: UserRole) => AuthService.hasRole(localUser, role),
  };
}
