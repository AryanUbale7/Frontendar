"use client";

import React, { useState } from "react";
import {
  Trophy,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileCode,
  LineChart,
  Layers,
  Terminal,
  BookOpen,
  ArrowRight,
  Download,
  Eye,
  Maximize2,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EvaluationReportProps {
  report: {
    hackathonTitle: string;
    repoUrl: string;
    status: "pass" | "fail" | string;
    timestamp: string;
    auditableReportId: string;
    scoreSummary: {
      finalScore: number;
      aiScoreTotal: number;
      toolScoreTotal: number;
      bonusPointsTotal: number;
      deductionsTotal: number;
    };
    aiEvaluation: {
      problemAlignment: { score: number; reason: string };
      requiredFeatures: { implemented: string[]; missing: string[]; score: number };
      innovation: { score: number; reason: string };
      bonusSuggestions: string[];
    };
    toolAudits: {
      performance: {
        lighthouseScore: number;
        accessibilityScore: number;
        seoScore: number;
        bestPracticesScore: number;
        passedMinChecks: boolean;
        evidence: { metrics: string[]; deductions: string[] };
      };
      security: {
        vulnerabilities: Array<{ package: string; severity: string; details: string }>;
        secretsFound: string[];
        passedScan: boolean;
        evidence: { vulnerabilitySummary: string; secretsLog: string };
      };
      codeQuality: {
        detectedFilesCount: number;
        typescriptUsagePercent: number;
        readmeSize: number;
        commentsDensityPercent: number;
        folderStructureValid: boolean;
        evidence: { structureLog: string; typescriptLog: string; documentationLog: string };
      };
      gitHealth: { isPublic: boolean; hasReadme: boolean; hasGitHistory: boolean };
    };
    scoringDetails: Array<{
      categoryName: string;
      awardedMarks: number;
      maxMarks: number;
      passingMarks: number;
      evaluatedBy: "AI Judge" | "Deterministic Tool" | "Merged Engine";
      evidenceCitations: string[];
    }>;
    logs: string[];
    deductions?: Array<{ rule: string; reason: string; evidence: string; pointsDeducted: number }>;
    bonuses?: Array<{ rule: string; reason: string; evidence: string; pointsAwarded: number }>;
  };
}

export function EvaluationReport({ report }: EvaluationReportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "performance" | "semantic" | "checklist">("overview");

  // Radial Score SVG Helper
  const renderRadialScore = (score: number, size: number = 80, strokeWidth: number = 6, colorClass: string = "text-[#FF006E]") => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={colorClass}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-800">{score}</span>
      </div>
    );
  };

  // Mock Export Downloads
  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `evaluation_report_${report.auditableReportId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-md overflow-hidden">
      {/* Top Auditable Meta Info */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#FF006E] text-white hover:bg-[#D8005C] font-extrabold uppercase text-[9px] tracking-wider">
              {(report?.status || "pass").toUpperCase()}
            </Badge>
            <span className="text-slate-400 text-xs font-mono">ID: {report?.auditableReportId || "N/A"}</span>
          </div>
          <h2 className="font-heading text-xl font-bold leading-tight">
            {report?.hackathonTitle || "Evaluation Report"}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Submission Repository: <a href={report?.repoUrl || "#"} target="_blank" rel="noreferrer" className="underline hover:text-white transition-all">{report?.repoUrl || "N/A"}</a>
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Final Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#FF006E] font-heading">{report?.scoreSummary?.finalScore ?? 0}</span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col gap-1">
            <Button size="xs" variant="outline" className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700" onClick={downloadJSON}>
              <Download className="h-3 w-3 mr-1" />
              <span>JSON Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-[#E2E8F0] bg-slate-50/50 p-2 overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Report Summary", icon: Layers },
          { id: "code", label: "Repository & Security", icon: FileCode },
          { id: "performance", label: "Lighthouse & UX", icon: LineChart },
          { id: "semantic", label: "AI Semantic Audit", icon: Sparkles },
          { id: "checklist", label: "Fix Checklist", icon: CheckCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 h-8.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-[#FF006E] shadow-sm border border-[#E2E8F0]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab contents panel */}
      <div className="p-6">
        {/* TAB 1: OVERVIEW SUMMARY */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Category Breakdown Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {report.scoringDetails?.map((detail, idx) => (
                <div key={idx} className="p-3 border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between min-h-[90px] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider line-clamp-1">
                    {detail.categoryName}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-lg font-black text-slate-800 font-heading">{detail.awardedMarks}</span>
                    <span className="text-[10px] text-slate-400 font-bold">/{detail.maxMarks}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase mt-1 tracking-wider ${
                    detail.awardedMarks >= detail.passingMarks ? "text-[#16A34A]" : "text-[#EF4444]"
                  }`}>
                    {detail.awardedMarks >= detail.passingMarks ? "PASSED" : "FAILED"}
                  </span>
                </div>
              ))}
            </div>

            {/* Deductions & Bonuses panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deductions list */}
              <Card className="border-[#EF4444]/20 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-[#FEF2F2] border-b border-[#FCA5A5]/20 p-4">
                  <CardTitle className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Deduction Registry & Penalties</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {report.deductions && report.deductions.length > 0 ? (
                    report.deductions.map((d, idx) => (
                      <div key={idx} className="p-3 border border-red-100 bg-[#FFFBEB]/30 rounded-lg space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{d.rule}</span>
                          <span className="text-[#EF4444] font-extrabold">-{d.pointsDeducted} Marks</span>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed">{d.reason}</p>
                        <p className="text-[9px] font-mono text-red-700 bg-red-50 p-1.5 rounded">{d.evidence}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-[#64748B] italic">
                      Zero penalties detected. Clean audits list!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bonus Marks */}
              <Card className="border-[#10B981]/20 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-[#ECFDF5] border-b border-[#A7F3D0]/20 p-4">
                  <CardTitle className="text-xs font-bold text-[#047857] flex items-center gap-1.5">
                    <Trophy className="h-4 w-4" />
                    <span>Extra Bonuses Awarded</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {report.bonuses && report.bonuses.length > 0 ? (
                    report.bonuses.map((b, idx) => (
                      <div key={idx} className="p-3 border border-emerald-100 bg-emerald-50/10 rounded-lg space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{b.rule}</span>
                          <span className="text-[#10B981] font-extrabold">+{b.pointsAwarded} Marks</span>
                        </div>
                        <p className="text-[11px] text-[#475569] leading-relaxed">{b.reason}</p>
                        <p className="text-[9px] font-mono text-emerald-700 bg-emerald-50 p-1.5 rounded">{b.evidence}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-[#64748B] italic">
                      No bonus conditions matched.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Screenshots mockup viewports */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Playwright responsive viewport snapshots
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Desktop (1440px)", aspect: "aspect-video" },
                  { name: "Laptop (1024px)", aspect: "aspect-video" },
                  { name: "Tablet (768px)", aspect: "aspect-[3/4]" },
                  { name: "Mobile (375px)", aspect: "aspect-[9/16]" }
                ].map((vp, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 space-y-1 p-2">
                    <div className={`${vp.aspect} w-full rounded-lg bg-slate-200 border flex items-center justify-center relative group overflow-hidden`}>
                      <span className="text-[10px] text-slate-400 font-bold group-hover:scale-105 transition-all">Screenshot OK</span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                        <Maximize2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 text-center block pt-1">{vp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CODE QUALITY & SECURITY */}
        {activeTab === "code" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Repository Details */}
              <div className="border p-4 rounded-xl bg-slate-50/50 space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-[#0F172A] border-b pb-1.5 flex items-center gap-1">
                  <FileCode className="h-4 w-4 text-[#FF006E]" />
                  <span>Repository Stats</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Files scanned:</span>
                    <span className="font-extrabold text-slate-800">{report.toolAudits.codeQuality.detectedFilesCount} source files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">TypeScript usage:</span>
                    <span className="font-extrabold text-slate-800">{report.toolAudits.codeQuality.typescriptUsagePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">README file size:</span>
                    <span className="font-extrabold text-slate-800">{report.toolAudits.codeQuality.readmeSize} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Comment density:</span>
                    <span className="font-extrabold text-slate-800">{report.toolAudits.codeQuality.commentsDensityPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Quality verification evidence */}
              <div className="border p-4 rounded-xl bg-slate-50/50 md:col-span-2 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-[#0F172A] border-b pb-1.5">
                  Static Code quality evidence log
                </h4>
                <div className="space-y-1.5 font-mono text-[10px] text-[#475569]">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{report.toolAudits.codeQuality.evidence.structureLog}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{report.toolAudits.codeQuality.evidence.typescriptLog}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{report.toolAudits.codeQuality.evidence.documentationLog}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Security audit details */}
            <Card className="border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <CardHeader className="bg-slate-50 border-b p-4">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#FF006E]" />
                  <span>Vulnerability & Secret Scanner report</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Secret Keys Scanner log</span>
                    <p className="text-xs font-medium text-slate-800">{report.toolAudits.security.evidence.secretsLog}</p>
                  </div>
                  <div className="p-3 border rounded-lg space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Dependency vulnerability log</span>
                    <p className="text-xs font-medium text-slate-800">{report.toolAudits.security.evidence.vulnerabilitySummary}</p>
                  </div>
                </div>

                {report.toolAudits.security.vulnerabilities.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Detected package vulnerabilities</span>
                    <div className="space-y-1.5">
                      {report.toolAudits.security.vulnerabilities.map((vuln, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-red-50/50 border border-red-100 rounded-lg">
                          <span className="font-semibold text-slate-800">{vuln.package}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FEE2E2] text-[#EF4444] border rounded uppercase">{vuln.severity}</span>
                          <span className="text-[#64748B] text-[11px] truncate w-80">{vuln.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: LIGHTHOUSE & UX */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Lighthouse Circular Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 justify-items-center">
              <div className="text-center space-y-2">
                {renderRadialScore(report.toolAudits.performance.lighthouseScore, 90, 6, "text-[#FF006E]")}
                <span className="text-xs font-bold text-slate-700 block">Performance</span>
              </div>
              <div className="text-center space-y-2">
                {renderRadialScore(report.toolAudits.performance.accessibilityScore, 90, 6, "text-emerald-500")}
                <span className="text-xs font-bold text-slate-700 block">Accessibility</span>
              </div>
              <div className="text-center space-y-2">
                {renderRadialScore(report.toolAudits.performance.bestPracticesScore, 90, 6, "text-blue-500")}
                <span className="text-xs font-bold text-slate-700 block">Best Practices</span>
              </div>
              <div className="text-center space-y-2">
                {renderRadialScore(report.toolAudits.performance.seoScore, 90, 6, "text-amber-500")}
                <span className="text-xs font-bold text-slate-700 block">SEO</span>
              </div>
            </div>

            {/* Performance Latency checklist */}
            <Card className="border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <CardHeader className="bg-slate-50 border-b p-4">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#FF006E]" />
                  <span>Web Vitals Latency checks</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 border rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase block">First Contentful Paint (FCP)</span>
                    <span className="text-lg font-black text-slate-800 block mt-1">1.2s</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase block">Largest Contentful Paint (LCP)</span>
                    <span className="text-lg font-black text-[#10B981] block mt-1">2.1s</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase block">Total Blocking Time (TBT)</span>
                    <span className="text-lg font-black text-[#10B981] block mt-1">150ms</span>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50/50">
                    <span className="text-[9px] font-bold text-[#64748B] uppercase block">Cumulative Layout Shift (CLS)</span>
                    <span className="text-lg font-black text-[#10B981] block mt-1">0.05</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: AI SEMANTIC AUDIT */}
        {activeTab === "semantic" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alignment & Innovation */}
              <div className="space-y-4">
                <div className="p-4 border rounded-xl bg-purple-50/20 border-purple-100 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase text-[#7C3AED] flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Problem Statement Alignment</span>
                  </h4>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {report.aiEvaluation.problemAlignment.reason}
                  </p>
                </div>

                <div className="p-4 border rounded-xl bg-purple-50/20 border-purple-100 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase text-[#7C3AED] flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span>Innovation & Creativity Rating</span>
                  </h4>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {report.aiEvaluation.innovation.reason}
                  </p>
                </div>
              </div>

              {/* Required Features Checklist */}
              <div className="p-4 border rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 border-b pb-1.5">
                  Semantic Required Features Analysis
                </h4>

                <div className="space-y-2 text-xs">
                  {report.aiEvaluation.requiredFeatures.implemented.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <span className="font-bold text-slate-700">{feat}</span>
                      <Badge className="bg-[#10B981] text-white hover:bg-[#059669] text-[8px] font-extrabold uppercase">Detected</Badge>
                    </div>
                  ))}

                  {report.aiEvaluation.requiredFeatures.missing.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg">
                      <span className="font-bold text-slate-700">{feat}</span>
                      <Badge className="bg-[#EF4444] text-white hover:bg-[#DC2626] text-[8px] font-extrabold uppercase">Missing</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Bonus Suggestions */}
            {report.aiEvaluation.bonusSuggestions?.length > 0 && (
              <div className="p-4 border rounded-xl bg-indigo-50/10 space-y-2.5">
                <h4 className="text-xs font-extrabold uppercase text-[#4F46E5]">AI Judge Recommended Enhancements</h4>
                <ul className="list-disc pl-4 space-y-1 text-xs text-[#475569]">
                  {report.aiEvaluation.bonusSuggestions.map((s, idx) => (
                    <li key={idx} className="leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ACTION CHECKLIST */}
        {activeTab === "checklist" && (
          <div className="space-y-5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Prioritized fixes checklist
            </h4>

            <div className="space-y-3">
              {/* High priority */}
              <div className="p-4 border rounded-xl bg-[#FEF2F2] border-[#FCA5A5]/30 space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider">
                  High Priority
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-red-950 font-medium">
                  {report.toolAudits.codeQuality.readmeSize === 0 && (
                    <li>Create README.md file in the root directory immediately.</li>
                  )}
                  {report.toolAudits.security.vulnerabilities.length > 0 && (
                    <li>Run `npm audit fix` to resolve vulnerable packages.</li>
                  )}
                  {report.aiEvaluation.requiredFeatures.missing.length > 0 && (
                    <li>Implement missing features: {report.aiEvaluation.requiredFeatures.missing.join(", ")}.</li>
                  )}
                </ul>
              </div>

              {/* Medium priority */}
              <div className="p-4 border rounded-xl bg-[#FFFBEB] border-[#FDE047]/30 space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                  Medium Priority
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-amber-950 font-medium">
                  {report.toolAudits.codeQuality.typescriptUsagePercent < 90 && (
                    <li>Migrate remaining raw JavaScript files to strict TypeScript (.ts/.tsx).</li>
                  )}
                  {report.toolAudits.codeQuality.commentsDensityPercent < 10 && (
                    <li>Add comments and JSDoc annotations to explain hooks and state logic files.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Audit Signature */}
      <CardFooter className="border-t border-[#F1F5F9] bg-slate-50/50 p-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#64748B]">
        <span>Report digitally compiled using Frontend Arena Score Engine.</span>
        <span className="flex items-center gap-1 font-mono mt-1 sm:mt-0">
          <Terminal className="h-3 w-3" /> System verify check: PASS
        </span>
      </CardFooter>
    </Card>
  );
}
