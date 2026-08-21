"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/design-system/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image as ImageIcon, Calendar, Sparkles } from "lucide-react";
import { HofEvent, EventStatus } from "./types";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: HofEvent | null;
  onSave: (eventData: Partial<HofEvent>) => Promise<void>;
}

export function EventFormModal({ isOpen, onClose, event, onSave }: EventFormModalProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<EventStatus>("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (event) {
      setName(event.name || "");
      setYear(event.year || new Date().getFullYear().toString());
      setDescription(event.description || "");
      setCoverUrl(event.coverUrl || null);
      setStatus(event.status || "draft");
    } else {
      setName("");
      setYear(new Date().getFullYear().toString());
      setDescription("");
      setCoverUrl(null);
      setStatus("draft");
    }
    setError("");
  }, [event, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCoverUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setCoverUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError("Event name is required (e.g. Frontend Wars 2026).");
      return;
    }
    if (!year.trim()) {
      setError("Event year is required (e.g. 2026).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSave({
        name: name.trim(),
        year: year.trim(),
        description: description.trim() || null,
        coverUrl,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? "Edit Hall of Fame Event" : "Create Hall of Fame Event"}
      description="Configure event metadata, edition year, banner imagery, and public visibility status."
      maxWidth="lg"
      primaryActionText={loading ? "Saving..." : event ? "Save Changes" : "Create Event"}
      onPrimaryAction={handleSubmit}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
      loading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <span>Event Name</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Frontend Wars 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Year</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="h-10 text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Short Description / Tagline
          </label>
          <textarea
            placeholder="e.g. Celebrating the exceptional builders and top finalists of Frontend Wars 2026."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-[#E2E8F0] p-3 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none transition-all"
          />
        </div>

        {/* Status Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Publishing Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "draft", label: "Draft", desc: "Hidden from public website", color: "border-[#E2E8F0] bg-[#F8FAFC]" },
              { id: "published", label: "Published", desc: "Live on public landing page", color: "border-emerald-200 bg-emerald-50/50" },
              { id: "archived", label: "Archived", desc: "Preserved in admin records", color: "border-amber-200 bg-amber-50/50" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id as EventStatus)}
                className={`p-2.5 text-left rounded-xl border transition-all ${
                  status === st.id
                    ? "ring-2 ring-[#2563EB] border-[#2563EB] bg-[#2563EB]/5 shadow-xs"
                    : `${st.color} hover:border-[#94A3B8]`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">{st.label}</span>
                  {status === st.id && (
                    <Badge variant="solid" size="sm" className="bg-[#2563EB] text-[9px] px-1.5 py-0">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cover / Banner Upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
            <span>Event Cover Banner (Optional)</span>
            {coverUrl && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-normal"
              >
                <X className="h-3 w-3" />
                Remove banner
              </button>
            )}
          </label>

          {coverUrl ? (
            <div className="relative h-28 w-full rounded-xl overflow-hidden border border-[#E2E8F0] group shadow-xs">
              <img
                src={coverUrl}
                alt="Event cover preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-white/90 text-xs h-7"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="text-xs h-7"
                  onClick={handleRemoveCover}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#F8FAFC]/60 hover:bg-[#F1F5F9]/80 group"
            >
              <div className="h-9 w-9 rounded-xl bg-white border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform shadow-xs">
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-[#0F172A]">
                Click or drag & drop event banner image
              </p>
              <p className="text-[10px] text-[#64748B]">
                PNG, JPG, WEBP up to 5MB (1200×400 recommended)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </form>
    </Modal>
  );
}
