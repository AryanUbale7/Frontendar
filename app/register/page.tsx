"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronLeft,
  Calendar,
  Users,
  User as UserIcon,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  BookOpen,
  Link as LinkIcon,
  GitPullRequest,
  Medal,
  ExternalLink,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  CheckSquare,
  PlayCircle,
  ShieldCheck,
  Loader2,
  Circle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/hooks/useUser";
import { EmptyState } from "@/components/design-system/EmptyState";
import { EvaluationReport } from "@/components/design-system/EvaluationReport";

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

interface Round {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
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
}

function HackathonRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hackathonId = searchParams.get("id");
  const goToWorkspace = searchParams.get("workspace") === "true";
  const { user } = useUser();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>("PENDING");
  const [blueprint, setBlueprint] = useState<any>(null);
  const [activeProblemIdx, setActiveProblemIdx] = useState<number>(0);
  
  // System Config & Email Verification States
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [profileVerified, setProfileVerified] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifyingEmailState, setVerifyingEmailState] = useState(false);

  const handleSendVerificationCode = async () => {
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" });
      if (res.ok) {
        setVerificationSent(true);
        alert("Verification code has been logged to the server console!");
      } else {
        const err = await res.json();
        alert("Failed to send code: " + (err.error || err.message));
      }
    } catch (e: any) {
      alert("Error sending code: " + e.message);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmailState(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCodeInput })
      });
      if (res.ok) {
        setProfileVerified(true);
        alert("Email verified successfully!");
      } else {
        const err = await res.json();
        alert("Verification failed: " + (err.error || err.message));
      }
    } catch (e: any) {
      alert("Error verifying email: " + e.message);
    } finally {
      setVerifyingEmailState(false);
    }
  };
  
  // If ?workspace=true, go straight to workspace tab (skip form)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState<"problem" | "rules" | "resources" | "submit" | "leaderboard">(goToWorkspace ? "submit" : "problem");

  // Form States
  const [collegeName, setCollegeName] = useState("");
  const [participationMode, setParticipationMode] = useState<"solo" | "create_team" | "join_team">("solo");
  const [teamName, setTeamName] = useState("");
  const [memberEmails, setMemberEmails] = useState(["", "", ""]);
  const [teamCode, setTeamCode] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  // Submission States
  const [repoUrl, setRepoUrl] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [astCheckResult, setAstCheckResult] = useState<string | null>(null);
  const [evaluationReport, setEvaluationReport] = useState<any | null>(null);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<any | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  
  // Submission Workspace Wizard States
  const [submissionStep, setSubmissionStep] = useState(1);
  const [branchName, setBranchName] = useState("main");
  const [projectName, setProjectName] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [detailedDesc, setDetailedDesc] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [newFeatureTag, setNewFeatureTag] = useState("");
  
  const [selectedTechStack, setSelectedTechStack] = useState<any>({
    frontend: [],
    backend: [],
    database: [],
    cloud: [],
    ai: [],
    devops: []
  });

  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [presentationPdf, setPresentationPdf] = useState("");
  const [architectureDiagram, setArchitectureDiagram] = useState("");
  
  const [teamContributions, setTeamContributions] = useState<any[]>([{ member: "", role: "", contribution: "" }]);

  const [checklistRepo, setChecklistRepo] = useState(false);
  const [checklistDeploy, setChecklistDeploy] = useState(false);
  const [checklistReadme, setChecklistReadme] = useState(false);
  const [checklistConfirm, setChecklistConfirm] = useState(false);
  const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardFilterPsId, setLeaderboardFilterPsId] = useState<string>("all");

  useEffect(() => {
    if (blueprint && submissionAttempts.length > 0) {
      const existing = submissionAttempts[0];
      if (existing && existing.problemStatementId) {
        const stmts = blueprint.problemStatements || [];
        const matchedIdx = stmts.findIndex((p: any) => p.id === existing.problemStatementId || p.title === existing.problemStatementId);
        if (matchedIdx !== -1) {
          setActiveProblemIdx(matchedIdx);
        }
      }
    }
  }, [blueprint, submissionAttempts]);

  // Load Hackathon details and check registration status
  useEffect(() => {
    // If coming from "View Workspace", assume already registered to skip form instantly
    if (goToWorkspace) {
      setIsRegistered(true);
    }

    const fetchHackathon = async () => {
      try {
        const res = await fetch("/api/hackathons");
        if (res.ok) {
          const list: Hackathon[] = await res.json();
          const found = list.find((h) => h.id === hackathonId);
          if (found) {
            setHackathon(found);
            
            // Fetch blueprint configuration
            fetch(`/api/blueprint?hackathonId=${found.id}`)
              .then((r) => r.json())
              .then((bp) => {
                if (bp && !bp.error) {
                  setBlueprint(bp);
                }
              })
              .catch((err) => console.warn("Failed to load blueprint: ", err));

            // Fetch system configuration
            fetch("/api/system/config")
              .then((r) => r.json())
              .then((cfg) => {
                if (cfg && !cfg.error) {
                  setSystemConfig(cfg);
                }
              })
              .catch(() => {});

            // Fetch current user details for emailVerified
            fetch("/api/auth/me")
              .then((r) => r.json())
              .then((usr) => {
                if (usr && usr.emailVerified) {
                  setProfileVerified(true);
                }
              })
              .catch(() => {});

            // Check if user is enrolled
            if (user) {
              fetch(`/api/registrations?hackathonId=${found.id}&userId=${user.id}`)
                .then((r) => r.json())
                .then((list) => {
                  if (Array.isArray(list)) {
                    const myReg = list.find((r: any) => r.userId === user.id);
                    if (myReg) {
                      setIsRegistered(true);
                      setRegistrationStatus(myReg.status);

                      // Load attempts and active report from database
                      fetch(`/api/submissions?hackathonId=${found.id}&userId=${user.id}`)
                        .then((r) => r.json())
                        .then((subs) => {
                          if (Array.isArray(subs)) {
                            const formatted = subs.map((sub, idx) => ({
                              ...sub,
                              version: sub.version || idx + 1,
                              time: new Date(sub.updatedAt).toLocaleString(),
                              status: sub.status,
                              score: sub.score ?? 0,
                              grade: sub.grade || (sub.score && sub.score >= 75 ? "PASSED" : "FAILED"),
                              repoUrl: sub.repoUrl,
                              reports: sub.reports
                            }));
                            setSubmissionAttempts(formatted);
                            if (formatted.length > 0) {
                              setRepoUrl(formatted[0].repoUrl);
                            }

                            const newestSub = subs[0];
                            if (newestSub && (newestSub.status === "QUEUED" || newestSub.status === "EVALUATING")) {
                              setEvaluatingSubmission(newestSub);
                              setSubmissionSuccess(true);
                              void pollForEvaluationResult(found.id, user.id);
                            }

                            const completedSub = subs.find(s => s.status === "COMPLETED" && s.reports && s.reports.length > 0);
                            if (completedSub) {
                              setEvaluationReport(completedSub.reports[0].payload);
                              setSubmissionSuccess(true);
                            }
                          }
                        })
                        .catch((err) => console.error("Failed to load submissions: ", err));
                    }
                  }
                })
                .catch((err) => console.error("Failed to load registration: ", err));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId, user]);

  useEffect(() => {
    if (user) {
      setCollegeName(user.collegeName || "");
    }
  }, [user]);

  useEffect(() => {
    if (activePortalTab === "leaderboard" && hackathonId) {
      let cancelled = false;
      const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
          const url = leaderboardFilterPsId && leaderboardFilterPsId !== "all"
            ? `/api/hackathons/${hackathonId}/leaderboard?problemStatementId=${encodeURIComponent(leaderboardFilterPsId)}`
            : `/api/hackathons/${hackathonId}/leaderboard`;
          const res = await fetch(url);
          const data = await res.json();
          if (!cancelled && data && Array.isArray(data.leaderboard)) {
            setLeaderboardList(data.leaderboard);
          }
        } catch (err) {
          console.error("Failed to load leaderboard:", err);
        } finally {
          if (!cancelled) setLoadingLeaderboard(false);
        }
      };
      loadLeaderboard();
      const interval = setInterval(loadLeaderboard, 15000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, [activePortalTab, hackathonId, leaderboardFilterPsId]);

  const handleMemberEmailChange = (idx: number, val: string) => {
    setMemberEmails(memberEmails.map((email, i) => (i === idx ? val : email)));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!user) {
      setErrorMsg("You must be logged in to register.");
      return;
    }
    if (!hackathon) {
      setErrorMsg("Invalid hackathon selection.");
      return;
    }
    if (!agreeRules) {
      setErrorMsg("You must agree to the hackathon rules.");
      return;
    }
    if (participationMode === "create_team" && !teamName) {
      setErrorMsg("Please enter a Team Name.");
      return;
    }
    if (participationMode === "join_team" && !teamCode) {
      setErrorMsg("Please enter a valid Team Invite Code.");
      return;
    }

    const activeHackathon = hackathon;
    const activeUser = user;
    if (!activeHackathon || !activeUser) {
      setErrorMsg("Invalid session state.");
      return;
    }

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonId: activeHackathon.id,
          userId: activeUser.id,
          userEmail: activeUser.email,
          collegeName,
          teamName: participationMode === "create_team" ? teamName : null,
          participationMode,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to register.");
      }

      const reg = await response.json();
      setRegistrationStatus(reg.status);
      setSuccess(true);

      setTimeout(() => {
        setIsRegistered(true);
        setShowRegistrationForm(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register. Please try again.");
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeHackathon = hackathon;
    if (!activeHackathon) {
      alert("No active hackathon loaded.");
      return;
    }
    if (!user) {
      alert("You must be logged in to submit your project.");
      return;
    }
    if (!repoUrl.includes("github.com")) {
      alert("Please provide a valid GitHub repository URL.");
      return;
    }
    if (activeHackathon.lifecycle && activeHackathon.lifecycle !== "ACTIVE") {
      alert("Submissions are currently closed. The hackathon must be in its Active window to accept projects.");
      return;
    }
    setSubmittingProject(true);
    setAstCheckResult("analyzing");

    let bpData = blueprint; // Use the blueprint already fetched on mount

    if (!bpData) {
      const bpStored = localStorage.getItem(`fa_blueprint_${activeHackathon.id}`);
      if (bpStored) {
        try {
          bpData = JSON.parse(bpStored);
        } catch (e) {}
      }
    }

    if (!bpData) {
      bpData = {
        problemStatement: { title: activeHackathon.name, description: activeHackathon.description },
        requiredFeatures: activeHackathon.problemTitle ? [{ name: activeHackathon.problemTitle, description: "Core feature component", mandatory: true, weight: 25 }] : [],
        techStackRules: { allowed: ["React", "TypeScript"], preferred: [], restricted: [] },
        submissionRequirements: { githubRepo: true, liveDeployment: true, readme: true },
        codeQualityRules: { folders: 25, comments: 25 },
        performanceRules: { lighthouseMin: 70, accessibilityMin: 60, seoMin: 70, bestPracticesMin: 70, performanceWeight: 15 },
        securityRules: { secretsDetection: true },
        scoringSystem: {
          categories: [
            { name: "Problem Alignment", maxMarks: 20, weight: 20, passingMarks: 12 },
            { name: "UI/UX & Features", maxMarks: 25, weight: 25, passingMarks: 15 },
            { name: "Performance & SEO", maxMarks: 15, weight: 15, passingMarks: 9 },
            { name: "Accessibility", maxMarks: 10, weight: 10, passingMarks: 6 },
            { name: "Innovation", maxMarks: 15, weight: 15, passingMarks: 9 },
            { name: "Documentation", maxMarks: 10, weight: 10, passingMarks: 6 }
          ]
        },
        autoPassFailRules: [{ rule: "No GitHub", action: "fail" }],
        bonusRules: [{ name: "Best UI Design", points: 5 }]
      };
    }

    // Attach which problem statement the participant is solving
    bpData = { ...bpData, selectedProblemIndex: activeProblemIdx };

    // Resolve the problemStatementId for PS-isolated evaluation
    const bpProblemStatements = bpData.problemStatements || [];
    const selectedPS = bpProblemStatements[activeProblemIdx] || bpProblemStatements[0];
    const resolvedProblemStatementId = selectedPS?.id || selectedPS?.title || undefined;

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          deploymentUrl,
          hackathonId: activeHackathon.id,
          userId: user.id,
          problemStatementId: resolvedProblemStatementId,
          projectName: projectName || "Untitled Project",
          shortDesc: shortDesc || "",
          detailedDesc: detailedDesc || "",
          problemSolved: problemSolved || "",
          features: featuresList,
          techStack: selectedTechStack,
          videoUrl: demoVideoUrl || "",
          presentationPdf: presentationPdf || "",
          architectureDiagram: architectureDiagram || "",
          teamContributions: teamContributions,
          blueprint: bpData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // The backend now enqueues evaluation and returns 202 immediately.
        // The full report arrives asynchronously; poll until it is available.
        setAstCheckResult("submitted");
        setSubmissionSuccess(true);
        setSubmittingProject(false);
        setRepoUrl("");
        setDeploymentUrl("");

        // Optimistically set the evaluating state immediately (immediate visual feedback)
        const nextVersion = submissionAttempts.length > 0
          ? submissionAttempts[0].version + 1
          : 1;
        setEvaluatingSubmission({
          id: result.submissionId,
          status: "QUEUED",
          version: result.version || nextVersion
        });

        // Immediate fetch to populate evaluating state
        const subRes = await fetch(`/api/submissions?hackathonId=${activeHackathon.id}&userId=${user.id}`);
        if (subRes.ok) {
          const subs = await subRes.json();
          if (Array.isArray(subs) && subs.length > 0) {
            setEvaluatingSubmission(subs[0]);
            
            const formatted = subs.map((sub: any, idx: number) => ({
              ...sub,
              version: sub.version || idx + 1,
              time: new Date(sub.updatedAt).toLocaleString(),
              status: sub.status,
              score: sub.score ?? 0,
              grade: sub.grade || (sub.score && sub.score >= 75 ? "PASSED" : "FAILED"),
              repoUrl: sub.repoUrl,
              reports: sub.reports
            }));
            setSubmissionAttempts(formatted);
            if (formatted.length > 0) {
              setRepoUrl(formatted[0].repoUrl);
            }
          }
        }

        void pollForEvaluationResult(activeHackathon.id, user.id);
        return;
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to run automated evaluation on backend.");
      }
    } catch (err: any) {
      alert("Evaluation Error: " + err.message);
      setSubmittingProject(false);
      setAstCheckResult(null);
    }
  };

  const pollForEvaluationResult = async (hackathonId: string, userId: string, attemptsLeft = 60, pollIntervalMs = 4000) => {
    if (!isMountedRef.current) return;
    try {
      const res = await fetch(`/api/submissions?hackathonId=${hackathonId}&userId=${userId}`);
      if (res.ok) {
        const subs = await res.json();
        if (Array.isArray(subs) && subs.length > 0) {
          const latest = subs[0];

          // Format all submissions for the history timeline
          const formatted = subs.map((sub: any, idx: number) => ({
            ...sub,
            version: sub.version || idx + 1,
            time: new Date(sub.updatedAt).toLocaleString(),
            status: sub.status,
            score: sub.score ?? 0,
            grade: sub.grade || (sub.score && sub.score >= 75 ? "PASSED" : "FAILED"),
            repoUrl: sub.repoUrl,
            reports: sub.reports
          }));
          setSubmissionAttempts(formatted);
          if (formatted.length > 0) {
            setRepoUrl(formatted[0].repoUrl);
          }

          if (latest.status === "COMPLETED" && latest.reports && latest.reports.length > 0) {
            setEvaluationReport(latest.reports[0].payload);
            setEvaluatingSubmission(null);
            setAstCheckResult("passed");

            // Refresh leaderboard
            const leadRes = await fetch(`/api/hackathons/${hackathonId}/leaderboard`);
            if (leadRes.ok) {
              const data = await leadRes.json();
              if (data && Array.isArray(data.leaderboard)) {
                setLeaderboardList(data.leaderboard);
              }
            }
            return;
          }
          if (latest.status === "FAILED") {
            setEvaluatingSubmission(null);
            setAstCheckResult("failed");
            alert("Evaluation failed for your submission. Check your repository and try again.");
            return;
          }

          if (latest.status === "QUEUED" || latest.status === "EVALUATING") {
            setEvaluatingSubmission(latest);
          }
        }
      }
    } catch (err) {
      console.error("Failed to poll evaluation status:", err);
    }

    if (isMountedRef.current && attemptsLeft > 0) {
      // Exponential backoff: start at pollIntervalMs, cap at 30s, increase by 1.5x each attempt
      const nextInterval = Math.min(pollIntervalMs * 1.5, 30000);
      setTimeout(() => {
        if (isMountedRef.current) {
          pollForEvaluationResult(hackathonId, userId, attemptsLeft - 1, nextInterval);
        }
      }, nextInterval);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF006E] border-t-transparent" />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
        <ShieldAlert className="h-12 w-12 text-[#EF4444] mb-3" />
        <h1 className="font-heading text-lg font-bold text-[#0F172A] mb-1">
          Hackathon Not Found
        </h1>
        <p className="text-xs text-[#475569] mb-4 max-w-sm">
          The challenge link is invalid or the hackathon is no longer active on the platform.
        </p>
        <Button asChild variant="default" size="sm">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  // Back button helper
  const handleBackNavigation = () => {
    if (isRegistered) {
      router.push("/dashboard/participant");
    } else if (showRegistrationForm) {
      setShowRegistrationForm(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Top Header */}
      <header className="h-18 w-full border-b border-[#E2E8F0] bg-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-13 w-13 items-center justify-center rounded-[14px] bg-black p-1 shadow-md shrink-0">
            <img src="/logo.png" alt="Frontend Arena Logo" className="h-full w-full object-contain" />
          </div>
          <span className="font-heading text-base font-bold text-[#0F172A]">
            Frontend Arena
          </span>
        </Link>

        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-1 text-xs font-bold text-[#475569] hover:text-[#0F172A]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>
            {isRegistered
              ? "Exit Workspace"
              : showRegistrationForm
              ? "Back to Info"
              : "Back to Home"}
          </span>
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 space-y-6">
        {/* Success Modal Overlay */}
        {success && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-[#E2E8F0] space-y-4"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-[#0F172A]">
                  Registration Successful!
                </h3>
                <p className="text-xs text-[#475569]">
                  Opening your active workspace...
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Banner Card */}
        <div
          className="h-36 w-full flex flex-col justify-end p-6 text-white rounded-2xl relative shadow-md overflow-hidden"
          style={{
            background: hackathon.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)",
          }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative z-10 space-y-1">
            <Badge variant="accent" size="sm" className="bg-[#FEF3C7] text-[#B45309] border-[#FDE047] font-bold">
              {isRegistered
                ? "Active Workspace"
                : showRegistrationForm
                ? "Enrollment Form"
                : "Challenge Profile"}
            </Badge>
            <h1 className="font-heading text-2xl font-extrabold truncate">
              {hackathon.name}
            </h1>
            <p className="text-xs text-slate-200">
              {hackathon.tagline || "Official Developer Hackathon Track"}
            </p>
            {isRegistered && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Registration:</span>
                {registrationStatus === "SHORTLISTED" && (
                  <Badge variant="success" size="sm" className="bg-[#D1FAE5] text-[#065F46] border-[#34D399] font-bold">Shortlisted</Badge>
                )}
                {registrationStatus === "REJECTED" && (
                  <Badge variant="error" size="sm" className="bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5] font-bold">Rejected</Badge>
                )}
                {registrationStatus === "APPROVED" && (
                  <Badge variant="success" size="sm" className="bg-[#DBEAFE] text-[#1E40AF] border-[#93C5FD] font-bold">Approved</Badge>
                )}
                {registrationStatus === "PENDING" && (
                  <Badge variant="outline" size="sm" className="bg-slate-800 text-slate-200 border-slate-600 font-bold">Pending Review</Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#EF4444] text-xs font-semibold shadow-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isRegistered ? (
            /* 1. REGISTERED WORKSPACE VIEW */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Workspace Navigation Bar */}
              <div className="flex w-full overflow-x-auto justify-start gap-1 p-1 bg-white border border-[#E2E8F0] rounded-[16px] max-w-2xl">
                <button
                  onClick={() => setActivePortalTab("problem")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                    activePortalTab === "problem"
                      ? "bg-[#0f172a] text-white shadow-sm"
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
                      ? "bg-[#0f172a] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Rules & Guidelines</span>
                </button>
                <button
                  onClick={() => setActivePortalTab("resources")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                    activePortalTab === "resources"
                      ? "bg-[#0f172a] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>Resources</span>
                </button>
                {hackathon.submissionEnabled && (
                  <button
                    onClick={() => setActivePortalTab("submit")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                      activePortalTab === "submit"
                        ? "bg-[#0f172a] text-white shadow-sm"
                        : "text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <GitPullRequest className="h-4 w-4" />
                    <span>Submissions</span>
                  </button>
                )}
                {hackathon.leaderboardEnabled && (
                  <button
                    onClick={() => setActivePortalTab("leaderboard")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-[10px] transition-all ${
                      activePortalTab === "leaderboard"
                        ? "bg-[#0f172a] text-white shadow-sm"
                        : "text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Medal className="h-4 w-4" />
                    <span>Leaderboard</span>
                  </button>
                )}
              </div>

              {/* Workspace content sections */}
              <div className="space-y-6">
                {activePortalTab === "problem" && (
                  !hackathon.problemReleased ? (
                    <Card className="p-12 text-center bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200 flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 rounded-full bg-rose-50 text-[#FF006E]">
                        <AlertCircle className="h-10 w-10" />
                      </div>
                      <div className="space-y-2 max-w-md">
                        <h2 className="font-heading text-lg font-bold text-[#0F172A]">
                          Problem Statement Not Released
                        </h2>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          The problem statement for this hackathon has not been released by the admin yet. Please check back later or when the hackathon begins!
                        </p>
                      </div>
                    </Card>
                  ) : (() => {
                    const stmts = blueprint?.problemStatements && Array.isArray(blueprint.problemStatements) && blueprint.problemStatements.length > 0
                      ? blueprint.problemStatements
                      : [{ title: hackathon.problemTitle, description: hackathon.problemDescription, background: "", objectives: "", expectedSolution: "", difficulty: "" }];
                    const activeStmt = stmts[activeProblemIdx] || stmts[0];
                    return (
                    <Card className="p-6 space-y-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                      <div className="space-y-3 border-b border-[#F1F5F9] pb-4">
                        {/* Problem Tabs when multiple exist */}
                        {stmts.length > 1 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {stmts.map((s: any, sIdx: number) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  if (submissionAttempts.length > 0) {
                                    alert("Problem statement choice is locked after your first submission.");
                                    return;
                                  }
                                  setActiveProblemIdx(sIdx);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  activeProblemIdx === sIdx
                                    ? "bg-[#FF006E] text-white shadow-sm"
                                    : "bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#FF006E]/5 hover:text-[#FF006E]"
                                } ${submissionAttempts.length > 0 ? "opacity-75 cursor-not-allowed" : ""}`}
                              >
                                Problem #{sIdx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                        <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                          <FileCode2 className="h-5 w-5 text-[#FF006E]" />
                          <span>{activeStmt.title || hackathon.problemTitle}</span>
                        </h2>
                        {activeStmt.difficulty && (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {activeStmt.difficulty}
                          </Badge>
                        )}
                        <p className="text-xs text-[#475569]">
                          Read specifications, requirements, and test scenarios.
                        </p>
                      </div>

                      <div className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">
                        {activeStmt.description || hackathon.problemDescription}
                      </div>

                      {/* Background & Objectives from blueprint */}
                      {(activeStmt.background || activeStmt.objectives || activeStmt.expectedSolution) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {activeStmt.background && (
                            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Background</span>
                              <p className="text-[#0F172A]">{activeStmt.background}</p>
                            </div>
                          )}
                          {activeStmt.objectives && (
                            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Core Objectives</span>
                              <p className="text-[#0F172A]">{activeStmt.objectives}</p>
                            </div>
                          )}
                          {activeStmt.expectedSolution && (
                            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">Expected Solution</span>
                              <p className="text-[#0F172A]">{activeStmt.expectedSolution}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                          Automated Evaluation Test Cases
                        </h3>
                        {hackathon.testCases.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {hackathon.testCases.map((tc, tcIdx) => (
                              <div
                                key={tcIdx}
                                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5 font-bold">
                                  <span className="text-[#0F172A]">Test Scenario #{tcIdx + 1}</span>
                                  <Badge variant="accent" size="sm" className="bg-[#FEF3C7] text-[#B45309]">
                                    Score weight: {tc.weight}%
                                  </Badge>
                                </div>
                                <div className="space-y-1.5 font-code text-[11px] pt-1">
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
                    );
                  })()
                )}

                {activePortalTab === "rules" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4 mb-4">
                      <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#FF006E]" />
                        <span>Hackathon Guidelines & Rules</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Ensure your team complies with all guidelines.
                      </p>
                    </div>

                    {hackathon.rules.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-3.5 text-xs text-[#475569] leading-relaxed">
                        {hackathon.rules.map((rule, ruleIdx) => (
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
                        <span>Developer Resources & Templates</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Boilerplates, documentation, and references.
                      </p>
                    </div>

                    {hackathon.resources.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hackathon.resources.map((res, resIdx) => (
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

                {activePortalTab === "submit" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200 space-y-6">
                    <div className="space-y-1.5 border-b border-[#F1F5F9] pb-4">
                      <h2 className="font-heading text-lg font-bold text-[#0F172A] flex items-center gap-2">
                        <GitPullRequest className="h-5 w-5 text-[#FF006E]" />
                        <span>Submission Workspace & Project Portfolio</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Provide your repository metadata, live URL, implementation tags, and team contributions to compile reports.
                      </p>
                    </div>

                    {/* Step wizard progress bar */}
                    <div className="grid grid-cols-5 gap-2 pb-4 text-center">
                      {[
                        { step: 1, label: "Repo & Branch" },
                        { step: 2, label: "Live Deploy" },
                        { step: 3, label: "Project Info" },
                        { step: 4, label: "Stack & Tags" },
                        { step: 5, label: "Final Checklist" }
                      ].map((s) => (
                        <div key={s.step} className="space-y-1.5">
                          <div className={`h-2 rounded-full transition-all ${
                            submissionStep >= s.step ? "bg-[#FF006E]" : "bg-slate-100"
                          }`} />
                          <span className={`text-[9px] font-black uppercase tracking-wider block ${
                            submissionStep === s.step ? "text-[#FF006E]" : "text-slate-400"
                          }`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {submissionSuccess && (evaluationReport || evaluatingSubmission) ? (
                      <div className="space-y-6">
                        {/* Enterprise Repository Evaluation in Progress Panel */}
                        {evaluatingSubmission && (
                          <Card className="p-6 md:p-8 bg-slate-900 border border-slate-800 text-white shadow-xl rounded-2xl space-y-6 relative overflow-hidden">
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[#FF006E] text-[10px] font-mono font-bold tracking-wider uppercase">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF006E]" />
                                    FAIE v3
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-[10px] font-mono font-semibold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Evaluation Running
                                  </span>
                                </div>
                                <h3 className="font-heading text-xl font-bold tracking-tight text-white pt-0.5">
                                  Repository Evaluation in Progress
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                  FAIE is performing a deterministic static analysis of your submission.
                                </p>
                              </div>

                              {/* Compact Metadata Row */}
                              <div className="flex flex-col sm:items-end justify-center bg-slate-800/60 p-3 rounded-xl border border-slate-800 text-xs font-mono shrink-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">Repository:</span>
                                  <span className="text-slate-200 font-bold max-w-[180px] sm:max-w-[220px] truncate">
                                    {projectName || (repoUrl ? repoUrl.split("/").pop() : "Smart Campus Hub")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">Version:</span>
                                  <span className="text-[#FF006E] font-bold">
                                    v{evaluatingSubmission.version || (submissionAttempts[0]?.version ? submissionAttempts[0].version : 1)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">Status:</span>
                                  <span className="text-slate-200 font-medium capitalize">
                                    {evaluatingSubmission.status === "QUEUED" ? "Queued" : "Evaluation Running"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Evaluation Progress Pipeline */}
                            <div className="space-y-3">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                <span>Evaluation Pipeline</span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  Deterministic Audit Mode
                                </span>
                              </div>

                              <div className="space-y-2.5 relative pt-1">
                                {/* Vertical Connector Line */}
                                <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-800 pointer-events-none" />

                                {/* Stage 1: Submission Received */}
                                <div className="relative flex items-start gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800/80 transition-all">
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-200">Submission Received</h4>
                                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">Completed</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Repository metadata successfully received.
                                    </p>
                                  </div>
                                </div>

                                {/* Stage 2: Repository Analysis */}
                                <div className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                  evaluatingSubmission.status === "QUEUED"
                                    ? "bg-slate-800/80 border-[#FF006E]/40"
                                    : "bg-slate-800/40 border-slate-800/80"
                                }`}>
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 shrink-0 mt-0.5">
                                    {evaluatingSubmission.status === "QUEUED" ? (
                                      <div className="h-6 w-6 rounded-full bg-[#FF006E]/20 border border-[#FF006E]/40 flex items-center justify-center">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF006E] opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF006E]"></span>
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className={`text-xs font-bold ${evaluatingSubmission.status === "QUEUED" ? "text-[#FF006E]" : "text-slate-200"}`}>
                                        Repository Analysis
                                      </h4>
                                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                                        evaluatingSubmission.status === "QUEUED"
                                          ? "text-[#FF006E] bg-[#FF006E]/10 border-[#FF006E]/30 font-semibold"
                                          : "text-emerald-400 bg-emerald-950/60 border-emerald-800/50"
                                      }`}>
                                        {evaluatingSubmission.status === "QUEUED" ? "Active" : "Completed"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Fetching repository tree and source files...
                                    </p>
                                  </div>
                                </div>

                                {/* Stage 3: AST Analysis */}
                                <div className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                  evaluatingSubmission.status === "EVALUATING"
                                    ? "bg-slate-800/80 border-[#FF006E]/40"
                                    : "bg-slate-900/30 border-slate-800/40 opacity-70"
                                }`}>
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 shrink-0 mt-0.5">
                                    {evaluatingSubmission.status === "EVALUATING" ? (
                                      <div className="h-6 w-6 rounded-full bg-[#FF006E]/20 border border-[#FF006E]/40 flex items-center justify-center">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF006E] opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF006E]"></span>
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="h-6 w-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-600">
                                        <Circle className="h-2.5 w-2.5 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className={`text-xs font-bold ${evaluatingSubmission.status === "EVALUATING" ? "text-[#FF006E]" : "text-slate-400"}`}>
                                        AST Analysis
                                      </h4>
                                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                                        evaluatingSubmission.status === "EVALUATING"
                                          ? "text-[#FF006E] bg-[#FF006E]/10 border-[#FF006E]/30 font-semibold"
                                          : "text-slate-500 bg-slate-800/30 border-slate-800"
                                      }`}>
                                        {evaluatingSubmission.status === "EVALUATING" ? "Active" : "Pending"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Parsing source files using Tree-sitter WASM.
                                    </p>
                                  </div>
                                </div>

                                {/* Stage 4: Technology & Feature Verification */}
                                <div className="relative flex items-start gap-3 p-3 rounded-xl border bg-slate-900/30 border-slate-800/40 opacity-70 transition-all">
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 shrink-0 mt-0.5 text-slate-600">
                                    <Circle className="h-2.5 w-2.5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-400">
                                        Technology & Feature Verification
                                      </h4>
                                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-800">
                                        Pending
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Detecting frameworks, required features and architecture.
                                    </p>
                                  </div>
                                </div>

                                {/* Stage 5: Quality Analysis */}
                                <div className="relative flex items-start gap-3 p-3 rounded-xl border bg-slate-900/30 border-slate-800/40 opacity-70 transition-all">
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 shrink-0 mt-0.5 text-slate-600">
                                    <Circle className="h-2.5 w-2.5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-400">
                                        Quality Analysis
                                      </h4>
                                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-800">
                                        Pending
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Running deterministic performance, accessibility, responsive, code-quality and documentation checks.
                                    </p>
                                  </div>
                                </div>

                                {/* Stage 6: Score Generation */}
                                <div className="relative flex items-start gap-3 p-3 rounded-xl border bg-slate-900/30 border-slate-800/40 opacity-70 transition-all">
                                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 shrink-0 mt-0.5 text-slate-600">
                                    <Circle className="h-2.5 w-2.5 text-slate-600" />
                                  </div>
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="text-xs font-bold text-slate-400">
                                        Score Generation
                                      </h4>
                                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800/30 px-2 py-0.5 rounded border border-slate-800">
                                        Pending
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                      Preparing the final auditable score report.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                                <span className="flex items-center gap-2 text-xs">
                                  <Loader2 className="h-3.5 w-3.5 text-[#FF006E] animate-spin" />
                                  Evaluation in progress
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {evaluatingSubmission.status === "QUEUED" ? "Queued in runner queue..." : "Running static analysis..."}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-[#FF006E] to-rose-400 rounded-full transition-all duration-500"
                                  style={{ width: evaluatingSubmission.status === "QUEUED" ? "25%" : "65%" }}
                                />
                              </div>
                            </div>

                            {/* Live Engine Status Panel */}
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2.5 font-mono text-xs">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-2">
                                FAIE Engine Status
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-slate-400">Worker:</span>
                                  <span className="text-slate-200 font-semibold">{evaluatingSubmission.status === "QUEUED" ? "Queued" : "Running"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                                  <span className="text-slate-400">Analysis Mode:</span>
                                  <span className="text-slate-200 font-semibold">Deterministic</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                                  <span className="text-slate-400">Browser Automation:</span>
                                  <span className="text-slate-200 font-semibold">Disabled</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                                  <span className="text-slate-400">AI Judgement:</span>
                                  <span className="text-slate-200 font-semibold">Disabled</span>
                                </div>
                                <div className="flex items-center gap-2 sm:col-span-2">
                                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                                  <span className="text-slate-400">Evidence Mode:</span>
                                  <span className="text-slate-200 font-semibold">Source-code verified</span>
                                </div>
                              </div>
                            </div>

                            {/* Trust Message Card */}
                            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2.5">
                              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                              <p>
                                Your repository is being evaluated using static repository intelligence and AST-based analysis. No manual judging or AI-based scoring is involved.
                              </p>
                            </div>
                          </Card>
                        )}

                        {/* Demoted previous report OR submit update header */}
                        {evaluationReport && (
                          <>
                            {evaluatingSubmission ? (
                              <div className="p-4 border border-amber-200 rounded-2xl bg-amber-50/60 text-xs text-amber-800 space-y-1 shadow-2xs">
                                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                                  <AlertCircle className="h-4 w-4 text-amber-700" />
                                  <span>Previous Evaluation Results (v{evaluationReport.version || (submissionAttempts.find(s => s.status === "COMPLETED")?.version || 1)})</span>
                                </p>
                                <p className="text-[#64748B] leading-relaxed">
                                  This is your previous completed result. Version <span className="font-bold text-slate-800">v{evaluatingSubmission.version}</span> is currently being evaluated.
                                </p>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center bg-white p-3 border border-[#E2E8F0] rounded-xl shadow-2xs">
                                <span className="text-xs text-[#64748B] font-medium">Need to submit a newer version of your repository?</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSubmissionSuccess(false);
                                    setSubmissionStep(1);
                                  }}
                                >
                                  Submit Update
                                </Button>
                              </div>
                            )}
                            <div className={evaluatingSubmission ? "opacity-60 pointer-events-none transition-all duration-300" : "transition-all duration-300"}>
                              <EvaluationReport report={evaluationReport} />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Email Verification Banner */}
                        {systemConfig?.forceEmailVerification && !profileVerified && (
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                            <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4 text-rose-600" />
                              Strict Email Verification Required
                            </div>
                            <p className="text-[11px] text-rose-600">
                              The administrator requires verified emails before project submission.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              {!verificationSent ? (
                                <Button
                                  type="button"
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] h-8 px-3 rounded-lg"
                                  onClick={handleSendVerificationCode}
                                >
                                  Request Verification Code
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCodeInput}
                                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                                    className="h-8 w-36 px-2 text-xs border border-rose-300 rounded-lg focus:outline-hidden text-slate-900"
                                  />
                                  <Button
                                    type="button"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-8 px-3 rounded-lg"
                                    onClick={handleVerifyEmail}
                                    disabled={verifyingEmailState}
                                  >
                                    Verify Code
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* STEP 1: REPO & BRANCH */}
                        {submissionStep === 1 && (
                          <div className="space-y-4 max-w-lg">
                            <Input
                              label="GitHub Repository URL"
                              value={repoUrl}
                              onChange={(e) => setRepoUrl(e.target.value)}
                              placeholder="https://github.com/username/project"
                              required
                              disabled={submissionAttempts.length > 0}
                              helperText={submissionAttempts.length > 0 ? "Repository URL is locked after your first submission." : "Provide a public GitHub link."}
                            />
                            <Input
                              label="Branch Detection"
                              value={branchName}
                              onChange={(e) => setBranchName(e.target.value)}
                              placeholder="main"
                              helperText="Default active git branch (e.g. main, master)."
                            />
                            <div className="flex justify-end pt-4">
                              <Button
                                type="button"
                                className="bg-[#FF006E] text-white font-bold"
                                onClick={() => setSubmissionStep(2)}
                                disabled={systemConfig?.forceEmailVerification && !profileVerified}
                              >
                                Next Step
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* STEP 2: LIVE DEPLOYMENT */}
                        {submissionStep === 2 && (
                          <div className="space-y-4 max-w-lg">
                            <Input
                              label="Live Deployment URL"
                              value={deploymentUrl}
                              onChange={(e) => setDeploymentUrl(e.target.value)}
                              placeholder="https://my-demo-link.vercel.app"
                              helperText="Must be a live web page layout."
                            />
                            <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">HTTPS Validation Check:</span>
                              <Badge className="bg-emerald-500 text-white font-extrabold uppercase text-[9px] tracking-wider">
                                HTTPS SECURE
                              </Badge>
                            </div>
                            <div className="flex justify-between pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubmissionStep(1)}
                              >
                                Back
                              </Button>
                              <Button
                                type="button"
                                className="bg-[#FF006E] text-white font-bold"
                                onClick={() => setSubmissionStep(3)}
                              >
                                Next Step
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* STEP 3: PROJECT INFORMATION */}
                        {submissionStep === 3 && (
                          <div className="space-y-4 max-w-lg">
                            <Input
                              label="Project Portfolio Name"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              placeholder="My Enterprise Dashboard"
                              required
                            />
                            <Input
                              label="Short Description"
                              value={shortDesc}
                              onChange={(e) => setShortDesc(e.target.value)}
                              placeholder="A brief tagline description of the project."
                              required
                            />
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block">
                                Detailed Description <span className="text-rose-500">*</span>
                              </label>
                              <textarea
                                className="w-full p-2.5 border rounded-xl text-xs focus:ring-[#FF006E] focus:border-[#FF006E]"
                                rows={3}
                                value={detailedDesc}
                                onChange={(e) => setDetailedDesc(e.target.value)}
                                placeholder="Explain features, layouts, and libraries used."
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block">
                                Problem Solved <span className="text-rose-500">*</span>
                              </label>
                              <textarea
                                className="w-full p-2.5 border rounded-xl text-xs focus:ring-[#FF006E] focus:border-[#FF006E]"
                                rows={2}
                                value={problemSolved}
                                onChange={(e) => setProblemSolved(e.target.value)}
                                placeholder="How does this codebase resolve the hackathon problem statement?"
                                required
                              />
                            </div>
                            <div className="flex justify-between pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubmissionStep(2)}
                              >
                                Back
                              </Button>
                              <Button
                                type="button"
                                className="bg-[#FF006E] text-white font-bold"
                                onClick={() => setSubmissionStep(4)}
                                disabled={!projectName.trim() || !shortDesc.trim() || !detailedDesc.trim() || !problemSolved.trim()}
                              >
                                Next Step
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* STEP 4: TECH STACK & DYNAMIC TAGS */}
                        {submissionStep === 4 && (
                          <div className="space-y-6 max-w-lg">
                            {/* Dynamic feature tags */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 block">Dynamic Feature Tags</label>
                              <div className="flex gap-2">
                                <Input
                                  value={newFeatureTag}
                                  onChange={(e) => setNewFeatureTag(e.target.value)}
                                  placeholder="e.g. Responsive Sidebar"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    if (newFeatureTag.trim()) {
                                      setFeaturesList([...featuresList, newFeatureTag.trim()]);
                                      setNewFeatureTag("");
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                {featuresList.map((tag, idx) => (
                                  <Badge key={idx} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 px-2.5 rounded-lg flex items-center gap-1">
                                    <span>{tag}</span>
                                    <button onClick={() => setFeaturesList(featuresList.filter(t => t !== tag))} className="text-slate-400 hover:text-slate-800 text-[10px] font-black">×</button>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Tech Stack checklist */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-slate-700 block">Tech Stack Categorization</label>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {[
                                  { key: "frontend", label: "Frontend Frameworks (React, Next.js, Vue)" },
                                  { key: "backend", label: "Backend Engines (Node, Express, Go)" },
                                  { key: "database", label: "Databases (PostgreSQL, MongoDB)" },
                                  { key: "cloud", label: "Cloud Hosting (Vercel, AWS, GCP)" }
                                ].map((stack) => (
                                  <div key={stack.key} className="p-3 border rounded-xl space-y-1.5 bg-slate-50/50">
                                    <span className="font-bold text-slate-700 block">{stack.label}</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Next.js, Tailwinds"
                                      className="w-full p-2 border rounded bg-white text-xs"
                                      onChange={(e) => {
                                        setSelectedTechStack({
                                          ...selectedTechStack,
                                          [stack.key]: e.target.value.split(",").map(t => t.trim())
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubmissionStep(3)}
                              >
                                Back
                              </Button>
                              <Button
                                type="button"
                                className="bg-[#FF006E] text-white font-bold"
                                onClick={() => setSubmissionStep(5)}
                              >
                                Next Step
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* STEP 5: FINAL CHECKLIST */}
                        {submissionStep === 5 && (
                          <div className="space-y-6 max-w-lg">
                            {/* Final checklist */}
                            <div className="p-4 border rounded-xl bg-slate-50 space-y-2.5 text-xs">
                              <span className="font-bold text-slate-800 block">Final Checklist</span>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={checklistRepo} onChange={(e) => setChecklistRepo(e.target.checked)} />
                                  <span className="text-slate-600 font-medium">Repository includes final, verified components files.</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={checklistDeploy} onChange={(e) => setChecklistDeploy(e.target.checked)} />
                                  <span className="text-slate-600 font-medium">Live URL builds cleanly and is online.</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={checklistReadme} onChange={(e) => setChecklistReadme(e.target.checked)} />
                                  <span className="text-slate-600 font-medium">README file is updated in root directory.</span>
                                </label>
                              </div>
                            </div>

                            {astCheckResult && (
                              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                                {astCheckResult === "analyzing" ? (
                                  <>
                                    <RefreshCw className="h-5 w-5 text-[#FF006E] animate-spin shrink-0" />
                                    <span className="text-xs text-[#475569] font-medium">Running AST metrics and validation scripts...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
                                    <span className="text-xs text-[#16A34A] font-semibold">Checks passed! Finalizing submission...</span>
                                  </>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSubmissionStep(4)}
                              >
                                Back
                              </Button>
                              <Button
                                type="button"
                                className="bg-[#FF006E] text-white font-bold"
                                loading={submittingProject}
                                onClick={handleProjectSubmit}
                                disabled={!checklistRepo || !checklistDeploy || !checklistReadme || !!evaluatingSubmission || (systemConfig?.forceEmailVerification && !profileVerified)}
                              >
                                {evaluatingSubmission ? "Evaluation In Progress" : "Submit & Evaluate Project"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBMISSIONS HISTORY TIMELINE TABLE */}
                    {submissionAttempts.length > 0 && (
                      <div className="border-t pt-6 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Timeline Submission History Logs
                        </h4>
                        <div className="border rounded-xl overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <th className="p-3">Attempt Version</th>
                                <th className="p-3">Time Submitted</th>
                                <th className="p-3">Scorecard</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {submissionAttempts.map((attempt, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-700">v{attempt.version}</td>
                                  <td className="p-3 text-slate-500">{attempt.time}</td>
                                  <td className="p-3 font-bold text-[#FF006E]">{attempt.score}/100 ({attempt.grade})</td>
                                  <td className="p-3">
                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold tracking-widest uppercase">
                                      {attempt.status}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    {attempt.reports && attempt.reports.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEvaluationReport(attempt.reports[0].payload);
                                          setSubmissionSuccess(true);
                                        }}
                                        className="text-[#FF006E] hover:underline font-bold"
                                      >
                                        View Report
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
                      </div>
                    )}
                  </Card>
                )}

                {activePortalTab === "leaderboard" && (
                  <Card className="p-6 bg-white border-[#E2E8F0] shadow-sm rounded-2xl animate-in fade-in duration-200 space-y-4">
                    {/* Leaderboard Problem Statement Filter */}
                    {blueprint?.problemStatements && Array.isArray(blueprint.problemStatements) && blueprint.problemStatements.length > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2 border-b border-[#F1F5F9]">
                        <span className="text-xs font-bold text-[#475569]">Filter by Problem:</span>
                        <select
                          value={leaderboardFilterPsId}
                          onChange={(e) => setLeaderboardFilterPsId(e.target.value)}
                          className="flex h-9 w-64 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] focus:outline-none shadow-xs"
                        >
                          <option value="all">All Problem Statements</option>
                          {blueprint.problemStatements.map((ps: any, idx: number) => (
                            <option key={ps.id || idx} value={ps.id || ps.title}>
                              {ps.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {loadingLeaderboard ? (
                      <div className="flex justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#FF006E]" />
                      </div>
                    ) : leaderboardList.length > 0 ? (
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
                            {leaderboardList.map((row, idx) => {
                              const matchedPS = blueprint?.problemStatements?.find((p: any) => p.id === row.problemStatementId || p.title === row.problemStatementId);
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
                              );
                            })}
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
          ) : showRegistrationForm ? (
            /* 2. REGISTRATION FORM VIEW */
            <motion.div
              key="enrollment-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
            >
              {/* Left Column Info Widget */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="p-5 space-y-4">
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2">
                    Enrolling In
                  </h3>
                  <h4 className="font-bold text-sm text-[#0F172A]">{hackathon.name}</h4>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {hackathon.tagline || hackathon.description}
                  </p>
                  <div className="pt-2 border-t border-[#F1F5F9] text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#475569]">
                      <span>Registration Mode:</span>
                      <span className="font-bold text-[#0F172A] capitalize">{participationMode.replace("_", " ")}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column Form Card */}
              <div className="lg:col-span-2">
                <form onSubmit={handleRegisterSubmit}>
                  <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                      <CardTitle className="text-base font-bold text-[#0F172A]">Developer Enrollment</CardTitle>
                      <CardDescription className="text-xs text-[#475569]">
                        Configure your participation structure.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Participant Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Your Name"
                          value={user?.fullName || ""}
                          disabled
                          helperText="Pre-filled from account settings"
                        />
                        <Input
                          label="Your Email"
                          value={user?.email || ""}
                          disabled
                          helperText="Pre-filled from account settings"
                        />
                      </div>

                      <Input
                        label="School / Organization Name"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="Enter your college or company name"
                        required
                      />

                      {/* Participation Mode */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                          Participation Mode
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Solo */}
                          <div
                            onClick={() => setParticipationMode("solo")}
                            className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                              participationMode === "solo"
                                ? "border-[#FF006E] bg-[#FF006E]/5"
                                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <UserIcon className={`h-5 w-5 shrink-0 mt-0.5 ${participationMode === "solo" ? "text-[#FF006E]" : "text-[#475569]"}`} />
                            <div>
                              <h4 className="text-xs font-bold text-[#0F172A]">Solo</h4>
                              <p className="text-[10px] text-[#475569] mt-0.5">Register as an individual builder.</p>
                            </div>
                          </div>

                          {/* Create Team */}
                          <div
                            onClick={() => setParticipationMode("create_team")}
                            className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                              participationMode === "create_team"
                                ? "border-[#FF006E] bg-[#FF006E]/5"
                                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <Users className={`h-5 w-5 shrink-0 mt-0.5 ${participationMode === "create_team" ? "text-[#FF006E]" : "text-[#475569]"}`} />
                            <div>
                              <h4 className="text-xs font-bold text-[#0F172A]">Create Team</h4>
                              <p className="text-[10px] text-[#475569] mt-0.5">Create a team and invite members.</p>
                            </div>
                          </div>

                          {/* Join Team */}
                          <div
                            onClick={() => setParticipationMode("join_team")}
                            className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                              participationMode === "join_team"
                                ? "border-[#FF006E] bg-[#FF006E]/5"
                                : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <Users className={`h-5 w-5 shrink-0 mt-0.5 ${participationMode === "join_team" ? "text-[#FF006E]" : "text-[#475569]"}`} />
                            <div>
                              <h4 className="text-xs font-bold text-[#0F172A]">Join Team</h4>
                              <p className="text-[10px] text-[#475569] mt-0.5">Use an invite code to join a team.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conditional Participation Fields */}
                      <AnimatePresence mode="wait">
                        {participationMode === "create_team" && (
                          <motion.div
                            key="create_team_fields"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 pt-4 border-t border-[#F1F5F9] overflow-hidden"
                          >
                            <Input
                              label="Team Name"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              placeholder="e.g. Code Knights"
                              required
                            />
                            <div className="space-y-2">
                              <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                                Invite Members (Emails - Optional)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                  type="email"
                                  placeholder="Member 2 Email"
                                  value={memberEmails[0]}
                                  onChange={(e) => handleMemberEmailChange(0, e.target.value)}
                                />
                                <Input
                                  type="email"
                                  placeholder="Member 3 Email"
                                  value={memberEmails[1]}
                                  onChange={(e) => handleMemberEmailChange(1, e.target.value)}
                                />
                                <Input
                                  type="email"
                                  placeholder="Member 4 Email"
                                  value={memberEmails[2]}
                                  onChange={(e) => handleMemberEmailChange(2, e.target.value)}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {participationMode === "join_team" && (
                          <motion.div
                            key="join_team_fields"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-4 border-t border-[#F1F5F9] overflow-hidden"
                          >
                            <Input
                              label="Team Invite Code"
                              value={teamCode}
                              onChange={(e) => setTeamCode(e.target.value)}
                              placeholder="e.g. SQUAD-A92B"
                              required
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Agree Checkbox */}
                      <div className="pt-4 border-t border-[#F1F5F9]">
                        <Checkbox
                          label="I agree to all hackathon guidelines and code of conduct."
                          description="You acknowledge that submissions made after the deadline will not be evaluated."
                          checked={agreeRules}
                          onChange={(e) => setAgreeRules(e.target.checked)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-[#F8FAFC]/30 border-t border-[#F1F5F9] p-4">
                      <Button
                        type="submit"
                        className="bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-sm font-bold"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Confirm Registration
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            </motion.div>
          ) : (
            /* 3. PUBLIC DETAILS VIEW (DEFAULT FIRST PAGE) */
            <motion.div
              key="public-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-300"
            >
              {/* Left Side: About, Problem description, Rounds */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <Card className="p-6 space-y-4 bg-white border-[#E2E8F0] shadow-xs rounded-2xl">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#FF006E]" />
                    <span>About the Hackathon</span>
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">
                    {hackathon.description || "Welcome to the official challenge page! Here you will compete against builders from all over the world to craft dynamic, pixel-perfect frontend experiences. Read the prompt, configure your team, and build something legendary."}
                  </p>
                </Card>

                {/* Problem Statement Preview */}
                <Card className="p-6 space-y-4 bg-white border-[#E2E8F0] shadow-xs rounded-2xl">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-[#FF006E]" />
                    <span>Problem Statement Overview</span>
                  </h3>
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-[#0F172A]">{hackathon.problemTitle}</h4>
                    <p className="text-xs text-[#475569] leading-relaxed line-clamp-4">
                      {hackathon.problemDescription}
                    </p>
                    <p className="text-[10px] text-[#64748B] italic">
                      Note: You will gain full access to test scenarios, code inputs, and submission portals once you complete the registration.
                    </p>
                  </div>
                </Card>

                {/* Rounds & Stages Timeline */}
                <Card className="p-6 space-y-4 bg-white border-[#E2E8F0] shadow-xs rounded-2xl">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#FF006E]" />
                    <span>Timeline & Rounds</span>
                  </h3>

                  <div className="space-y-4">
                    {hackathon.rounds.map((round, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== hackathon.rounds.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#E2E8F0]" />
                        )}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF2F7] border border-[#FFCCD5] text-[#FF006E] text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="space-y-1 pt-1">
                          <h4 className="text-xs font-bold text-[#0F172A]">{round.name}</h4>
                          {round.description && (
                            <p className="text-[11px] text-[#475569] leading-relaxed">{round.description}</p>
                          )}
                          {(round.startDate || round.endDate) && (
                            <p className="text-[10px] text-[#64748B] font-semibold">
                              Window: {round.startDate || "TBA"} to {round.endDate || "TBA"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Side: Register Widget & Guidelines */}
              <div className="lg:col-span-1 space-y-6">
                {/* Register Action Card */}
                <Card className="p-6 text-center space-y-4 border-[#E2E8F0] shadow-sm bg-white rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF006E] to-[#FFD60A]" />
                  <div className="space-y-1 pt-1">
                    <Badge variant="success" size="sm">
                      Registration Open
                    </Badge>
                    <h4 className="font-heading text-sm font-bold text-[#0F172A] pt-2">
                      Enrollment Window Active
                    </h4>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left space-y-2.5 text-xs text-[#475569]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">Entry Fee:</span>
                      <span className="text-[#16A34A] font-bold">Free</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">Close Date:</span>
                      <span className="font-medium text-[#0F172A]">{new Date(hackathon.registrationClose).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">Format:</span>
                      <span>Virtual / Online</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!user) {
                        router.push(`/sign-in?redirect=/register?id=${hackathon.id}`);
                      } else {
                        setShowRegistrationForm(true);
                      }
                    }}
                    className="w-full bg-[#FF006E] text-white hover:bg-[#D8005C] shadow-md py-3 text-xs font-bold rounded-xl"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Register Now
                  </Button>
                </Card>

                {/* Guidelines Rules Card */}
                <Card className="p-5 space-y-3 bg-white border-[#E2E8F0] shadow-xs rounded-2xl">
                  <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-[#FF006E]" />
                    <span>Quick Guidelines</span>
                  </h3>
                  {hackathon.rules.length > 0 ? (
                    <ul className="space-y-2.5 text-[11px] text-[#475569] leading-relaxed">
                      {hackathon.rules.map((rule, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="text-[#FF006E] font-bold mt-0.5">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#64748B] italic">Standard platform regulations apply.</p>
                  )}
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function HackathonRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF006E] border-t-transparent" />
      </div>
    }>
      <HackathonRegistrationContent />
    </Suspense>
  );
}
