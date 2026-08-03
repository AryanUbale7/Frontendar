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
  RefreshCw,
  Rocket,
  Archive,
  X,
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
import { EvaluationReport } from "@/components/design-system/EvaluationReport";

/** Build Authorization headers from localStorage token for admin API calls. */
function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("fa_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const toLocalDatetimeString = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toISODate = (localStr: string | null | undefined): string => {
  if (!localStr) return "";
  const d = new Date(localStr);
  return isNaN(d.getTime()) ? "" : d.toISOString();
};

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
  problemReleased?: boolean;
  rounds: Round[];
  problemTitle: string;
  problemDescription: string;
  testCases: TestCase[];
  rules: string[];
  resources: Resource[];
  status: string;
  lifecycle?: string;
  published?: boolean;
  archived?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export default function PlatformAdminDashboardPage() {
  const { activeTab } = useUIStore();

  const [globalRegistrations, setGlobalRegistrations] = useState<any[]>([]);

  // Load hackathons and global registrations from backend on mount
  React.useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await fetch("/api/hackathons", { headers: { ...authHeaders() } });
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
    const fetchGlobalRegistrations = async () => {
      try {
        const res = await fetch("/api/registrations");
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setGlobalRegistrations(list);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    const fetchSystemConfig = async () => {
      try {
        const res = await fetch("/api/system/config");
        if (res.ok) {
          const config = await res.json();
          setAllowRegistration(config.allowRegistration);
          setEnableAstEvaluation(config.enableAstEvaluation);
          setMaintenanceMode(config.maintenanceMode);
          setForceEmailVerification(config.forceEmailVerification);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHackathons();
    fetchGlobalRegistrations();
    fetchSystemConfig();
  }, []);

  const handleSaveSystemConfig = async () => {
    try {
      const res = await fetch("/api/system/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          allowRegistration,
          enableAstEvaluation,
          maintenanceMode,
          forceEmailVerification
        })
      });
      if (res.ok) {
        showToast("System configuration saved successfully!");
      } else {
        const err = await res.json();
        alert("Failed to save config: " + (err.error || err.message));
      }
    } catch (e: any) {
      console.error(e);
      alert("Error saving config: " + e.message);
    }
  };

  // Settings Tab States
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [enableAstEvaluation, setEnableAstEvaluation] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [forceEmailVerification, setForceEmailVerification] = useState(true);

  // Hackathons States
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isCreatingHackathon, setIsCreatingHackathon] = useState(false);
  const [editingHackathonId, setEditingHackathonId] = useState<string | null>(null);
  const [selectedRegHackathonId, setSelectedRegHackathonId] = useState<string>("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState<boolean>(false);

  const [adminSubmissions, setAdminSubmissions] = useState<any[]>([]);
  const [loadingAdminSubmissions, setLoadingAdminSubmissions] = useState(false);
  const [selectedSubmissionForReport, setSelectedSubmissionForReport] = useState<any | null>(null);
  const [adminLeaderboard, setAdminLeaderboard] = useState<any[]>([]);
  const [loadingAdminLeaderboard, setLoadingAdminLeaderboard] = useState(false);

  // Virtual Judging Center States
  const [judgingHackathonId, setJudgingHackathonId] = useState("");
  const [judgingProblemStatementId, setJudgingProblemStatementId] = useState("");
  const [judgingStatusFilter, setJudgingStatusFilter] = useState("");
  const [judgingStats, setJudgingStats] = useState<any>(null);
  const [judgingSubmissions, setJudgingSubmissions] = useState<any[]>([]);
  const [loadingJudgingSubmissions, setLoadingJudgingSubmissions] = useState(false);
  const [loadingJudgingStats, setLoadingJudgingStats] = useState(false);
  const [selectedHackathonBlueprint, setSelectedHackathonBlueprint] = useState<any>(null);

  const fetchJudgingStats = async (hackathonId: string, problemStatementId: string) => {
    setLoadingJudgingStats(true);
    try {
      const res = await fetch(`/api/judging/stats?hackathonId=${hackathonId}&problemStatementId=${problemStatementId}`, {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setJudgingStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJudgingStats(false);
    }
  };

  const fetchJudgingSubmissions = async (hackathonId: string, problemStatementId: string, status: string) => {
    setLoadingJudgingSubmissions(true);
    try {
      const res = await fetch(`/api/judging/submissions?hackathonId=${hackathonId}&problemStatementId=${problemStatementId}&status=${status}`, {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setJudgingSubmissions(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJudgingSubmissions(false);
    }
  };

  const handleRetryJudgingEvaluation = async (submissionId: string) => {
    try {
      const res = await fetch("/api/judging/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({ submissionId })
      });
      if (res.ok) {
        showToast("Evaluation retry triggered successfully!");
        fetchJudgingSubmissions(judgingHackathonId, judgingProblemStatementId, judgingStatusFilter);
        fetchJudgingStats(judgingHackathonId, judgingProblemStatementId);
      } else {
        const err = await res.json();
        alert("Failed to retry: " + (err.error || err.message));
      }
    } catch (e: any) {
      console.error(e);
      alert("Error retrying: " + e.message);
    }
  };

  React.useEffect(() => {
    const fetchBlueprintForSelector = async () => {
      if (!judgingHackathonId) {
        setSelectedHackathonBlueprint(null);
        setJudgingProblemStatementId("");
        return;
      }
      try {
        const res = await fetch(`/api/blueprint?hackathonId=${judgingHackathonId}&includeDraft=true`, {
          headers: { ...authHeaders() }
        });
        if (res.ok) {
          const bp = await res.json();
          setSelectedHackathonBlueprint(bp);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchBlueprintForSelector();
  }, [judgingHackathonId]);

  React.useEffect(() => {
    if (activeTab === "judging" && judgingHackathonId) {
      fetchJudgingStats(judgingHackathonId, judgingProblemStatementId);
      fetchJudgingSubmissions(judgingHackathonId, judgingProblemStatementId, judgingStatusFilter);
    }
  }, [activeTab, judgingHackathonId, judgingProblemStatementId, judgingStatusFilter]);

  // System Metrics States
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [loadingSystemMetrics, setLoadingSystemMetrics] = useState(false);

  const fetchSystemMetrics = async () => {
    setLoadingSystemMetrics(true);
    try {
      const res = await fetch("/api/system/metrics", {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemMetrics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSystemMetrics(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "analytics") {
      fetchSystemMetrics();
    }
  }, [activeTab]);

  const fetchAdminSubmissions = async (hackathonId?: string) => {
    setLoadingAdminSubmissions(true);
    try {
      const url = hackathonId ? `/api/submissions?hackathonId=${hackathonId}` : "/api/submissions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAdminSubmissions(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch admin submissions:", e);
    } finally {
      setLoadingAdminSubmissions(false);
    }
  };

  const fetchAdminLeaderboard = async (hackathonId: string) => {
    setLoadingAdminLeaderboard(true);
    try {
      const url = adminLeaderboardFilterPsId && adminLeaderboardFilterPsId !== "all"
        ? `/api/hackathons/${hackathonId}/leaderboard?problemStatementId=${encodeURIComponent(adminLeaderboardFilterPsId)}`
        : `/api/hackathons/${hackathonId}/leaderboard`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.leaderboard)) {
          setAdminLeaderboard(data.leaderboard);
        }
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLoadingAdminLeaderboard(false);
    }
  };

  const fetchRegistrations = async (hackathonId: string) => {
    if (!hackathonId) return;
    setLoadingRegs(true);
    try {
      const res = await fetch(`/api/registrations?hackathonId=${hackathonId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRegistrations(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleUpdateRegStatus = async (regId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/registrations/${regId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        showToast(`Registration updated to ${newStatus}!`);
        fetchRegistrations(selectedRegHackathonId);
      } else {
        alert("Failed to update registration status.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (Array.isArray(hackathons) && hackathons.length > 0 && !selectedRegHackathonId) {
      setSelectedRegHackathonId(hackathons[0].id);
    }
  }, [hackathons, selectedRegHackathonId]);

  React.useEffect(() => {
    if (selectedRegHackathonId) {
      fetchRegistrations(selectedRegHackathonId);
    }
  }, [selectedRegHackathonId]);

  const [activeBlueprintHackathonId, setActiveBlueprintHackathonId] = useState<string | null>(null);
  const [activeManageHackathonId, setActiveManageHackathonId] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<"problem" | "rules" | "resources" | "submissions" | "leaderboard">("problem");

  const [adminLeaderboardFilterPsId, setAdminLeaderboardFilterPsId] = useState<string>("all");
  const [manageBlueprint, setManageBlueprint] = useState<any>(null);

  React.useEffect(() => {
    const fetchManageBlueprint = async () => {
      if (!activeManageHackathonId) {
        setManageBlueprint(null);
        return;
      }
      try {
        const res = await fetch(`/api/blueprint?hackathonId=${activeManageHackathonId}&includeDraft=true`);
        if (res.ok) {
          const bp = await res.json();
          setManageBlueprint(bp);
        }
      } catch (e) {
        console.error("Failed to fetch manage blueprint:", e);
      }
    };
    fetchManageBlueprint();
    setAdminLeaderboardFilterPsId("all");
  }, [activeManageHackathonId]);

  React.useEffect(() => {
    if (activePortalTab === "submissions") {
      fetchAdminSubmissions(activeManageHackathonId || undefined);
    } else if (activePortalTab === "leaderboard" && activeManageHackathonId) {
      fetchAdminLeaderboard(activeManageHackathonId);
    }
  }, [activePortalTab, activeManageHackathonId, adminLeaderboardFilterPsId]);

  React.useEffect(() => {
    if (activeTab === "submissions") {
      fetchAdminSubmissions();
    }
  }, [activeTab]);

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
    setProblemReleased(false);
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
    setRegStart(toLocalDatetimeString(hackathon.registrationStart));
    setRegClose(toLocalDatetimeString(hackathon.registrationClose));
    setEventStart(toLocalDatetimeString(hackathon.eventStart));
    setEventClose(toLocalDatetimeString(hackathon.eventClose));
    setBannerImage(hackathon.bannerUrl);
    setSubmissionEnabled(hackathon.submissionEnabled);
    setLeaderboardEnabled(hackathon.leaderboardEnabled);
    setDiscussionEnabled(hackathon.discussionEnabled);
    setProblemReleased(hackathon.problemReleased || false);
    setRounds(hackathon.rounds);
    setProblemTitle(hackathon.problemTitle);
    setProblemDescription(hackathon.problemDescription);
    setTestCases(hackathon.testCases.length > 0 ? hackathon.testCases : [{ input: "", output: "", weight: 100 }]);
    setRules(hackathon.rules.length > 0 ? hackathon.rules : [""]);
    setResources(hackathon.resources.length > 0 ? hackathon.resources : [{ title: "", url: "", type: "Link" }]);
    setIsCreatingHackathon(true);
  };

  const handleDeleteHackathon = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/hackathons/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
      if (res.ok) {
        setHackathons((prev) => prev.filter((h) => h.id !== id));
        localStorage.removeItem(`fa_blueprint_${id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete hackathon.");
      }
    } catch (e: any) {
      alert("Error deleting hackathon: " + e.message);
    }
  };

  const refreshHackathons = async () => {
    try {
      const res = await fetch("/api/hackathons", { headers: { ...authHeaders() } });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) setHackathons(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublishHackathon = async (id: string, name: string) => {
    if (!confirm(`Publish "${name}"? It will become publicly visible and start its lifecycle.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/hackathons/${id}/publish`, { method: "POST", headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Hackathon published.");
        await refreshHackathons();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to publish hackathon.");
      }
    } catch (e) {
      alert("Error publishing hackathon: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const handleArchiveHackathon = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? Archived hackathons are hidden from participants and reject submissions.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/hackathons/${id}/archive`, { method: "POST", headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Hackathon archived.");
        await refreshHackathons();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to archive hackathon.");
      }
    } catch (e) {
      alert("Error archiving hackathon: " + (e instanceof Error ? e.message : "Unknown error"));
    }
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
  const [problemReleased, setProblemReleased] = useState(false);
  
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

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerImage(`url("${result}") center/cover no-repeat`);
        showToast("Brand banner image uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
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

  const handleCreateHackathonSubmit = async (e: React.FormEvent) => {
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
      registrationStart: toISODate(regStart),
      registrationClose: toISODate(regClose),
      eventStart: toISODate(eventStart),
      eventClose: toISODate(eventClose),
      bannerUrl: bannerImage,
      submissionEnabled,
      leaderboardEnabled,
      discussionEnabled,
      problemReleased,
      rounds,
      problemTitle: problemTitle || "Default Challenge Title",
      problemDescription: problemDescription || "No description provided for this problem statement.",
      testCases: testCases.filter((tc) => tc.input || tc.output),
      rules: rules.filter((rule) => rule.trim()),
      resources: resources.filter((res) => res.title && res.url),
      status: "draft",
      published: false,
      archived: false,
    };

    if (editingHackathonId) {
      const updatedHackathons = hackathons.map((h) => {
        if (h.id === editingHackathonId) {
          const updated = {
            ...h,
            name: hackathonName,
            tagline: hackathonTagline,
            description: hackathonDescription,
            registrationStart: toISODate(regStart),
            registrationClose: toISODate(regClose),
            eventStart: toISODate(eventStart),
            eventClose: toISODate(eventClose),
            bannerUrl: bannerImage,
            submissionEnabled,
            leaderboardEnabled,
            discussionEnabled,
            problemReleased,
            rounds,
            problemTitle: problemTitle || "Default Challenge Title",
            problemDescription: problemDescription || "No description provided for this problem statement.",
            testCases: testCases.filter((tc) => tc.input || tc.output),
            rules: rules.filter((rule) => rule.trim()),
            resources: resources.filter((res) => res.title && res.url),
          };
          
          fetch("/api/hackathons", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(updated)
          }).then(() => {
            fetch("/api/hackathons", { headers: { ...authHeaders() } }).then(r => r.json()).then(list => {
              if (Array.isArray(list)) setHackathons(list);
            });
          });

          return updated;
        }
        return h;
      });

      setIsCreatingHackathon(false);
      setEditingHackathonId(null);
      resetForm();
      showToast(`Hackathon "${hackathonName}" updated successfully!`);
      return;
    }

    try {
      const createRes = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(newHackathon)
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to create hackathon: ${err.error || createRes.statusText}`);
        return;
      }
      const refreshRes = await fetch("/api/hackathons", { headers: { ...authHeaders() } });
      const list = await refreshRes.json();
      if (Array.isArray(list)) setHackathons(list);
    } catch (e) {
      console.error("Failed to create hackathon:", e);
      alert("Failed to create hackathon: " + (e instanceof Error ? e.message : "Network error"));
      return;
    }

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
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF006E]/5 via-transparent to-transparent pointer-events-none" />
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <Badge variant="solid" size="sm" className="bg-[#FF006E] text-white">
                    Platform Insights
                  </Badge>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">
                    Evaluation Engine Online
                  </span>
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#0F172A]">
                  Frontend Arena Console
                </h1>
                <p className="text-sm text-[#475569]">
                  Manage active hackathons, monitor live enrollments, and coordinate system evaluations.
                </p>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <Button 
                  onClick={async () => {
                    const res = await fetch("/api/registrations");
                    if (res.ok) {
                      const list = await res.json();
                      if (Array.isArray(list)) {
                        setGlobalRegistrations(list);
                      }
                    }
                  }}
                  variant="outline" 
                  className="text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]" 
                  leftIcon={<Activity className="h-4 w-4" />}
                >
                  Sync Live Feed
                </Button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Active Hackathons */}
              <Card className="p-5 flex items-center justify-between border-[#E2E8F0] shadow-sm hover:border-[#FF006E]/30 transition-all duration-200">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">Active Challenges</p>
                  <h3 className="font-heading text-2xl font-extrabold text-[#0F172A] mt-1">{hackathons.length}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FF006E]/5 text-[#FF006E]">
                  <Trophy className="h-5 w-5" />
                </div>
              </Card>

              {/* Card 2: Total Registrations */}
              <Card className="p-5 flex items-center justify-between border-[#E2E8F0] shadow-sm hover:border-[#FF006E]/30 transition-all duration-200">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">Total Enrollments</p>
                  <h3 className="font-heading text-2xl font-extrabold text-[#0F172A] mt-1">{globalRegistrations.length}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </Card>

              {/* Card 3: Shortlisted */}
              <Card className="p-5 flex items-center justify-between border-[#E2E8F0] shadow-sm hover:border-[#FF006E]/30 transition-all duration-200">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">Shortlisted Teams</p>
                  <h3 className="font-heading text-2xl font-extrabold text-[#0F172A] mt-1">
                    {globalRegistrations.filter(r => r.status === "SHORTLISTED").length}
                  </h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </Card>

              {/* Card 4: Evaluation Docker Sandbox Status */}
              <Card className="p-5 flex items-center justify-between border-[#E2E8F0] shadow-sm hover:border-[#FF006E]/30 transition-all duration-200">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">Docker Sandbox</p>
                  <h3 className="font-heading text-2xl font-extrabold text-emerald-600 mt-1">Active</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-emerald-50 text-emerald-600">
                  <Server className="h-5 w-5" />
                </div>
              </Card>
            </div>

            {/* Recent Platform Registrations */}
            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Recent Enrollments Log
                  </CardTitle>
                  <CardDescription className="text-xs text-[#475569]">
                    Real-time participant registrations across all live challenges.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[#FF006E] border-[#FF006E]/20 bg-[#FF006E]/5 font-bold">
                  Live Feed
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {globalRegistrations.length === 0 ? (
                  <div className="p-8 text-center">
                    <EmptyState
                      title="No Enrollments Recorded"
                      description="No participants have registered for any hackathons on the platform yet."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]/30 text-[#475569] font-semibold">
                          <th className="p-4">Participant</th>
                          <th className="p-4">College</th>
                          <th className="p-4">Hackathon</th>
                          <th className="p-4">Mode</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9]">
                        {globalRegistrations.slice(0, 5).map((reg) => {
                          const matchingHack = hackathons.find(h => h.id === reg.hackathonId);
                          return (
                            <tr key={reg.id} className="hover:bg-[#F8FAFC]/60 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-[#0F172A]">
                                  {reg.user?.firstName ? `${reg.user.firstName} ${reg.user.lastName || ""}`.trim() : "Anonymous User"}
                                </div>
                                <div className="text-[10px] text-[#475569]">{reg.user?.email || "No email"}</div>
                              </td>
                              <td className="p-4 text-[#475569]">{reg.collegeName || "N/A"}</td>
                              <td className="p-4 font-medium text-[#0F172A]">{matchingHack?.name || reg.hackathonId}</td>
                              <td className="p-4 capitalize text-[#475569]">{reg.participationMode.replace("_", " ")}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                                  reg.status === "SHORTLISTED" ? "bg-green-50 text-green-700 border border-green-200" :
                                  reg.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200" :
                                  reg.status === "APPROVED" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                  "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                }`}>
                                  {reg.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Challenge Submissions Logs</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchAdminSubmissions(activeManageHackathonId || undefined)}
                        leftIcon={<RefreshCw className={`h-3 w-3 ${loadingAdminSubmissions ? "animate-spin" : ""}`} />}
                      >
                        Refresh Submissions
                      </Button>
                    </div>
                    {loadingAdminSubmissions ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#FF006E]" />
                      </div>
                    ) : adminSubmissions.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <th className="p-3">Project Name</th>
                              <th className="p-3">Participant</th>
                              <th className="p-3">Repository</th>
                              <th className="p-3">Deployment</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Score</th>
                              <th className="p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adminSubmissions.map((sub, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{sub.projectName}</td>
                                <td className="p-3">
                                  <div className="font-medium text-slate-700">{sub.user.firstName} {sub.user.lastName}</div>
                                  <div className="text-[10px] text-slate-400">{sub.user.email}</div>
                                </td>
                                <td className="p-3 font-mono text-slate-500">
                                  <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="text-[#FF006E] hover:underline truncate max-w-[200px] block">
                                    {sub.repoUrl.replace("https://github.com/", "")}
                                  </a>
                                </td>
                                <td className="p-3">
                                  {sub.deploymentUrl ? (
                                    <a href={sub.deploymentUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate max-w-[150px] block">
                                      {sub.deploymentUrl}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic">None</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Badge className={
                                    sub.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                    sub.status === "FAILED" ? "bg-rose-50 text-rose-600 border-rose-200" :
                                    "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                                  }>
                                    {sub.status}
                                  </Badge>
                                </td>
                                <td className="p-3 font-bold text-[#FF006E]">{sub.score !== null ? `${sub.score}/100` : "Pending"}</td>
                                <td className="p-3">
                                  {sub.reports && sub.reports.length > 0 ? (
                                    <button
                                      onClick={() => setSelectedSubmissionForReport(sub)}
                                      className="text-[#FF006E] hover:underline font-bold"
                                    >
                                      View Audit Report
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 italic">No Report</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState
                        title="No Project Submissions Received"
                        description="Once teams link their repository links and execute AST code analysis, files will appear here."
                        icon={<GitPullRequest className="h-7 w-7" />}
                      />
                    )}
                  </Card>
                )}

                {activePortalTab === "leaderboard" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200 space-y-4">
                    {/* Leaderboard Problem Statement Filter */}
                    {manageBlueprint?.problemStatements && Array.isArray(manageBlueprint.problemStatements) && manageBlueprint.problemStatements.length > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2 border-b border-[#F1F5F9]">
                        <span className="text-xs font-bold text-[#475569]">Filter by Problem:</span>
                        <select
                          value={adminLeaderboardFilterPsId}
                          onChange={(e) => setAdminLeaderboardFilterPsId(e.target.value)}
                          className="flex h-9 w-64 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-none shadow-xs"
                        >
                          <option value="all">All Problem Statements</option>
                          {manageBlueprint.problemStatements.map((ps: any, idx: number) => (
                            <option key={ps.id || idx} value={ps.id || ps.title}>
                              {ps.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {loadingAdminLeaderboard ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#FF006E]" />
                      </div>
                    ) : adminLeaderboard.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <th className="p-3">Rank</th>
                              <th className="p-3">Project Name</th>
                              <th className="p-3">Participant</th>
                              <th className="p-3">Score</th>
                              <th className="p-3">Grade</th>
                              <th className="p-3">Date Evaluated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adminLeaderboard.map((row, idx) => {
                              const matchedPS = manageBlueprint?.problemStatements?.find((p: any) => p.id === row.problemStatementId || p.title === row.problemStatementId);
                              const psTitle = matchedPS ? matchedPS.title : row.problemStatementId || "Default Problem";
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-extrabold text-slate-800">Rank {row.rank}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-[#0F172A]">{row.projectName}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold">{psTitle}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-medium text-slate-700">{row.participantName}</div>
                                    <div className="text-[10px] text-slate-400">{row.participantEmail}</div>
                                  </td>
                                  <td className="p-3 font-bold text-[#FF006E]">{row.score}/100</td>
                                  <td className="p-3">
                                  <Badge className={row.grade === "PASSED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}>
                                    {row.grade}
                                  </Badge>
                                </td>
                                <td className="p-3 text-slate-500">{new Date(row.timestamp).toLocaleString()}</td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState
                        title="Platform Leaderboard Uncalculated"
                        description="Rankings will display here once automated tests run and scorecards are published."
                        icon={<Medal className="h-7 w-7" />}
                      />
                    )}
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
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleBannerFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {bannerImage ? (
                        <div className="space-y-2">
                          <div className="relative h-28 w-full rounded-lg border border-[#E2E8F0] overflow-hidden flex flex-col justify-end p-3 text-white shadow-sm" style={{ background: bannerImage }}>
                            <div className="absolute inset-0 bg-black/20" />
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
                              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-[#EF4444] transition-colors"
                              title="Remove Banner"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change Banner Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center h-28 w-full border-2 border-dashed border-[#CBD5E1] rounded-lg bg-[#F8FAFC] hover:bg-slate-100 hover:border-[#FF006E] cursor-pointer transition-all p-4 text-center group"
                          >
                            <ImageIcon className="h-6 w-6 text-[#94A3B8] group-hover:text-[#FF006E] mb-1.5 transition-colors" />
                            <span className="text-[11px] font-bold text-[#0F172A]">
                              Upload Brand Banner Image
                            </span>
                            <span className="text-[9px] text-[#64748B] mt-0.5">
                              Click to choose PNG, JPG, WebP, SVG (Max 5MB)
                            </span>
                          </div>

                          {/* Preset Gradients fallback options */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Or choose preset gradient:</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { label: "Pink Glow", bg: "linear-gradient(135deg, #FF006E, #FFD60A)" },
                                { label: "Ocean Blue", bg: "linear-gradient(to right, #2563EB, #06B6D4)" },
                                { label: "Dark Arena", bg: "linear-gradient(to right, #0F172A, #312E81)" },
                                { label: "Emerald", bg: "linear-gradient(to right, #059669, #10B981)" },
                              ].map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setBannerImage(preset.bg)}
                                  className="h-7 rounded-md border border-[#E2E8F0] shadow-2xs hover:scale-105 transition-transform"
                                  style={{ background: preset.bg }}
                                  title={preset.label}
                                />
                              ))}
                            </div>
                          </div>
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
                        <div className="border-t border-[#F1F5F9] my-1" />
                        <Checkbox
                          label="Release Problem Statement"
                          description="Display the challenge details, problem description, and test scenarios to registered participants."
                          checked={problemReleased}
                          onChange={(e) => setProblemReleased(e.target.checked)}
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
                              {hackathon.lifecycle || "DRAFT"}
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
                              {hackathon.registrationClose ? new Date(hackathon.registrationClose).toLocaleDateString() : "Not configured"}
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
                            {hackathon.problemReleased ? (
                              <Badge variant="success" size="sm" className="bg-[#D1FAE5] text-[#065F46] border-[#34D399]">
                                Problem Released
                              </Badge>
                            ) : (
                              <Badge variant="outline" size="sm" className="bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]">
                                Problem Hidden
                              </Badge>
                            )}
                          </div>
                        </CardContent>

                        {/* Footer details link */}
                        <CardFooter className="p-3 bg-[#F8FAFC]/50 border-t border-[#F1F5F9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          {(() => {
                            const currentStatus = (hackathon.lifecycle || "DRAFT") as string;
                            let statusText = "Draft";
                            let statusColor = "text-slate-500";
                            if (currentStatus === "UPCOMING") {
                              statusText = "Upcoming";
                              statusColor = "text-amber-600";
                            } else if (currentStatus === "ACTIVE") {
                              statusText = "Active";
                              statusColor = "text-emerald-600";
                            } else if (currentStatus === "COMPLETED") {
                              statusText = "Completed";
                              statusColor = "text-slate-600";
                            } else if (currentStatus === "ARCHIVED") {
                              statusText = "Archived";
                              statusColor = "text-rose-600";
                            }
                            return (
                              <span className={`${statusColor} font-bold flex items-center gap-1`}>
                                <Clock className="h-3.5 w-3.5" /> {statusText}
                              </span>
                            );
                          })()}
                           <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full sm:w-auto sm:justify-end">
                            {!hackathon.published && (
                              <button
                                type="button"
                                onClick={() => handlePublishHackathon(hackathon.id, hackathon.name)}
                                className="text-[#16A34A] hover:text-[#15803D] flex items-center gap-0.5 font-bold"
                              >
                                <Rocket className="h-3.5 w-3.5" />
                                <span>Publish</span>
                              </button>
                            )}
                            {hackathon.published && !hackathon.archived && (
                              <button
                                type="button"
                                onClick={() => handleArchiveHackathon(hackathon.id, hackathon.name)}
                                className="text-[#D97706] hover:text-[#B45309] flex items-center gap-0.5 font-bold"
                                title="Archive Hackathon"
                              >
                                <Archive className="h-3.5 w-3.5" />
                                <span>Archive</span>
                              </button>
                            )}
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
                            <button
                              type="button"
                              onClick={() => handleDeleteHackathon(hackathon.id, hackathon.name)}
                              className="text-[#EF4444] hover:text-[#B91C1C] flex items-center gap-0.5 font-bold"
                              title="Delete Hackathon"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
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

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Active Submissions Feed</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchAdminSubmissions()}
                  leftIcon={<RefreshCw className={`h-3 w-3 ${loadingAdminSubmissions ? "animate-spin" : ""}`} />}
                >
                  Refresh Submissions
                </Button>
              </div>
              {loadingAdminSubmissions ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#FF006E]" />
                </div>
              ) : adminSubmissions.length > 0 ? (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="p-3">Hackathon</th>
                        <th className="p-3">Project Name</th>
                        <th className="p-3">Participant</th>
                        <th className="p-3">Repository</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminSubmissions.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-600">{sub.hackathonName}</td>
                          <td className="p-3 font-semibold text-slate-800">{sub.projectName}</td>
                          <td className="p-3">
                            <div className="font-medium text-slate-700">{sub.user.firstName} {sub.user.lastName}</div>
                            <div className="text-[10px] text-slate-400">{sub.user.email}</div>
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="text-[#FF006E] hover:underline truncate max-w-[200px] block">
                              {sub.repoUrl.replace("https://github.com/", "")}
                            </a>
                          </td>
                          <td className="p-3">
                            <Badge className={
                              sub.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              sub.status === "FAILED" ? "bg-rose-50 text-rose-600 border-rose-200" :
                              "bg-amber-50 text-amber-600 border-amber-200"
                            }>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-[#FF006E]">{sub.score !== null ? `${sub.score}/100` : "Pending"}</td>
                          <td className="p-3">
                            {sub.reports && sub.reports.length > 0 ? (
                              <button
                                onClick={() => setSelectedSubmissionForReport(sub)}
                                className="text-[#FF006E] hover:underline font-bold"
                              >
                                View Audit Report
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">No Report</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No Project Submissions Found"
                  description="Once participants submit their software repositories, projects will appear here for code analysis and review."
                  icon={<GitPullRequest className="h-7 w-7" />}
                />
              )}
            </Card>
          </motion.div>
        );

      case "judging":
        const judgingProblemStatements = (selectedHackathonBlueprint?.problemStatements as any[]) || [];
        return (
          <motion.div
            key="judging"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header and Selectors */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Scale className="h-6 w-6 text-[#FF006E]" />
                  <span>Virtual Judging Center</span>
                </h1>
                <p className="text-xs text-[#475569]">
                  Inspect automated scorecard parameters, retry failed runs, and view live participant reports.
                </p>
              </div>

              {/* Filters panel */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#475569]">Hackathon:</span>
                  <select
                    value={judgingHackathonId}
                    onChange={(e) => {
                      setJudgingHackathonId(e.target.value);
                      setJudgingProblemStatementId("");
                    }}
                    className="flex h-9 w-48 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-hidden shadow-xs"
                  >
                    <option value="">Select Hackathon...</option>
                    {Array.isArray(hackathons) && hackathons.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {judgingHackathonId && judgingProblemStatements.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#475569]">Problem:</span>
                    <select
                      value={judgingProblemStatementId}
                      onChange={(e) => setJudgingProblemStatementId(e.target.value)}
                      className="flex h-9 w-48 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-hidden shadow-xs"
                    >
                      <option value="">All Problem Statements</option>
                      {judgingProblemStatements.map((ps: any, idx: number) => (
                        <option key={ps.id || idx} value={ps.id || ps.title}>{ps.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#475569]">Status:</span>
                  <select
                    value={judgingStatusFilter}
                    onChange={(e) => setJudgingStatusFilter(e.target.value)}
                    className="flex h-9 w-36 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-hidden shadow-xs"
                  >
                    <option value="">All Statuses</option>
                    <option value="QUEUED">Queued</option>
                    <option value="EVALUATING">Evaluating</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics Row */}
            {judgingHackathonId && judgingStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Queued</span>
                  <span className="text-2xl font-black text-[#0F172A] mt-1">{judgingStats.queuedCount}</span>
                </Card>
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Evaluating</span>
                  <span className="text-2xl font-black text-[#FF006E] mt-1">{judgingStats.evaluatingCount}</span>
                </Card>
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Completed</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1">{judgingStats.completedCount}</span>
                </Card>
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Failed</span>
                  <span className="text-2xl font-black text-rose-600 mt-1">{judgingStats.failedCount}</span>
                </Card>
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between col-span-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Average Score</span>
                  <span className="text-2xl font-black text-[#0F172A] mt-1">{judgingStats.averageScore}/100</span>
                </Card>
                <Card className="p-4 bg-white border-[#E2E8F0] flex flex-col justify-between col-span-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Range (High/Low)</span>
                  <span className="text-sm font-bold text-[#0F172A] mt-2">
                    High: <span className="text-emerald-600">{judgingStats.highestScore}</span><br />
                    Low: <span className="text-rose-600">{judgingStats.lowestScore}</span>
                  </span>
                </Card>
              </div>
            )}

            {/* Submissions List */}
            {!judgingHackathonId ? (
              <Card className="p-8 text-center text-slate-500 italic">
                Please select a Hackathon to load judging data.
              </Card>
            ) : loadingJudgingSubmissions ? (
              <Card className="p-12 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF006E] border-t-transparent" />
              </Card>
            ) : judgingSubmissions.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No Submissions Match Filter"
                  description="No project evaluation logs or records match the selected hackathon/problem filters."
                  icon={<Scale className="h-7 w-7" />}
                />
              </Card>
            ) : (
              <Card className="overflow-hidden border border-[#E2E8F0] shadow-xs rounded-[16px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 font-bold text-[#475569]">
                        <th className="p-4">Participant / Team</th>
                        <th className="p-4">Problem Statement</th>
                        <th className="p-4">Attempt</th>
                        <th className="p-4">Repository URL</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Submitted At</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {judgingSubmissions.map((sub) => {
                        const displayName = sub.user 
                          ? `${sub.user.firstName || ""} ${sub.user.lastName || ""}`.trim() || sub.user.email.split("@")[0]
                          : "Unknown User";
                        const displayEmail = sub.user ? sub.user.email : "N/A";
                        
                        // Resolve problem statement title
                        const matchedPS = judgingProblemStatements.find((p: any) => p.id === sub.problemStatementId || p.title === sub.problemStatementId);
                        const psTitle = matchedPS ? matchedPS.title : sub.problemStatementId || "Default Problem";

                        // Compute duration if completed
                        let durationStr = "N/A";
                        if (sub.completedAt) {
                          const diff = new Date(sub.completedAt).getTime() - new Date(sub.createdAt).getTime();
                          durationStr = `${Math.round(diff / 1000)}s`;
                        }

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-[#0F172A]">{displayName}</div>
                              <div className="text-[10px] text-[#64748B]">{displayEmail}</div>
                            </td>
                            <td className="p-4 text-[#475569] max-w-[150px] truncate" title={psTitle}>
                              {psTitle}
                            </td>
                            <td className="p-4 font-bold text-[#0F172A]">v{sub.version}</td>
                            <td className="p-4">
                              <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline max-w-[200px] truncate block">
                                {sub.repoUrl.replace("https://github.com/", "")}
                              </a>
                            </td>
                            <td className="p-4">
                              {sub.status === "COMPLETED" && <Badge variant="success" size="sm" className="bg-[#D1FAE5] text-[#065F46] border-[#34D399]">Completed</Badge>}
                              {sub.status === "FAILED" && <Badge variant="error" size="sm" className="bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]">Failed</Badge>}
                              {sub.status === "QUEUED" && <Badge variant="outline" size="sm" className="bg-slate-100 text-slate-700 border-slate-300 animate-pulse">Queued</Badge>}
                              {sub.status === "EVALUATING" && <Badge variant="outline" size="sm" className="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] animate-pulse">Evaluating</Badge>}
                            </td>
                            <td className="p-4 font-black text-sm text-[#0F172A]">{sub.score !== null ? `${sub.score}/100` : "—"}</td>
                            <td className="p-4">
                              <div>{new Date(sub.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-[#64748B]">Duration: {durationStr}</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold rounded-lg border-[#E2E8F0] text-slate-700 hover:bg-slate-100"
                                  onClick={() => setSelectedSubmissionForReport(sub)}
                                >
                                  View Report
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className={`h-7 px-2.5 text-[10px] font-bold rounded-lg ${sub.status === "FAILED" ? "bg-[#FF006E] hover:bg-[#D8005C] text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                                  disabled={sub.status !== "FAILED"}
                                  onClick={() => handleRetryJudgingEvaluation(sub.id)}
                                >
                                  Retry
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#FF006E]" />
                  <span>Participant Registrations</span>
                </h1>
                <p className="text-xs text-[#475569]">
                  Manage participant entries, check details, and shortlist or reject registrations.
                </p>
              </div>

              {/* Hackathon Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#475569]">Hackathon:</span>
                <select
                  value={selectedRegHackathonId}
                  onChange={(e) => setSelectedRegHackathonId(e.target.value)}
                  className="flex h-9 w-64 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-hidden shadow-xs"
                >
                  <option value="">Select a Hackathon...</option>
                  {Array.isArray(hackathons) && hackathons.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingRegs ? (
              <Card className="p-12 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF006E] border-t-transparent" />
              </Card>
            ) : registrations.length === 0 ? (
              <Card className="p-6">
                <EmptyState
                  title="No Registered Participants"
                  description="No participants have registered for this hackathon yet."
                  icon={<Users className="h-7 w-7" />}
                />
              </Card>
            ) : (
              <Card className="overflow-hidden border border-[#E2E8F0] shadow-xs rounded-[16px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 font-bold text-[#475569]">
                        <th className="p-4">Participant</th>
                        <th className="p-4">College</th>
                        <th className="p-4">Mode / Team Name</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {registrations.map((reg) => {
                        const displayName = reg.user 
                          ? `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email.split("@")[0]
                          : "Unknown User";
                        const displayEmail = reg.user ? reg.user.email : "N/A";

                        return (
                          <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 space-y-0.5">
                              <div className="font-bold text-[#0F172A]">{displayName}</div>
                              <div className="text-[10px] text-[#64748B]">{displayEmail}</div>
                            </td>
                            <td className="p-4 text-[#475569]">{reg.collegeName || "N/A"}</td>
                            <td className="p-4 space-y-0.5">
                              <span className="font-medium text-[#0F172A] capitalize">{reg.participationMode}</span>
                              {reg.teamName && (
                                <div className="text-[10px] font-bold text-[#FF006E]">{reg.teamName}</div>
                              )}
                            </td>
                            <td className="p-4">
                              {reg.status === "SHORTLISTED" && (
                                <Badge variant="success" size="sm" className="bg-[#D1FAE5] text-[#065F46] border-[#34D399]">Shortlisted</Badge>
                              )}
                              {reg.status === "REJECTED" && (
                                <Badge variant="error" size="sm" className="bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]">Rejected</Badge>
                              )}
                              {reg.status === "APPROVED" && (
                                <Badge variant="success" size="sm" className="bg-[#DBEAFE] text-[#1E40AF] border-[#93C5FD]">Approved</Badge>
                              )}
                              {reg.status === "ON_HOLD" && (
                                <Badge variant="outline" size="sm" className="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]">On Hold</Badge>
                              )}
                              {reg.status === "PENDING" && (
                                <Badge variant="outline" size="sm" className="bg-slate-100 text-slate-700 border-slate-300">Pending Review</Badge>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold rounded-lg bg-[#10B981] hover:bg-[#0D9668] text-white"
                                  onClick={() => handleUpdateRegStatus(reg.id, "SHORTLISTED")}
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-white border-0"
                                  onClick={() => handleUpdateRegStatus(reg.id, "ON_HOLD")}
                                >
                                  On Hold
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white"
                                  onClick={() => handleUpdateRegStatus(reg.id, "REJECTED")}
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-[#FF006E]" />
                  <span>Metrics & Live Logs</span>
                </h1>
                <p className="text-xs text-[#475569]">
                  Monitor evaluation queue health, worker concurrency, and recent run diagnostics.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemMetrics}
                className="h-9 px-4 rounded-xl border border-[#E2E8F0] hover:bg-slate-100 font-bold text-xs"
                disabled={loadingSystemMetrics}
              >
                {loadingSystemMetrics ? "Refreshing..." : "Refresh Metrics"}
              </Button>
            </div>

            {loadingSystemMetrics && !systemMetrics ? (
              <Card className="p-12 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF006E] border-t-transparent" />
              </Card>
            ) : !systemMetrics ? (
              <Card className="p-8 text-center text-slate-500 italic">
                Failed to load system metrics. Click refresh to try again.
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* BullMQ Queue Health Card */}
                  <Card className="p-6 border border-[#E2E8F0] shadow-xs">
                    <h3 className="text-xs font-black uppercase text-[#64748B] tracking-wider mb-4 flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF006E] animate-pulse" />
                      BullMQ Queue Engine Health
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Driver Connection</span>
                        <span className="font-bold text-[#0F172A] capitalize">
                          {systemMetrics.queue ? `${systemMetrics.queue.driver} (connected)` : "In-Memory Fallback"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Jobs Waiting (Queued)</span>
                        <span className="font-bold text-[#0F172A]">
                          {systemMetrics.queue ? systemMetrics.queue.waiting : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Jobs Active (Evaluating)</span>
                        <span className="font-bold text-[#FF006E]">
                          {systemMetrics.queue ? systemMetrics.queue.active : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Jobs Completed (Today)</span>
                        <span className="font-bold text-emerald-600">
                          {systemMetrics.queue ? systemMetrics.queue.completed : 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="text-[#64748B]">Jobs Failed</span>
                        <span className="font-bold text-rose-600">
                          {systemMetrics.queue ? systemMetrics.queue.failed : 0}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* DB Auditable Stats */}
                  <Card className="p-6 border border-[#E2E8F0] shadow-xs">
                    <h3 className="text-xs font-black uppercase text-[#64748B] tracking-wider mb-4 flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Database Submission Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Total Completed Submissions</span>
                        <span className="font-bold text-emerald-600">{systemMetrics.db.completed}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Total Failed Submissions</span>
                        <span className="font-bold text-rose-600">{systemMetrics.db.failed}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Total Queued Submissions</span>
                        <span className="font-bold text-[#0F172A]">{systemMetrics.db.queued}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2">
                        <span className="text-[#64748B]">Total Evaluating Submissions</span>
                        <span className="font-bold text-[#FF006E]">{systemMetrics.db.evaluating}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-1">
                        <span className="text-[#64748B]">Avg Evaluation Duration</span>
                        <span className="font-bold text-[#0F172A]">{systemMetrics.db.avgDurationSec} seconds</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Failures Panel */}
                <Card className="p-6 border border-[#E2E8F0] shadow-xs rounded-[16px]">
                  <h3 className="text-xs font-black uppercase text-[#0F172A] tracking-wider mb-3">
                    Recent Evaluation Diagnostics
                  </h3>
                  <p className="text-[11px] text-[#64748B] mb-4">
                    The following evaluations encountered runtime failures. Detailed errors (e.g. lighthouse timeouts, browser launch issues) can be viewed by inspecting individual reports in the Virtual Judging Center.
                  </p>

                  {systemMetrics.recentFailures.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#64748B] italic bg-slate-50 rounded-xl">
                      No failed evaluation runs found in the database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] bg-slate-50 font-bold text-[#475569]">
                            <th className="p-3">Submission ID</th>
                            <th className="p-3">Project Name</th>
                            <th className="p-3">Repository URL</th>
                            <th className="p-3">Failed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {systemMetrics.recentFailures.map((fail: any) => (
                            <tr key={fail.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-[10px] text-slate-500">{fail.id}</td>
                              <td className="p-3 font-bold text-[#0F172A]">{fail.projectName}</td>
                              <td className="p-3 text-[#475569]">{fail.repoUrl}</td>
                              <td className="p-3 text-slate-500">
                                {new Date(fail.failedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
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
                <Button onClick={handleSaveSystemConfig} className="bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-sm font-bold" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
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

      {selectedSubmissionForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-y-auto border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedSubmissionForReport(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all"
              title="Close Report"
            >
              <X className="h-5 w-5" />
            </button>
            {selectedSubmissionForReport.reports && selectedSubmissionForReport.reports.length > 0 ? (
              <EvaluationReport report={selectedSubmissionForReport.reports[0].payload} />
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500 italic">No evaluation report available for this submission.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </RequireRole>
  );
}
