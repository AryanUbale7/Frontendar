"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Award,
  Loader2,
  Copy,
  Check,
  Lock,
  RefreshCw,
} from "lucide-react";

interface VerificationData {
  uniqueId: string;
  name: string;
  status: "ACTIVE" | "REVOKED" | string;
  createdAt: string;
  eventName?: string;
  issueDate?: string;
  certificateType?: string;
}

export default function VerifyCredentialPage() {
  const params = useParams();
  const rawUniqueId = params?.uniqueId ? String(params.uniqueId).trim() : "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState<string>("");

  useEffect(() => {
    if (!rawUniqueId) {
      setLoading(false);
      setError("No credential identifier provided in the verification URL.");
      return;
    }

    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/qr-verification/public/${encodeURIComponent(rawUniqueId)}`
        );

        if (!res.ok) {
          if (res.status === 404) {
            setError("The credential ID scanned or entered could not be verified against official records.");
          } else {
            setError("Unable to complete verification check at this time. Please try again.");
          }
          setData(null);
          return;
        }

        const json = await res.json();
        setData(json);
        setVerifiedTimestamp(
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          })
        );
      } catch (err: any) {
        console.error("Verification fetch error:", err);
        setError("Network connection issue. Please check your internet connectivity and reload.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [rawUniqueId]);

  const handleCopyId = (idToCopy: string) => {
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedIssueDate = useMemo(() => {
    if (data?.issueDate) return data.issueDate;
    if (data?.createdAt) {
      try {
        return new Date(data.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return data.createdAt;
      }
    }
    return "Official Record";
  }, [data]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans antialiased">
      {/* Institutional Top Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg p-0.5"
            aria-label="Frontend Arena Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-heading text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Frontend Arena
              </div>
              <div className="text-[11px] font-medium text-slate-500 tracking-normal hidden sm:block">
                Official Credential Verification
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
              <Lock className="w-3 h-3 text-slate-500" aria-hidden="true" />
              <span>Official Portal</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {loading ? (
          /* LOADING STATE */
          <div
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 animate-pulse"
            aria-live="polite"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900 font-heading">
                Verifying Credential...
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Validating registry records for{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {rawUniqueId || "credential ID"}
                </span>
                ...
              </p>
            </div>

            {/* Skeleton details placeholder */}
            <div className="w-full max-w-md pt-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded-md w-3/4 mx-auto" />
              <div className="h-10 bg-slate-50 rounded-xl border border-slate-100 w-full" />
              <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 w-full" />
            </div>
          </div>
        ) : error || !data ? (
          /* INVALID / NOT VERIFIED STATE */
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden transition-all">
            {/* Header Banner */}
            <div className="bg-red-50/80 border-b border-red-100 p-6 sm:p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 border-2 border-red-200 flex items-center justify-center shadow-xs mb-3.5">
                <XCircle className="h-9 w-9" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 mb-2">
                Verification Failed
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                Credential Not Verified
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mt-1.5 leading-relaxed">
                We could not verify this credential against Frontend Arena&apos;s records.
              </p>
            </div>

            {/* Details & Help Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Queried Identifier
                </div>
                <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm font-semibold text-slate-800 break-all">
                  <span>{rawUniqueId || "Unknown / Empty"}</span>
                  {rawUniqueId && (
                    <button
                      type="button"
                      onClick={() => handleCopyId(rawUniqueId)}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                      title="Copy queried ID"
                      aria-label="Copy identifier"
                    >
                      {copiedId ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  What does this mean?
                </div>
                <p className="leading-relaxed text-amber-800">
                  This identifier was not found in the Frontend Arena credential repository. This may happen if the QR code or link was altered, or if the credential has not yet been published.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Return to Frontend Arena
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : data.status === "REVOKED" ? (
          /* REVOKED STATE */
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden transition-all">
            {/* Revoked Header */}
            <div className="bg-amber-50/80 border-b border-amber-100 p-6 sm:p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 border-2 border-amber-200 flex items-center justify-center shadow-xs mb-3.5">
                <AlertTriangle className="h-9 w-9" aria-hidden="true" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                Status: Revoked
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                Credential Revoked
              </h1>
              <p className="text-xs sm:text-sm text-amber-900 max-w-md mt-1.5 leading-relaxed font-medium">
                This credential is no longer active.
              </p>
            </div>

            {/* Revoked Details Card */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed font-medium">
                <strong>Notice:</strong> This credential was officially issued by Frontend Arena, but has since been revoked by administration. It is no longer valid or recognized for active achievement status.
              </div>

              {/* Data Table */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-slate-50/40">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Credential Holder
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    {data.name}
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Credential ID
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-700 break-all">
                    {data.uniqueId}
                  </span>
                </div>

                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Record Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    REVOKED
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Return to Frontend Arena
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE / VERIFIED STATE (PREMIUM OFFICIAL PORTAL) */
          <div className="space-y-6">
            {/* Top Verification Hero & Authenticity Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Green Hero Badge Section */}
              <div className="relative bg-gradient-to-b from-emerald-50/90 via-emerald-50/40 to-white border-b border-emerald-100/80 p-6 sm:p-8 text-center flex flex-col items-center">
                {/* Visual Status Container */}
                <div className="relative mb-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100/90 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center shadow-xs ring-8 ring-emerald-50">
                    <CheckCircle2 className="h-9 w-9 sm:h-11 sm:w-11 text-emerald-600" aria-hidden="true" />
                  </div>
                </div>

                {/* Status Title */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs mb-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  VERIFIED
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Official Frontend Arena Credential
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mt-2 leading-relaxed">
                  This credential has been successfully verified against Frontend Arena&apos;s official records.
                </p>

                {/* Authenticity Badge Pill */}
                <div className="mt-4 inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-center">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 tracking-wide">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    AUTHENTIC CREDENTIAL
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Issued and verified by Frontend Arena
                  </span>
                </div>
              </div>

              {/* Credential Details Card Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Credential Details
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE
                  </span>
                </div>

                {/* Dynamic Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Participant Name */}
                  <div className="space-y-1.5 md:col-span-2 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Credential Holder
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight block">
                      {data.name}
                    </span>
                  </div>

                  {/* Credential ID */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Credential ID
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-blue-50/60 border border-blue-200/70 px-3 py-2 rounded-xl">
                      <span className="font-mono text-sm sm:text-base font-bold text-blue-700 break-all">
                        {data.uniqueId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(data.uniqueId)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-100/70 transition-colors shrink-0"
                        title="Copy Credential ID"
                        aria-label="Copy Credential ID"
                      >
                        {copiedId ? (
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Status
                    </span>
                    <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-2xs" />
                      <span className="text-sm font-bold text-emerald-900 tracking-wide">
                        ACTIVE / VERIFIED
                      </span>
                    </div>
                  </div>

                  {/* Credential Type */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Credential Type
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block">
                      {data.certificateType || "Frontend Arena Verified Credential"}
                    </span>
                  </div>

                  {/* Event Name */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Event
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block">
                      {data.eventName || "Frontend Arena Official Competition"}
                    </span>
                  </div>

                  {/* Issued Date */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Issued On
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block">
                      {formattedIssueDate}
                    </span>
                  </div>

                  {/* Issuing Authority */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Issuing Authority
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block">
                      Frontend Arena Authority
                    </span>
                  </div>
                </div>

                {/* Trust Statement Callout */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 flex items-start gap-3 text-xs sm:text-sm text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="leading-relaxed font-medium">
                    This credential is recognized as an official credential issued by Frontend Arena.
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Record Section Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    Verification Record
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  LIVE REGISTRY
                </span>
              </div>

              {/* Tabular Audit Details */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                <div className="flex justify-between sm:flex-col sm:justify-start gap-0.5 border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
                  <dt className="text-slate-500 font-medium">Verification Status</dt>
                  <dd className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    VERIFIED
                  </dd>
                </div>

                <div className="flex justify-between sm:flex-col sm:justify-start gap-0.5 border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
                  <dt className="text-slate-500 font-medium">Credential ID</dt>
                  <dd className="font-mono font-bold text-slate-800 break-all">{data.uniqueId}</dd>
                </div>

                <div className="flex justify-between sm:flex-col sm:justify-start gap-0.5 border-b border-slate-50 pb-2 sm:border-0 sm:pb-0">
                  <dt className="text-slate-500 font-medium">Record Status</dt>
                  <dd className="font-bold text-emerald-700">ACTIVE</dd>
                </div>

                {verifiedTimestamp && (
                  <div className="flex justify-between sm:flex-col sm:justify-start gap-0.5">
                    <dt className="text-slate-500 font-medium">Verified On</dt>
                    <dd className="font-medium text-slate-700">{verifiedTimestamp}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </main>

      {/* Official Portal Institutional Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 text-center text-xs text-slate-500 space-y-2 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Official Verification Portal</span>
            <span>•</span>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
            >
              Frontend Arena
            </Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Frontend Arena. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
