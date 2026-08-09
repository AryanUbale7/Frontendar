"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import {
  Search,
  Download,
  Eye,
  Ban,
  ExternalLink,
  Loader2,
  RefreshCw,
  Award,
  FileDown,
  X,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CertificateRecord } from "./types";
import { CertificateCanvasRenderer, downloadCanvasAsPng, downloadCertificateAsPdf } from "./CertificateCanvasRenderer";
import { PRESET_TEMPLATES } from "./presets";

export function IssuedCertificatesTable() {
  const [records, setRecords] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Modal preview state
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchRecords = useCallback(async (query = searchQuery) => {
    try {
      setLoading(true);
      let localCerts: CertificateRecord[] = [];
      try {
        localCerts = JSON.parse(localStorage.getItem("fa_local_issued_certificates") || "[]");
      } catch {
        localCerts = [];
      }

      let serverList: CertificateRecord[] = [];
      const url = query ? `/api/certificates?search=${encodeURIComponent(query)}` : "/api/certificates";
      const res = await fetch(url);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          serverList = list;
        }
      }

      const map = new Map<string, CertificateRecord>();
      for (const item of localCerts) {
        if (!query || item.participantName?.toLowerCase().includes(query.toLowerCase()) || item.uniqueId?.toLowerCase().includes(query.toLowerCase())) {
          map.set(item.uniqueId, item);
        }
      }
      for (const item of serverList) {
        map.set(item.uniqueId, item);
      }

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecords(combined);
    } catch (e) {
      console.error("Failed to fetch certificates:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle single QR Download
  const handleDownloadQr = async (uniqueId: string) => {
    try {
      const verifyUrl = `https://frontendarena.online/verify/${uniqueId}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 1024,
        margin: 2,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });

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

  // Handle single Certificate Revocation
  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this certificate? Revoked certificates will permanently fail public verification checks.")) {
      return;
    }

    try {
      setRevokingId(id);
      const res = await fetch(`/api/certificates/${id}/revoke`, { method: "PUT" });
      if (res.ok) {
        fetchRecords();
        if (previewCert?.id === id) {
          setPreviewCert({ ...previewCert, status: "REVOKED" });
        }
      }
    } catch (e) {
      console.error("Failed to revoke certificate:", e);
    } finally {
      setRevokingId(null);
    }
  };

  const handleDownloadSingleCertificate = (cert: CertificateRecord) => {
    setPreviewCert(cert);
    setTimeout(() => {
      if (activeCanvasRef.current) {
        const cleanName = cert.participantName.replace(/[^a-zA-Z0-9]/g, "-");
        downloadCanvasAsPng(activeCanvasRef.current, `${cleanName}-${cert.uniqueId}.png`);
      }
    }, 300);
  };

  const handleDeleteAllCertificates = async () => {
    if (!confirm("Are you sure you want to delete ALL issued certificates? (QR verification records will remain active for validation).")) {
      return;
    }

    try {
      setLoading(true);
      try {
        localStorage.removeItem("fa_local_issued_certificates");
      } catch {
        // Ignore
      }

      await fetch("/api/certificates/all", { method: "DELETE" });

      setRecords([]);
      alert("All certificate records deleted successfully. QR verification IDs preserved.");
    } catch (e) {
      console.error("Failed to delete all certificates:", e);
      alert("Failed to delete certificates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-[#E2E8F0] shadow-sm bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#2563EB]" />
              Issued Certificates Registry
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              View, preview, download, or revoke issued participant certificates and QR codes.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <Input
                placeholder="Search participant or ID..."
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
            <Button
              onClick={handleDeleteAllCertificates}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
              title="Delete All Certificates (QR Verifications Preserved)"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete All
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#64748B] text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
              Loading certificate records...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8] text-xs space-y-2">
              <Award className="h-8 w-8 mx-auto opacity-50 stroke-1" />
              <p>No issued certificates found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Unique ID</th>
                  <th className="py-3 px-4">Event Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium">
                {records.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      {cert.participantName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                      {cert.uniqueId}
                    </td>
                    <td className="py-3 px-4 text-[#475569]">
                      {cert.eventName || "Frontend Arena Competition"}
                    </td>
                    <td className="py-3 px-4">
                      {cert.status === "ACTIVE" ? (
                        <Badge variant="solid" size="sm" className="bg-[#22C55E] text-white font-bold">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" className="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] font-bold">
                          REVOKED
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {cert.issueDate ||
                        new Date(cert.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <Button
                        onClick={() => setPreviewCert(cert)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        title="Preview Certificate"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#475569]" />
                      </Button>

                      <Button
                        onClick={() => handleDownloadSingleCertificate(cert)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs border-[#E2E8F0] text-[#2563EB] hover:bg-[#2563EB]/10"
                        title="Download Certificate PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        onClick={() => handleDownloadQr(cert.uniqueId)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs border-[#E2E8F0] text-emerald-600 hover:bg-emerald-50"
                        title="Download Standalone QR PNG"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>

                      <a
                        href={`/verify/${cert.uniqueId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                        title="Open Verification Link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      {cert.status === "ACTIVE" && (
                        <Button
                          onClick={() => handleRevoke(cert.id)}
                          disabled={revokingId === cert.id}
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

      {/* Modal Preview Certificate */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  Certificate Preview: {previewCert.participantName}
                </h3>
                <span className="text-xs text-[#2563EB] font-mono font-bold">
                  {previewCert.uniqueId}
                </span>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex justify-center">
              <CertificateCanvasRenderer
                layout={(() => {
                  if (previewCert.snapshotLayout && Object.keys(previewCert.snapshotLayout).length > 0 && (previewCert.snapshotLayout as any).elements) {
                    return previewCert.snapshotLayout;
                  }
                  try {
                    const customTpls = JSON.parse(localStorage.getItem("fa_custom_certificate_templates") || "[]");
                    if (previewCert.templateId) {
                      const match = customTpls.find((t: any) => t.id === previewCert.templateId);
                      if (match && match.layout) return match.layout;
                    }
                    if (customTpls.length > 0 && customTpls[0].layout) {
                      return customTpls[0].layout;
                    }
                  } catch {
                    // Ignore
                  }
                  return PRESET_TEMPLATES[0].layout;
                })()}
                participantName={previewCert.participantName}
                uniqueId={previewCert.uniqueId}
                eventName={previewCert.eventName || "Frontend Arena Competition"}
                issueDate={previewCert.issueDate || "August 9, 2026"}
                onCanvasReady={(canvas) => {
                  activeCanvasRef.current = canvas;
                }}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`/verify/${previewCert.uniqueId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-1"
              >
                Verification URL: /verify/{previewCert.uniqueId}
                <ExternalLink className="h-3 w-3" />
              </a>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (activeCanvasRef.current) {
                      const cleanName = previewCert.participantName.replace(/[^a-zA-Z0-9]/g, "-");
                      downloadCertificateAsPdf(activeCanvasRef.current, `${cleanName}-${previewCert.uniqueId}.pdf`);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => {
                    if (activeCanvasRef.current) {
                      const cleanName = previewCert.participantName.replace(/[^a-zA-Z0-9]/g, "-");
                      downloadCanvasAsPng(activeCanvasRef.current, `${cleanName}-${previewCert.uniqueId}.png`);
                    }
                  }}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
