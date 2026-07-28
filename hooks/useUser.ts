"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/types/auth";
import { AuthService } from "@/lib/auth/auth-service";

export function useUser() {
  const { user, isLoading, signOut } = useAuth();

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!user) return null;
    const updatedUser: UserProfile = {
      ...user,
      ...updates,
      fullName: updates.firstName && updates.lastName
        ? `${updates.firstName} ${updates.lastName}`
        : user.fullName,
    };
    AuthService.setStoredUser(updatedUser);
    return updatedUser;
  };

  return {
    user,
    isLoaded: !isLoading,
    updateUserProfile,
    signOut,
  };
}
