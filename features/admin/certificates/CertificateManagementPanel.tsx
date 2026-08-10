"use client";

import React, { useState } from "react";
import { Award, Layers, Users } from "lucide-react";
import { FigmaCertificateEditor } from "./FigmaCertificateEditor";
import { BulkGenerator } from "./BulkGenerator";
import { IssuedCertificatesTable } from "./IssuedCertificatesTable";

export function CertificateManagementPanel() {
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "editor" | "issued">("editor");

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6 shadow-sm">
        <div className="space-y-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider">
              Bulk Certificate & QR System
            </span>
            <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">
              Official Credential Issuer
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
            Certificate Designer & QR Generator
          </h1>
          <p className="text-xs text-[#475569] leading-relaxed">
            Upload template images, interactively design certificates with Figma-style drag & drop, bulk generate unique participant IDs, and export PDF/PNG certificates.
          </p>
        </div>

        {/* Sub-Tab Switches (Horizontally scrollable on mobile) */}
        <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center p-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] min-w-max">
            <button
              onClick={() => setActiveSubTab("editor")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "editor"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#475569] hover:bg-[#E2E8F0]/60 hover:text-[#0F172A]"
              }`}
            >
              <Layers className="h-4 w-4" />
              Figma Designer
            </button>

            <button
              onClick={() => setActiveSubTab("generator")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "generator"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#475569] hover:bg-[#E2E8F0]/60 hover:text-[#0F172A]"
              }`}
            >
              <Users className="h-4 w-4" />
              Bulk Generator
            </button>

            <button
              onClick={() => setActiveSubTab("issued")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "issued"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-[#475569] hover:bg-[#E2E8F0]/60 hover:text-[#0F172A]"
              }`}
            >
              <Award className="h-4 w-4" />
              Issued Registry
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Content Views */}
      {activeSubTab === "editor" && (
        <FigmaCertificateEditor onSaveSuccess={() => setActiveSubTab("generator")} />
      )}

      {activeSubTab === "generator" && (
        <BulkGenerator onSuccess={() => setActiveSubTab("issued")} />
      )}

      {activeSubTab === "issued" && (
        <IssuedCertificatesTable />
      )}
    </div>
  );
}
