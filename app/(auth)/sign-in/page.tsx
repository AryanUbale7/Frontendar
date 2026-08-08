"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";

export default function SignInPage() {
  const router = useRouter();
  const { user, isAuthenticated, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "platform_admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "org_admin") {
        router.push("/dashboard/organization");
      } else {
        router.push("/dashboard/participant");
      }
    }
  }, [user, isAuthenticated, router]);

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
            Sign in with your Google account to access your developer dashboard and hackathons
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 rounded-[12px] bg-[#FF3B3B]/15 border border-[#FF3B3B]/30 text-[#FF3B3B] text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Official Google Sign-in Popup Button */}
          <div className="flex justify-center w-full py-4">
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
        </CardContent>

        <CardFooter className="flex justify-center pt-4 border-t border-[#E2E8F0]">
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
