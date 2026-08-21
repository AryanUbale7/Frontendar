"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Users,
  Building,
  Calendar,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/design-system/EmptyState";
import { Modal } from "@/components/design-system/Modal";
import { LinkedInIcon, GitHubIcon } from "./social-icons";
import { EventFormModal } from "./EventFormModal";
import { ParticipantFormModal } from "./ParticipantFormModal";
import { BadgeManagementModal } from "./BadgeManagementModal";
import { ParticipantOrderingList } from "./ParticipantOrderingList";
import { DuplicateEventModal } from "./DuplicateEventModal";
import { HofEvent, HofParticipant, HofBadge, EventStatus, RecognitionType, RECOGNITION_LABELS } from "./types";

export function HallOfFameManagementPanel() {
  const [events, setEvents] = useState<HofEvent[]>([]);
  const [badges, setBadges] = useState<HofBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [toastMessage, setToastMessage] = useState("");

  // Sub-navigation: active event being managed for participants
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [recognitionFilter, setRecognitionFilter] = useState<"all" | RecognitionType>("all");

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HofEvent | null>(null);

  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<HofParticipant | null>(null);

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicatingEvent, setDuplicatingEvent] = useState<HofEvent | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "event" | "participant";
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: "event",
    id: "",
    name: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Load events & badges
  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, badgesRes] = await Promise.all([
        fetch("/api/hall-of-fame/admin/events"),
        fetch("/api/hall-of-fame/admin/badges"),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        }
      }

      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        if (Array.isArray(badgesData)) {
          setBadges(badgesData);
        }
      }
    } catch (err) {
      console.error("[HallOfFamePanel] Load data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || null;

  // ----------------------------------------------------
  // EVENT CRUD HANDLERS
  // ----------------------------------------------------
  const handleSaveEvent = async (eventData: Partial<HofEvent>) => {
    if (editingEvent) {
      // Update
      const res = await fetch(`/api/hall-of-fame/admin/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update event");
      }
      showToast(`Event "${eventData.name || editingEvent.name}" updated successfully!`);
    } else {
      // Create
      const res = await fetch("/api/hall-of-fame/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create event");
      }
      showToast(`Event "${eventData.name}" created successfully!`);
    }
    await loadData();
  };

  const handleTogglePublish = async (event: HofEvent) => {
    const nextStatus: EventStatus = event.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/hall-of-fame/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(
          nextStatus === "published"
            ? `"${event.name}" is now Published live on public website!`
            : `"${event.name}" moved to Draft.`
        );
        await loadData();
      }
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleToggleArchive = async (event: HofEvent) => {
    const nextStatus: EventStatus = event.status === "archived" ? "draft" : "archived";
    try {
      const res = await fetch(`/api/hall-of-fame/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(
          nextStatus === "archived"
            ? `"${event.name}" archived.`
            : `"${event.name}" restored to Draft.`
        );
        await loadData();
      }
    } catch (err: any) {
      alert("Failed to toggle archive: " + err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/hall-of-fame/admin/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Event deleted successfully.");
        if (selectedEventId === id) setSelectedEventId(null);
        await loadData();
      }
    } catch (err: any) {
      alert("Failed to delete event: " + err.message);
    }
  };

  const handleDuplicateEvent = async (
    sourceId: string,
    newName: string,
    newYear: string,
    copyParticipants: boolean
  ) => {
    const res = await fetch(`/api/hall-of-fame/admin/events/${sourceId}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName, newYear, copyParticipants }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to duplicate event");
    }
    showToast(`Duplicated into "${newName}" successfully!`);
    await loadData();
  };

  // ----------------------------------------------------
  // PARTICIPANT CRUD HANDLERS
  // ----------------------------------------------------
  const handleSaveParticipant = async (data: Partial<HofParticipant> & { badgeIds?: string[] }) => {
    if (!selectedEventId) return;

    if (editingParticipant) {
      // Update
      const res = await fetch(`/api/hall-of-fame/admin/participants/${editingParticipant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update participant");
      }
      showToast(`Participant "${data.fullName}" updated successfully!`);
    } else {
      // Add
      const res = await fetch(`/api/hall-of-fame/admin/events/${selectedEventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add participant");
      }
      showToast(`Participant "${data.fullName}" added to Hall of Fame!`);
    }
    await loadData();
  };

  const handleDeleteParticipant = async (id: string) => {
    try {
      const res = await fetch(`/api/hall-of-fame/admin/participants/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Participant deleted successfully.");
        await loadData();
      }
    } catch (err: any) {
      alert("Failed to delete participant: " + err.message);
    }
  };

  const handleSaveParticipantOrder = async (orderedIds: string[]) => {
    if (!selectedEventId) return;
    const res = await fetch(`/api/hall-of-fame/admin/events/${selectedEventId}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedParticipantIds: orderedIds }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to save participant order");
    }
    showToast("Participant display sequence reordered successfully!");
    await loadData();
  };

  // ----------------------------------------------------
  // BADGES HANDLERS
  // ----------------------------------------------------
  const handleCreateBadge = async (badgeData: Partial<HofBadge>) => {
    const res = await fetch("/api/hall-of-fame/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badgeData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create badge");
    }
    showToast(`Badge "${badgeData.name}" created!`);
    await loadData();
  };

  const handleUpdateBadge = async (id: string, badgeData: Partial<HofBadge>) => {
    const res = await fetch(`/api/hall-of-fame/admin/badges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badgeData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update badge");
    }
    showToast(`Badge "${badgeData.name}" updated!`);
    await loadData();
  };

  const handleDeleteBadge = async (id: string) => {
    const res = await fetch(`/api/hall-of-fame/admin/badges/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete badge");
    }
    showToast("Badge deleted.");
    await loadData();
  };

  // Calculate metrics
  const totalEvents = events.length;
  const publishedEventsCount = events.filter((e) => e.status === "published").length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participants?.length || e.participantCount || 0), 0);
  const activeBadgesCount = badges.filter((b) => b.status === "active").length;

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.year.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter participants of active event
  const currentParticipants = activeEvent?.participants || [];
  const filteredParticipants = currentParticipants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.teamName && p.teamName.toLowerCase().includes(participantSearch.toLowerCase())) ||
      (p.collegeOrOrg && p.collegeOrOrg.toLowerCase().includes(participantSearch.toLowerCase()));
    const matchesRecognition =
      recognitionFilter === "all" || p.recognitionType === recognitionFilter;
    return matchesSearch && matchesRecognition;
  });

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#0F172A] text-white px-4 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header & Metric Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6 shadow-sm">
        <div className="space-y-1 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              Hall of Fame CMS
            </span>
            <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic Edition Engine
            </span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
            Hall of Fame Management System
          </h1>
          <p className="text-xs text-[#475569] leading-relaxed">
            Manage winners, runner-ups, Top 10 finalists, and merit badge recipients across Frontend Arena hackathon editions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBadgeModalOpen(true)}
            className="flex items-center gap-1.5 text-xs h-9"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Badges ({badges.length})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="flex items-center gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs h-9 bg-[#2563EB] hover:bg-[#1D4ED8] font-bold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Create Event</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-[#E2E8F0] bg-white rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Total Events</span>
            <Trophy className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{totalEvents}</p>
          <p className="text-[10px] text-[#64748B]">{publishedEventsCount} published live</p>
        </Card>

        <Card className="p-4 border-[#E2E8F0] bg-white rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Published Live</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{publishedEventsCount}</p>
          <p className="text-[10px] text-[#64748B]">Visible on landing page</p>
        </Card>

        <Card className="p-4 border-[#E2E8F0] bg-white rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Featured Builders</span>
            <Users className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{totalParticipants}</p>
          <p className="text-[10px] text-[#64748B]">Across all editions</p>
        </Card>

        <Card className="p-4 border-[#E2E8F0] bg-white rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Active Badges</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{activeBadgesCount}</p>
          <p className="text-[10px] text-[#64748B]">Custom merit honors</p>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PARTICIPANTS ROSTER (WHEN AN EVENT IS SELECTED)                   */}
      {/* ========================================================================= */}
      {selectedEventId && activeEvent ? (
        <div className="space-y-6">
          {/* Active Event Header Card */}
          <div className="p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 mb-1"
                >
                  ← Back to All Hall of Fame Events
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0F172A]">
                    {activeEvent.name}
                  </h2>
                  <Badge variant="solid" size="sm" className="bg-[#2563EB] text-white">
                    {activeEvent.year}
                  </Badge>
                  <Badge
                    variant={
                      activeEvent.status === "published"
                        ? "success"
                        : activeEvent.status === "archived"
                        ? "warning"
                        : "secondary"
                    }
                    size="sm"
                    className="capitalize font-bold"
                  >
                    {activeEvent.status}
                  </Badge>
                </div>
                {activeEvent.description && (
                  <p className="text-xs text-[#64748B]">{activeEvent.description}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReorderModalOpen(true)}
                  disabled={currentParticipants.length < 2}
                  className="flex items-center gap-1.5 text-xs h-9"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>Reorder Sequence</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setEditingParticipant(null);
                    setIsParticipantModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs h-9 bg-[#2563EB] hover:bg-[#1D4ED8] font-bold shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Person</span>
                </Button>
              </div>
            </div>

            {/* Filter & Search for Participants */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                <Input
                  placeholder="Search participant, team, or college..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs text-[#64748B] font-semibold mr-1">Filter:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "winner", label: "Winners" },
                  { id: "runner_up", label: "Runner-Up" },
                  { id: "top_10", label: "Top 10" },
                  { id: "finalist", label: "Finalists" },
                  { id: "special_recognition", label: "Special Rec." },
                  { id: "custom", label: "Custom" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRecognitionFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      recognitionFilter === f.id
                        ? "bg-[#0F172A] text-white shadow-xs"
                        : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Participant Cards Grid */}
          {filteredParticipants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredParticipants.map((p, idx) => {
                const recognitionLabel =
                  p.recognitionType === "custom" && p.customRecognition
                    ? p.customRecognition
                    : RECOGNITION_LABELS[p.recognitionType] || p.recognitionType;

                const isWinner = p.recognitionType === "winner";

                return (
                  <Card
                    key={p.id}
                    className={`p-6 border rounded-3xl bg-white shadow-xs flex flex-col justify-between transition-all hover:shadow-lg ${
                      isWinner
                        ? "border-amber-300 ring-2 ring-amber-300/40"
                        : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Recognition Badge & Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={isWinner ? "solid" : "secondary"}
                          size="sm"
                          className={
                            isWinner
                              ? "bg-amber-500 text-white font-bold text-xs"
                              : "bg-[#F1F5F9] text-slate-800 font-bold text-xs border border-slate-200 truncate"
                          }
                        >
                          {recognitionLabel}
                        </Badge>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-[#475569] hover:bg-slate-100 rounded-lg"
                            onClick={() => {
                              setEditingParticipant(p);
                              setIsParticipantModalOpen(true);
                            }}
                            title="Edit Participant"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: "participant",
                                id: p.id,
                                name: p.fullName,
                              })
                            }
                            title="Delete Participant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Photo - Large, Crisp & Focused */}
                      <div className="flex justify-center pt-2">
                        <div className="h-32 w-32 rounded-2xl overflow-hidden border-2 border-[#E2E8F0] p-0.5 bg-white shadow-sm">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.fullName}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-full w-full rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-3xl">
                              {p.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Name & Subtitles - Clear High Contrast Black Text */}
                      <div className="text-center pt-1">
                        <h3 className="font-heading font-bold text-lg text-[#0F172A] truncate" title={p.fullName}>
                          {p.fullName}
                        </h3>
                        {p.teamName && (
                          <p className="text-xs font-semibold text-[#2563EB] truncate mt-0.5">
                            Team: {p.teamName}
                          </p>
                        )}
                        {p.collegeOrOrg && (
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                            {p.collegeOrOrg}
                          </p>
                        )}
                      </div>

                      {/* Bio / Description */}
                      {p.description && (
                        <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]/60 text-center">
                          {p.description}
                        </p>
                      )}

                      {/* Badges List */}
                      {p.badges && p.badges.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
                          {p.badges.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>{b.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Social links row & Rank */}
                    <div className="flex items-center justify-between pt-3.5 mt-4 border-t border-[#E2E8F0] text-[#64748B]">
                      <div className="flex items-center gap-2">
                        {p.linkedInUrl && (
                          <a
                            href={p.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors"
                            title="LinkedIn Profile"
                          >
                            <LinkedInIcon className="h-4 w-4" />
                          </a>
                        )}
                        {p.portfolioUrl && (
                          <a
                            href={p.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center hover:text-[#059669] hover:border-[#059669] transition-colors"
                            title="Portfolio Website"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {p.githubUrl && (
                          <a
                            href={p.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center hover:text-[#0F172A] hover:border-[#0F172A] transition-colors"
                            title="GitHub Profile"
                          >
                            <GitHubIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-slate-200">
                        Rank #{idx + 1}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={
                participantSearch || recognitionFilter !== "all"
                  ? "No matching participants found"
                  : "No participants added yet"
              }
              description={
                participantSearch || recognitionFilter !== "all"
                  ? "Try adjusting your search or recognition filter criteria."
                  : `Add winners, runner-ups, and finalists to ${activeEvent.name}.`
              }
              primaryActionText={
                !participantSearch && recognitionFilter === "all" ? "Add First Participant" : undefined
              }
              onPrimaryAction={
                !participantSearch && recognitionFilter === "all"
                  ? () => {
                      setEditingParticipant(null);
                      setIsParticipantModalOpen(true);
                    }
                  : undefined
              }
            />
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: ALL EVENTS TABLE / LIST                                           */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              <Input
                placeholder="Search event name or year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs text-[#64748B] font-semibold mr-1">Status:</span>
              {[
                { id: "all", label: "All Events" },
                { id: "published", label: "Published" },
                { id: "draft", label: "Drafts" },
                { id: "archived", label: "Archived" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === tab.id
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid / Cards */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev) => {
                const partCount = ev.participants?.length || ev.participantCount || 0;
                const isPublished = ev.status === "published";
                const isArchived = ev.status === "archived";

                return (
                  <Card
                    key={ev.id}
                    className="border-[#E2E8F0] bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Event Banner preview or fallback gradient */}
                      <div className="relative h-28 w-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] flex items-end p-4">
                        {ev.coverUrl && (
                          <img
                            src={ev.coverUrl}
                            alt={ev.name}
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        <div className="relative z-10 flex items-center justify-between w-full">
                          <Badge
                            variant="solid"
                            size="sm"
                            className="bg-white/20 backdrop-blur-md text-white font-bold border-none text-xs"
                          >
                            Edition {ev.year}
                          </Badge>

                          <Badge
                            variant={
                              isPublished
                                ? "success"
                                : isArchived
                                ? "warning"
                                : "secondary"
                            }
                            size="sm"
                            className="capitalize font-bold shadow-xs"
                          >
                            {ev.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-heading font-bold text-lg text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                            {ev.name}
                          </h3>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-1">
                            {ev.description || "Official Frontend Arena Hall of Fame edition."}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#475569] pt-2 border-t border-[#E2E8F0]">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#2563EB]" />
                            <span className="font-bold text-[#0F172A]">{partCount}</span>
                            <span>featured</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-[#2563EB]" />
                            <span>{ev.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedEventId(ev.id)}
                        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold h-9 flex items-center justify-center gap-2"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>Manage Participants ({partCount})</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </Button>

                      <div className="flex items-center justify-between pt-1 gap-1">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] px-2"
                            onClick={() => {
                              setEditingEvent(ev);
                              setIsEventModalOpen(true);
                            }}
                            title="Edit Event"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] px-2"
                            onClick={() => {
                              setDuplicatingEvent(ev);
                              setIsDuplicateModalOpen(true);
                            }}
                            title="Duplicate to new year"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Clone
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePublish(ev)}
                            className={`h-8 text-[11px] px-2 ${
                              isPublished
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50 font-bold"
                            }`}
                            title={isPublished ? "Unpublish to draft" : "Publish to live website"}
                          >
                            {isPublished ? "Unpublish" : "Publish"}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: "event",
                                id: ev.id,
                                name: ev.name,
                              })
                            }
                            title="Delete Event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={
                searchQuery || statusFilter !== "all"
                  ? "No matching events found"
                  : "No Hall of Fame events created yet"
              }
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try changing your search keywords or status filter."
                  : "Create your first dynamic Hall of Fame edition (e.g. Frontend Wars 2026)."
              }
              primaryActionText={
                !searchQuery && statusFilter === "all" ? "Create First Event" : undefined
              }
              onPrimaryAction={
                !searchQuery && statusFilter === "all"
                  ? () => {
                      setEditingEvent(null);
                      setIsEventModalOpen(true);
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Create / Edit Event Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleSaveEvent}
      />

      {/* 2. Add / Edit Participant Modal */}
      {activeEvent && (
        <ParticipantFormModal
          isOpen={isParticipantModalOpen}
          onClose={() => {
            setIsParticipantModalOpen(false);
            setEditingParticipant(null);
          }}
          eventId={activeEvent.id}
          eventName={activeEvent.name}
          participant={editingParticipant}
          availableBadges={badges.filter((b) => b.status === "active")}
          onSave={handleSaveParticipant}
        />
      )}

      {/* 3. Badge Management Modal */}
      <BadgeManagementModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        badges={badges}
        onCreateBadge={handleCreateBadge}
        onUpdateBadge={handleUpdateBadge}
        onDeleteBadge={handleDeleteBadge}
      />

      {/* 4. Participant Reorder Modal */}
      {activeEvent && (
        <ParticipantOrderingList
          isOpen={isReorderModalOpen}
          onClose={() => setIsReorderModalOpen(false)}
          eventName={activeEvent.name}
          participants={currentParticipants}
          onSaveOrder={handleSaveParticipantOrder}
        />
      )}

      {/* 5. Duplicate Event Modal */}
      <DuplicateEventModal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setDuplicatingEvent(null);
        }}
        sourceEvent={duplicatingEvent}
        onDuplicate={handleDuplicateEvent}
      />

      {/* 6. Destructive Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        title={`Confirm Delete ${deleteConfirm.type === "event" ? "Event" : "Participant"}`}
        description="This action cannot be undone and will permanently remove this record from the database."
        maxWidth="sm"
        primaryActionText="Yes, Delete Permanently"
        onPrimaryAction={() => {
          if (deleteConfirm.type === "event") {
            handleDeleteEvent(deleteConfirm.id);
          } else {
            handleDeleteParticipant(deleteConfirm.id);
          }
          setDeleteConfirm({ ...deleteConfirm, isOpen: false });
        }}
        secondaryActionText="Cancel"
        onSecondaryAction={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
      >
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span>Are you sure you want to delete </span>
            <strong className="font-bold text-red-900">{deleteConfirm.name}</strong>?
          </div>
        </div>
      </Modal>
    </div>
  );
}
