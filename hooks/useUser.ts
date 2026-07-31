"use client";

import { useAuth } from "@/hooks/useAuth";

export function useUser() {
  const auth = useAuth();
  return {
    user: auth.user,
    isLoaded: !auth.isLoading,
    updateUserProfile: auth.updateUserProfile,
    signOut: auth.signOut,
  };
}
