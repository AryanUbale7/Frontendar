"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";

export default function SignUpPage() {
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

        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 rounded-[12px] bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#DC2626] text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* Official Google Sign-up Popup Button */}
          <div className="flex justify-center w-full py-4">
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
        </CardContent>

        <CardFooter className="flex justify-center pt-4 border-t border-[#CBE6F3]">
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
