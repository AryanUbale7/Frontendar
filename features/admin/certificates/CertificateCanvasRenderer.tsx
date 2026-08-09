"use client";

import React, { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { CertificateLayout } from "./types";

interface CertificateCanvasRendererProps {
  layout: CertificateLayout;
  participantName?: string;
  uniqueId?: string;
  eventName?: string;
  issueDate?: string;
  width?: number;
  height?: number;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function CertificateCanvasRenderer({
  layout,
  participantName = "Aryan Ubale",
  uniqueId = "FA-8K29XQ71",
  eventName = "Frontend Arena Hackathon 2026",
  issueDate = "August 9, 2026",
  width = 1000,
  height = 700,
  className = "w-full h-auto shadow-md rounded-lg border border-[#E2E8F0]",
  onCanvasReady,
}: CertificateCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawCertificate = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const scaleX = width / (layout.width || 1000);
    const scaleY = height / (layout.height || 700);

    // 1. Draw Background
    ctx.fillStyle = layout.backgroundColor || "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Decorative Frames & Borders
    const borderWidth = (layout.borderWidth || 8) * Math.min(scaleX, scaleY);
    const borderColor = layout.borderColor || "#2563EB";

    if (layout.showFrame !== false) {
      if (layout.frameStyle === "classic") {
        // Outer border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(15 * scaleX, 15 * scaleY, width - 30 * scaleX, height - 30 * scaleY);

        // Inner gold/thin line
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = Math.max(1, borderWidth / 4);
        ctx.strokeRect(22 * scaleX, 22 * scaleY, width - 44 * scaleX, height - 44 * scaleY);

        // Corner accents
        const cornerSize = 25 * scaleX;
        ctx.fillStyle = borderColor;
        // Top-left
        ctx.fillRect(15 * scaleX, 15 * scaleY, cornerSize, cornerSize);
        // Top-right
        ctx.fillRect(width - 15 * scaleX - cornerSize, 15 * scaleY, cornerSize, cornerSize);
        // Bottom-left
        ctx.fillRect(15 * scaleX, height - 15 * scaleY - cornerSize, cornerSize, cornerSize);
        // Bottom-right
        ctx.fillRect(width - 15 * scaleX - cornerSize, height - 15 * scaleY - cornerSize, cornerSize, cornerSize);
      } else if (layout.frameStyle === "dark") {
        // Cyberpunk / Dark frame
        ctx.strokeStyle = "#06B6D4";
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(12 * scaleX, 12 * scaleY, width - 24 * scaleX, height - 24 * scaleY);

        ctx.strokeStyle = "#FF006E";
        ctx.lineWidth = Math.max(1, borderWidth / 3);
        ctx.strokeRect(20 * scaleX, 20 * scaleY, width - 40 * scaleX, height - 40 * scaleY);
      } else if (layout.frameStyle === "minimal") {
        // Minimal subtle border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = Math.max(2, borderWidth / 2);
        ctx.strokeRect(10 * scaleX, 10 * scaleY, width - 20 * scaleX, height - 20 * scaleY);
      } else {
        // Modern Frame
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(15 * scaleX, 15 * scaleY, width - 30 * scaleX, height - 30 * scaleY);
      }
    }

    // 3. Render Elements
    const elements = layout.elements || [];

    for (const elem of elements) {
      if (!elem.visible) continue;

      const posX = (elem.x / 100) * width;
      const posY = (elem.y / 100) * height;

      if (elem.type === "logo" || elem.type === "signature") {
        if (elem.dataUrl) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = elem.dataUrl;
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });

            const imgW = (elem.width || 120) * scaleX;
            const imgH = (elem.height || 60) * scaleY;
            let drawX = posX;
            if (elem.align === "center") drawX = posX - imgW / 2;
            else if (elem.align === "right") drawX = posX - imgW;

            ctx.drawImage(img, drawX, posY, imgW, imgH);
          } catch (e) {
            console.error("Error drawing image element:", e);
          }
        }
      } else if (elem.type === "qrCode") {
        try {
          const verifyUrl = `https://frontendarena.online/verify/${uniqueId}`;
          const qrCanvas = document.createElement("canvas");
          const qrSize = (elem.width || 100) * scaleX;
          await QRCode.toCanvas(qrCanvas, verifyUrl, {
            width: qrSize,
            margin: 1,
            color: { dark: elem.color || "#0F172A", light: "#FFFFFF" },
          });

          let drawX = posX;
          if (elem.align === "center") drawX = posX - qrSize / 2;
          else if (elem.align === "right") drawX = posX - qrSize;

          ctx.drawImage(qrCanvas, drawX, posY, qrSize, qrSize);
        } catch (e) {
          console.error("Error drawing QR element:", e);
        }
      } else {
        // Text Elements
        let textContent = elem.text || "";
        if (elem.type === "name") textContent = participantName;
        else if (elem.type === "uniqueId") textContent = `ID: ${uniqueId}`;
        else if (elem.type === "eventName") textContent = eventName;
        else if (elem.type === "date") textContent = issueDate;

        // Perform dynamic template replacement
        textContent = textContent
          .replace(/\{\{name\}\}/gi, participantName)
          .replace(/\{\{uniqueId\}\}/gi, uniqueId)
          .replace(/\{\{eventName\}\}/gi, eventName)
          .replace(/\{\{date\}\}/gi, issueDate);

        const scaledFontSize = Math.round((elem.fontSize || 16) * scaleY);
        const fontStyle = elem.fontStyle || "normal";
        const fontFamily = elem.fontFamily || "Inter, sans-serif";

        ctx.font = `${fontStyle} ${scaledFontSize}px ${fontFamily}`;
        ctx.fillStyle = elem.color || "#0F172A";
        ctx.textAlign = elem.align || "center";
        ctx.textBaseline = "middle";

        ctx.fillText(textContent, posX, posY);
      }
    }

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [layout, participantName, uniqueId, eventName, issueDate, width, height, onCanvasReady]);

  useEffect(() => {
    drawCertificate();
  }, [drawCertificate]);

  return <canvas ref={canvasRef} className={className} />;
}

/** Helper function to download canvas content as PNG */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Helper function to export canvas as PNG data URL */
export function exportCanvasAsPng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png", 1.0);
}
