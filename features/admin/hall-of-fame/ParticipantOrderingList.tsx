"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/design-system/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ArrowUp, ArrowDown, Trophy, Medal, Sparkles, Award } from "lucide-react";
import { HofParticipant, RECOGNITION_LABELS } from "./types";

interface ParticipantOrderingListProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  participants: HofParticipant[];
  onSaveOrder: (orderedIds: string[]) => Promise<void>;
}

export function ParticipantOrderingList({
  isOpen,
  onClose,
  eventName,
  participants,
  onSaveOrder,
}: ParticipantOrderingListProps) {
  const [items, setItems] = useState<HofParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    setItems([...participants].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [participants, isOpen]);

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newItems = [...items];
    const temp = newItems[idx];
    newItems[idx] = newItems[idx - 1];
    newItems[idx - 1] = temp;
    setItems(newItems);
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[idx];
    newItems[idx] = newItems[idx + 1];
    newItems[idx + 1] = temp;
    setItems(newItems);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newItems = [...items];
    const draggedItem = newItems[draggedIdx];
    newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    setDraggedIdx(targetIdx);
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSaveOrder(items.map((i) => i.id));
      onClose();
    } catch (err: any) {
      alert("Failed to save order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reorder Hall of Fame Participants"
      description={`Arrange the display sequence for ${eventName}. Public landing showcases honor this exact order.`}
      maxWidth="lg"
      primaryActionText={loading ? "Saving..." : "Save Display Order"}
      onPrimaryAction={handleSave}
      secondaryActionText="Cancel"
      onSecondaryAction={onClose}
      loading={loading}
    >
      <div className="space-y-3 pt-1">
        <p className="text-xs text-[#64748B] flex items-center gap-1">
          <span>Tip: Drag items or use the</span>
          <span className="font-bold text-[#0F172A]">↑ / ↓</span>
          <span>arrows to re-position rankings.</span>
        </p>

        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((p, idx) => {
            const recognitionText =
              p.recognitionType === "custom" && p.customRecognition
                ? p.customRecognition
                : RECOGNITION_LABELS[p.recognitionType] || p.recognitionType;

            return (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={() => setDraggedIdx(null)}
                className={`flex items-center justify-between p-2.5 rounded-xl border bg-white transition-all cursor-move ${
                  draggedIdx === idx
                    ? "border-[#2563EB] bg-[#2563EB]/5 shadow-md scale-[1.01]"
                    : "border-[#E2E8F0] hover:border-[#94A3B8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#94A3B8] hover:text-[#0F172A] p-1">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F1F5F9] text-xs font-bold text-[#0F172A]">
                    {idx + 1}
                  </span>

                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.fullName}
                      className="h-8 w-8 rounded-full object-cover border border-[#E2E8F0]"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      {p.fullName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{p.fullName}</span>
                      <Badge variant="secondary" size="sm" className="text-[9px] px-1.5 py-0 font-bold">
                        {recognitionText}
                      </Badge>
                    </div>
                    {p.teamName && (
                      <p className="text-[10px] text-[#64748B]">Team: {p.teamName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveUp(idx);
                    }}
                    className="h-7 w-7 p-0 text-[#475569]"
                    title="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={idx === items.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDown(idx);
                    }}
                    className="h-7 w-7 p-0 text-[#475569]"
                    title="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
