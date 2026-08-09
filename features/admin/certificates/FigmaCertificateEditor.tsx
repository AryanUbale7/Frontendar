"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Save,
  Upload,
  Image as ImageIcon,
  Type,
  Layers,
  Sparkles,
  Check,
  Eye,
  Settings2,
  Trash2,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  RefreshCw,
  QrCode,
  Award,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Move,
  Copy,
  ChevronUp,
  ChevronDown,
  Grid,
  FileText,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CertificateCanvasRenderer } from "./CertificateCanvasRenderer";
import { CertificateLayout, CanvasElement, ElementType } from "./types";
import { PRESET_TEMPLATES, DEFAULT_OVERLAY_ELEMENTS } from "./presets";

interface FigmaCertificateEditorProps {
  initialLayout?: CertificateLayout;
  initialTitle?: string;
  onSaveSuccess?: () => void;
}

const FONT_FAMILIES = [
  { name: "Inter (Sans-serif)", value: "Inter, sans-serif" },
  { name: "Playfair Display (Serif)", value: "Playfair Display, Georgia, serif" },
  { name: "Cinzel (Classic Serif)", value: "Cinzel, Times New Roman, serif" },
  { name: "Outfit (Modern Sans)", value: "Outfit, Inter, sans-serif" },
  { name: "Courier New (Monospace)", value: "Courier New, monospace" },
  { name: "Georgia (Serif)", value: "Georgia, serif" },
  { name: "Arial (Sans-serif)", value: "Arial, sans-serif" },
];

const PREVIEW_PARTICIPANTS = [
  { name: "ARYAN UBALE", uniqueId: "FA-8K29XQ71" },
  { name: "RAHUL SHARMA", uniqueId: "FA-P42LM8Q2" },
  { name: "PRIYA PATIL", uniqueId: "FA-X91KD73A" },
  { name: "AMAN SHAH", uniqueId: "FA-991B1B88" },
];

export function FigmaCertificateEditor({
  initialLayout,
  initialTitle = "Hackathon Certificate Template",
  onSaveSuccess,
}: FigmaCertificateEditorProps) {
  const [templateTitle, setTemplateTitle] = useState(initialTitle);
  const [templateDescription, setTemplateDescription] = useState("Customizable certificate template for hackathons.");
  const [layout, setLayout] = useState<CertificateLayout>(() => initialLayout || PRESET_TEMPLATES[0].layout);

  // Editor State
  const [selectedElementId, setSelectedElementId] = useState<string | null>("el-name");
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState("");
  const [activeRightTab, setActiveRightTab] = useState<"properties" | "layers">("properties");
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showSnapGuides, setShowSnapGuides] = useState<boolean>(true);
  const [snapX, setSnapX] = useState<boolean>(false);
  const [snapY, setSnapY] = useState<boolean>(false);

  // Editable Live Preview Values
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [previewEventName, setPreviewEventName] = useState("Frontend Arena Hackathon 2026");
  const [previewDate, setPreviewDate] = useState("August 9, 2026");
  const [previewDescription, setPreviewDescription] = useState(
    "For outstanding performance, dedication, and technical excellence in the development of Project Viksit Bharat 2026 National-Level Innovation Hackathon."
  );
  const [previewOrgName, setPreviewOrgName] = useState("Frontend Arena Organization");

  // Save / Toast State
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CertificateLayout[]>([layout]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isResizingRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elementStartPosRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  const currentParticipant = PREVIEW_PARTICIPANTS[previewIndex];
  const selectedElement = layout.elements.find((el) => el.id === selectedElementId);

  // Check if selected element is near canvas boundary
  const isOutOfBounds = selectedElement
    ? selectedElement.x < 3 || selectedElement.x > 97 || selectedElement.y < 3 || selectedElement.y > 97
    : false;

  // Push to Undo/Redo History Stack
  const pushHistory = (newLayout: CertificateLayout) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newLayout)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateLayout = (updater: (prev: CertificateLayout) => CertificateLayout, recordHistory = true) => {
    setLayout((prev) => {
      const next = updater(prev);
      if (recordHistory) {
        pushHistory(next);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setLayout(JSON.parse(JSON.stringify(history[prevIdx])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setLayout(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  };

  const updateElement = (id: string, fields: Partial<CanvasElement>, recordHistory = true) => {
    updateLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...fields } : el)),
    }), recordHistory);
  };

  const handleAddElement = (type: ElementType, label: string, defaultText = "") => {
    const maxZ = layout.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const newEl: CanvasElement = {
      id: `el-${type}-${Date.now()}`,
      type,
      label,
      text: defaultText,
      x: 50,
      y: 50,
      fontSize: type === "name" ? 42 : type === "title" ? 34 : 16,
      fontFamily: "Inter, sans-serif",
      fontStyle: type === "name" ? "bold" : "normal",
      color: type === "name" ? "#0F172A" : "#2563EB",
      align: "center",
      visible: true,
      zIndex: maxZ + 1,
      width: type === "description" ? 750 : type === "qrCode" ? 100 : type === "logo" ? 120 : 600,
      height: type === "qrCode" ? 100 : type === "logo" ? 60 : 50,
      opacity: 1,
      rotation: 0,
      isLocked: false,
      autoWrap: true,
      autoFitText: type === "name" || type === "eventName",
      lineHeight: 1.35,
      verticalAlign: "center",
    };

    updateLayout((prev) => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedElementId(newEl.id);
  };

  const handleRemoveElement = (id: string) => {
    updateLayout((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const target = layout.elements.find((el) => el.id === id);
    if (!target) return;

    const maxZ = layout.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const dup: CanvasElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el-${target.type}-${Date.now()}`,
      label: `${target.label} (Copy)`,
      x: Math.min(90, target.x + 4),
      y: Math.min(90, target.y + 4),
      zIndex: maxZ + 1,
    };

    updateLayout((prev) => ({ ...prev, elements: [...prev.elements, dup] }));
    setSelectedElementId(dup.id);
  };

  // Upload Custom Background Image (Option 1 vs Option 2)
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: "background_only" | "create_template") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Background image size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (mode === "create_template") {
          const freshLayout: CertificateLayout = {
            width: 1000,
            height: 700,
            backgroundColor: "#FFFFFF",
            borderColor: "#2563EB",
            borderWidth: 0,
            showFrame: false,
            frameStyle: "none",
            backgroundImage: dataUrl,
            elements: JSON.parse(JSON.stringify(DEFAULT_OVERLAY_ELEMENTS)),
          };
          setLayout(freshLayout);
          pushHistory(freshLayout);
        } else {
          updateLayout((prev) => ({
            ...prev,
            backgroundImage: dataUrl,
            showFrame: false,
          }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Add a NEW Logo or Signature Element (Supports Multiple Logos!)
  const handleAddImageAsset = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        let newId = "";
        updateLayout((prev) => {
          const count = prev.elements.filter((el) => el.type === type).length + 1;
          const maxZ = prev.elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
          newId = `el-${type}-${Date.now()}`;

          const newEl: CanvasElement = {
            id: newId,
            type,
            label: type === "logo" ? `Logo ${count}` : `Signature ${count}`,
            text: "",
            dataUrl,
            x: Math.min(85, 20 + count * 12),
            y: type === "logo" ? 15 : 82,
            fontSize: 16,
            fontFamily: "Inter, sans-serif",
            color: "#0F172A",
            align: "center",
            visible: true,
            zIndex: maxZ + 1,
            width: type === "logo" ? 120 : 160,
            height: type === "logo" ? 60 : 60,
            opacity: 1,
            rotation: 0,
            isLocked: false,
          };
          return { ...prev, elements: [...prev.elements, newEl] };
        });

        if (newId) {
          setSelectedElementId(newId);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Replace Image for the SPECIFIC Selected Logo / Signature
  const handleReplaceSelectedImage = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateElement(id, { dataUrl, visible: true });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Layer Reordering Controls
  const handleLayerMove = (id: string, direction: "top" | "up" | "down" | "bottom") => {
    updateLayout((prev) => {
      const sorted = [...prev.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const idx = sorted.findIndex((el) => el.id === id);
      if (idx === -1) return prev;

      if (direction === "top") {
        const [target] = sorted.splice(idx, 1);
        sorted.push(target);
      } else if (direction === "bottom") {
        const [target] = sorted.splice(idx, 1);
        sorted.unshift(target);
      } else if (direction === "up" && idx < sorted.length - 1) {
        const temp = sorted[idx];
        sorted[idx] = sorted[idx + 1];
        sorted[idx + 1] = temp;
      } else if (direction === "down" && idx > 0) {
        const temp = sorted[idx];
        sorted[idx] = sorted[idx - 1];
        sorted[idx - 1] = temp;
      }

      const reindexed = sorted.map((el, i) => ({ ...el, zIndex: i + 1 }));
      return { ...prev, elements: reindexed };
    });
  };

  // Mouse Drag to Position Elements or Resize Container Width / Height
  const handleMouseDownElement = (e: React.MouseEvent, id: string, resizeHandle: string | null = null) => {
    e.stopPropagation();
    setSelectedElementId(id);
    const target = layout.elements.find((el) => el.id === id);
    if (!target || target.isLocked) return;

    if (resizeHandle) {
      isResizingRef.current = resizeHandle;
    } else {
      isDraggingRef.current = true;
    }

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    elementStartPosRef.current = {
      x: target.x,
      y: target.y,
      width: target.width || (target.type === "qrCode" ? 100 : 600),
      height: target.height || (target.type === "qrCode" ? 100 : 60),
    };
  };

  // Double-Click Inline Canvas Direct Text Editing
  const handleDoubleClickElement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = layout.elements.find((el) => el.id === id);
    if (!target || target.type === "logo" || target.type === "signature" || target.type === "qrCode") return;
    setEditingElementId(id);
    setInlineEditText(target.text || "");
  };

  const handleFinishInlineEdit = () => {
    if (editingElementId) {
      updateElement(editingElementId, { text: inlineEditText });
      setEditingElementId(null);
    }
  };

  const handleMouseMoveCanvas = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedElementId || !containerRef.current) return;
      const target = layout.elements.find((el) => el.id === selectedElementId);
      if (!target || target.isLocked) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Handle Interactive Resizing
      if (isResizingRef.current) {
        const deltaXPixels = (e.clientX - dragStartPosRef.current.x) / (zoom / 100);
        const deltaYPixels = (e.clientY - dragStartPosRef.current.y) / (zoom / 100);

        let newWidth = elementStartPosRef.current.width;
        let newHeight = elementStartPosRef.current.height;

        if (isResizingRef.current.includes("E")) {
          newWidth = Math.max(30, Math.min(950, elementStartPosRef.current.width + deltaXPixels * 2));
        } else if (isResizingRef.current.includes("W")) {
          newWidth = Math.max(30, Math.min(950, elementStartPosRef.current.width - deltaXPixels * 2));
        }

        if (isResizingRef.current.includes("S")) {
          newHeight = Math.max(30, Math.min(600, elementStartPosRef.current.height + deltaYPixels * 2));
        } else if (isResizingRef.current.includes("N")) {
          newHeight = Math.max(30, Math.min(600, elementStartPosRef.current.height - deltaYPixels * 2));
        }

        if (target.type === "qrCode") {
          newHeight = newWidth;
        }

        updateElement(selectedElementId, { width: Math.round(newWidth), height: Math.round(newHeight) }, false);
        return;
      }

      // Handle Dragging Position
      if (isDraggingRef.current) {
        const deltaX = ((e.clientX - dragStartPosRef.current.x) / (rect.width * (zoom / 100))) * 100;
        const deltaY = ((e.clientY - dragStartPosRef.current.y) / (rect.height * (zoom / 100))) * 100;

        let newX = Math.round(elementStartPosRef.current.x + deltaX);
        let newY = Math.round(elementStartPosRef.current.y + deltaY);

        if (showSnapGuides) {
          if (Math.abs(newX - 50) < 2) {
            newX = 50;
            setSnapX(true);
          } else {
            setSnapX(false);
          }

          if (Math.abs(newY - 50) < 2) {
            newY = 50;
            setSnapY(true);
          } else {
            setSnapY(false);
          }
        }

        updateElement(selectedElementId, { x: newX, y: newY }, false);
      }
    },
    [selectedElementId, zoom, layout.elements, showSnapGuides]
  );

  const handleMouseUpCanvas = useCallback(() => {
    if (isDraggingRef.current || isResizingRef.current) {
      isDraggingRef.current = false;
      isResizingRef.current = null;
      setSnapX(false);
      setSnapY(false);
      pushHistory(layout);
    }
  }, [layout]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingElementId) {
        if (e.key === "Escape") {
          setEditingElementId(null);
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          handleFinishInlineEdit();
        }
        return;
      }

      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
        return;
      }

      if (selectedElementId) {
        const target = layout.elements.find((el) => el.id === selectedElementId);
        if (!target || target.isLocked) return;

        const step = e.shiftKey ? 5 : 1;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          updateElement(selectedElementId, { x: Math.max(0, target.x - step) });
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          updateElement(selectedElementId, { x: Math.min(100, target.x + step) });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          updateElement(selectedElementId, { y: Math.max(0, target.y - step) });
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          updateElement(selectedElementId, { y: Math.min(100, target.y + step) });
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleRemoveElement(selectedElementId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, editingElementId, layout, historyIndex]);

  // Save Template Version to Backend
  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      alert("Please enter a template title.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateTitle.trim(),
          description: templateDescription.trim(),
          layout: {
            ...layout,
            version: (layout.version || 1) + 1,
          },
        }),
      });

      if (res.ok) {
        setSaveToast("Certificate template & layout version saved successfully!");
        setTimeout(() => setSaveToast(null), 3000);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const err = await res.json();
        alert("Failed to save template: " + (err.message || err.error));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error saving template";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="solid" className="bg-[#2563EB] text-white font-bold text-[10px] uppercase">
              Editable Certificate Designer
            </Badge>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Multiple Logo & Brand Asset Engine
            </span>
          </div>
          <Input
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            className="text-lg font-bold border-none px-0 h-auto focus-visible:ring-0 text-[#0F172A]"
            placeholder="Template Title..."
          />
        </div>

        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1.5 rounded-lg text-[#475569] hover:bg-white disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-1.5 rounded-lg text-[#475569] hover:bg-white disabled:opacity-30"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-1 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-lg text-[#475569] hover:bg-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono font-bold w-12 text-center text-[#0F172A]">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-lg text-[#475569] hover:bg-white"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 rounded-lg text-[#475569] hover:bg-white font-semibold text-[10px]"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
              showGrid ? "bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]" : "border-[#E2E8F0] text-[#475569] bg-white"
            }`}
            title="Toggle Canvas Grid Overlay"
          >
            <Grid className="h-4 w-4" />
          </button>

          {/* Live Preview Participant Dropdown */}
          <div className="flex items-center gap-1.5 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] px-2 py-1">
            <Eye className="h-4 w-4 text-[#2563EB]" />
            <select
              value={previewIndex}
              onChange={(e) => setPreviewIndex(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[#0F172A] border-none focus:outline-none"
            >
              {PREVIEW_PARTICIPANTS.map((p, idx) => (
                <option key={p.uniqueId} value={idx}>
                  Live Preview: {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save Version Button */}
          <Button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & Finalize Version
          </Button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Live Preview Variables Toolbar */}
      <Card className="border-[#E2E8F0] bg-[#F8FAFC] shadow-xs">
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-[#0F172A] block mb-1 flex items-center gap-1">
              <Edit3 className="h-3 w-3 text-[#2563EB]" />
              Live Preview Event Name:
            </label>
            <Input
              value={previewEventName}
              onChange={(e) => setPreviewEventName(e.target.value)}
              className="bg-white border-[#E2E8F0] h-8 text-xs font-semibold"
              placeholder="e.g. Viksit Bharat Hackathon 2026"
            />
          </div>

          <div>
            <label className="font-bold text-[#0F172A] block mb-1 flex items-center gap-1">
              <Edit3 className="h-3 w-3 text-[#2563EB]" />
              Live Preview Date:
            </label>
            <Input
              value={previewDate}
              onChange={(e) => setPreviewDate(e.target.value)}
              className="bg-white border-[#E2E8F0] h-8 text-xs font-semibold"
              placeholder="e.g. August 9, 2026"
            />
          </div>

          <div>
            <label className="font-bold text-[#0F172A] block mb-1 flex items-center gap-1">
              <Edit3 className="h-3 w-3 text-[#2563EB]" />
              Live Preview Org Name:
            </label>
            <Input
              value={previewOrgName}
              onChange={(e) => setPreviewOrgName(e.target.value)}
              className="bg-white border-[#E2E8F0] h-8 text-xs font-semibold"
              placeholder="e.g. Frontend Arena Organization"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Designer Grid (Left Palette | Center Canvas | Right Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PALETTE: Background Options, Tools, Elements */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upload Background Template (Option 1 vs Option 2) */}
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader className="pb-2 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-[#2563EB]" />
                Background Template Options
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3 text-xs">
              {layout.backgroundImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg border border-[#E2E8F0] overflow-hidden bg-slate-100 h-24">
                    <img src={layout.backgroundImage} alt="Background Template" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer py-1 px-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-bold text-center text-[#0F172A] hover:bg-slate-200">
                      Replace Background
                      <input type="file" accept="image/*" onChange={(e) => handleBackgroundUpload(e, "background_only")} className="hidden" />
                    </label>
                    <button
                      onClick={() => updateLayout((prev) => ({ ...prev, backgroundImage: undefined }))}
                      className="py-1 px-2 rounded-lg border border-red-200 bg-red-50 text-[10px] font-bold text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed border-[#2563EB]/40 rounded-xl bg-[#2563EB]/5 hover:bg-[#2563EB]/10 transition-colors">
                    <Sparkles className="h-5 w-5 text-[#2563EB] mb-1" />
                    <span className="text-xs font-bold text-[#2563EB]">Option 2: Create Editable Template</span>
                    <span className="text-[10px] text-[#64748B] text-center">Uploads background & auto-places 7 editable text overlay fields</span>
                    <input type="file" accept="image/*" onChange={(e) => handleBackgroundUpload(e, "create_template")} className="hidden" />
                  </label>

                  <label className="cursor-pointer flex flex-col items-center justify-center p-2.5 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0]/50 transition-colors">
                    <Upload className="h-4 w-4 text-[#475569] mb-1" />
                    <span className="text-xs font-semibold text-[#0F172A]">Option 1: Use as Background Only</span>
                    <input type="file" accept="image/*" onChange={(e) => handleBackgroundUpload(e, "background_only")} className="hidden" />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Elements Palette */}
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader className="pb-2 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-[#2563EB]" />
                Add Editable Text Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleAddElement("name", "Participant Name", "{{name}}")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left"
              >
                <Type className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
                <span>{"{{name}}"}</span>
              </button>

              <button
                onClick={() => handleAddElement("uniqueId", "Verification ID", "ID: {{uniqueId}}")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left"
              >
                <FileText className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
                <span>{"{{uniqueId}}"}</span>
              </button>

              <button
                onClick={() => handleAddElement("qrCode", "Dynamic QR Code")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-emerald-50 hover:border-emerald-500 text-[#0F172A] font-semibold text-left"
              >
                <QrCode className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => handleAddElement("eventName", "Event Name", "{{eventName}}")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left"
              >
                <Award className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                <span>{"{{eventName}}"}</span>
              </button>

              <button
                onClick={() => handleAddElement("date", "Issue Date", "Issued on: {{date}}")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left"
              >
                <Type className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span>{"{{date}}"}</span>
              </button>

              <button
                onClick={() => handleAddElement("description", "Description Box", "{{description}}")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left"
              >
                <FileText className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span>{"{{description}}"}</span>
              </button>

              <button
                onClick={() => handleAddElement("title", "Certificate Title", "CERTIFICATE OF EXCELLENCE")}
                className="flex items-center gap-1.5 p-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#2563EB]/10 hover:border-[#2563EB] text-[#0F172A] font-semibold text-left col-span-2"
              >
                <Type className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
                <span>+ Add Custom Text Box</span>
              </button>
            </CardContent>
          </Card>

          {/* Brand Assets (Add Multiple Logos & Signatures!) */}
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader className="pb-2 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-[#2563EB]" />
                Brand Assets (Multiple Logos)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 grid grid-cols-2 gap-2 text-xs">
              <label className="cursor-pointer flex flex-col items-center justify-center p-2.5 border border-dashed border-[#2563EB]/40 bg-[#2563EB]/5 rounded-xl hover:bg-[#2563EB]/10 transition-colors">
                <ImageIcon className="h-4 w-4 text-[#2563EB] mb-1" />
                <span className="text-[10px] font-bold text-[#2563EB]">+ Add Logo</span>
                <input type="file" accept="image/*" onChange={(e) => handleAddImageAsset(e, "logo")} className="hidden" />
              </label>

              <label className="cursor-pointer flex flex-col items-center justify-center p-2.5 border border-dashed border-[#D97706]/40 bg-amber-50/50 rounded-xl hover:bg-amber-100/50 transition-colors">
                <Award className="h-4 w-4 text-[#D97706] mb-1" />
                <span className="text-[10px] font-bold text-[#D97706]">+ Add Signature</span>
                <input type="file" accept="image/*" onChange={(e) => handleAddImageAsset(e, "signature")} className="hidden" />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* CENTER INTERACTIVE CANVAS: Drag, Double-Click Direct Typing, Resizable Text Boxes & QR Codes */}
        <div className="lg:col-span-6 space-y-3 flex flex-col items-center">
          <Card className="w-full border-[#E2E8F0] bg-slate-900 shadow-lg overflow-hidden flex flex-col items-center justify-center p-4 min-h-[520px]">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMoveCanvas}
              onMouseUp={handleMouseUpCanvas}
              onClick={() => {
                setSelectedElementId(null);
                handleFinishInlineEdit();
              }}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center center",
                transition: "transform 0.1s ease-out",
              }}
              className="relative w-[1000px] h-[700px] bg-white rounded-lg shadow-2xl overflow-hidden cursor-crosshair"
            >
              {/* Background Grid Pattern Overlay (if enabled) */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
              )}

              {/* Snap-to-center Guide Lines */}
              {snapX && (
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#FF006E] z-40 pointer-events-none shadow-sm" />
              )}
              {snapY && (
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#FF006E] z-40 pointer-events-none shadow-sm" />
              )}

              {/* Live Canvas Renderer */}
              <CertificateCanvasRenderer
                layout={layout}
                participantName={currentParticipant.name}
                uniqueId={currentParticipant.uniqueId}
                eventName={previewEventName}
                issueDate={previewDate}
                descriptionText={previewDescription}
                orgName={previewOrgName}
                width={1000}
                height={700}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Interactive Bounding Boxes & Selection Layers */}
              {layout.elements.map((el) => {
                if (!el.visible) return null;
                const isSelected = selectedElementId === el.id;
                const isEditing = editingElementId === el.id;
                const isImageOrQR = el.type === "logo" || el.type === "signature" || el.type === "qrCode";
                const boxWidthPx = el.width || (el.type === "qrCode" ? 100 : isImageOrQR ? 120 : 600);
                const boxHeightPx = el.height || (el.type === "qrCode" ? 100 : isImageOrQR ? 60 : 50);

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDownElement(e, el.id)}
                    onDoubleClick={(e) => handleDoubleClickElement(e, el.id)}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${boxWidthPx}px`,
                      height: `${boxHeightPx}px`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                      zIndex: (el.zIndex || 1) + 20,
                    }}
                    className={`absolute p-1 rounded cursor-move transition-all flex items-center justify-center ${
                      isSelected
                        ? "ring-2 ring-[#2563EB] ring-offset-2 ring-offset-white bg-[#2563EB]/10"
                        : "hover:ring-1 hover:ring-[#2563EB]/50"
                    }`}
                  >
                    {/* Inline Direct Canvas Text Editing Overlay */}
                    {isEditing ? (
                      <textarea
                        rows={3}
                        autoFocus
                        value={inlineEditText}
                        onChange={(e) => setInlineEditText(e.target.value)}
                        onBlur={handleFinishInlineEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleFinishInlineEdit();
                        }}
                        className="w-full bg-white border-2 border-[#2563EB] text-xs font-bold text-[#0F172A] p-2 rounded shadow-2xl focus:outline-none z-50 resize-y"
                      />
                    ) : (
                      isSelected && (
                        <>
                          {/* Selection Badge Header */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#2563EB] text-white text-[9px] font-bold whitespace-nowrap shadow-sm flex items-center gap-1 z-50 pointer-events-none">
                            {el.isLocked ? <Lock className="h-2.5 w-2.5" /> : <Move className="h-2.5 w-2.5" />}
                            {el.label} ({boxWidthPx}×{boxHeightPx}px)
                          </div>

                          {/* 4 Corner Interactive Resize Handles */}
                          <div
                            onMouseDown={(e) => handleMouseDownElement(e, el.id, "NW")}
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full cursor-nwse-resize z-50"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownElement(e, el.id, "NE")}
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full cursor-nesw-resize z-50"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownElement(e, el.id, "SW")}
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full cursor-nesw-resize z-50"
                          />
                          <div
                            onMouseDown={(e) => handleMouseDownElement(e, el.id, "SE")}
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#2563EB] rounded-full cursor-nwse-resize z-50"
                          />

                          {/* Left and Right Edge Handles for Text Container Width */}
                          {!isImageOrQR && (
                            <>
                              <div
                                onMouseDown={(e) => handleMouseDownElement(e, el.id, "W")}
                                className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-[#2563EB] rounded cursor-ew-resize flex items-center justify-center z-50 hover:bg-[#2563EB] hover:text-white"
                                title="Drag to resize text box width"
                              >
                                <span className="text-[8px] font-bold">│</span>
                              </div>

                              <div
                                onMouseDown={(e) => handleMouseDownElement(e, el.id, "E")}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-white border-2 border-[#2563EB] rounded cursor-ew-resize flex items-center justify-center z-50 hover:bg-[#2563EB] hover:text-white"
                                title="Drag to resize text box width"
                              >
                                <span className="text-[8px] font-bold">│</span>
                              </div>
                            </>
                          )}
                        </>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Boundary Out-of-Bounds Warning Badge */}
          {isOutOfBounds && (
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Warning: Selected element is near or outside the printable canvas boundary!</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-4">
            <span>💡 Add as many logos as needed (Sponsors, Partners, Org)</span>
            <span>• Drag to move</span>
            <span>• Corner handles to resize</span>
          </div>
        </div>

        {/* RIGHT INSPECTOR: Properties & Layer Stack */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            {/* Inspector Tabs */}
            <div className="flex border-b border-[#E2E8F0]">
              <button
                onClick={() => setActiveRightTab("properties")}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === "properties"
                    ? "border-b-2 border-[#2563EB] text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Properties
              </button>
              <button
                onClick={() => setActiveRightTab("layers")}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === "layers"
                    ? "border-b-2 border-[#2563EB] text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Layers ({layout.elements.length})
              </button>
            </div>

            <CardContent className="p-4 text-xs space-y-4">
              {activeRightTab === "properties" ? (
                selectedElement ? (
                  <div className="space-y-4">
                    {/* Header Action Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-[#0F172A] truncate">{selectedElement.label}</span>
                        {selectedElement.type !== "customText" && selectedElement.type !== "title" && (
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-[#2563EB]/10 text-[#2563EB]">
                            {selectedElement.type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateElement(selectedElement.id, { isLocked: !selectedElement.isLocked })}
                          className={`p-1.5 rounded-lg border text-xs ${
                            selectedElement.isLocked
                              ? "bg-amber-50 border-amber-300 text-amber-700 font-bold"
                              : "border-[#E2E8F0] text-[#475569]"
                          }`}
                          title="Lock element positioning"
                        >
                          {selectedElement.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDuplicateElement(selectedElement.id)}
                          className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
                          title="Duplicate Element"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveElement(selectedElement.id)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete Element"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image / Logo / Signature Specific Controls */}
                    {(selectedElement.type === "logo" || selectedElement.type === "signature") && (
                      <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                        <label className="font-bold text-[#0F172A] block uppercase tracking-wider text-[10px]">
                          {selectedElement.label} Image
                        </label>
                        {selectedElement.dataUrl ? (
                          <div className="space-y-2">
                            <div className="h-20 w-full rounded border border-[#E2E8F0] bg-white p-1 flex items-center justify-center overflow-hidden">
                              <img src={selectedElement.dataUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                            <label className="cursor-pointer block w-full py-1 text-center bg-white border border-[#E2E8F0] rounded font-semibold text-[10px] hover:bg-slate-100">
                              Replace Image
                              <input type="file" accept="image/*" onChange={(e) => handleReplaceSelectedImage(e, selectedElement.id)} className="hidden" />
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer block w-full p-3 border border-dashed border-[#2563EB] rounded-xl text-center bg-white hover:bg-blue-50">
                            <Upload className="h-4 w-4 text-[#2563EB] mx-auto mb-1" />
                            <span className="font-bold text-[#2563EB] text-xs">Upload Image</span>
                            <input type="file" accept="image/*" onChange={(e) => handleReplaceSelectedImage(e, selectedElement.id)} className="hidden" />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Text Value */}
                    {selectedElement.type !== "logo" &&
                      selectedElement.type !== "signature" &&
                      selectedElement.type !== "qrCode" && (
                        <div>
                          <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                            Text / Variable Pattern
                          </label>
                          {selectedElement.type === "description" || (selectedElement.text && selectedElement.text.length > 50) ? (
                            <textarea
                              rows={3}
                              value={selectedElement.text || ""}
                              onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                              className="w-full bg-white border-[#E2E8F0] rounded-md p-2 text-xs font-mono border focus:outline-none focus:border-[#2563EB]"
                            />
                          ) : (
                            <Input
                              value={selectedElement.text || ""}
                              onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                              className="bg-white border-[#E2E8F0] text-xs font-mono"
                            />
                          )}
                        </div>
                      )}

                    {/* Width & Height Sliders */}
                    <div>
                      <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                        <span>Width</span>
                        <span className="font-bold text-[#2563EB]">{selectedElement.width || 100}px</span>
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="950"
                        value={selectedElement.width || 100}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    {(selectedElement.type === "logo" || selectedElement.type === "signature" || selectedElement.type === "qrCode") && (
                      <div>
                        <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                          <span>Height</span>
                          <span className="font-bold text-[#2563EB]">{selectedElement.height || 60}px</span>
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="400"
                          value={selectedElement.height || 60}
                          onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                          className="w-full accent-[#2563EB]"
                        />
                      </div>
                    )}

                    {/* Font Family & Size */}
                    {selectedElement.type !== "logo" &&
                      selectedElement.type !== "signature" &&
                      selectedElement.type !== "qrCode" && (
                        <>
                          <div>
                            <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                              Font Family
                            </label>
                            <select
                              value={selectedElement.fontFamily}
                              onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                              className="w-full h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs font-semibold text-[#0F172A]"
                            >
                              {FONT_FAMILIES.map((f) => (
                                <option key={f.value} value={f.value}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                                Size ({selectedElement.fontSize}px)
                              </label>
                              <input
                                type="range"
                                min="10"
                                max="90"
                                value={selectedElement.fontSize}
                                onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                                className="w-full accent-[#2563EB]"
                              />
                            </div>

                            <div>
                              <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                                Color
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={selectedElement.color}
                                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                  className="h-7 w-10 rounded border border-[#E2E8F0] cursor-pointer"
                                />
                                <span className="font-mono text-[11px] font-bold">{selectedElement.color}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                    {/* Rotation */}
                    <div>
                      <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                        <span>Rotation</span>
                        <span className="font-bold text-[#2563EB]">{selectedElement.rotation || 0}°</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedElement.rotation || 0}
                        onChange={(e) => updateElement(selectedElement.id, { rotation: Number(e.target.value) })}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    {/* X & Y Positioning Sliders */}
                    <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                      <div>
                        <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                          <span>Horizontal Position (X)</span>
                          <span className="font-bold text-[#2563EB]">{selectedElement.x}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedElement.x}
                          onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                          className="w-full accent-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                          <span>Vertical Position (Y)</span>
                          <span className="font-bold text-[#2563EB]">{selectedElement.y}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedElement.y}
                          onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                          className="w-full accent-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-[#94A3B8] space-y-2">
                    <Sliders className="h-8 w-8 mx-auto stroke-1 opacity-50" />
                    <p className="text-xs font-semibold">Select an element on canvas to inspect properties.</p>
                  </div>
                )
              ) : (
                /* TAB 2: LAYER STACK MANAGER */
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                    Layer Order (Top to Bottom)
                  </div>
                  {[...layout.elements]
                    .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                    .map((el) => (
                      <div
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer ${
                          selectedElementId === el.id
                            ? "bg-[#2563EB]/10 border-[#2563EB] font-bold text-[#2563EB]"
                            : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {el.type === "logo" || el.type === "signature" ? (
                            <ImageIcon className="h-3.5 w-3.5 text-[#2563EB] shrink-0" />
                          ) : el.type === "qrCode" ? (
                            <QrCode className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Type className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                          )}
                          <span className="truncate">{el.label}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerMove(el.id, "up");
                            }}
                            className="p-1 rounded hover:bg-slate-200"
                            title="Bring Forward"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLayerMove(el.id, "down");
                            }}
                            className="p-1 rounded hover:bg-slate-200"
                            title="Send Backward"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
