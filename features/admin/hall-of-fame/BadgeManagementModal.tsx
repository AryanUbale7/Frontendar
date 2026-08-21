"use client";

import React, { useState } from "react";
import { Modal } from "@/components/design-system/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Trophy,
  Medal,
  Flame,
  Zap,
  Heart,
  Star,
  Shield,
  Award,
  Rocket,
  Code,
  Target,
  Plus,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import { HofBadge } from "./types";

interface BadgeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: HofBadge[];
  onCreateBadge: (badge: Partial<HofBadge>) => Promise<void>;
  onUpdateBadge: (id: string, badge: Partial<HofBadge>) => Promise<void>;
  onDeleteBadge: (id: string) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: "Sparkles", icon: Sparkles },
  { name: "Trophy", icon: Trophy },
  { name: "Medal", icon: Medal },
  { name: "Flame", icon: Flame },
  { name: "Zap", icon: Zap },
  { name: "Heart", icon: Heart },
  { name: "Star", icon: Star },
  { name: "Shield", icon: Shield },
  { name: "Award", icon: Award },
  { name: "Rocket", icon: Rocket },
  { name: "Code", icon: Code },
  { name: "Target", icon: Target },
];

export function BadgeManagementModal({
  isOpen,
  onClose,
  badges,
  onCreateBadge,
  onUpdateBadge,
  onDeleteBadge,
}: BadgeManagementModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("Sparkles");
    setStatus("active");
    setError("");
  };

  const handleEdit = (badge: HofBadge) => {
    setEditingId(badge.id);
    setName(badge.name || "");
    setDescription(badge.description || "");
    setIcon(badge.icon || "Sparkles");
    setStatus(badge.status || "active");
    setError("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError("Badge name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (editingId) {
        await onUpdateBadge(editingId, {
          name: name.trim(),
          description: description.trim() || null,
          icon,
          status,
        });
      } else {
        await onCreateBadge({
          name: name.trim(),
          description: description.trim() || null,
          icon,
          status,
        });
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save badge.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this badge?")) {
      try {
        setLoading(true);
        await onDeleteBadge(id);
        if (editingId === id) resetForm();
      } catch (err: any) {
        setError(err.message || "Failed to delete badge.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Badge & Honors System"
      description="Create and manage custom merit badges that can be awarded to Hall of Fame participants."
      maxWidth="lg"
      secondaryActionText="Close"
      onSecondaryAction={onClose}
    >
      <div className="space-y-6 pt-1">
        {/* Form to Add / Edit Badge */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              {editingId ? "Edit Badge" : "Create New Badge"}
            </h4>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#2563EB] hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Badge Name *
              </label>
              <Input
                placeholder="e.g. Best UI/UX Designer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    status === "active"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0]"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("inactive")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    status === "inactive"
                      ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                      : "bg-white text-[#475569] border-[#E2E8F0]"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Badge Description
            </label>
            <Input
              placeholder="e.g. Awarded for exceptional aesthetic fidelity and interaction design."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Badge Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ICONS.map((ic) => {
                const IconComp = ic.icon;
                const isSelected = icon === ic.name;
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    title={ic.name}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
                        : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8]"
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              loading={loading}
              className="h-8 px-4 text-xs font-bold"
            >
              {editingId ? "Update Badge" : "Create Badge"}
            </Button>
          </div>
        </form>

        {/* Existing Badges List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Existing Badges ({badges.length})
          </h4>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{b.name}</span>
                      <Badge
                        variant={b.status === "active" ? "solid" : "secondary"}
                        size="sm"
                        className={b.status === "active" ? "bg-emerald-600 text-white text-[9px]" : "text-[9px]"}
                      >
                        {b.status}
                      </Badge>
                    </div>
                    {b.description && (
                      <p className="text-[11px] text-[#64748B] line-clamp-1">{b.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-[#475569]"
                    onClick={() => handleEdit(b)}
                    title="Edit badge"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(b.id)}
                    title="Delete badge"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
