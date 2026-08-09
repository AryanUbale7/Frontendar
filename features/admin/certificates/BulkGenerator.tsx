"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  Users,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CertificateTemplateRecord } from "./types";
import { PRESET_TEMPLATES } from "./presets";

interface BulkGeneratorProps {
  onSuccess?: () => void;
}

export function BulkGenerator({ onSuccess }: BulkGeneratorProps) {
  const [templates, setTemplates] = useState<CertificateTemplateRecord[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("modern-minimal");

  const [eventName, setEventName] = useState("Frontend Arena Hackathon 2026");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  );

  const [manualText, setManualText] = useState("");
  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const res = await fetch("/api/certificates/templates");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setTemplates(list);
            setSelectedTemplateId(list[0].id);
          } else {
            // Fallback to presets if no custom templates exist yet
            const defaultPresets: CertificateTemplateRecord[] = PRESET_TEMPLATES.map((p) => ({
              id: p.id,
              title: p.name,
              description: p.description,
              layout: p.layout,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            setTemplates(defaultPresets);
            setSelectedTemplateId(defaultPresets[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch templates:", e);
        const defaultPresets: CertificateTemplateRecord[] = PRESET_TEMPLATES.map((p) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          layout: p.layout,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setTemplates(defaultPresets);
        setSelectedTemplateId(defaultPresets[0].id);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Update parsed names when manualText changes (splits on newlines, commas, or multiple spaces)
  useEffect(() => {
    if (!manualText.trim()) {
      setParsedNames([]);
      setDuplicateCount(0);
      return;
    }

    const items = manualText
      .split(/[\r\n,]+|\s{2,}/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const nameSet = new Set<string>();
    let dupes = 0;
    const finalNames: string[] = [];

    for (const name of items) {
      if (nameSet.has(name.toLowerCase())) {
        dupes++;
      } else {
        nameSet.add(name.toLowerCase());
        finalNames.push(name);
      }
    }

    setParsedNames(finalNames);
    setDuplicateCount(dupes);
  }, [manualText]);

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/);
      const names: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip CSV headers if detected
        if (i === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("participant"))) {
          continue;
        }

        // Handle CSV comma separation
        const parts = line.split(",");
        const candidate = parts[0].replace(/^["']|["']$/g, "").trim();
        if (candidate) {
          names.push(candidate);
        }
      }

      setManualText(names.join("\n"));
    };
    reader.readAsText(file);
  };

  const handleGenerateBulk = async () => {
    if (parsedNames.length === 0) {
      setError("Please enter or upload at least one participant name.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setResultMessage(null);

      const res = await fetch("/api/certificates/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: parsedNames,
          templateId: selectedTemplateId || undefined,
          eventName: eventName.trim(),
          issueDate: issueDate.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to generate bulk certificates.");
      }

      const json = await res.json();
      setResultMessage(json.message || `Successfully generated ${parsedNames.length} certificates.`);
      setManualText("");
      setParsedNames([]);

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during bulk generation.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="solid" className="bg-[#2563EB] text-white font-bold">
              Bulk Certificate Engine
            </Badge>
            <span className="text-xs text-[#64748B] font-medium">Automatic Unique ID & QR Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Import Participants & Generate</h2>
          <p className="text-xs text-[#475569]">
            Upload a CSV participant list or paste names to generate personalized certificates with verification QRs.
          </p>
        </div>
      </div>

      {resultMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{resultMessage}</span>
          </div>
          {onSuccess && (
            <Button
              onClick={onSuccess}
              variant="outline"
              size="sm"
              className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
            >
              View Issued Certificates
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Step 1: Event Details & Template Selection */}
        <Card className="md:col-span-5 border-[#E2E8F0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#2563EB]" />
              Configuration
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Select layout template and certificate metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                Certificate Template
              </label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 py-2 text-[#64748B]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
                  Loading saved templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] text-xs">
                  Using default preset template (Classic Gold).
                </div>
              ) : (
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A]"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                Event / Hackathon Name
              </label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Frontend Arena Hackathon 2026"
                className="bg-white border-[#E2E8F0] text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                Issue Date
              </label>
              <Input
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="e.g. August 9, 2026"
                className="bg-white border-[#E2E8F0] text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Upload CSV or Paste Names */}
        <Card className="md:col-span-7 border-[#E2E8F0] bg-white shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#2563EB]" />
                Participant Names List
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Upload CSV file or enter names one per line.
              </CardDescription>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] hover:bg-[#E2E8F0]/50 transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#2563EB]" />
              Upload CSV
              <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
            <textarea
              rows={8}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Aryan Ubale&#10;Rahul Sharma&#10;Priya Patil&#10;Aman Shah"
              className="w-full flex-1 p-3 rounded-xl border border-[#E2E8F0] bg-white text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#2563EB] resize-none"
            />

            {/* List Summary Footer */}
            <div className="flex items-center justify-between text-xs bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0F172A]">
                  Total Participants: <span className="text-[#2563EB]">{parsedNames.length}</span>
                </span>
                {duplicateCount > 0 && (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {duplicateCount} duplicates found
                  </span>
                )}
              </div>

              <Button
                onClick={handleGenerateBulk}
                disabled={generating || parsedNames.length === 0}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Certificates...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate {parsedNames.length > 0 ? `${parsedNames.length} Certificates` : "Bulk"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
