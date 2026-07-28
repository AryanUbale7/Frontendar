"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AuthService } from "@/lib/auth/auth-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setError("Failed to send reset link. Please try again.");
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
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-xs text-[#475569]">
                Enter your registered email address and we'll send you a password reset link.
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
                  label="Email Address"
                  type="email"
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4 text-[#475569]" />}
                  required
                />

                <Button
                  type="submit"
                  variant="default"
                  className="w-full mt-2"
                  loading={loading}
                  rightIcon={<Send className="h-4 w-4" />}
                >
                  Send Reset Link
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center pt-2 border-t border-[#E2E8F0]/60">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </CardFooter>
          </>
        ) : (
          /* Distinct Full Confirmation State Screen */
          <div className="py-6 px-2 text-center space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#22C55E] mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading text-2xl font-bold text-[#0F172A]">
                Check Your Email
              </h3>
              <p className="text-xs text-[#475569] max-w-sm mx-auto leading-relaxed">
                We've sent a password reset link to{" "}
                <span className="font-bold text-[#0F172A] font-code">{email}</span>. Please click the link in your inbox to proceed.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubmitted(false)}
              >
                Resend Email
              </Button>
              <div>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
