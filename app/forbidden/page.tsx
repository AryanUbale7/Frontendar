"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-lg border-[#E2E8F0]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10 text-[#EF4444] mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
            403 — Access Forbidden
          </h1>
          <p className="text-xs text-[#475569] leading-relaxed">
            You do not have the required role permissions to view this resource or dashboard page.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button variant="default" asChild>
            <Link href="/dashboard">Return to My Dashboard</Link>
          </Button>
          <Button variant="outline" asChild leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
