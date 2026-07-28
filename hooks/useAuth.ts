"use client";

import { useState, useEffect } from "react";
import { UserProfile, UserRole, SignInData, SignUpData } from "@/types/auth";
import { AuthService } from "@/lib/auth/auth-service";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadedUser = AuthService.getStoredUser();
    setUser(loadedUser);
    setIsLoading(false);
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

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const u = await AuthService.signInWithGoogle();
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

  const hasRole = (role: UserRole) => {
    return AuthService.hasRole(user, role);
  };

  return {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    hasRole,
  };
}
