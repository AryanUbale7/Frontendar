"use client";

import React, { useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { CertificateLayout, CanvasElement } from "./types";

interface CertificateCanvasRendererProps {
  layout: CertificateLayout;
  participantName?: string;
  uniqueId?: string;
  eventName?: string;
  issueDate?: string;
  descriptionText?: string;
  orgName?: string;
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
  descriptionText = "For outstanding performance, dedication, and technical excellence in the development of Project Viksit Bharat 2026 National-Level Innovation Hackathon.",
  orgName = "Frontend Arena Organization",
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

    // 1. Fill Solid Background Color
    ctx.fillStyle = layout.backgroundColor || "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Background Template Image (if uploaded)
    if (layout.backgroundImage) {
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.src = layout.backgroundImage;
        await new Promise((resolve) => {
          bgImg.onload = resolve;
          bgImg.onerror = resolve;
        });

        ctx.save();
        ctx.globalAlpha = layout.backgroundImageOpacity ?? 1;
        ctx.drawImage(bgImg, 0, 0, width, height);
        ctx.restore();
      } catch (e) {
        console.error("Error drawing certificate background image:", e);
      }
    }

    // 3. Draw Decorative Frames & Borders (if enabled)
    const borderWidth = (layout.borderWidth || 8) * Math.min(scaleX, scaleY);
    const borderColor = layout.borderColor || "#2563EB";

    if (layout.showFrame && layout.frameStyle !== "none") {
      ctx.save();
      if (layout.frameStyle === "classic") {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(15 * scaleX, 15 * scaleY, width - 30 * scaleX, height - 30 * scaleY);

        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = Math.max(1, borderWidth / 4);
        ctx.strokeRect(22 * scaleX, 22 * scaleY, width - 44 * scaleX, height - 44 * scaleY);

        const cornerSize = 25 * scaleX;
        ctx.fillStyle = borderColor;
        ctx.fillRect(15 * scaleX, 15 * scaleY, cornerSize, cornerSize);
        ctx.fillRect(width - 15 * scaleX - cornerSize, 15 * scaleY, cornerSize, cornerSize);
        ctx.fillRect(15 * scaleX, height - 15 * scaleY - cornerSize, cornerSize, cornerSize);
        ctx.fillRect(width - 15 * scaleX - cornerSize, height - 15 * scaleY - cornerSize, cornerSize, cornerSize);
      } else if (layout.frameStyle === "dark") {
        ctx.strokeStyle = "#06B6D4";
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(12 * scaleX, 12 * scaleY, width - 24 * scaleX, height - 24 * scaleY);

        ctx.strokeStyle = "#FF006E";
        ctx.lineWidth = Math.max(1, borderWidth / 3);
        ctx.strokeRect(20 * scaleX, 20 * scaleY, width - 40 * scaleX, height - 40 * scaleY);
      } else if (layout.frameStyle === "minimal") {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = Math.max(2, borderWidth / 2);
        ctx.strokeRect(10 * scaleX, 10 * scaleY, width - 20 * scaleX, height - 20 * scaleY);
      } else {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(15 * scaleX, 15 * scaleY, width - 30 * scaleX, height - 30 * scaleY);
      }
      ctx.restore();
    }

    // 4. Sort Elements by zIndex
    const sortedElements = [...(layout.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 5. Render Canvas Elements
    for (const elem of sortedElements) {
      if (!elem.visible) continue;

      const posX = (elem.x / 100) * width;
      const posY = (elem.y / 100) * height;

      ctx.save();
      ctx.globalAlpha = elem.opacity ?? 1;

      // Handle Rotation
      if (elem.rotation) {
        ctx.translate(posX, posY);
        ctx.rotate((elem.rotation * Math.PI) / 180);
        ctx.translate(-posX, -posY);
      }

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
        else if (elem.type === "description") textContent = descriptionText;
        else if (elem.type === "orgName") textContent = orgName;

        // Perform dynamic template variable replacements
        textContent = textContent
          .replace(/\{\{name\}\}/gi, participantName)
          .replace(/\{\{uniqueId\}\}/gi, uniqueId)
          .replace(/\{\{eventName\}\}/gi, eventName)
          .replace(/\{\{date\}\}/gi, issueDate)
          .replace(/\{\{description\}\}/gi, descriptionText)
          .replace(/\{\{organizationName\}\}/gi, orgName)
          .replace(/\{\{orgName\}\}/gi, orgName);

        // Text Transformation
        if (elem.textTransform === "uppercase") textContent = textContent.toUpperCase();
        else if (elem.textTransform === "lowercase") textContent = textContent.toLowerCase();
        else if (elem.textTransform === "capitalize") {
          textContent = textContent.replace(/\b\w/g, (l) => l.toUpperCase());
        }

        let scaledFontSize = Math.round((elem.fontSize || 16) * scaleY);
        const fontStyle = elem.fontStyle || "normal";
        const fontWeight = elem.fontWeight || (fontStyle.includes("bold") ? "bold" : "normal");
        const fontFamily = elem.fontFamily || "Inter, sans-serif";

        ctx.font = `${fontStyle.includes("italic") ? "italic" : ""} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
        ctx.fillStyle = elem.color || "#0F172A";
        ctx.textAlign = elem.align || "center";
        ctx.textBaseline = "middle";

        // Calculated Text Container Width (defaults to 70% of canvas if unspecified)
        const boxWidth = ((elem.width || 700) / 1000) * width;

        // Auto-Fit font size scaling for names & single-line text
        if (elem.autoFitText && textContent.length > 0 && boxWidth > 20) {
          while (scaledFontSize > 10 && ctx.measureText(textContent).width > boxWidth) {
            scaledFontSize -= 1;
            ctx.font = `${fontStyle.includes("italic") ? "italic" : ""} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
          }
        }

        // Multi-line Word Wrapping Engine
        const rawParagraphs = textContent.split("\n");
        const lines: string[] = [];

        for (const para of rawParagraphs) {
          if (!para.trim()) {
            lines.push("");
            continue;
          }

          const words = para.split(" ");
          let currentLine = "";

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > boxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
        }

        const lineHeightMultiplier = elem.lineHeight || 1.35;
        const lineHeight = scaledFontSize * lineHeightMultiplier;
        const totalHeight = lines.length * lineHeight;

        let startY = posY;
        const vAlign = elem.verticalAlign || "center";
        if (vAlign === "center") {
          startY = posY - totalHeight / 2 + lineHeight / 2;
        } else if (vAlign === "bottom") {
          startY = posY - totalHeight + lineHeight / 2;
        } else {
          startY = posY + lineHeight / 2;
        }

        lines.forEach((lineStr, lineIdx) => {
          ctx.fillText(lineStr, posX, startY + lineIdx * lineHeight);
        });
      }

      ctx.restore();
    }

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [layout, participantName, uniqueId, eventName, issueDate, descriptionText, orgName, width, height, onCanvasReady]);

  useEffect(() => {
    drawCertificate();
  }, [drawCertificate]);

  return <canvas ref={canvasRef} className={className} />;
}

/** Helper function to download canvas content as PNG */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Helper function to download canvas content as crisp high-res PDF */
export function downloadCertificateAsPdf(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/png", 1.0);

  // Open printable window for PDF output
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the certificate PDF.");
    return;
  }

  const cleanFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${cleanFilename}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #ffffff;
          }
          img {
            width: 100vw;
            height: 100vh;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 500);" />
      </body>
    </html>
  `);
  printWindow.document.close();
}
