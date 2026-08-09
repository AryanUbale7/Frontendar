"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Search,
  Plus,
  Ban,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface QrRecord {
  id: string;
  uniqueId: string;
  name: string;
  status: "ACTIVE" | "REVOKED" | string;
  createdAt: string;
}

export function QrVerificationPanel() {
  const [participantName, setParticipantName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [recentRecord, setRecentRecord] = useState<QrRecord | null>(null);
  const [recentQrDataUrl, setRecentQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // List states
  const [records, setRecords] = useState<QrRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal view states
  const [previewRecord, setPreviewRecord] = useState<QrRecord | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>("");

  const fetchRecords = useCallback(async (query = searchQuery) => {
    try {
      setLoadingRecords(true);
      const url = query ? `/api/qr-verification?search=${encodeURIComponent(query)}` : "/api/qr-verification";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setRecords(json);
      }
    } catch (e: unknown) {
      console.error("Failed to fetch QR records:", e);
    } finally {
      setLoadingRecords(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const generateQrDataUrl = async (uniqueId: string): Promise<string> => {
    const verifyUrl = `https://frontendarena.online/verify/${uniqueId}`;
    return QRCode.toDataURL(verifyUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) {
      setError("Participant name is required.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const res = await fetch("/api/qr-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: participantName.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to generate QR Code");
      }

      const newRecord: QrRecord = await res.json();
      const dataUrl = await generateQrDataUrl(newRecord.uniqueId);

      setRecentRecord(newRecord);
      setRecentQrDataUrl(dataUrl);
      setParticipantName("");
      fetchRecords();
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (uniqueId: string) => {
    try {
      const dataUrl = await generateQrDataUrl(uniqueId);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${uniqueId}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to download QR image:", e);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this credential? Revoked credentials will permanently fail verification.")) {
      return;
    }

    try {
      setRevokingId(id);
      const res = await fetch(`/api/qr-verification/${id}/revoke`, { method: "PUT" });
      if (res.ok) {
        fetchRecords();
        if (recentRecord?.id === id) {
          setRecentRecord({ ...recentRecord, status: "REVOKED" });
        }
        if (previewRecord?.id === id) {
          setPreviewRecord({ ...previewRecord, status: "REVOKED" });
        }
      }
    } catch (e) {
      console.error("Failed to revoke QR record:", e);
    } finally {
      setRevokingId(null);
    }
  };

  const handleOpenPreview = async (rec: QrRecord) => {
    setPreviewRecord(rec);
    const dataUrl = await generateQrDataUrl(rec.uniqueId);
    setPreviewQrDataUrl(dataUrl);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="solid" size="sm" className="bg-[#2563EB] text-white font-bold">
              QR Verification System
            </Badge>
            <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">
              Official Credential Issuer
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
            Certificate & ID QR Verification
          </h1>
          <p className="text-sm text-[#475569]">
            Generate globally unique ID credentials and downloadable high-res QR codes linked to frontendarena.online/verify/
          </p>
        </div>
      </div>

      {/* Grid: Generator Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form */}
        <Card className="lg:col-span-6 border-[#E2E8F0] shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#2563EB]" />
              Generate New Verification ID
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Enter the participant&apos;s name to issue a unique verification record and official QR code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#DC2626] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1.5 uppercase tracking-wider">
                  Participant Name *
                </label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  required
                  className="bg-white border-[#E2E8F0]"
                />
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={generating}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Unique ID & QR...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Generate QR
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Result Card */}
        <Card className="lg:col-span-6 border-[#E2E8F0] shadow-sm bg-white flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#2563EB]" />
              Generated Credential Preview
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Preview of the most recently generated QR code and verification payload.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col items-center justify-center py-4">
            {recentRecord && recentQrDataUrl ? (
              <div className="w-full max-w-sm flex flex-col items-center space-y-4">
                {/* QR Code Container */}
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col items-center">
                  <img
                    src={recentQrDataUrl}
                    alt={`QR for ${recentRecord.uniqueId}`}
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                  <span className="text-[11px] font-mono text-[#64748B] mt-2">
                    https://frontendarena.online/verify/{recentRecord.uniqueId}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Participant:</span>
                    <span className="font-bold text-[#0F172A]">{recentRecord.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Generated ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#2563EB]">{recentRecord.uniqueId}</span>
                      <button
                        onClick={() => copyToClipboard(recentRecord.uniqueId)}
                        className="text-[#64748B] hover:text-[#0F172A] p-0.5"
                        title="Copy Unique ID"
                      >
                        {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B] font-medium">Status:</span>
                    <Badge variant="solid" size="sm" className="bg-[#22C55E] text-white">
                      {recentRecord.status}
                    </Badge>
                  </div>
                </div>

                {/* Download Button */}
                <div className="w-full flex gap-2">
                  <Button
                    onClick={() => handleDownload(recentRecord.uniqueId)}
                    variant="default"
                    className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Download QR (.png)
                  </Button>
                  <a
                    href={`/verify/${recentRecord.uniqueId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
                    title="Open Verification Page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#94A3B8] space-y-2">
                <QrCode className="h-12 w-12 mx-auto stroke-1 opacity-50" />
                <p className="text-xs font-medium">
                  No QR generated in this session yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated IDs Management List */}
      <Card className="border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#0F172A]">
              Generated Verification Records
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              View, preview, download, or revoke existing verification IDs.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <Input
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchRecords(e.target.value);
                }}
                className="pl-9 text-xs bg-white border-[#E2E8F0]"
              />
            </div>
            <Button
              onClick={() => fetchRecords()}
              variant="outline"
              size="sm"
              className="border-[#E2E8F0]"
              title="Refresh list"
            >
              <RefreshCw className="h-4 w-4 text-[#64748B]" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loadingRecords ? (
            <div className="flex items-center justify-center py-12 text-[#64748B] text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
              Loading records...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8] text-xs">
              No verification records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Unique ID</th>
                  <th className="py-3 px-4">Verification URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      {rec.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                      {rec.uniqueId}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/verify/${rec.uniqueId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        /verify/{rec.uniqueId}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      {rec.status === "ACTIVE" ? (
                        <Badge variant="solid" size="sm" className="bg-[#22C55E] text-white">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" className="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]">
                          REVOKED
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {new Date(rec.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <Button
                        onClick={() => handleOpenPreview(rec)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        title="View QR Code"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#475569]" />
                      </Button>

                      <Button
                        onClick={() => handleDownload(rec.uniqueId)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        title="Download High-Res QR PNG"
                      >
                        <Download className="h-3.5 w-3.5 text-[#2563EB]" />
                      </Button>

                      {rec.status === "ACTIVE" && (
                        <Button
                          onClick={() => handleRevoke(rec.id)}
                          disabled={revokingId === rec.id}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs border-[#EF4444]/30 text-[#DC2626] hover:bg-[#EF4444]/10"
                          title="Revoke Credential"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* View QR Modal / Drawer */}
      {previewRecord && previewQrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-base text-[#0F172A]">
                QR Code Preview
              </h3>
              <button
                onClick={() => setPreviewRecord(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
              <img
                src={previewQrDataUrl}
                alt={`QR Code for ${previewRecord.uniqueId}`}
                className="w-56 h-56 object-contain"
              />
              <span className="text-[11px] font-mono text-[#64748B] mt-2">
                https://frontendarena.online/verify/{previewRecord.uniqueId}
              </span>
            </div>

            <div className="space-y-1 text-xs bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Name:</span>
                <span className="font-bold text-[#0F172A]">{previewRecord.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Unique ID:</span>
                <span className="font-mono font-bold text-[#2563EB]">{previewRecord.uniqueId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Status:</span>
                <Badge
                  variant={previewRecord.status === "ACTIVE" ? "solid" : "secondary"}
                  size="sm"
                  className={previewRecord.status === "ACTIVE" ? "bg-[#22C55E] text-white" : "bg-[#FEF3C7] text-[#92400E]"}
                >
                  {previewRecord.status}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleDownload(previewRecord.uniqueId)}
                variant="default"
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Download High-Res PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
