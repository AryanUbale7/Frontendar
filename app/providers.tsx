"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { createContext, useState, useEffect } from "react";
import { UserProfile, UserRole, SignInData, SignUpData } from "@/types/auth";
import { AuthService } from "@/lib/auth/auth-service";

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (data: SignInData) => Promise<UserProfile>;
  signInWithGoogle: (credential: string) => Promise<UserProfile>;
  signUp: (data: SignUpData) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => UserProfile | null;
  hasRole: (role: UserRole) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      return AuthService.getStoredUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !AuthService.getStoredUser() && AuthService.hasSessionCookie();
    }
    return false;
  });

  const syncUser = () => {
    const loadedUser = AuthService.getStoredUser();
    setUser(loadedUser);
    setIsLoading(false);
  };

  useEffect(() => {
    syncUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "fa_session_user" || e.key === null) {
        syncUser();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const signIn = async (data: SignInData) => {
    setIsLoading(true);
    try {
      const u = await AuthService.signInWithEmailPassword(data);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const u = await AuthService.signInWithGoogle(credential);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      const u = await AuthService.signUp(data);
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!user) return null;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      fullName: updates.firstName && updates.lastName
        ? `${updates.firstName} ${updates.lastName}`
        : updates.firstName ? updates.firstName : user.fullName,
    };
    AuthService.setStoredUser(updatedUser);
    setUser(updatedUser);
    return updatedUser;
  };

  const hasRole = (role: UserRole) => {
    return AuthService.hasRole(user, role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        updateUserProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "481238035040-917qs7d47s4pu2htbsjurc9gvs2g64b8.apps.googleusercontent.com";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
