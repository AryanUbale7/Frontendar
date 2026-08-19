"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (user.role === "platform_admin") {
      router.push("/dashboard/admin");
    } else if (user.role === "org_admin") {
      router.push("/dashboard/organization");
    } else {
      router.push("/dashboard/participant");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-96 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#DEE32E] border-t-transparent" />
        <p className="text-xs text-[#475569]">Loading your dashboard environment...</p>
      </div>
    </div>
  );
}
