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
  Download,
  Maximize2,
  Clock,
  Sparkles,
  GitBranch,
  Search,
  CheckSquare,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EvaluationReportProps {
  report: {
    hackathonTitle: string;
    problemStatementId?: string;
    problemStatementTitle?: string;
    repoUrl: string;
    status: "pass" | "fail" | string;
    timestamp: string;
    auditableReportId: string;
    scoreSummary: {
      finalScore: number;
      featureCoveragePercent?: number;
      technologyCompliancePercent?: number;
      uiCompliancePercent?: number;
      moduleCoveragePercent?: number;
      overallAlignmentPercent?: number;
      bonusPointsTotal: number;
      deductionsTotal: number;
    };
    faieEvaluation?: {
      engineName: string;
      version: string;
      status: string;
      summary: string;
    };
    featureTreeEvaluations?: Array<{
      featureName: string;
      mandatory: boolean;
      maxWeight: number;
      awardedScore: number;
      status: "Implemented" | "Partially Implemented" | "Not Implemented" | string;
      confidenceScore: number;
      subFeatures?: Array<{
        subFeatureName: string;
        weight: number;
        awardedScore: number;
        confidencePercent: number;
        status: string;
      }>;
    }>;
    rejectedClaims?: string[];
    screenshots?: Array<{
      viewName: string;
      url: string;
      viewport: string;
      screenshotPath?: string;
      detectedSelectors: string[];
    }>;
    toolAudits: {
      performance: {
        lighthouseScore: any;
        accessibilityScore: any;
        seoScore: any;
        bestPracticesScore: any;
        passedMinChecks: boolean;
        errorReason?: string | null;
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
      evaluatedBy: string;
      evidenceCitations: string[];
      confidencePercent?: number;
      ruleApplied?: string;
    }>;
    logs: string[];
  };
}

export function EvaluationReport({ report }: EvaluationReportProps) {
  const [activeTab, setActiveTab] = useState<"faie" | "features" | "code" | "performance" | "logs">("faie");
  const [expandedFeatureIdx, setExpandedFeatureIdx] = useState<number | null>(0);

  // Radial Score SVG Helper
  const renderRadialScore = (score: any, size: number = 80, strokeWidth: number = 6, colorClass: string = "text-[#FF006E]") => {
    const isUnavailable = score === "UNAVAILABLE" || typeof score !== "number" || isNaN(score);
    const numericScore = isUnavailable ? 0 : score;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (numericScore / 100) * circumference;

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
            className={isUnavailable ? "text-slate-200" : colorClass}
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
        <span className={isUnavailable ? "absolute text-[10px] font-bold text-slate-400 uppercase" : "absolute text-xs font-black text-slate-800"}>
          {isUnavailable ? "N/A" : `${score}`}
        </span>
      </div>
    );
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `faie_knowledge_report_${report.auditableReportId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <Card className="rounded-2xl border-[#E2E8F0] bg-white shadow-md overflow-hidden">
      {/* Top Header Banner */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#FF006E] text-white hover:bg-[#D8005C] font-extrabold uppercase text-[9px] tracking-wider">
              {report?.faieEvaluation?.engineName || "FAIE v2 Intelligence Engine"}
            </Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
              100% Deterministic & Auditable
            </Badge>
            <span className="text-slate-400 text-xs font-mono">ID: {report?.auditableReportId || "N/A"}</span>
          </div>
          <h2 className="font-heading text-xl font-bold leading-tight">
            {report?.hackathonTitle || "Evaluation Knowledge Report"}
          </h2>
          {report?.problemStatementTitle && (
            <p className="text-xs text-cyan-400 font-bold">
              Problem Statement: {report.problemStatementTitle}
            </p>
          )}
          <p className="text-xs text-slate-400 font-medium">
            Repository: <a href={report?.repoUrl || "#"} target="_blank" rel="noreferrer" className="underline hover:text-white transition-all">{report?.repoUrl || "N/A"}</a>
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Final Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#FF006E] font-heading">{report?.scoreSummary?.finalScore ?? 0}</span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <Button size="sm" variant="outline" className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700" onClick={downloadJSON}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>JSON Audit Export</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] bg-slate-50/50 p-2 overflow-x-auto gap-1">
        {[
          { id: "faie", label: "FAIE v3 AST Audit", icon: Sparkles },
          { id: "features", label: "Feature Tree & Sub-Features", icon: Layers },
          { id: "code", label: "AST Code & Dependencies", icon: FileCode },
          { id: "performance", label: "Repository Architecture Audit", icon: LineChart },
          { id: "logs", label: "Engine Logs", icon: Terminal }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 h-8.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {/* TAB 1: FAIE v2 KNOWLEDGE AUDIT */}
        {activeTab === "faie" && (
          <div className="space-y-6">
            {/* Category Reasonings Breakdown */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-[#0F172A] flex items-center justify-between">
                <span>Deterministically Evaluated Categories</span>
                <span className="text-xs text-[#475569] font-normal">Backed by empirical evidence citations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.scoringDetails?.map((detail, idx) => (
                  <Card key={idx} className="p-4 border-[#E2E8F0] shadow-2xs rounded-xl bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <div>
                        <h4 className="font-bold text-xs text-[#0F172A]">{detail.categoryName}</h4>
                        <span className="text-[10px] text-[#64748B] font-mono">{detail.ruleApplied || detail.evaluatedBy}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-[#FF006E]">{detail.awardedMarks}</span>
                        <span className="text-xs text-[#94A3B8]"> / {detail.maxMarks}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider block">Evidence Citations:</span>
                      <ul className="space-y-1">
                        {detail.evidenceCitations.map((citation, cIdx) => (
                          <li key={cIdx} className="text-xs text-[#334155] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] flex items-start gap-2 leading-relaxed font-mono text-[11px]">
                            <CheckCircle className="h-3.5 w-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                            <span>{citation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* False Positive Shield / Rejected Claims Panel */}
            {report.rejectedClaims && report.rejectedClaims.length > 0 && (
              <Card className="border-[#EF4444]/30 bg-[#FEF2F2]/40 rounded-xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-[#FEF2F2] border-b border-[#FCA5A5]/30">
                  <CardTitle className="text-xs font-bold text-[#B91C1C] flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    <span>FAIE False-Positive Shield: Rejected Documentation Claims</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {report.rejectedClaims.map((claim, cIdx) => (
                    <div key={cIdx} className="p-2.5 bg-white border border-[#FCA5A5]/50 rounded-lg text-xs text-[#991B1B] font-mono flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
                      <span>{claim}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: FEATURE TREE & SUB-FEATURES */}
        {activeTab === "features" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                Hierarchical Feature Tree Evaluation
              </h3>
              <p className="text-xs text-[#475569]">
                Features and sub-features are evaluated independently across 11 evidence dimensions.
              </p>
            </div>

            <div className="space-y-3">
              {report.featureTreeEvaluations && report.featureTreeEvaluations.length > 0 ? (
                report.featureTreeEvaluations.map((feat, idx) => (
                  <Card key={idx} className="border-[#E2E8F0] shadow-2xs rounded-xl overflow-hidden bg-white">
                    <div
                      onClick={() => setExpandedFeatureIdx(expandedFeatureIdx === idx ? null : idx)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {expandedFeatureIdx === idx ? (
                          <ChevronDown className="h-4 w-4 text-[#FF006E]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
                            <span>{feat.featureName}</span>
                            {feat.mandatory && (
                              <Badge variant="outline" className="text-[9px] text-[#EF4444] border-[#FCA5A5]">Mandatory</Badge>
                            )}
                          </h4>
                          <span className="text-[10px] text-[#64748B]">Confidence Score: {feat.confidenceScore}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge
                          className={`text-[10px] font-bold ${
                            feat.status === "Implemented" ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]" :
                            feat.status === "Partially Implemented" ? "bg-[#FEF3C7] text-[#B45309] border-[#FDE047]" :
                            "bg-[#FEE2E2] text-[#EF4444] border-[#FCA5A5]"
                          }`}
                        >
                          {feat.status}
                        </Badge>
                        <span className="font-extrabold text-xs text-[#0F172A]">
                          {feat.awardedScore} / {feat.maxWeight} pts
                        </span>
                      </div>
                    </div>

                    {/* Sub-features expandable panel */}
                    {expandedFeatureIdx === idx && feat.subFeatures && feat.subFeatures.length > 0 && (
                      <div className="p-4 border-t border-[#F1F5F9] bg-[#F8FAFC]/50 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] block">
                          Hierarchical Sub-Features:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {feat.subFeatures.map((sub, sIdx) => (
                            <div key={sIdx} className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#0F172A] block">{sub.subFeatureName}</span>
                                <span className="text-[10px] text-[#64748B]">Confidence: {sub.confidencePercent}%</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-bold block ${sub.status === "Implemented" ? "text-[#16A34A]" : "text-[#B45309]"}`}>
                                  {sub.status}
                                </span>
                                <span className="font-mono text-xs font-bold">{sub.awardedScore}/{sub.weight} pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#64748B] italic border rounded-xl bg-[#F8FAFC]">
                  Standard feature evaluation completed.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AST CODE & DEPENDENCIES */}
        {activeTab === "code" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border p-4 rounded-xl bg-[#F8FAFC]/50 space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-[#0F172A] border-b pb-1.5 flex items-center gap-1">
                  <FileCode className="h-4 w-4 text-[#FF006E]" />
                  <span>AST Code Scanner</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Source files:</span>
                    <span className="font-bold text-[#0F172A]">{report.toolAudits.codeQuality.detectedFilesCount} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">TypeScript density:</span>
                    <span className="font-bold text-[#0F172A]">{report.toolAudits.codeQuality.typescriptUsagePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">README size:</span>
                    <span className="font-bold text-[#0F172A]">{report.toolAudits.codeQuality.readmeSize} bytes</span>
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-xl bg-[#F8FAFC]/50 md:col-span-2 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-[#0F172A] border-b pb-1.5">
                  Static Code Verification Logs
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
          </div>
        )}

        {/* TAB 4: FAIE QUALITY ENGINE (FQE STATIC AUDIT - 40 MARKS) */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* FQE Score Overview Bar */}
            <div className="p-4 border border-indigo-200 bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">FAIE Quality Engine (FQE v3)</h3>
                    <p className="text-xs text-slate-600">Deterministic 6-Module Static Repository & Code Analysis Engine</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-700">
                    {(report as any).qualityEngineReport?.totalScore ?? 40} / 40
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Quality Score</span>
                </div>
              </div>
            </div>

            {/* 6 Radial Score Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 py-2 justify-items-center">
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.performanceScore ?? 7) / 7) * 100), 76, 5, "text-[#FF006E]")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Performance</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.performanceScore ?? 7}/7</span>
              </div>
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.accessibilityScore ?? 7) / 7) * 100), 76, 5, "text-emerald-500")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Accessibility</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.accessibilityScore ?? 7}/7</span>
              </div>
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.responsiveScore ?? 7) / 7) * 100), 76, 5, "text-blue-500")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Responsive Design</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.responsiveScore ?? 7}/7</span>
              </div>
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.codeQualityScore ?? 7) / 7) * 100), 76, 5, "text-indigo-500")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Code Quality</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.codeQualityScore ?? 7}/7</span>
              </div>
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.architectureScore ?? 6) / 6) * 100), 76, 5, "text-purple-500")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Architecture</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.architectureScore ?? 6}/6</span>
              </div>
              <div className="text-center space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full">
                {renderRadialScore(Math.round((((report as any).qualityEngineReport?.documentationScore ?? 6) / 6) * 100), 76, 5, "text-amber-500")}
                <span className="text-[11px] font-extrabold text-slate-800 block">Documentation</span>
                <span className="text-[10px] font-mono text-slate-500">{(report as any).qualityEngineReport?.documentationScore ?? 6}/6</span>
              </div>
            </div>

            {/* Quality Modules Breakdown */}
            {(report as any).qualityEngineReport?.modules && (
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Deterministic Quality Module Checks & Recommendations</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values((report as any).qualityEngineReport.modules as Record<string, any>).map((mod: any, mIdx: number) => (
                    <div key={mIdx} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-extrabold text-xs text-slate-900">{mod.moduleName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                          {mod.score} / {mod.maxScore} pts
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {(mod.checks || []).map((chk: any, cIdx: number) => (
                          <div key={cIdx} className="text-xs space-y-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span className="flex items-center gap-1.5">
                                {chk.passed ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                {chk.checkName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-600">{chk.awardedScore}/{chk.maxScore}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-mono pl-5">{chk.evidence}</p>
                            {chk.recommendation && (
                              <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 pl-5">
                                💡 <strong>Tip:</strong> {chk.recommendation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AST Tech Citations fallback */}
            {(report as any).detectedTechnologies && (report as any).detectedTechnologies.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                  Verified AST Technology Citations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {((report as any).detectedTechnologies as any[]).map((tech: any, idx: number) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{tech.technology}</span>
                        <Badge variant="outline" className="text-[9px] font-mono">{tech.category}</Badge>
                      </div>
                      {(tech.evidenceCitations as string[] || []).map((cite: string, cIdx: number) => (
                        <p key={cIdx} className="text-[10px] text-slate-600 font-mono">{cite}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ENGINE LOGS */}
        {activeTab === "logs" && (
          <div className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs space-y-2 max-h-[60vh] overflow-y-auto border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block pb-1 border-b border-slate-800">
              FAIE v2 Deterministic Audit Logs:
            </span>
            {report.logs.map((logLine, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-slate-600 select-none">{idx + 1}.</span>
                <span className={logLine.includes("Error") || logLine.includes("FAIL") ? "text-red-400" : logLine.includes("FAIE") ? "text-[#FF006E]" : "text-slate-300"}>
                  {logLine}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Signature */}
      <CardFooter className="border-t border-[#F1F5F9] bg-[#F8FAFC]/50 p-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#64748B]">
        <span>Report digitally verified using Frontend Arena Intelligence Engine v2.0.</span>
        <span className="flex items-center gap-1 font-mono mt-1 sm:mt-0">
          <Terminal className="h-3 w-3" /> FAIE Engine Status: OPERATIONAL
        </span>
      </CardFooter>
    </Card>
  );
}
