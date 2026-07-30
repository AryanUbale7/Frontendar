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
import { GoogleLogin } from "@react-oauth/google";

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

  const handleGoogleSignUp = async (credentialToken: string) => {
    setError("");
    try {
      const user = await signInWithGoogle(credentialToken);
      if (user) {
        router.push("/dashboard/participant");
      }
    } catch (err: any) {
      setError(typeof err === "string" ? err : (err && err.message) ? String(err.message) : "Google sign-up failed.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full shadow-xl border-[#CBE6F3] bg-[#FFFFFF] p-2 sm:p-4">
        <CardHeader className="space-y-2 text-center pb-4 border-b border-[#CBE6F3]">
          <CardTitle className="text-2xl font-bold text-[#4741A6]">
            Create Developer Account
          </CardTitle>
          <CardDescription className="text-xs text-[#2D2B55]/80 font-medium">
            Join Frontend Arena to compete in hackathons, win cash prizes, and earn certificates
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {/* Official Google Sign-up Popup Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) {
                  handleGoogleSignUp(res.credential);
                }
              }}
              onError={() => setError("Google Authentication Failed.")}
              theme="outline"
              size="large"
              shape="pill"
              text="signup_with"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#CBE6F3]" />
            <span className="absolute bg-[#FFFFFF] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#6E6D8A]">
              Or form registration
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-[12px] bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#DC2626] text-xs font-semibold">
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
                leftIcon={<User className="h-4 w-4 text-[#8583A5]" />}
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
              leftIcon={<Mail className="h-4 w-4 text-[#8583A5]" />}
              required
            />

            <Input
              label="College or Organization (Optional)"
              placeholder="e.g. IIT Delhi or Acme Inc."
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4 text-[#8583A5]" />}
              helperText="Fill if managing a squad or academic track."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password *"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-[#8583A5]" />}
                required
              />
              <Input
                label="Confirm Password *"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-[#8583A5]" />}
                required
              />
            </div>

            <div className="pt-1">
              <Checkbox
                label={
                  <span>
                    I accept the{" "}
                    <a href="#" className="text-[#4741A6] hover:underline font-bold">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#4741A6] hover:underline font-bold">
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

        <CardFooter className="flex justify-center pt-2 border-t border-[#CBE6F3]">
          <p className="text-xs text-[#2D2B55]">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-[#4741A6] hover:underline"
            >
              Sign In Here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
