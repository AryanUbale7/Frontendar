"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
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

    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      await signUp({
        firstName,
        lastName,
        email,
        password,
        organizationName,
        acceptTerms,
      });
      router.push("/verify-email");
    } catch {
      setError("Registration failed. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      router.push("/dashboard/participant");
    } catch {
      setError("Google sign-up failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full shadow-lg border-[#E2E8F0] p-2 sm:p-4">
        <CardHeader className="space-y-2 text-center pb-4 border-b border-[#E2E8F0]/60">
          <CardTitle className="text-2xl font-bold text-[#0F172A]">
            Create Developer Account
          </CardTitle>
          <CardDescription className="text-xs text-[#475569]">
            Join Frontend Arena to compete in hackathons, win cash prizes, and earn certificates
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Google Sign-up Button */}
          <Button
            variant="outline"
            className="w-full justify-center gap-3 font-semibold text-xs py-2.5"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign Up with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#E2E8F0]" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
              Or form registration
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-[12px] bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#DC2626] text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name *"
                placeholder="Aryan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="h-4 w-4 text-[#475569]" />}
                required
              />
              <Input
                label="Last Name *"
                placeholder="Patel"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address *"
              type="email"
              placeholder="aryan.patel@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4 text-[#475569]" />}
              required
            />

            <Input
              label="College or Organization (Optional)"
              placeholder="e.g. IIT Delhi or Acme Inc."
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4 text-[#475569]" />}
              helperText="Fill if managing a squad or academic track."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password *"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-[#475569]" />}
                required
              />
              <Input
                label="Confirm Password *"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-[#475569]" />}
                required
              />
            </div>

            <div className="pt-1">
              <Checkbox
                label={
                  <span>
                    I accept the{" "}
                    <a href="#" className="text-[#FF006E] hover:underline font-semibold">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#FF006E] hover:underline font-semibold">
                      Privacy Policy
                    </a>
                    .
                  </span>
                }
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full mt-2"
              loading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pt-2 border-t border-[#E2E8F0]/60">
          <p className="text-xs text-[#475569]">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-[#FF006E] hover:underline"
            >
              Sign In Here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
