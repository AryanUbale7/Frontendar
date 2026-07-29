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
  Lock,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
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

  // Security Tab States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Preferences Tab States
  const [dashboardMode, setDashboardMode] = useState("standard");
  const [digestFrequency, setDigestFrequency] = useState("weekly");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

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

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 8) {
      triggerError("New password must be at least 8 characters long.");
      return;
    }
    // Mock save
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    triggerSuccess("Password updated successfully!");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSuccess("Dashboard preferences saved successfully!");
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
          Manage your personal details, email notification subscriptions, security credentials, and system preferences.
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
          <TabsTrigger value="security" className="flex items-center gap-2 px-4 py-2">
            <Lock className="h-4 w-4" />
            <span>Security & 2FA</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 px-4 py-2">
            <Sliders className="h-4 w-4" />
            <span>Preferences</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F1F5F9]">
                  <Input
                    label="GitHub Username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="e.g. johndoe"
                    leftIcon={<span className="text-xs text-[#475569] font-medium">github.com/</span>}
                  />
                  <Input
                    label="LinkedIn Profile ID"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="e.g. johndoe-dev"
                    leftIcon={<span className="text-xs text-[#475569] font-medium">linkedin.com/in/</span>}
                  />
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

        {/* Tab 3: Security Settings */}
        <TabsContent value="security">
          <form onSubmit={handleSaveSecurity}>
            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CardTitle className="text-base font-bold text-[#0F172A]">Security Credentials</CardTitle>
                <CardDescription className="text-xs text-[#475569]">
                  Update your authentication passwords and enable enhanced account protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4 max-w-lg">
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <Input
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-[#94A3B8] hover:text-[#0F172A]"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm New Password"
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>

                <div className="pt-6 border-t border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Two-Factor Authentication</h4>
                  <Checkbox
                    label="Enable 2-Step Verification"
                    description="Enhance your account safety. Require verification via your email or authenticator app in addition to your standard password credentials on login."
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-[#F8FAFC]/30 border-t border-[#F1F5F9] p-4">
                <Button type="submit" variant="default" size="sm" leftIcon={<Save className="h-4 w-4" />}>
                  Update Credentials
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 4: System Preferences */}
        <TabsContent value="preferences">
          <form onSubmit={handleSavePreferences}>
            <Card className="rounded-2xl border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CardTitle className="text-base font-bold text-[#0F172A]">System Customization</CardTitle>
                <CardDescription className="text-xs text-[#475569]">
                  Personalize the interface layout and summary dashboard options.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Dashboard Density */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                      Dashboard Layout Density
                    </label>
                    <select
                      value={dashboardMode}
                      onChange={(e) => setDashboardMode(e.target.value)}
                      className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                    >
                      <option value="standard">Standard (Spacious & Graphic)</option>
                      <option value="compact">Compact (Dense Info Listing)</option>
                      <option value="minimalist">Minimalist (Text & Outlines only)</option>
                    </select>
                    <p className="text-[10px] text-[#64748B]">
                      Modifies padding, image density, and list item spacing across your dashboard modules.
                    </p>
                  </div>

                  {/* Select Summary Digests Frequency */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium uppercase tracking-wider text-[#0F172A]">
                      Digest Dispatch Frequency
                    </label>
                    <select
                      value={digestFrequency}
                      onChange={(e) => setDigestFrequency(e.target.value)}
                      className="flex h-10 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF006E] focus-visible:border-transparent"
                    >
                      <option value="instant">Instant (Every single notification alert)</option>
                      <option value="daily">Daily Summaries (Consolidated digest once daily)</option>
                      <option value="weekly">Weekly Summaries (Consolidated digest on Fridays)</option>
                      <option value="never">Muted (Receive security and critical alerts only)</option>
                    </select>
                    <p className="text-[10px] text-[#64748B]">
                      Adjust the schedule for receiving community digest summaries.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F1F5F9] space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Promotional Communications</h4>
                  <Checkbox
                    label="Opt-in to partner promotional offers"
                    description="Receive promotional benefits, free tooling credits, and special developer vouchers from Frontend Arena's hackathon sponsors and partners."
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
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
