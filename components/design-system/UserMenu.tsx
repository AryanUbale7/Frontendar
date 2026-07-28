"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, Bell, LogOut, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/useUser";

export function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useUser();

  if (!user) return null;

  const roleLabels: Record<string, { label: string; variant: "success" | "accent" | "solid" }> = {
    participant: { label: "Participant", variant: "success" },
    org_admin: { label: "Org Admin", variant: "accent" },
    platform_admin: { label: "Platform Admin", variant: "solid" },
  };

  const currentRoleInfo = roleLabels[user.role] || { label: user.role, variant: "success" as const };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="User Profile Menu"
          className="relative flex items-center gap-2.5 rounded-full p-1 transition-all hover:ring-2 hover:ring-[#2563EB]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white font-heading font-semibold text-xs shadow-sm">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-[#0F172A]">
              {user.fullName}
            </p>
            <p className="text-xs text-[#475569] truncate font-code">
              {user.email}
            </p>
            <div className="pt-1">
              <Badge variant={currentRoleInfo.variant} size="sm">
                {currentRoleInfo.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4 text-[#475569]" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4 text-[#475569]" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <Shield className="h-4 w-4 text-[#475569]" />
            <span>My Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-[#EF4444] focus:bg-[#EF4444]/10 focus:text-[#EF4444] cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
