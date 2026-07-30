"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      const user = await signIn({ email, password, rememberMe });
      if (user) {
        if (user.role === "platform_admin") {
          router.push("/dashboard/admin");
        } else if (user.role === "org_admin") {
          router.push("/dashboard/organization");
        } else {
          router.push("/dashboard/participant");
        }
      }
    } catch {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleGoogleSignIn = async (credentialToken: string) => {
    setError("");
    try {
      const user = await signInWithGoogle(credentialToken);
      if (user) {
        if (user.role === "platform_admin") {
          router.push("/dashboard/admin");
        } else if (user.role === "org_admin") {
          router.push("/dashboard/organization");
        } else {
          router.push("/dashboard/participant");
        }
      }
    } catch (err: any) {
      setError(typeof err === "string" ? err : (err && err.message) ? String(err.message) : "Google sign-in failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full shadow-lg border-[#E2E8F0] bg-[#FFFFFF] p-2 sm:p-4">
        <CardHeader className="space-y-2 text-center pb-4 border-b border-[#E2E8F0]">
          <CardTitle className="text-2xl font-bold text-[#1A1A1A]">
            Sign In to Account
          </CardTitle>
          <CardDescription className="text-xs text-[#5A5A5A] font-medium">
            Enter your credentials to access your developer dashboard and hackathons
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Official Google Sign-in Popup Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) {
                  handleGoogleSignIn(res.credential);
                }
              }}
              onError={() => setError("Google Authentication Failed.")}
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#E2E8F0]" />
            <span className="absolute bg-[#FFFFFF] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#5A5A5A]">
              Or email login
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-[12px] bg-[#FF3B3B]/15 border border-[#FF3B3B]/30 text-[#FF3B3B] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="aryan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-[#5A5A5A]" />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-[#5A5A5A]" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#5A5A5A] hover:text-[#5B4DFF] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                required
              />
              <div className="flex justify-end pt-1">
                <Link
                  href="#"
                  className="text-xs text-[#5B4DFF] hover:underline font-bold"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full mt-2"
              loading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#5A5A5A]">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-bold text-[#5B4DFF] hover:underline"
            >
              Register Here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
