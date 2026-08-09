"use client";

import React, { useState } from "react";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  RefreshCw,
  QrCode,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CertificateCanvasRenderer } from "./CertificateCanvasRenderer";
import { CertificateLayout, CanvasElement } from "./types";
import { PRESET_TEMPLATES } from "./presets";

interface CertificateEditorProps {
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

export function CertificateEditor({ initialLayout, initialTitle = "Hackathon Certificate Template", onSaveSuccess }: CertificateEditorProps) {
  const [templateTitle, setTemplateTitle] = useState(initialTitle);
  const [templateDescription, setTemplateDescription] = useState("Customizable certificate template for hackathon participants.");
  const [layout, setLayout] = useState<CertificateLayout>(initialLayout || PRESET_TEMPLATES[0].layout);
  const [selectedElementId, setSelectedElementId] = useState<string>("el-name");
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sample live preview dynamic bindings
  const [previewName, setPreviewName] = useState("Aryan Ubale");
  const [previewEventName, setPreviewEventName] = useState("Frontend Arena Hackathon 2026");
  const [previewDate, setPreviewDate] = useState("August 9, 2026");

  const selectedElement = layout.elements.find((el) => el.id === selectedElementId);

  const updateElement = (id: string, fields: Partial<CanvasElement>) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...fields } : el)),
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (preset) {
      setLayout(JSON.parse(JSON.stringify(preset.layout)));
      setTemplateTitle(preset.name);
      setTemplateDescription(preset.description);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, elementType: "logo" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const existing = layout.elements.find((el) => el.type === elementType);
        if (existing) {
          updateElement(existing.id, { dataUrl, visible: true });
        } else {
          const newEl: CanvasElement = {
            id: `el-${elementType}-${Date.now()}`,
            type: elementType,
            label: elementType === "logo" ? "Organization Logo" : "Official Signature",
            x: elementType === "logo" ? 50 : 25,
            y: elementType === "logo" ? 10 : 75,
            fontSize: 14,
            fontFamily: "Inter",
            color: "#0F172A",
            align: "center",
            width: elementType === "logo" ? 100 : 120,
            height: elementType === "logo" ? 60 : 50,
            visible: true,
            dataUrl,
          };
          setLayout((prev) => ({ ...prev, elements: [...prev.elements, newEl] }));
          setSelectedElementId(newEl.id);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      alert("Please provide a template title.");
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
          layout,
        }),
      });

      if (res.ok) {
        setSaveToast("Certificate template saved successfully!");
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
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="solid" className="bg-[#2563EB] text-white font-bold">
              Visual Certificate Designer
            </Badge>
            <span className="text-xs text-[#64748B] font-medium">Live Canvas Positioning</span>
          </div>
          <Input
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
            className="text-xl font-bold border-none px-0 h-auto focus-visible:ring-0 text-[#0F172A]"
            placeholder="Template Title..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center gap-2"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Certificate Template
          </Button>
        </div>
      </div>

      {saveToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Preset Selector */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex items-center gap-4 overflow-x-auto">
        <span className="text-xs font-bold text-[#0F172A] whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#2563EB]" />
          Presets:
        </span>
        <div className="flex items-center gap-2">
          {PRESET_TEMPLATES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id)}
              className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] hover:border-[#2563EB] transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Element Controls & Properties */}
        <div className="lg:col-span-5 space-y-6">
          {/* Elements List */}
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#2563EB]" />
                Template Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {layout.elements.map((el) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                    selectedElementId === el.id
                      ? "bg-[#2563EB]/10 border-[#2563EB] font-bold text-[#2563EB]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]/50"
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateElement(el.id, { visible: !el.visible });
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        el.visible ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {el.visible ? "Visible" : "Hidden"}
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Element Property Inspector */}
          {selectedElement && (
            <Card className="border-[#E2E8F0] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E2E8F0]">
                <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#2563EB]" />
                  Inspector: {selectedElement.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Text Content (if applicable) */}
                {selectedElement.type !== "logo" && selectedElement.type !== "signature" && selectedElement.type !== "qrCode" && (
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                      Text Value / Pattern
                    </label>
                    <Input
                      value={selectedElement.text || ""}
                      onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                      className="bg-white border-[#E2E8F0] text-xs"
                      placeholder="Enter text or {{variable}}..."
                    />
                  </div>
                )}

                {/* Font Family & Size */}
                {selectedElement.type !== "logo" && selectedElement.type !== "signature" && selectedElement.type !== "qrCode" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                        Font Family
                      </label>
                      <select
                        value={selectedElement.fontFamily}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full h-9 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs font-medium text-[#0F172A]"
                      >
                        {FONT_FAMILIES.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                        Font Size ({selectedElement.fontSize}px)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>
                  </div>
                )}

                {/* Alignment & Text Color */}
                {selectedElement.type !== "logo" && selectedElement.type !== "signature" && selectedElement.type !== "qrCode" && (
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                        Text Align
                      </label>
                      <div className="flex border border-[#E2E8F0] rounded-lg overflow-hidden">
                        {(["left", "center", "right"] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => updateElement(selectedElement.id, { align })}
                            className={`flex-1 py-1.5 flex justify-center items-center text-xs ${
                              selectedElement.align === align ? "bg-[#2563EB] text-white font-bold" : "bg-white text-[#475569]"
                            }`}
                          >
                            {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                            {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                            {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[#0F172A] block mb-1 uppercase tracking-wider">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedElement.color}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          className="h-8 w-12 rounded cursor-pointer border border-[#E2E8F0]"
                        />
                        <span className="font-mono text-xs font-bold text-[#0F172A]">{selectedElement.color}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* X & Y Positioning Sliders */}
                <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                      <span>Horizontal Position (X)</span>
                      <span className="font-bold text-[#2563EB]">{selectedElement.x}%</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="95"
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
                      min="5"
                      max="95"
                      value={selectedElement.y}
                      onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                      className="w-full accent-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Resizing Image / QR Code */}
                {(selectedElement.type === "logo" || selectedElement.type === "signature" || selectedElement.type === "qrCode") && (
                  <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                    <div>
                      <label className="font-semibold text-[#0F172A] flex justify-between mb-1 uppercase tracking-wider">
                        <span>Element Width</span>
                        <span className="font-bold text-[#2563EB]">{selectedElement.width || 100}px</span>
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="250"
                        value={selectedElement.width || 100}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upload Logo & Signature Buttons */}
          <Card className="border-[#E2E8F0] bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Upload className="h-4 w-4 text-[#2563EB]" />
                Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#0F172A] block mb-1 uppercase">Org Logo</label>
                <label className="cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0]/50 transition-colors">
                  <ImageIcon className="h-5 w-5 text-[#2563EB] mb-1" />
                  <span className="text-[10px] font-semibold text-[#475569]">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0F172A] block mb-1 uppercase">Signature</label>
                <label className="cursor-pointer flex flex-col items-center justify-center p-3 border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0]/50 transition-colors">
                  <Award className="h-5 w-5 text-[#D97706] mb-1" />
                  <span className="text-[10px] font-semibold text-[#475569]">Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "signature")}
                    className="hidden"
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Visual Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#2563EB]" />
                  Live Certificate Canvas Preview
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Real-time preview of the rendered certificate with dynamic field replacement.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[420px]">
              <CertificateCanvasRenderer
                layout={layout}
                participantName={previewName}
                eventName={previewEventName}
                issueDate={previewDate}
                uniqueId="FA-8K29XQ71"
              />
            </CardContent>
          </Card>

          {/* Test Sample Inputs */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#0F172A] uppercase block mb-1">
                Preview Participant Name
              </label>
              <Input
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                className="text-xs bg-white border-[#E2E8F0]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#0F172A] uppercase block mb-1">
                Preview Event Name
              </label>
              <Input
                value={previewEventName}
                onChange={(e) => setPreviewEventName(e.target.value)}
                className="text-xs bg-white border-[#E2E8F0]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#0F172A] uppercase block mb-1">
                Preview Issue Date
              </label>
              <Input
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="text-xs bg-white border-[#E2E8F0]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
