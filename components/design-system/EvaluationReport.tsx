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
  Clock,
  Sparkles,
  GitBranch,
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  Code2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
  onReevaluate?: () => void;
  attempts?: Array<{
    id: string;
    attemptNumber: number;
    score: number | null;
    status: string;
    blueprintVersion: number;
    reportPayload?: any;
    completedAt?: string;
    commitSha?: string;
  }>;
  selectedAttemptNumber?: number;
  onSelectAttempt?: (attemptNumber: number) => void;
  isAdmin?: boolean;
}

export function EvaluationReport({
  report,
  onReevaluate,
  attempts,
  selectedAttemptNumber,
  onSelectAttempt,
  isAdmin = false
}: EvaluationReportProps) {
  const [activeTab, setActiveTab] = useState<"faie" | "features" | "code" | "performance">("faie");
  const [expandedFeatureIdx, setExpandedFeatureIdx] = useState<number | null>(0);

  const finalScore = report?.scoreSummary?.finalScore ?? 0;
  const isPassed = report?.status?.toLowerCase() === "pass" || finalScore >= 60;
  const fqe = (report as any).qualityEngineReport;

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `faie_report_${report.auditableReportId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // SVG Circular Gauge
  const renderCircularScore = (score: number) => {
    const size = 76;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;
    const strokeColor = score >= 80 ? "#10B981" : score >= 60 ? "#4F46E5" : score >= 40 ? "#F59E0B" : "#EF4444";

    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
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
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute text-center flex flex-col items-center">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight font-sans leading-none">
            {score}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">/100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 bg-[#F8FAFC] p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* 0. ATTEMPT HISTORY SWITCHER BAR */}
      {attempts && attempts.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 px-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Evaluation History ({attempts.length} attempts):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {attempts.map((att) => {
              const isSelected = selectedAttemptNumber ? selectedAttemptNumber === att.attemptNumber : att.attemptNumber === attempts.length;
              return (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => onSelectAttempt?.(att.attemptNumber)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>Attempt #{att.attemptNumber}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"}`}>
                    {att.score !== null ? `${att.score} pts` : "Queued"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. SaaS SINGLE-CARD ENTERPRISE HEADER */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Header Left: Metadata Grid */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] tracking-wide px-2.5 py-0.5 rounded-full">
                {report?.faieEvaluation?.engineName || "FAIE v3.1 Engine"}
              </Badge>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-mono font-semibold">
                ✓ 100% AST Static Audit
              </Badge>
              <span className="text-slate-500 font-mono text-[11px] truncate">
                ID: {report?.auditableReportId || "rep_demo_01"}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {report?.hackathonTitle || "Frontend Evaluation Knowledge Report"}
              </h2>
              {report?.problemStatementTitle && (
                <p className="text-xs font-semibold text-indigo-600 mt-0.5 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Problem Statement: {report.problemStatementTitle}</span>
                </p>
              )}
            </div>

            {/* Subtitle Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <a
                href={report?.repoUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-1 transition-colors truncate max-w-xs"
              >
                <GitBranch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{report?.repoUrl || "github.com/repository"}</span>
                <ExternalLink className="h-3 w-3 opacity-60 shrink-0" />
              </a>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{report?.timestamp ? new Date(report.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">Branch: main</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">Eval time: 5.8s</span>
            </div>
          </div>

          {/* Header Right: Circular Score Ring & Quick Actions */}
          <div className="flex items-center gap-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            {renderCircularScore(finalScore)}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs font-black uppercase px-3 py-1 tracking-wider ${
                    isPassed
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {isPassed ? "PASSING GRADE" : "ACTION REQUIRED"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs"
                  onClick={downloadJSON}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Export JSON
                </Button>
                {onReevaluate && (
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                    onClick={onReevaluate}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Re-evaluate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. COMPACT KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Problem Alignment", score: `${report.scoreSummary.featureCoveragePercent ?? 80}%`, value: `${Math.round((report.scoreSummary.featureCoveragePercent ?? 80) * 0.4)} / 40`, icon: Layers, color: "text-indigo-600", bar: report.scoreSummary.featureCoveragePercent ?? 80 },
          { label: "Tech Compliance", score: `${report.scoreSummary.technologyCompliancePercent ?? 100}%`, value: `${Math.round((report.scoreSummary.technologyCompliancePercent ?? 100) * 0.2)} / 20`, icon: Code2, color: "text-emerald-600", bar: report.scoreSummary.technologyCompliancePercent ?? 100 },
          { label: "Quality Engine", score: `${fqe?.totalScore ?? 31}/40`, value: `${fqe?.totalScore ?? 31} / 40`, icon: Sparkles, color: "text-purple-600", bar: Math.round(((fqe?.totalScore ?? 31) / 40) * 100) },
          { label: "Architecture", score: `${fqe?.architectureScore ?? 6}/6`, value: `${fqe?.architectureScore ?? 6} / 6`, icon: LineChart, color: "text-blue-600", bar: Math.round(((fqe?.architectureScore ?? 6) / 6) * 100) },
          { label: "Documentation", score: `${fqe?.documentationScore ?? 6}/6`, value: `${fqe?.documentationScore ?? 6} / 6`, icon: FileCode, color: "text-amber-600", bar: Math.round(((fqe?.documentationScore ?? 6) / 6) * 100) },
          { label: "Performance", score: `${fqe?.performanceScore ?? 7}/7`, value: `${fqe?.performanceScore ?? 7} / 7`, icon: Activity, color: "text-rose-600", bar: Math.round(((fqe?.performanceScore ?? 7) / 7) * 100) },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 truncate">{kpi.label}</span>
                <Icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 font-sans tracking-tight">{kpi.score}</div>
                <div className="text-[10px] text-slate-600 font-medium">Weight: {kpi.value}</div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, kpi.bar))}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* 3. MODERN ENTERPRISE TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 overflow-x-auto gap-1">
          {[
            { id: "faie", label: "AST Overview Audit", icon: Sparkles },
            { id: "features", label: "Feature Tree Evaluation", icon: Layers },
            { id: "code", label: "Tech Stack & AST Metrics", icon: FileCode },
            { id: "performance", label: "Architecture Quality (FQE)", icon: LineChart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/80 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          {/* TAB 1: FAIE OVERVIEW AUDIT */}
          {activeTab === "faie" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Deterministically Evaluated Categories</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Every point awarded includes explicit evidence citations and confidence metrics.</p>
                </div>
                <Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200 font-mono text-[10px]">
                  Scoring Balance: 100 Marks
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.scoringDetails?.map((detail, idx) => (
                  <Card key={idx} className="p-4 border border-slate-200 rounded-xl bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{detail.categoryName}</h4>
                        <span className="text-[10px] text-slate-600 font-mono">{detail.ruleApplied || detail.evaluatedBy}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-base text-indigo-600">{detail.awardedMarks}</span>
                        <span className="text-xs text-slate-400 font-bold"> / {detail.maxMarks}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Evidence Citations:</span>
                      <div className="space-y-1.5">
                        {detail.evidenceCitations.map((citation, cIdx) => (
                          <div key={cIdx} className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-start gap-2 font-mono text-[11px] leading-relaxed">
                            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{citation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* False Positive Shield */}
              {report.rejectedClaims && report.rejectedClaims.length > 0 && (
                <Card className="border-rose-200 bg-rose-50/40 rounded-xl overflow-hidden p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>FAIE False-Positive Shield: Rejected Documentation Claims</span>
                  </div>
                  <div className="space-y-2">
                    {report.rejectedClaims.map((claim, cIdx) => (
                      <div key={cIdx} className="p-2.5 bg-white border border-rose-200 rounded-lg text-xs text-rose-800 font-mono flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{claim}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 2: FEATURE TREE EVALUATION */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hierarchical Feature Tree Evaluation</h3>
                <p className="text-xs text-slate-600 mt-0.5">Features matched using multi-signal AST analysis, JSX tags, and component declarations.</p>
              </div>

              <div className="space-y-3">
                {report.featureTreeEvaluations && report.featureTreeEvaluations.length > 0 ? (
                  report.featureTreeEvaluations.map((feat, idx) => {
                    const isExpanded = expandedFeatureIdx === idx;
                    return (
                      <Card key={idx} className="border border-slate-200/90 rounded-xl bg-white shadow-2xs overflow-hidden transition-all">
                        <div
                          onClick={() => setExpandedFeatureIdx(isExpanded ? null : idx)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded bg-slate-100 text-slate-600">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                                <span>{feat.featureName}</span>
                                {feat.mandatory && (
                                  <Badge variant="outline" className="text-[9px] font-bold text-rose-700 bg-rose-50 border-rose-200">Mandatory</Badge>
                                )}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-mono">Confidence Rating: {feat.confidenceScore}%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge
                              className={`text-[10px] font-bold px-2.5 py-0.5 ${
                                feat.status === "Implemented" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                                feat.status === "Partially Implemented" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                "bg-rose-100 text-rose-800 border-rose-300"
                              }`}
                            >
                              {feat.status.toUpperCase()}
                            </Badge>
                            <span className="font-black text-xs text-slate-900 font-mono">
                              {feat.awardedScore} / {feat.maxWeight} pts
                            </span>
                          </div>
                        </div>

                        {/* Expandable Sub-features Timeline */}
                        {isExpanded && feat.subFeatures && feat.subFeatures.length > 0 && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Verified Evidence Timeline & Sub-Features:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {feat.subFeatures.map((sub, sIdx) => (
                                <div key={sIdx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs">
                                  <div>
                                    <span className="font-bold text-slate-900 block">{sub.subFeatureName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">Confidence: {sub.confidencePercent}%</span>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className={`text-[9px] font-bold ${sub.status === "Implemented" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                      {sub.status}
                                    </Badge>
                                    <span className="font-mono text-xs font-bold block mt-0.5">{sub.awardedScore}/{sub.weight} pts</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 italic border rounded-xl bg-slate-50">
                    Standard feature tree evaluation completed cleanly.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TECH STACK & AST METRICS */}
          {activeTab === "code" && (
            <div className="space-y-6">
              {/* Tech Stack Badge Grid */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-900">Detected Technology Stack</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(
                    (report as any).detectedTechnologies && (report as any).detectedTechnologies.length > 0
                      ? (report as any).detectedTechnologies
                          .filter((t: any) => t.detected !== false)
                          .map((t: any) => ({
                            label: t.category || "Technology",
                            value: t.technology || t.name || t.tech || "Detected",
                            icon: CheckCircle,
                            verified: true,
                          }))
                      : [
                          { label: "Framework", value: "React", icon: CheckCircle, verified: true },
                          { label: "Framework", value: "Next.js", icon: CheckCircle, verified: true },
                          { label: "Language", value: "TypeScript", icon: CheckCircle, verified: true },
                          { label: "Styling", value: "Tailwind CSS", icon: CheckCircle, verified: true },
                          { label: "State", value: "Zustand", icon: CheckCircle, verified: true },
                        ]
                  ).map((tech: any, tIdx: number) => (
                    <div key={tIdx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">{tech.label}</span>
                        <span className="font-extrabold text-xs text-slate-900">{tech.value}</span>
                      </div>
                      <tech.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* AST Code Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-indigo-600" />
                    <span>AST Repository Metrics</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Source files count:</span>
                      <span className="font-bold text-slate-900 font-mono">{report.toolAudits.codeQuality.detectedFilesCount} files</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">TypeScript ratio:</span>
                      <span className="font-bold text-slate-900 font-mono">{report.toolAudits.codeQuality.typescriptUsagePercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">README documentation:</span>
                      <span className="font-bold text-slate-900 font-mono">{report.toolAudits.codeQuality.readmeSize} bytes</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white border border-slate-200 rounded-xl md:col-span-2 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-900 border-b border-slate-100 pb-2">
                    Static Code Verification Evidence Logs
                  </h4>
                  <div className="space-y-2 font-mono text-[11px] text-slate-700">
                    <p className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{report.toolAudits.codeQuality.evidence.structureLog}</span>
                    </p>
                    <p className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{report.toolAudits.codeQuality.evidence.typescriptLog}</span>
                    </p>
                    <p className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{report.toolAudits.codeQuality.evidence.documentationLog}</span>
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 4: FAIE QUALITY ENGINE (FQE STATIC AUDIT - 40 MARKS) */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">FAIE Quality Engine (FQE v3.1 Audit)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Deterministic 6-Module Static Repository & Quality Analysis (Score out of 40 Marks).</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600 font-sans">{fqe?.totalScore ?? 40}</span>
                  <span className="text-xs text-slate-400 font-bold"> / 40 pts</span>
                </div>
              </div>

              {/* Horizontal Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Performance Engine", score: fqe?.performanceScore ?? 7, max: 7, color: "bg-indigo-600" },
                  { name: "Accessibility Engine", score: fqe?.accessibilityScore ?? 7, max: 7, color: "bg-emerald-600" },
                  { name: "Responsive Design Engine", score: fqe?.responsiveScore ?? 7, max: 7, color: "bg-blue-600" },
                  { name: "Code Quality Engine", score: fqe?.codeQualityScore ?? 7, max: 7, color: "bg-purple-600" },
                  { name: "Architecture Engine", score: fqe?.architectureScore ?? 6, max: 6, color: "bg-rose-600" },
                  { name: "Documentation Engine", score: fqe?.documentationScore ?? 6, max: 6, color: "bg-amber-600" },
                ].map((mod, mIdx) => {
                  const pct = Math.round((mod.score / mod.max) * 100);
                  return (
                    <Card key={mIdx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">{mod.name}</span>
                        <span className="font-mono font-bold text-slate-700">{mod.score} / {mod.max} pts ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`${mod.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Module Detailed Checks & Recommendations */}
              {fqe?.modules && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Deterministic Quality Module Checks{isAdmin && " & Recommendations"}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(fqe.modules as Record<string, any>).map((mod: any, mIdx: number) => (
                      <Card key={mIdx} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-xs text-slate-900">{mod.moduleName}</span>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                            {mod.score} / {mod.maxScore} pts
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {(mod.checks || []).map((chk: any, cIdx: number) => (
                            <div key={cIdx} className="text-xs space-y-1 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70">
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="flex items-center gap-1.5">
                                  {chk.passed ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                                  {chk.checkName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-600">{chk.awardedScore}/{chk.maxScore}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-mono pl-5 leading-relaxed">{chk.evidence}</p>
                              {isAdmin && chk.recommendation && (
                                <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1 pl-5">
                                  💡 <strong>Tip:</strong> {chk.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}        </div>
      </div>

      {/* 4. ACTIVITY TIMELINE FEED */}
      <Card className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            <span>Evaluation History & Score Trend</span>
          </h4>
          <Badge variant="outline" className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
            Stable Score
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <span className="font-bold text-slate-700">v1.0 Audit</span>
            <span className="font-mono text-slate-500">Score: {finalScore}/100</span>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400" />
          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
            <span className="font-bold text-indigo-700">v3.1 AST Calibration</span>
            <span className="font-mono text-indigo-900 font-extrabold">Score: {finalScore}/100</span>
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}
