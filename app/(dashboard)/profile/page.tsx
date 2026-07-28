"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  ChevronRight,
  Pencil,
  Camera,
  Eye,
  MapPin,
  GraduationCap,
  Mail,
  Phone,
  GitFork,
  Globe,
  Award,
  Sparkles,
  ExternalLink,
  Plus,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";

export default function ProfilePage() {
  const { user, updateUserProfile } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("Mumbai, Maharashtra, India");
  const [username, setUsername] = useState("@aryanubale318_5424");
  const [college, setCollege] = useState("Bachelor Of Engineering (b.e) at Shree LR Tiwari College of Engineering");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 9022767450");
  const [bio, setBio] = useState("Passionate frontend engineer and AI enthusiast building next-generation web platforms.");
  const [github, setGithub] = useState("aryanpatel");
  const [linkedin, setLinkedin] = useState("aryanpatel-dev");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "Aryan Gajanan Ubale");
      setEmail(user.email || "aryanubale318@gmail.com");
      if (user.collegeName) setCollege(user.collegeName);
      if (user.githubHandle) setGithub(user.githubHandle);
      if (user.linkedinHandle) setLinkedin(user.linkedinHandle);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = fullName.split(" ");
    updateUserProfile({
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      collegeName: college,
      githubHandle: github,
      linkedinHandle: linkedin,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const initiatives = [
    {
      title: "INDIA RUNS",
      date: "Jul 31, 2026",
      tag: "Free | Virtual",
      status: "Evaluation",
      gradient: "from-purple-900 to-indigo-900",
    },
    {
      title: "Bharatiya Antariksh Hackathon 2026",
      date: "Jul 20, 2026",
      tag: "Free | Hybrid",
      status: "Shortlisting",
      gradient: "from-blue-900 to-slate-900",
    },
    {
      title: "PromptWars: Mumbai",
      date: "Jun 13, 2026",
      tag: "Free | In Person",
      status: "Registration",
      gradient: "from-[#0F172A] to-[#2563EB]",
    },
    {
      title: "Frontend Wars 2026",
      date: "Aug 20, 2026",
      tag: "Free | Virtual",
      status: "Coding Sprint",
      gradient: "from-[#2563EB] to-[#06B6D4]",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#2563EB] flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3 text-[#94A3B8]" />
        <span className="font-semibold text-[#0F172A]">User Profile</span>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Top Cover Banner */}
      <div className="relative h-44 w-full rounded-2xl bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 shadow-sm overflow-hidden">
        <button
          aria-label="Edit cover photo"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#0F172A] hover:bg-white shadow-xs transition-all"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Main 2-Column Hack2Skill Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Profile Info Card + About + Initiatives) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main User Card */}
          <Card className="relative p-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl space-y-6">
            {/* Top Row: Avatar & Public View CTA */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="relative -mt-20">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#2563EB] text-white font-heading font-bold text-3xl ring-4 ring-white shadow-md">
                  {user?.firstName?.charAt(0) || "A"}
                  {user?.lastName?.charAt(0) || "U"}
                  <button
                    aria-label="Upload profile photo"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] text-white ring-2 ring-white hover:bg-[#2563EB] transition-all"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  className="text-xs font-semibold"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-xs font-semibold"
                >
                  Public View
                </Button>
              </div>
            </div>

            {/* Profile Info Details / Edit Form */}
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Personal Bio Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
                      {fullName}
                    </h2>
                    <Pencil className="h-3.5 w-3.5 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                  </div>

                  <div className="space-y-1.5 text-xs text-[#475569]">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>{location}</span>
                    </p>
                    <p className="flex items-center gap-2 font-code">
                      <span className="text-[#2563EB]">@</span>
                      <span>{username}</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                    </p>
                    <p className="flex items-start gap-2 pt-1 leading-relaxed">
                      <GraduationCap className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{college}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]">
                    <p className="flex items-center gap-2 font-code">
                      <Mail className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>{email}</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                    </p>
                    <p className="flex items-center gap-2 font-code">
                      <Phone className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>{phone}</span>
                    </p>
                  </div>
                </div>

                {/* Skills, Interests, Social Handles */}
                <div className="space-y-4">
                  {/* Skills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>Skills</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["React", "Next.js 15", "Tailwind CSS", "TypeScript"].map((skill, sIdx) => (
                        <Badge key={sIdx} variant="outline" size="sm" className="text-[11px] bg-[#F8FAFC]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>Interests</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Web Development", "AI Agents", "UI/UX Design", "Hackathons"].map((interest, iIdx) => (
                        <Badge key={iIdx} variant="secondary" size="sm" className="text-[11px]">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Social Handles */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>Social Handles</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={`https://github.com/${github}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#2563EB] hover:text-white transition-all"
                      >
                        <GitFork className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://linkedin.com/in/${linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#2563EB] hover:text-white transition-all"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Inline Edit Form */
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="College / Education"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="GitHub Handle"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                  <Input
                    label="LinkedIn Handle"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit" leftIcon={<Save className="h-3.5 w-3.5" />}>
                    Save Profile
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* About Section */}
          <Card className="p-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-[#0F172A]">About</h3>
              <Pencil className="h-3.5 w-3.5 text-[#94A3B8] cursor-pointer hover:text-[#2563EB]" onClick={() => setIsEditing(true)} />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {bio}
            </p>
          </Card>

          {/* Initiatives Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">Initiatives</h3>
              <Button variant="ghost" size="sm" className="text-xs text-[#2563EB]" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initiatives.map((item, idx) => (
                <Card key={idx} className="p-4 border-[#E2E8F0] shadow-xs bg-white rounded-xl space-y-3 hover:border-[#2563EB]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${item.gradient} text-white font-bold text-xs flex items-center justify-center`}>
                      {item.title.charAt(0)}
                    </div>
                    <Badge variant="outline" size="sm" className="text-[10px]">
                      {item.tag}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0F172A]">{item.title}</h4>
                    <p className="text-[10px] text-[#475569] mt-0.5">Round Ends On : {item.date}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/60 text-[11px]">
                    <span className="text-[#2563EB] font-semibold">{item.status}</span>
                    <span className="text-[#475569] hover:underline cursor-pointer">Details →</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Gamification Card + Achievements) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level 1 Gamification Card */}
          <Card className="p-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl space-y-6 text-center">
            {/* Level 1 Ribbon Emblem */}
            <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center transform rotate-45">
                <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center transform -rotate-45">
                  <span className="font-heading text-2xl font-black text-[#8B5CF6]">1</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#0F172A]">LEVEL</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE047] text-[#B45309] text-xs font-extrabold">
                Badges Earned: 0
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#0F172A] px-1">
                  <span>XP Progress</span>
                  <span className="text-[#8B5CF6]">0 / 140xp</span>
                </div>
                <Progress value={15} indicatorClassName="bg-gradient-to-r from-purple-500 to-indigo-600" />
              </div>
            </div>

            {/* Achievements Divider & Button */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
              <p className="text-xs font-semibold text-[#475569]">Recent Achievements</p>
              <Button
                variant="outline"
                className="w-full text-xs font-bold border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899] hover:text-white transition-all rounded-xl py-2"
              >
                Show Achievements
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
