"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  ChevronRight,
  Settings,
  User,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";

export default function SettingsPage() {
  const { user, updateUserProfile } = useUser();

  // Toast State
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Account Tab States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [college, setCollege] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [email, setEmail] = useState("");

  // Populate initial values
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setCollege(user.collegeName || "");
      setGithub(user.githubHandle || "");
      setLinkedin(user.linkedinHandle || "");
    }
  }, [user]);

  // Notifications Tab States
  const [notifyNewHackathons, setNotifyNewHackathons] = useState(true);
  const [notifyTeamInvites, setNotifyTeamInvites] = useState(true);
  const [notifyEvaluations, setNotifyEvaluations] = useState(true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateUserProfile({
        firstName,
        lastName,
        collegeName: college,
        githubHandle: github,
        linkedinHandle: linkedin,
      });
      triggerSuccess("Account settings updated successfully!");
    } catch (err) {
      triggerError("Failed to update profile settings.");
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSuccess("Notification preferences saved successfully!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#FF006E] flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
        <Link href="/profile" className="hover:text-[#FF006E]">
          User Profile
        </Link>
        <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
        <span className="font-semibold text-[#0F172A] uppercase tracking-wider text-[10px]">
          Settings
        </span>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-sm font-semibold shadow-xs animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#EF4444] text-sm font-semibold shadow-xs animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Header Title */}
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-[#0F172A] flex items-center gap-2">
          <Settings className="h-7 w-7 text-[#FF006E]" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs text-[#475569]">
          Manage your personal details and email notification subscriptions.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full space-y-6">
        <TabsList className="flex w-full sm:w-auto overflow-x-auto justify-start gap-1 p-1 bg-white border border-[#E2E8F0] rounded-[16px]">
          <TabsTrigger value="account" className="flex items-center gap-2 px-4 py-2">
            <User className="h-4 w-4" />
            <span>Profile & Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 px-4 py-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Account Details */}
        <TabsContent value="account">
          <form onSubmit={handleSaveAccount}>
            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CardTitle className="text-base font-bold text-[#0F172A]">Personal Profile Info</CardTitle>
                <CardDescription className="text-xs text-[#475569]">
                  Update your contact details, education history, and developer social profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 w-full">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-slate-50 px-3 py-2 text-sm text-[#94A3B8] cursor-not-allowed focus-visible:outline-none"
                      />
                      <Badge variant="success" size="sm" className="absolute right-3">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      Primary email linked to your account cannot be changed.
                    </p>
                  </div>

                  <Input
                    label="College / University"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter college name"
                  />
                </div>

                {/* Clean non-overlapping prefix addon inputs for GitHub and LinkedIn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F1F5F9]">
                  <div className="space-y-1.5 w-full">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                      GitHub Username
                    </label>
                    <div className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#FF006E]">
                      <span className="flex items-center px-3 bg-slate-50 border-r border-[#E2E8F0] text-xs font-medium text-[#475569] select-none shrink-0">
                        github.com/
                      </span>
                      <input
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="johndoe"
                        className="flex-1 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none bg-transparent min-w-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 w-full">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                      LinkedIn Profile ID
                    </label>
                    <div className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#FF006E]">
                      <span className="flex items-center px-3 bg-slate-50 border-r border-[#E2E8F0] text-xs font-medium text-[#475569] select-none shrink-0">
                        linkedin.com/in/
                      </span>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="johndoe-dev"
                        className="flex-1 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none bg-transparent min-w-0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-[#F8FAFC]/30 border-t border-[#F1F5F9] p-4">
                <Button type="submit" variant="default" size="sm" leftIcon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 2: Notifications Preferences */}
        <TabsContent value="notifications">
          <form onSubmit={handleSaveNotifications}>
            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CardTitle className="text-base font-bold text-[#0F172A]">Notification Subscriptions</CardTitle>
                <CardDescription className="text-xs text-[#475569]">
                  Configure what notifications and updates you wish to receive in your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Checkbox
                    label="New Hackathons & Challenges"
                    description="Receive email alerts when new developer sprints, UI challenges, or community hackathons are launched."
                    checked={notifyNewHackathons}
                    onChange={(e) => setNotifyNewHackathons(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Team Requests & Invitations"
                    description="Get real-time email notifications when other community members invite you to join their team or request to join yours."
                    checked={notifyTeamInvites}
                    onChange={(e) => setNotifyTeamInvites(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Submissions & Evaluations"
                    description="Get email updates regarding submission deadlines, project evaluation milestones, and published scorecards."
                    checked={notifyEvaluations}
                    onChange={(e) => setNotifyEvaluations(e.target.checked)}
                  />
                  <div className="border-t border-[#F1F5F9] my-2" />
                  <Checkbox
                    label="Weekly Community Newsletter"
                    description="A curated digest containing popular open-source submissions, upcoming webinars, and general community announcements."
                    checked={notifyNewsletter}
                    onChange={(e) => setNotifyNewsletter(e.target.checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-[#F8FAFC]/30 border-t border-[#F1F5F9] p-4">
                <Button type="submit" variant="default" size="sm" leftIcon={<Save className="h-4 w-4" />}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
