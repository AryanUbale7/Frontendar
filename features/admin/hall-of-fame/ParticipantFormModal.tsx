"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/design-system/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  User,
  Globe,
  Award,
  Sparkles,
  Trophy,
  Medal,
  Check,
  Building,
  Users,
} from "lucide-react";
import { HofParticipant, HofBadge, RecognitionType, RECOGNITION_LABELS } from "./types";
import { LinkedInIcon, GitHubIcon } from "./social-icons";

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  participant?: HofParticipant | null;
  availableBadges: HofBadge[];
  onSave: (data: Partial<HofParticipant> & { badgeIds?: string[] }) => Promise<void>;
}

// Client-side smart image optimizer to generate a crisp 500x500 square avatar data URL
async function optimizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        const size = Math.min(img.width, img.height);
        const targetDim = Math.min(500, size);
        canvas.width = targetDim;
        canvas.height = targetDim;

        // Center crop to square
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, size, size, 0, 0, targetDim, targetDim);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to process image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function ParticipantFormModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  participant,
  availableBadges,
  onSave,
}: ParticipantFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [collegeOrOrg, setCollegeOrOrg] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [recognitionType, setRecognitionType] = useState<RecognitionType>("winner");
  const [customRecognition, setCustomRecognition] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (participant) {
      setFullName(participant.fullName || "");
      setTeamName(participant.teamName || "");
      setCollegeOrOrg(participant.collegeOrOrg || "");
      setDescription(participant.description || "");
      setPhotoUrl(participant.photoUrl || null);
      setRecognitionType(participant.recognitionType || "winner");
      setCustomRecognition(participant.customRecognition || "");
      setLinkedInUrl(participant.linkedInUrl || "");
      setPortfolioUrl(participant.portfolioUrl || "");
      setGithubUrl(participant.githubUrl || "");
      const bIds = participant.badges?.map((b) => b.id) || participant.badgeIds || [];
      setSelectedBadgeIds(bIds);
    } else {
      setFullName("");
      setTeamName("");
      setCollegeOrOrg("");
      setDescription("");
      setPhotoUrl(null);
      setRecognitionType("winner");
      setCustomRecognition("");
      setLinkedInUrl("");
      setPortfolioUrl("");
      setGithubUrl("");
      setSelectedBadgeIds([]);
    }
    setError("");
  }, [participant, isOpen]);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      const optimized = await optimizeAvatarImage(file);
      setPhotoUrl(optimized);
    } catch (err: any) {
      setError("Failed to optimize and upload image: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadgeIds((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setError("Participant full name is required.");
      return;
    }
    if (recognitionType === "custom" && !customRecognition.trim()) {
      setError("Please specify the custom recognition title (e.g. Best UI/UX Designer).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSave({
        eventId,
        fullName: fullName.trim(),
        teamName: teamName.trim() || null,
        collegeOrOrg: collegeOrOrg.trim() || null,
        description: description.trim() || null,
        photoUrl,
        recognitionType,
        customRecognition: recognitionType === "custom" ? customRecognition.trim() : null,
        linkedInUrl: linkedInUrl.trim() || null,
        portfolioUrl: portfolioUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        badgeIds: selectedBadgeIds,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save participant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={participant ? "Edit Featured Participant" : "Add Featured Participant"}
      description={`Assign recognition position, badges, social links, and real photo for ${eventName}.`}
      maxWidth="lg"
      primaryActionText={loading ? "Saving..." : participant ? "Save Changes" : "Add Participant"}
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
      loading={loading || isUploading}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Top: Photo Upload & Basic Info Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
          {/* Photo Box */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all flex items-center justify-center bg-white shadow-xs group ${
                isDragOver
                  ? "border-[#2563EB] bg-[#2563EB]/10 scale-105"
                  : photoUrl
                  ? "border-[#2563EB]/40"
                  : "border-dashed border-[#CBD5E1] hover:border-[#2563EB]"
              }`}
            >
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt="Participant avatar preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold">
                    <Upload className="h-4 w-4" />
                    <span>Change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-[#64748B] group-hover:text-[#2563EB]">
                  {isUploading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform text-[#2563EB]" />
                      <span className="text-[10px] font-semibold">Upload Photo</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[10px] text-red-500 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="h-3 w-3" />
                Remove photo
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Core Info beside photo */}
          <div className="flex-1 w-full space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1">
                <span>Full Name</span>
                <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3 text-[#2563EB]" />
                  <span>Team Name</span>
                </label>
                <Input
                  placeholder="e.g. Pixel Pioneers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1">
                  <Building className="h-3 w-3 text-[#2563EB]" />
                  <span>College / Org</span>
                </label>
                <Input
                  placeholder="e.g. Stanford University"
                  value={collegeOrOrg}
                  onChange={(e) => setCollegeOrOrg(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Position / Recognition Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Position / Recognition Category</span>
            <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "winner", label: "Winner (1st Place)", icon: Trophy, bg: "hover:border-[#2563EB]" },
              { id: "runner_up", label: "Runner-Up", icon: Medal, bg: "hover:border-[#2563EB]" },
              { id: "top_10", label: "Top 10 Finalist", icon: Sparkles, bg: "hover:border-[#2563EB]" },
              { id: "finalist", label: "Finalist", icon: Award, bg: "hover:border-[#2563EB]" },
              { id: "special_recognition", label: "Special Recognition", icon: Award, bg: "hover:border-[#2563EB]" },
              { id: "custom", label: "Custom Recognition", icon: Sparkles, bg: "hover:border-[#2563EB]" },
            ].map((rec) => {
              const Icon = rec.icon;
              const isSelected = recognitionType === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecognitionType(rec.id as RecognitionType)}
                  className={`p-2.5 text-left rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSelected
                      ? "border-[#2563EB] bg-[#2563EB] text-white shadow-xs"
                      : "border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : "text-[#2563EB]"}`} />
                  <span className="truncate">{rec.label}</span>
                </button>
              );
            })}
          </div>

          {recognitionType === "custom" && (
            <div className="mt-2 space-y-1 animate-in fade-in">
              <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">
                Custom Recognition Title
              </label>
              <Input
                placeholder="e.g. Best UI/UX Designer, Most Creative Builder, Community Choice"
                value={customRecognition}
                onChange={(e) => setCustomRecognition(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          )}
        </div>

        {/* Badges Multi-select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Special Badges & Honors</span>
            </label>
            <span className="text-[10px] text-[#64748B]">Select all that apply</span>
          </div>

          <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            {availableBadges.length > 0 ? (
              availableBadges.map((badge) => {
                const isSelected = selectedBadgeIds.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggleBadge(badge.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#94A3B8]"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    <span>{badge.name}</span>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-[#64748B]">No custom badges created yet.</p>
            )}
          </div>
        </div>

        {/* Short Bio / Achievement Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Short Description / Achievement Note
          </label>
          <textarea
            placeholder="e.g. Built an ultra-fast high-concurrency real-time trading simulator with WebGL visualizer."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-[#E2E8F0] p-2.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none transition-all"
          />
        </div>

        {/* Social / Portfolio Links */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Profiles & Portfolio Links (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <div className="absolute left-2.5 top-2 text-[#0A66C2]">
                <LinkedInIcon className="h-3.5 w-3.5" />
              </div>
              <Input
                placeholder="LinkedIn URL"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#059669]" />
              <Input
                placeholder="Portfolio URL"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="relative">
              <div className="absolute left-2.5 top-2 text-[#0F172A]">
                <GitHubIcon className="h-3.5 w-3.5" />
              </div>
              <Input
                placeholder="GitHub URL"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
