"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Server,
  Users,
  Activity,
  Terminal,
  Trophy,
  GitPullRequest,
  Scale,
  Medal,
  BarChart3,
  Settings,
  Plus,
  Sliders,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  BookOpen,
  FileCode2,
  FileText,
  Link as LinkIcon,
  PlayCircle,
  ChevronLeft,
  Edit3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RequireRole } from "@/components/auth/RequireRole";
import { EmptyState } from "@/components/design-system/EmptyState";
import { useUIStore } from "@/store/uiStore";
import { BlueprintEditor } from "@/features/admin/blueprint/BlueprintEditor";

interface Round {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface TestCase {
  input: string;
  output: string;
  weight: number;
}

interface Resource {
  title: string;
  url: string;
  type: string;
}

interface Hackathon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  registrationStart: string;
  registrationClose: string;
  eventStart: string;
  eventClose: string;
  bannerUrl: string | null;
  submissionEnabled: boolean;
  leaderboardEnabled: boolean;
  discussionEnabled: boolean;
  rounds: Round[];
  problemTitle: string;
  problemDescription: string;
  testCases: TestCase[];
  rules: string[];
  resources: Resource[];
  status: "upcoming" | "active" | "completed";
}

export default function PlatformAdminDashboardPage() {
  const { activeTab } = useUIStore();

  // Load hackathons from backend on mount
  React.useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await fetch("/api/hackathons");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setHackathons(list);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHackathons();
  }, []);

  // Settings Tab States
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [enableAstEvaluation, setEnableAstEvaluation] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [forceEmailVerification, setForceEmailVerification] = useState(true);

  // Hackathons States
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isCreatingHackathon, setIsCreatingHackathon] = useState(false);
  const [editingHackathonId, setEditingHackathonId] = useState<string | null>(null);
  const [activeBlueprintHackathonId, setActiveBlueprintHackathonId] = useState<string | null>(null);
  const [activeManageHackathonId, setActiveManageHackathonId] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<"problem" | "rules" | "resources" | "submissions" | "leaderboard">("problem");

  const resetForm = () => {
    setHackathonName("");
    setHackathonTagline("");
    setHackathonDescription("");
    setRegStart("");
    setRegClose("");
    setEventStart("");
    setEventClose("");
    setBannerImage(null);
    setSubmissionEnabled(true);
    setLeaderboardEnabled(true);
    setDiscussionEnabled(false);
    setProblemTitle("");
    setProblemDescription("");
    setRounds([
      { name: "Round 1: Idea Submission", description: "Submit project abstract, wireframes, and proposed tech stack.", startDate: "", endDate: "" },
      { name: "Round 2: Prototype Hack", description: "Build the code and submit repository links.", startDate: "", endDate: "" },
    ]);
    setTestCases([{ input: "Sample input logic", output: "Sample output expected", weight: 50 }]);
    setRules(["Plagiarism will result in immediate disqualification.", "Teams must consist of 1-4 members."]);
    setResources([{ title: "Next.js Starter Template", url: "https://github.com/example/starter", type: "GitHub Template" }]);
  };

  const handleEditHackathon = (hackathon: Hackathon) => {
    setEditingHackathonId(hackathon.id);
    setHackathonName(hackathon.name);
    setHackathonTagline(hackathon.tagline);
    setHackathonDescription(hackathon.description);
    setRegStart(hackathon.registrationStart);
    setRegClose(hackathon.registrationClose);
    setEventStart(hackathon.eventStart);
    setEventClose(hackathon.eventClose);
    setBannerImage(hackathon.bannerUrl);
    setSubmissionEnabled(hackathon.submissionEnabled);
    setLeaderboardEnabled(hackathon.leaderboardEnabled);
    setDiscussionEnabled(hackathon.discussionEnabled);
    setRounds(hackathon.rounds);
    setProblemTitle(hackathon.problemTitle);
    setProblemDescription(hackathon.problemDescription);
    setTestCases(hackathon.testCases.length > 0 ? hackathon.testCases : [{ input: "", output: "", weight: 100 }]);
    setRules(hackathon.rules.length > 0 ? hackathon.rules : [""]);
    setResources(hackathon.resources.length > 0 ? hackathon.resources : [{ title: "", url: "", type: "Link" }]);
    setIsCreatingHackathon(true);
  };

  // Hackathon Form States
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonTagline, setHackathonTagline] = useState("");
  const [hackathonDescription, setHackathonDescription] = useState("");
  const [regStart, setRegStart] = useState("");
  const [regClose, setRegClose] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventClose, setEventClose] = useState("");
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [submissionEnabled, setSubmissionEnabled] = useState(true);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [discussionEnabled, setDiscussionEnabled] = useState(false);
  
  // Stages Rounds States
  const [rounds, setRounds] = useState<Round[]>([
    {
      name: "Round 1: Idea Submission",
      description: "Submit project abstract, wireframes, and proposed tech stack.",
      startDate: "",
      endDate: "",
    },
    {
      name: "Round 2: Prototype Hack",
      description: "Build the code and submit repository links.",
      startDate: "",
      endDate: "",
    },
  ]);

  // Problem Statement Builder States
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "Sample input logic", output: "Sample output expected", weight: 50 },
  ]);

  // Rules Builder States
  const [rules, setRules] = useState<string[]>([
    "Plagiarism will result in immediate disqualification.",
    "Teams must consist of 1-4 members.",
  ]);

  // Resources Builder States
  const [resources, setResources] = useState<Resource[]>([
    { title: "Next.js Starter Template", url: "https://github.com/example/starter", type: "GitHub Template" },
  ]);

  // Toast Success State
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleMockBannerUpload = () => {
    setBannerImage("linear-gradient(to right, #2563EB, #06B6D4)");
    showToast("Banner template uploaded successfully!");
  };

  // Dynamic lists helper functions
  const handleAddRound = () => {
    setRounds([...rounds, { name: `Round ${rounds.length + 1}: Custom Phase`, description: "", startDate: "", endDate: "" }]);
  };
  const handleRemoveRound = (idx: number) => {
    setRounds(rounds.filter((_, i) => i !== idx));
  };
  const handleUpdateRound = (idx: number, fields: Partial<Round>) => {
    setRounds(rounds.map((round, i) => (i === idx ? { ...round, ...fields } : round)));
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: "", output: "", weight: 10 }]);
  };
  const handleRemoveTestCase = (idx: number) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };
  const handleUpdateTestCase = (idx: number, fields: Partial<TestCase>) => {
    setTestCases(testCases.map((tc, i) => (i === idx ? { ...tc, ...fields } : tc)));
  };

  const handleAddRule = () => {
    setRules([...rules, ""]);
  };
  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };
  const handleUpdateRule = (idx: number, val: string) => {
    setRules(rules.map((rule, i) => (i === idx ? val : rule)));
  };

  const handleAddResource = () => {
    setResources([...resources, { title: "", url: "", type: "Link" }]);
  };
  const handleRemoveResource = (idx: number) => {
    setResources(resources.filter((_, i) => i !== idx));
  };
  const handleUpdateResource = (idx: number, fields: Partial<Resource>) => {
    setResources(resources.map((res, i) => (i === idx ? { ...res, ...fields } : res)));
  };

  const handleCreateHackathonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonName || !regStart || !regClose) {
      alert("Please fill in the Hackathon name and registration dates.");
      return;
    }

    const newHackathon: Hackathon = {
      id: `hack_${Date.now()}`,
      name: hackathonName,
      tagline: hackathonTagline,
      description: hackathonDescription,
      registrationStart: regStart,
      registrationClose: regClose,
      eventStart,
      eventClose,
      bannerUrl: bannerImage,
      submissionEnabled,
      leaderboardEnabled,
      discussionEnabled,
      rounds,
      problemTitle: problemTitle || "Default Challenge Title",
      problemDescription: problemDescription || "No description provided for this problem statement.",
      testCases: testCases.filter((tc) => tc.input || tc.output),
      rules: rules.filter((rule) => rule.trim()),
      resources: resources.filter((res) => res.title && res.url),
      status: "upcoming",
    };

    if (editingHackathonId) {
      const updatedHackathons = hackathons.map((h) => {
        if (h.id === editingHackathonId) {
          return {
            ...h,
            name: hackathonName,
            tagline: hackathonTagline,
            description: hackathonDescription,
            registrationStart: regStart,
            registrationClose: regClose,
            eventStart,
            eventClose,
            bannerUrl: bannerImage,
            submissionEnabled,
            leaderboardEnabled,
            discussionEnabled,
            rounds,
            problemTitle: problemTitle || "Default Challenge Title",
            problemDescription: problemDescription || "No description provided for this problem statement.",
            testCases: testCases.filter((tc) => tc.input || tc.output),
            rules: rules.filter((rule) => rule.trim()),
            resources: resources.filter((res) => res.title && res.url),
          };
          
          fetch("/api/hackathons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          }).then(() => {
            fetch("/api/hackathons").then(r => r.json()).then(list => {
              if (Array.isArray(list)) setHackathons(list);
            });
          });
        }
        return h;
      });

      setIsCreatingHackathon(false);
      setEditingHackathonId(null);
      resetForm();
      showToast(`Hackathon "${hackathonName}" updated successfully!`);
      return;
    }

    fetch("/api/hackathons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newHackathon)
    }).then(() => {
      fetch("/api/hackathons").then(r => r.json()).then(list => {
        if (Array.isArray(list)) setHackathons(list);
      });
    });

    setIsCreatingHackathon(false);
    resetForm();
    showToast(`Hackathon "${hackathonName}" launched successfully!`);
  };

  const selectedHackathon = Array.isArray(hackathons) ? hackathons.find((h) => h.id === activeManageHackathonId) : undefined;

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#0F172A] p-6 text-white shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="solid" size="sm" className="bg-[#FF006E] text-white">
                    Platform Admin
                  </Badge>
                  <Badge variant="outline" size="sm" className="text-slate-400 border-slate-700">
                    All Systems Dormant
                  </Badge>
                </div>
                <h1 className="font-heading text-2xl font-bold">
                  Frontend Arena System Telemetry
                </h1>
                <p className="text-sm text-slate-300">
                  Super-admin system governance, cluster health, and global user management.
                </p>
              </div>

              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800" leftIcon={<Terminal className="h-4 w-4" />}>
                System Diagnostics
              </Button>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#475569]">Global Users</p>
                  <h3 className="font-heading text-2xl font-bold text-[#0F172A]">0</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Users className="h-5 w-5" />
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#475569]">Subnet Health</p>
                  <h3 className="font-heading text-2xl font-bold text-[#475569]">0.00%</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Server className="h-5 w-5" />
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#475569]">Active Sockets</p>
                  <h3 className="font-heading text-2xl font-bold text-[#0F172A] font-code">0</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Activity className="h-5 w-5" />
                </div>
              </Card>

              <Card className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#475569]">System Security</p>
                  <h3 className="font-heading text-2xl font-bold text-[#0F172A]">No Audits</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
                  <Shield className="h-5 w-5" />
                </div>
              </Card>
            </div>

            {/* Global Cluster Table Card */}
            <Card>
              <CardHeader className="py-4 border-b border-[#E2E8F0]/60">
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  Global Node Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EmptyState
                  title="No Active Clusters Found"
                  description="There are currently no active subnets or node clusters registered in the system governance portal."
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case "hackathons":
        if (activeBlueprintHackathonId) {
          return (
            <motion.div
              key="blueprint-editor-subview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BlueprintEditor
                hackathonId={activeBlueprintHackathonId}
                onClose={() => setActiveBlueprintHackathonId(null)}
              />
            </motion.div>
          );
        }

        if (activeManageHackathonId && selectedHackathon) {
          /* LIVE PORTAL VIEW OF PARTICULAR HACKATHON */
          return (
            <motion.div
              key="hackathon-portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Back & Portal Header */}
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setActiveManageHackathonId(null)}
                  className="flex items-center gap-1 text-xs text-[#FF006E] font-bold hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Management List</span>
                </button>

                <div
                  className="rounded-2xl h-36 w-full flex flex-col justify-end p-6 text-white relative shadow-md overflow-hidden"
                  style={{
                    background: selectedHackathon.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)",
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-[10px] font-bold uppercase tracking-wider text-[#FFD60A] border border-[#FFD60A]/20">
                      Live Portal Preview
                    </span>
                    <h1 className="font-heading text-2xl font-extrabold truncate">
                      {selectedHackathon.name}
                    </h1>
                    <p className="text-xs text-slate-200">
                      {selectedHackathon.tagline || "Portal Workspace Preview"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Tabs Bar */}
              <div className="flex w-full overflow-x-auto justify-start gap-1 p-1 bg-white border border-[#E2E8F0] rounded-[16px] max-w-2xl">
                <button
                  onClick={() => setActivePortalTab("problem")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                    activePortalTab === "problem"
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <FileCode2 className="h-4 w-4" />
                  <span>Problem Statement</span>
                </button>
                <button
                  onClick={() => setActivePortalTab("rules")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                    activePortalTab === "rules"
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Rules</span>
                </button>
                <button
                  onClick={() => setActivePortalTab("resources")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                    activePortalTab === "resources"
                      ? "bg-[#0F172A] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>Resources</span>
                </button>
                {selectedHackathon.submissionEnabled && (
                  <button
                    onClick={() => setActivePortalTab("submissions")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                      activePortalTab === "submissions"
                        ? "bg-[#0F172A] text-white shadow-sm"
                        : "text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <GitPullRequest className="h-4 w-4" />
                    <span>Submissions</span>
                  </button>
                )}
                {selectedHackathon.leaderboardEnabled && (
                  <button
                    onClick={() => setActivePortalTab("leaderboard")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                      activePortalTab === "leaderboard"
                        ? "bg-[#0F172A] text-white shadow-sm"
                        : "text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Medal className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </button>
                )}
              </div>

              {/* Portal Tab Contents */}
              <div className="space-y-6">
                {activePortalTab === "problem" && (
                  <Card className="p-6 space-y-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4">
                      <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                        <FileCode2 className="h-5 w-5 text-[#FF006E]" />
                        <span>{selectedHackathon.problemTitle}</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Review the challenge requirements and details below to prepare your submission.
                      </p>
                    </div>

                    <div className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">
                      {selectedHackathon.problemDescription}
                    </div>

                    {/* Test Cases "test of PS" section */}
                    <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                        Automated Evaluation Test Cases
                      </h3>
                      {selectedHackathon.testCases.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedHackathon.testCases.map((tc, tcIdx) => (
                            <div
                              key={tcIdx}
                              className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5 font-bold">
                                <span className="text-[#0F172A]">Test Case #{tcIdx + 1}</span>
                                <Badge variant="accent" size="sm" className="bg-[#FEF3C7] text-[#B45309]">
                                  Weight: {tc.weight}%
                                </Badge>
                              </div>
                              <div className="space-y-1.5 font-code text-[11px]">
                                <div>
                                  <span className="text-[#64748B] block font-sans text-[10px] font-bold uppercase">Input:</span>
                                  <pre className="p-2 rounded bg-slate-100 border border-slate-200 overflow-x-auto select-all">
                                    {tc.input}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[#64748B] block font-sans text-[10px] font-bold uppercase">Expected Output:</span>
                                  <pre className="p-2 rounded bg-slate-100 border border-slate-200 overflow-x-auto select-all">
                                    {tc.output}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B] italic">No test cases configured for this problem statement.</p>
                      )}
                    </div>
                  </Card>
                )}

                {activePortalTab === "rules" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4 mb-4">
                      <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#FF006E]" />
                        <span>Hackathon Guidelines & Rules</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Ensure your team adheres to all platform regulations during active participation.
                      </p>
                    </div>

                    {selectedHackathon.rules.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-3.5 text-xs text-[#475569] leading-relaxed">
                        {selectedHackathon.rules.map((rule, ruleIdx) => (
                          <li key={ruleIdx} className="pl-1">
                            <span className="font-medium text-[#0F172A]">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-[#64748B] italic">No custom rules configured for this challenge.</p>
                    )}
                  </Card>
                )}

                {activePortalTab === "resources" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4 mb-4">
                      <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-[#FF006E]" />
                        <span>Developer Resources</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Templates, boilerplate repositories, design files, and technical documentations.
                      </p>
                    </div>

                    {selectedHackathon.resources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedHackathon.resources.map((res, resIdx) => (
                          <div
                            key={resIdx}
                            className="p-4 border border-[#E2E8F0] rounded-xl flex items-start justify-between gap-4 hover:border-[#FF006E]/30 transition-all bg-[#F8FAFC]"
                          >
                            <div className="space-y-1">
                              <Badge variant="outline" size="sm" className="bg-white text-xs">
                                {res.type}
                              </Badge>
                              <h4 className="font-bold text-xs text-[#0F172A]">{res.title}</h4>
                              <p className="text-[10px] text-[#64748B] truncate max-w-[200px]">
                                {res.url}
                              </p>
                            </div>
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#FF006E] hover:text-white hover:border-[#FF006E] transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748B] italic">No reference resources configured for this challenge.</p>
                    )}
                  </Card>
                )}

                {activePortalTab === "submissions" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <EmptyState
                      title="No Project Submissions Received"
                      description="Once teams link their repository links and execute AST code analysis, files will appear here."
                      icon={<GitPullRequest className="h-7 w-7" />}
                    />
                  </Card>
                )}

                {activePortalTab === "leaderboard" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <EmptyState
                      title="Platform Leaderboard Uncalculated"
                      description="Rankings will display here once automated tests run and scorecards are published."
                      icon={<Medal className="h-7 w-7" />}
                    />
                  </Card>
                )}
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key="hackathons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {isCreatingHackathon ? (
              /* HACKATHON CREATION FORM */
              <form onSubmit={handleCreateHackathonSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-[#0F172A] flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-[#FF006E]" />
                      <span>{editingHackathonId ? "Edit Hackathon" : "Create New Hackathon"}</span>
                    </h2>
                    <p className="text-xs text-[#475569]">
                      Set timelines, upload branding, define rounds, and toggle features.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreatingHackathon(false);
                      setEditingHackathonId(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* General details Card */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                        General Details
                      </h3>
                      <div className="space-y-4">
                        <Input
                          label="Hackathon Name"
                          value={hackathonName}
                          onChange={(e) => setHackathonName(e.target.value)}
                          placeholder="e.g. Frontend Wars 2026"
                          required
                        />
                        <Input
                          label="Tagline / Short Banner Text"
                          value={hackathonTagline}
                          onChange={(e) => setHackathonTagline(e.target.value)}
                          placeholder="e.g. Build, Compete, and Innovate in UI Design"
                        />
                        <div className="space-y-1.5 w-full">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                            About / Description
                          </label>
                          <textarea
                            value={hackathonDescription}
                            onChange={(e) => setHackathonDescription(e.target.value)}
                            placeholder="Provide a detailed description of the hackathon theme, rules, and guidelines."
                            className="flex min-h-[100px] w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Problem Statement Builder ("not in file upload type") */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                        Problem Statement & Evaluator
                      </h3>
                      <div className="space-y-4">
                        <Input
                          label="Problem Statement Title"
                          value={problemTitle}
                          onChange={(e) => setProblemTitle(e.target.value)}
                          placeholder="e.g. Build a Responsive Dashboard with Glassmorphism"
                        />
                        <div className="space-y-1.5 w-full">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                            Challenge Specifications / Description
                          </label>
                          <textarea
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                            placeholder="Write the detailed problem statement constraints, UI screens required, API endpoints, etc."
                            className="flex min-h-[120px] w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                          />
                        </div>

                        {/* Test Cases "test of PS" */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                              Automated Evaluator Test Cases
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddTestCase}
                              className="h-6 text-[10px] border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E]/10"
                            >
                              Add Test Case
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {testCases.map((tc, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 relative"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestCase(idx)}
                                  disabled={testCases.length <= 1}
                                  className="absolute top-2.5 right-2.5 text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-50"
                                  aria-label="Remove test case"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-[#475569]">Input Payload</span>
                                    <input
                                      type="text"
                                      value={tc.input}
                                      onChange={(e) => handleUpdateTestCase(idx, { input: e.target.value })}
                                      placeholder="e.g. query: 'nextjs', limit: 10"
                                      className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] font-code"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-[#475569]">Expected Output</span>
                                    <input
                                      type="text"
                                      value={tc.output}
                                      onChange={(e) => handleUpdateTestCase(idx, { output: e.target.value })}
                                      placeholder="e.g. status: 200, count: 10"
                                      className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] font-code"
                                    />
                                  </div>
                                </div>
                                <div className="w-28 space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-[#475569]">Score Weight (%)</span>
                                  <input
                                    type="number"
                                    value={tc.weight}
                                    onChange={(e) => handleUpdateTestCase(idx, { weight: Number(e.target.value) })}
                                    className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A]"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Rules Builder Card */}
                    <Card className="p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                        <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                          Rules & Guidelines Builder
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddRule}
                          className="h-7 text-xs border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E]/10"
                        >
                          Add Rule
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {rules.map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#475569]">{idx + 1}.</span>
                            <input
                              type="text"
                              value={rule}
                              onChange={(e) => handleUpdateRule(idx, e.target.value)}
                              placeholder={`Rule #${idx + 1}`}
                              className="flex h-9 flex-1 rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveRule(idx)}
                              disabled={rules.length <= 1}
                              className="text-[#94A3B8] hover:text-[#EF4444] p-1.5 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Resources Builder Card */}
                    <Card className="p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                        <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                          Developer Resources & Starters
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddResource}
                          className="h-7 text-xs border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E]/10"
                        >
                          Add Resource
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {resources.map((res, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 relative"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveResource(idx)}
                              className="absolute top-2.5 right-2.5 text-[#94A3B8] hover:text-[#EF4444]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-6">
                              <div className="sm:col-span-1 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-[#475569]">Title</span>
                                <input
                                  type="text"
                                  value={res.title}
                                  onChange={(e) => handleUpdateResource(idx, { title: e.target.value })}
                                  placeholder="Starter Repo"
                                  className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A]"
                                />
                              </div>
                              <div className="sm:col-span-1 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-[#475569]">URL Link</span>
                                <input
                                  type="url"
                                  value={res.url}
                                  onChange={(e) => handleUpdateResource(idx, { url: e.target.value })}
                                  placeholder="https://..."
                                  className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A]"
                                />
                              </div>
                              <div className="sm:col-span-1 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-[#475569]">Type</span>
                                <select
                                  value={res.type}
                                  onChange={(e) => handleUpdateResource(idx, { type: e.target.value })}
                                  className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A]"
                                >
                                  <option value="GitHub Template">GitHub Template</option>
                                  <option value="Documentation">Documentation</option>
                                  <option value="Figma Design">Figma Design</option>
                                  <option value="API Spec">API Spec</option>
                                  <option value="Link">Link</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Timelines Card */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                        Timelines & Windows
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A] flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#FF006E]" />
                            <span>Registration Starts</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={regStart}
                            onChange={(e) => setRegStart(e.target.value)}
                            className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A] flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#FF006E]" />
                            <span>Registration Closes</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={regClose}
                            onChange={(e) => setRegClose(e.target.value)}
                            className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A] flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#FF006E]" />
                            <span>Hackathon Code Window Starts</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={eventStart}
                            onChange={(e) => setEventStart(e.target.value)}
                            className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A] flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#FF006E]" />
                            <span>Hackathon Code Window Closes</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={eventClose}
                            onChange={(e) => setEventClose(e.target.value)}
                            className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Hackathon Stages & Rounds Builder */}
                    <Card className="p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                        <h3 className="font-heading text-sm font-bold text-[#0F172A]">
                          Evaluation Rounds & Stages
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddRound}
                          className="h-7 text-xs border-[#FF006E] text-[#FF006E] hover:bg-[#FF006E]/10"
                        >
                          Add Round
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {rounds.map((round, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 relative"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveRound(idx)}
                              disabled={rounds.length <= 1}
                              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-50"
                              aria-label="Remove round"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Input
                                label="Round Name"
                                value={round.name}
                                onChange={(e) =>
                                  handleUpdateRound(idx, { name: e.target.value })
                                }
                                placeholder="e.g. Idea Submission"
                                required
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                                    Starts
                                  </label>
                                  <input
                                    type="date"
                                    value={round.startDate}
                                    onChange={(e) =>
                                      handleUpdateRound(idx, {
                                        startDate: e.target.value,
                                      })
                                    }
                                    className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#0F172A]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                                    Ends
                                  </label>
                                  <input
                                    type="date"
                                    value={round.endDate}
                                    onChange={(e) =>
                                      handleUpdateRound(idx, {
                                        endDate: e.target.value,
                                      })
                                    }
                                    className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#0F172A]"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                                Round Description / Submission Deliverables
                              </label>
                              <input
                                type="text"
                                value={round.description}
                                onChange={(e) =>
                                  handleUpdateRound(idx, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="What must participants submit during this round?"
                                className="flex h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Upload & Feature Toggles */}
                  <div className="space-y-6">
                    {/* Banner Upload Card */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                        Branding & Banner
                      </h3>
                      {bannerImage ? (
                        <div className="relative h-28 w-full rounded-lg border border-[#E2E8F0] overflow-hidden flex flex-col justify-end p-3 text-white shadow-sm" style={{ background: bannerImage }}>
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="relative z-10">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFD60A]">
                              Preview
                            </p>
                            <h4 className="font-heading text-xs font-bold truncate">
                              {hackathonName || "Hackathon Name"}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBannerImage(null)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-[#EF4444]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={handleMockBannerUpload}
                          className="flex flex-col items-center justify-center h-28 w-full border-2 border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC] hover:bg-slate-100 hover:border-[#FF006E] cursor-pointer transition-all p-4 text-center"
                        >
                          <ImageIcon className="h-6 w-6 text-[#94A3B8] mb-1.5" />
                          <span className="text-[11px] font-bold text-[#0F172A]">
                            Upload Brand Banner
                          </span>
                          <span className="text-[9px] text-[#64748B] mt-0.5">
                            Recommended ratio: 16:9 (SVG/PNG)
                          </span>
                        </div>
                      )}
                    </Card>

                    {/* Features Toggles Card */}
                    <Card className="p-6 space-y-4">
                      <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                        Features & Navigation Tabs
                      </h3>
                      <div className="space-y-4">
                        <Checkbox
                          label="Enable Submission Tab"
                          description="Activate the repository linking and live evaluation system for participants."
                          checked={submissionEnabled}
                          onChange={(e) => setSubmissionEnabled(e.target.checked)}
                        />
                        <div className="border-t border-[#F1F5F9] my-1" />
                        <Checkbox
                          label="Enable Leaderboard Tab"
                          description="Allow participants to view live project scores and evaluation status."
                          checked={leaderboardEnabled}
                          onChange={(e) => setLeaderboardEnabled(e.target.checked)}
                        />
                        <div className="border-t border-[#F1F5F9] my-1" />
                        <Checkbox
                          label="Enable Live Discussion Tab"
                          description="Allow participants to communicate and team up directly in a public thread."
                          checked={discussionEnabled}
                          onChange={(e) => setDiscussionEnabled(e.target.checked)}
                        />
                      </div>
                    </Card>

                    {/* Submit Launch Hackathon Button */}
                    <Button
                      type="submit"
                      className="w-full bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-md py-3 text-sm font-extrabold rounded-xl"
                      leftIcon={<Trophy className="h-4.5 w-4.5" />}
                    >
                      {editingHackathonId ? "Save Changes" : "Launch Hackathon"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              /* HACKATHON DASHBOARD LIST */
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-[#FF006E]" />
                      <span>Hackathon Management</span>
                    </h1>
                    <p className="text-xs text-[#475569]">
                      Launch, configure, and monitor community and premium developer hackathons.
                    </p>
                  </div>
                  <Button
                    className="bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-sm font-bold"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsCreatingHackathon(true)}
                  >
                    Create Hackathon
                  </Button>
                </div>

                {hackathons.length > 0 ? (
                  /* RENDER CREATED HACKATHONS LIST */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hackathons.map((hackathon) => (
                      <Card key={hackathon.id} className="overflow-hidden border-[#E2E8F0] shadow-sm bg-white rounded-2xl flex flex-col hover:border-[#FF006E]/40 transition-all">
                        {/* Header Banner Preview */}
                        <div
                          className="h-28 w-full flex flex-col justify-end p-4 text-white relative"
                          style={{
                            background: hackathon.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)",
                          }}
                        >
                          <div className="absolute inset-0 bg-black/15" />
                          <div className="relative z-10">
                            <span className="px-2 py-0.5 rounded-md bg-black/50 text-[9px] font-bold text-[#FFD60A] uppercase border border-[#FFD60A]/20">
                              {hackathon.status}
                            </span>
                            <h3 className="font-heading text-base font-bold truncate mt-1">
                              {hackathon.name}
                            </h3>
                          </div>
                        </div>

                        {/* Body Details */}
                        <CardContent className="p-4 flex-1 space-y-3">
                          <p className="text-xs text-[#475569] font-medium leading-relaxed line-clamp-2">
                            {hackathon.tagline || hackathon.description || "No description provided."}
                          </p>

                          <div className="space-y-1 text-[11px] text-[#475569]">
                            <p className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0F172A]">Problem Statement:</span>{" "}
                              <span className="truncate">{hackathon.problemTitle}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0F172A]">Reg Close:</span>{" "}
                              {new Date(hackathon.registrationClose).toLocaleDateString()}
                            </p>
                            {hackathon.rounds.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1 border-t border-[#F1F5F9] mt-2">
                                <span className="font-bold text-[#0F172A]">Evaluation Rounds:</span>{" "}
                                <Badge variant="outline" size="sm">
                                  {hackathon.rounds.length} Rounds
                                </Badge>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {hackathon.submissionEnabled && (
                              <Badge variant="success" size="sm">
                                Submissions Tab Active
                              </Badge>
                            )}
                            {hackathon.leaderboardEnabled && (
                              <Badge variant="accent" size="sm" className="bg-[#FEF3C7] text-[#B45309] border-[#FDE047]">
                                Leaderboard Active
                              </Badge>
                            )}
                          </div>
                        </CardContent>

                        {/* Footer details link */}
                        <CardFooter className="p-3 bg-[#F8FAFC]/50 border-t border-[#F1F5F9] flex justify-between items-center text-xs">
                          <span className="text-[#FF006E] font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Upcoming
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleEditHackathon(hackathon)}
                              className="text-[#475569] hover:text-[#FF006E] flex items-center gap-0.5 font-bold"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBlueprintHackathonId(hackathon.id)}
                              className="text-[#475569] hover:text-[#FF006E] flex items-center gap-0.5 font-bold"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                              <span>Blueprint</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveManageHackathonId(hackathon.id);
                                setActivePortalTab("problem");
                              }}
                              className="text-[#475569] hover:underline flex items-center gap-0.5 font-bold"
                            >
                              <span>Workspace</span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* RENDER EMPTY STATE */
                  <Card className="p-6">
                    <EmptyState
                      title="No Hackathons Created Yet"
                      description="There are currently no hackathons registered on the platform. Click 'Create Hackathon' to setup your first coding challenge."
                      icon={<Trophy className="h-7 w-7" />}
                    />
                  </Card>
                )}
              </>
            )}
          </motion.div>
        );

      case "submissions":
        return (
          <motion.div
            key="submissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <GitPullRequest className="h-6 w-6 text-[#FF006E]" />
                <span>Global Submissions Portal</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Inspect active repository links, readme file parse logs, and code sandbox execution pipelines.
              </p>
            </div>

            <Card className="p-6">
              <EmptyState
                title="No Project Submissions Found"
                description="Once participants submit their software repositories, projects will appear here for code analysis and review."
                icon={<GitPullRequest className="h-7 w-7" />}
              />
            </Card>
          </motion.div>
        );

      case "judging":
        return (
          <motion.div
            key="judging"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Scale className="h-6 w-6 text-[#FF006E]" />
                <span>Virtual Judging Center</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Configure evaluation rubrics, allocate jury pools, and inspect automated scorecard parameters.
              </p>
            </div>

            <Card className="p-6">
              <EmptyState
                title="No Judging Operations Active"
                description="Judging nodes are currently sleeping. Create rubrics and launch evaluations when hackathons transition to the assessment phase."
                icon={<Scale className="h-7 w-7" />}
              />
            </Card>
          </motion.div>
        );

      case "leaderboard":
        return (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Medal className="h-6 w-6 text-[#FF006E]" />
                <span>Platform Leaderboards</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Review verified participant rankings, XP accruals, and digital credential disbursements.
              </p>
            </div>

            <Card className="p-6">
              <EmptyState
                title="No Leaderboard Data Logged"
                description="Rankings and scorecards will calculate and populate automatically as soon as first projects are officially graded."
                icon={<Medal className="h-7 w-7" />}
              />
            </Card>
          </motion.div>
        );

      case "teams":
        return (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Users className="h-6 w-6 text-[#FF006E]" />
                <span>Teams & Squads</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Manage participant team clusters, invite tokens, and user membership records.
              </p>
            </div>

            <Card className="p-6">
              <EmptyState
                title="No Registered Developer Teams"
                description="No team formations have occurred yet. Registered participant teams will be listed here."
                icon={<Users className="h-7 w-7" />}
              />
            </Card>
          </motion.div>
        );

      case "analytics":
        return (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-[#FF006E]" />
                <span>Metrics & Live Logs</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Monitor real-time sandbox runtimes, API traffic, database sockets, and server compute loads.
              </p>
            </div>

            <Card className="p-6">
              <EmptyState
                title="No Logs Generated"
                description="Sandbox validator subnets are currently inactive. Logs will populate once repository code checks begin."
                icon={<BarChart3 className="h-7 w-7" />}
              />
            </Card>
          </motion.div>
        );

      case "settings":
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <Settings className="h-6 w-6 text-[#FF006E]" />
                <span>System Configurations</span>
              </h1>
              <p className="text-xs text-[#475569]">
                Global portal features configuration, security restrictions, and AST engine settings.
              </p>
            </div>

            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CardTitle className="text-base font-bold text-[#0F172A]">Core Platform Toggles</CardTitle>
                <CardDescription className="text-xs text-[#475569]">
                  Interactive security and registration parameters for this Frontend Arena node.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-5">
                  <Checkbox
                    label="Allow New Registrations"
                    description="Open portal gates to accept signups from new developers."
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Enable Automated AST Code Evaluation"
                    description="Activate serverless nodes to run static analyses and code verification on project submissions."
                    checked={enableAstEvaluation}
                    onChange={(e) => setEnableAstEvaluation(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Global Maintenance Mode"
                    description="Puts the entire client platform in read-only status and blocks sub-operations."
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Force Strict Email Verification"
                    description="Enforce verification of participant email addresses before granting access to submit projects."
                    checked={forceEmailVerification}
                    onChange={(e) => setForceEmailVerification(e.target.checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-[#F8FAFC]/30 border-t border-[#F1F5F9] p-4">
                <Button className="bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-sm font-bold" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                  Save System Config
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );

      default:
        return (
          <div className="p-6">
            <p className="text-sm text-[#475569]">No active view selected.</p>
          </div>
        );
    }
  };

  return (
    <RequireRole role="platform_admin">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-sm font-semibold shadow-md animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {renderTabContent()}
      </AnimatePresence>
    </RequireRole>
  );
}
