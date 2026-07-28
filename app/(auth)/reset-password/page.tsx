"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthService } from "@/lib/auth/auth-service";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(password);
      setSubmitted(true);
    } catch {
      setError("Failed to reset password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full shadow-lg border-[#E2E8F0] p-2 sm:p-4">
        {!submitted ? (
          <>
            <CardHeader className="space-y-2 text-center pb-4 border-b border-[#E2E8F0]/60">
              <CardTitle className="text-2xl font-bold text-[#0F172A]">
                Set New Password
              </CardTitle>
              <CardDescription className="text-xs text-[#475569]">
                Create a strong password for your Frontend Arena account.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {error && (
                <div className="p-3 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#DC2626] text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4 text-[#475569]" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer text-[#475569] hover:text-[#0F172A] p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                />

                <Input
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4 text-[#475569]" />}
                  required
                />

                <Button
                  type="submit"
                  variant="default"
                  className="w-full mt-2"
                  loading={loading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <div className="py-6 px-2 text-center space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">
                Password Reset Complete
              </h3>
              <p className="text-xs text-[#475569] max-w-sm mx-auto leading-relaxed">
                Your password has been updated successfully. You can now sign in with your new credentials.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={() => router.push("/sign-in")}
              >
                Sign In Now
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
