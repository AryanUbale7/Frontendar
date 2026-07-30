"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

export interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { user, hasRole, isLoading } = useAuth();
  const router = useRouter();

  const isAuthorized = !!user && hasRole(role);

  useEffect(() => {
    if (!isLoading && !isAuthorized && !fallback) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthorized, fallback, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
}
