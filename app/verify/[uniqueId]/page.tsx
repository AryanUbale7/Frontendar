"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Award, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationData {
  uniqueId: string;
  name: string;
  status: "ACTIVE" | "REVOKED" | string;
  createdAt: string;
}

export default function VerifyCredentialPage() {
  const params = useParams();
  const rawUniqueId = params?.uniqueId ? String(params.uniqueId) : "";
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawUniqueId) {
      setLoading(false);
      setError("No credential ID provided.");
      return;
    }

    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/qr-verification/public/${encodeURIComponent(rawUniqueId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("The ID entered or scanned could not be verified.");
          } else {
            setError("Unable to complete verification check.");
          }
          setData(null);
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Verification fetch error:", err);
        setError("Verification Failed. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [rawUniqueId]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 text-[#0F172A]">
      {/* Top Header branding */}
      <header className="max-w-md mx-auto w-full flex items-center justify-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
          <Shield className="h-5 w-5" />
        </div>
        <span className="font-heading text-xl font-bold tracking-tight text-[#0F172A]">
          Frontend Arena
        </span>
      </header>

      <main className="max-w-md mx-auto w-full">
        <Card className="shadow-lg border-[#E2E8F0] bg-white rounded-2xl overflow-hidden">
          {loading ? (
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-10 w-10 text-[#2563EB] animate-spin" />
              <p className="text-sm font-medium text-[#475569]">
                Verifying credential details...
              </p>
            </CardContent>
          ) : error || !data ? (
            <>
              <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/20 p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/15 text-[#EF4444]">
                  <XCircle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#DC2626]">
                    Verification Failed
                  </h1>
                  <p className="text-xs text-[#991B1B] font-medium mt-1">
                    Invalid Credential Identification
                  </p>
                </div>
              </div>

              <CardContent className="py-6 px-6 text-center space-y-4">
                <p className="text-sm text-[#475569]">
                  {error || "The ID entered or scanned could not be verified."}
                </p>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] font-mono">
                  Queried ID: <span className="font-semibold">{rawUniqueId || "Unknown"}</span>
                </div>
              </CardContent>
            </>
          ) : data.status === "REVOKED" ? (
            <>
              <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/20 p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#D97706]">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#B45309]">
                    Verification Revoked
                  </h1>
                  <p className="text-xs text-[#92400E] font-medium mt-1">
                    Credential No Longer Active
                  </p>
                </div>
              </div>

              <CardContent className="py-6 px-6 space-y-5">
                <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FCD34D] text-xs text-[#B45309] text-center">
                  This credential has been revoked by Frontend Arena administration.
                </div>

                <div className="space-y-4 pt-2">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Participant Name
                    </span>
                    <span className="text-base font-bold text-[#0F172A]">
                      {data.name}
                    </span>
                  </div>

                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Credential ID
                    </span>
                    <span className="text-base font-mono font-bold text-[#475569]">
                      {data.uniqueId}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Status
                    </span>
                    <Badge variant="secondary" className="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] font-bold">
                      REVOKED
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <div className="bg-[#22C55E]/10 border-b border-[#22C55E]/20 p-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/15 text-[#16A34A]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#15803D]">
                    ✓ Verified
                  </h1>
                  <p className="text-xs text-[#166534] font-medium mt-1">
                    Official Frontend Arena Credential
                  </p>
                </div>
              </div>

              <CardContent className="py-6 px-6 space-y-5">
                <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
                  <Award className="h-5 w-5 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-medium text-[#166534]">
                    Authentic credential issued by Frontend Arena.
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Name
                    </span>
                    <span className="text-lg font-bold text-[#0F172A]">
                      {data.name}
                    </span>
                  </div>

                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      ID
                    </span>
                    <span className="text-base font-mono font-bold text-[#2563EB]">
                      {data.uniqueId}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Status
                    </span>
                    <Badge variant="solid" className="bg-[#22C55E] text-white font-bold">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-4 flex justify-between items-center text-xs text-[#64748B]">
            <span>Official Verification Portal</span>
            <Link href="/" className="font-semibold text-[#2563EB] hover:underline">
              Frontend Arena
            </Link>
          </CardFooter>
        </Card>
      </main>

      <footer className="max-w-md mx-auto w-full text-center text-xs text-[#94A3B8] mt-8">
        &copy; {new Date().getFullYear()} Frontend Arena. All rights reserved.
      </footer>
    </div>
  );
}
