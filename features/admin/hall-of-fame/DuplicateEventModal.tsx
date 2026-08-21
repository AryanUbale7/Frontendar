"use client";

import React, { useState } from "react";
import { Modal } from "@/components/design-system/Modal";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Calendar, AlertCircle } from "lucide-react";
import { HofEvent } from "./types";

interface DuplicateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceEvent: HofEvent | null;
  onDuplicate: (sourceId: string, newName: string, newYear: string, copyParticipants: boolean) => Promise<void>;
}

export function DuplicateEventModal({
  isOpen,
  onClose,
  sourceEvent,
  onDuplicate,
}: DuplicateEventModalProps) {
  const nextYear = sourceEvent
    ? (parseInt(sourceEvent.year || "2026", 10) + 1).toString()
    : "2027";

  const [newName, setNewName] = useState(
    sourceEvent ? `${sourceEvent.name.replace(/\d{4}/, nextYear)}` : ""
  );
  const [newYear, setNewYear] = useState(nextYear);
  const [copyParticipants, setCopyParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (sourceEvent) {
      const ny = (parseInt(sourceEvent.year || "2026", 10) + 1).toString();
      setNewYear(ny);
      setNewName(sourceEvent.name.includes(sourceEvent.year)
        ? sourceEvent.name.replace(sourceEvent.year, ny)
        : `${sourceEvent.name} (Copy)`
      );
      setCopyParticipants(false);
      setError("");
    }
  }, [sourceEvent, isOpen]);

  const handleConfirm = async () => {
    if (!sourceEvent) return;
    if (!newName.trim()) {
      setError("Please specify the new event name.");
      return;
    }
    if (!newYear.trim()) {
      setError("Please specify the new edition year.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onDuplicate(sourceEvent.id, newName.trim(), newYear.trim(), copyParticipants);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to duplicate event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Hall of Fame Event"
      description="Clone an existing event structure to create the next edition with independent participants."
      maxWidth="md"
      primaryActionText={loading ? "Cloning..." : "Confirm Duplication"}
      onPrimaryAction={handleConfirm}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
      loading={loading}
    >
      <div className="space-y-4 pt-1">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/60 text-xs text-[#1E3A8A] flex items-start gap-2">
          <Copy className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
          <div>
            <span className="font-bold">Cloning from: </span>
            <span>{sourceEvent?.name} ({sourceEvent?.year})</span>
            <p className="text-[11px] text-[#3B82F6] mt-0.5">
              The new event will be created in <strong>Draft</strong> mode so you can prepare it safely.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            New Event Name *
          </label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Frontend Wars 2027"
            className="h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Edition Year *</span>
          </label>
          <Input
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder="2027"
            className="h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="copy-participants"
            checked={copyParticipants}
            onChange={(e) => setCopyParticipants(e.target.checked)}
          />
          <label
            htmlFor="copy-participants"
            className="text-xs text-[#475569] cursor-pointer select-none"
          >
            Also copy existing participant roster as initial template
          </label>
        </div>
      </div>
    </Modal>
  );
}
