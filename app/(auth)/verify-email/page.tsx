"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [state, setState] = useState<"pending" | "success" | "expired">("pending");
  const [loading, setLoading] = useState(false);

  const handleSimulateVerification = () => {
    setLoading(true);
    setTimeout(() => {
      setState("success");
      setLoading(false);
    }, 1200);
  };

  const handleSimulateExpired = () => {
    setState("expired");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full shadow-lg border-[#E2E8F0] p-2 sm:p-4 text-center">
        {state === "pending" && (
          <div className="py-4 space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB]/10 text-[#2563EB] mx-auto shadow-sm">
              <Mail className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#0F172A]">
                Verify Your Email Address
              </CardTitle>
              <CardDescription className="text-xs text-[#475569] max-w-sm mx-auto leading-relaxed">
                We've sent a verification link to your email address. Please click the link to activate your developer account.
              </CardDescription>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="default"
                className="w-full"
                loading={loading}
                onClick={handleSimulateVerification}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm Verification
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-[#475569]"
                onClick={handleSimulateExpired}
              >
                Simulate Expired Link
              </Button>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="py-4 space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#0F172A]">
                Email Verified Successfully!
              </CardTitle>
              <CardDescription className="text-xs text-[#475569] max-w-sm mx-auto leading-relaxed">
                Your developer account is now active. You can start exploring hackathons and building projects.
              </CardDescription>
            </div>

            <div className="pt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={() => router.push("/dashboard/participant")}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {state === "expired" && (
          <div className="py-4 space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10 text-[#EF4444] mx-auto shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#0F172A]">
                Verification Link Expired
              </CardTitle>
              <CardDescription className="text-xs text-[#475569] max-w-sm mx-auto leading-relaxed">
                The verification link has expired or is invalid. Request a new verification link below.
              </CardDescription>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="default"
                className="w-full"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => setState("pending")}
              >
                Resend Verification Link
              </Button>
              <Link
                href="/sign-in"
                className="block text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
