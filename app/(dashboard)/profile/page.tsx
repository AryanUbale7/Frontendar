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
  Save,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/useUser";
import { EmptyState } from "@/components/design-system/EmptyState";

export default function ProfilePage() {
  const { user, updateUserProfile } = useUser();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        updateUserProfile({ avatarUrl: base64Image });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("Cover photo size should be less than 8MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        updateUserProfile({ coverUrl: base64Image });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [username, setUsername] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("Passionate developer building next-generation web platforms.");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Load user data and enrolled initiatives dynamically
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setUsername(user.email ? `@${user.email.split("@")[0]}` : "");
      if (user.collegeName) setCollege(user.collegeName);
      if (user.githubHandle) setGithub(user.githubHandle);
      if (user.linkedinHandle) setLinkedin(user.linkedinHandle);

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`fa_enrolled_hackathons_usr_${user.id}`);
        if (stored) {
          try {
            setInitiatives(JSON.parse(stored));
          } catch (e) {
            console.error(e);
          }
        }
      }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-[#475569]">
        <Link href="/" className="hover:text-[#00E5FF] flex items-center gap-1">
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
      <div
        onClick={() => coverInputRef.current?.click()}
        className="relative h-44 w-full rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] shadow-sm overflow-hidden cursor-pointer group"
      >
        {user?.coverUrl ? (
          <img src={user.coverUrl} alt="Cover Photo" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,110,0.25),transparent_50%)]" />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            coverInputRef.current?.click();
          }}
          aria-label="Edit cover photo"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#0F172A] hover:bg-white shadow-xs transition-all z-10"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Profile Info Card + About + Initiatives) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main User Card */}
          <Card className="relative p-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl space-y-6">
            {/* Top Row: Avatar & Public View CTA */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="relative -mt-20">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#00E5FF] text-white font-heading font-bold text-3xl ring-4 ring-white shadow-md overflow-hidden cursor-pointer group"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.fullName || "Avatar"} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <>
                      {user?.firstName?.charAt(0) || "U"}
                      {user?.lastName?.charAt(0) || ""}
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    aria-label="Upload profile photo"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] text-white ring-2 ring-white hover:bg-[#00E5FF] transition-all shadow-md z-10"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
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
                      {fullName || "User Profile"}
                    </h2>
                    <Pencil className="h-3.5 w-3.5 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
                  </div>

                  <div className="space-y-1.5 text-xs text-[#475569]">
                    {location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#00E5FF]" />
                        <span>{location}</span>
                      </p>
                    )}
                    {username && (
                      <p className="flex items-center gap-2 font-code">
                        <span className="text-[#00E5FF]">@</span>
                        <span>{username}</span>
                        <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
                      </p>
                    )}
                    {college && (
                      <p className="flex items-start gap-2 pt-1 leading-relaxed">
                        <GraduationCap className="h-4 w-4 text-[#00E5FF] shrink-0 mt-0.5" />
                        <span>{college}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]">
                    {email && (
                      <p className="flex items-center gap-2 font-code">
                        <Mail className="h-3.5 w-3.5 text-[#00E5FF]" />
                        <span>{email}</span>
                      </p>
                    )}
                    {phone && (
                      <p className="flex items-center gap-2 font-code">
                        <Phone className="h-3.5 w-3.5 text-[#00E5FF]" />
                        <span>{phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills, Interests, Social Handles */}
                <div className="space-y-4">
                  {/* Skills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>Skills</span>
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["React", "Next.js", "Tailwind CSS", "TypeScript"].map((skill, sIdx) => (
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
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Web Development", "AI Build Challenges", "UI/UX Design", "Hackathons"].map((interest, iIdx) => (
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
                      <Pencil className="h-3 w-3 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      {github && (
                        <a
                          href={`https://github.com/${github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#00E5FF] hover:text-white transition-all"
                        >
                          <GitFork className="h-4 w-4" />
                        </a>
                      )}
                      {linkedin && (
                        <a
                          href={`https://linkedin.com/in/${linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#00E5FF] hover:text-white transition-all"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
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
              <Pencil className="h-3.5 w-3.5 text-[#94A3B8] cursor-pointer hover:text-[#00E5FF]" onClick={() => setIsEditing(true)} />
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {bio}
            </p>
          </Card>

          {/* Dynamic Initiatives Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[#0F172A]">Initiatives</h3>
              <Link href="/dashboard/participant" className="text-xs font-semibold text-[#00E5FF] hover:underline flex items-center gap-1">
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {initiatives.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {initiatives.map((item, idx) => (
                  <Card key={idx} className="p-4 border-[#E2E8F0] shadow-xs bg-white rounded-xl space-y-3 hover:border-[#00E5FF]/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div
                        className="h-8 w-8 rounded-lg text-white font-bold text-xs flex items-center justify-center font-heading"
                        style={{ background: item.bannerUrl || "linear-gradient(to right, #0F172A, #1E293B)" }}
                      >
                        {item.title.charAt(0)}
                      </div>
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {item.tag || "Free | Virtual"}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0F172A] line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] text-[#475569] mt-0.5 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Closes: {item.date}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/60 text-[11px]">
                      <span className="text-[#16A34A] font-semibold">Enrolled</span>
                      <Link href={`/register?id=${item.id}&workspace=true`} className="text-[#00E5FF] hover:underline font-bold">
                        Workspace →
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Enrolled Initiatives Found"
                description="You are not currently registered for any hackathons. When you enroll in a hackathon, it will appear here."
              />
            )}
          </div>
        </div>

        {/* Right Column (Gamification Card) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level 1 Gamification Card */}
          <Card className="p-6 border-[#E2E8F0] shadow-sm bg-white rounded-2xl space-y-6 text-center">
            {/* Level 1 Emblem */}
            <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#00E5FF] via-[#FF8A00] to-[#FFD60A] p-0.5 shadow-md flex items-center justify-center transform rotate-45">
                <div className="h-full w-full bg-white rounded-[14px] flex flex-col items-center justify-center transform -rotate-45">
                  <span className="font-heading text-2xl font-black text-[#00E5FF]">1</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#0F172A]">LEVEL</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[rgba(0,229,255,0.08)] border border-[#FFCCD5] text-[#00E5FF] text-xs font-extrabold">
                Badges Earned: 0
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#0F172A] px-1">
                  <span>XP Progress</span>
                  <span className="text-[#00E5FF]">0 / 140xp</span>
                </div>
                <Progress value={15} indicatorClassName="bg-gradient-to-r from-[#00E5FF] to-[#FF8A00]" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
