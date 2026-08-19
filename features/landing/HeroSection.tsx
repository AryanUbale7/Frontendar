"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Vertex 3D projection utility
interface Point3D {
  x: number;
  y: number;
  z: number;
}

function projectVertex(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  centerX: number,
  centerY: number,
  focalLength: number
) {
  // Rotate around Y-axis (yaw)
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);

  // Rotate around X-axis (pitch)
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);

  const scale = focalLength / (focalLength + z2);
  return {
    xProj: centerX + x1 * scale,
    yProj: centerY + y2 * scale,
    zDepth: z2,
    scale,
  };
}

function Arena3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          setDimensions({
            width: parent.clientWidth,
            height: parent.clientHeight,
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Render configuration
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Setup orbiting badges configuration
    const badges = [
      { label: "REACT", orbitRadius: 130, speed: 0.015, color: "#06B6D4", shadow: "rgba(6, 182, 212, 0.3)", border: "rgba(6, 182, 212, 0.2)", angle: 0, floatFreq: 0.03 },
      { label: "JS", orbitRadius: 155, speed: 0.01, color: "#EAB308", shadow: "rgba(234, 179, 8, 0.3)", border: "rgba(234, 179, 8, 0.2)", angle: 1.2, floatFreq: 0.02 },
      { label: "CSS", orbitRadius: 110, speed: -0.018, color: "#3B82F6", shadow: "rgba(59, 130, 246, 0.3)", border: "rgba(59, 130, 246, 0.2)", angle: 2.5, floatFreq: 0.035 },
      { label: "GIT", orbitRadius: 165, speed: 0.008, color: "#F97316", shadow: "rgba(249, 115, 22, 0.3)", border: "rgba(249, 115, 22, 0.2)", angle: 3.8, floatFreq: 0.015 },
      { label: "</>", orbitRadius: 120, speed: -0.012, color: "#FF006E", shadow: "rgba(255, 0, 110, 0.3)", border: "rgba(255, 0, 110, 0.2)", angle: 4.7, floatFreq: 0.025 },
      { label: "{ }", orbitRadius: 140, speed: 0.013, color: "#8B5CF6", shadow: "rgba(139, 92, 246, 0.3)", border: "rgba(139, 92, 246, 0.2)", angle: 5.5, floatFreq: 0.028 }
    ];

    const mobileBadges = badges.slice(0, 3); // Reduce complexity on mobile

    const drawBadge = (
      label: string,
      px: number,
      py: number,
      scale: number,
      color: string,
      shadowColor: string,
      borderColor: string
    ) => {
      const baseWidth = 75;
      const baseHeight = 32;
      const w = baseWidth * scale;
      const h = baseHeight * scale;
      const r = 10 * scale;

      ctx.save();
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 12 * scale;

      // Draw glass card body
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(px - w / 2, py - h / 2, w, h, r);
      } else {
        ctx.rect(px - w / 2, py - h / 2, w, h);
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fill();

      // Card border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Bullet dot
      ctx.beginPath();
      ctx.arc(px - w / 2 + 12 * scale, py, 3.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Text label
      ctx.font = `bold ${Math.max(8, Math.round(11 * scale))}px system-ui, sans-serif`;
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px - w / 2 + 20 * scale, py + 0.5);

      ctx.restore();
    };

    const drawPlatform = (
      cameraYaw: number,
      cameraPitch: number,
      centerX: number,
      centerY: number,
      focalLength: number,
      scaleFactor: number
    ) => {
      // 1. Perspective Grid (Floor)
      ctx.strokeStyle = "rgba(15, 23, 42, 0.015)";
      ctx.lineWidth = 1;
      const size = 300 * scaleFactor;
      const step = 45 * scaleFactor;
      const yFloor = 50 * scaleFactor;

      for (let z = -size; z <= size; z += step) {
        ctx.beginPath();
        const p1 = projectVertex(-size, yFloor, z, cameraYaw, cameraPitch, centerX, centerY, focalLength);
        const p2 = projectVertex(size, yFloor, z, cameraYaw, cameraPitch, centerX, centerY, focalLength);
        ctx.moveTo(p1.xProj, p1.yProj);
        ctx.lineTo(p2.xProj, p2.yProj);
        ctx.stroke();
      }

      for (let x = -size; x <= size; x += step) {
        ctx.beginPath();
        const p1 = projectVertex(x, yFloor, -size, cameraYaw, cameraPitch, centerX, centerY, focalLength);
        const p2 = projectVertex(x, yFloor, size, cameraYaw, cameraPitch, centerX, centerY, focalLength);
        ctx.moveTo(p1.xProj, p1.yProj);
        ctx.lineTo(p2.xProj, p2.yProj);
        ctx.stroke();
      }

      // 2. Concentric Arena Rings
      const ringRadii = [60, 120, 185];
      ctx.strokeStyle = "rgba(15, 23, 42, 0.03)";
      ctx.lineWidth = 1.5;

      ringRadii.forEach((r) => {
        ctx.beginPath();
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const x = r * Math.cos(angle) * scaleFactor;
          const z = r * Math.sin(angle) * scaleFactor;
          const y = 0;

          const { xProj, yProj } = projectVertex(x, y, z, cameraYaw, cameraPitch, centerX, centerY, focalLength);

          if (i === 0) ctx.moveTo(xProj, yProj);
          else ctx.lineTo(xProj, yProj);
        }
        ctx.stroke();
      });

      // 3. Radial Arena Guidelines
      ctx.beginPath();
      const radialCount = 12;
      const maxR = 185 * scaleFactor;
      for (let i = 0; i < radialCount; i++) {
        const angle = (i / radialCount) * Math.PI * 2;
        const x = maxR * Math.cos(angle);
        const z = maxR * Math.sin(angle);

        const p1 = projectVertex(0, 0, 0, cameraYaw, cameraPitch, centerX, centerY, focalLength);
        const p2 = projectVertex(x, 0, z, cameraYaw, cameraPitch, centerX, centerY, focalLength);

        ctx.moveTo(p1.xProj, p1.yProj);
        ctx.lineTo(p2.xProj, p2.yProj);
      }
      ctx.strokeStyle = "rgba(15, 23, 42, 0.02)";
      ctx.stroke();
    };

    const drawCentralSymbol = (
      yOffset: number,
      cameraYaw: number,
      cameraPitch: number,
      centerX: number,
      centerY: number,
      focalLength: number,
      scaleFactor: number
    ) => {
      // 3D coordinates for wireframe coder tag </>. 
      // Structuring two parallel path loops (Z=-5 and Z=5) connected by wireframe lines.
      const leftBracket = [
        { x: -30, y: -15, z: -5 },
        { x: -45, y: 0, z: -5 },
        { x: -30, y: 15, z: -5 },
        { x: -30, y: -15, z: 5 },
        { x: -45, y: 0, z: 5 },
        { x: -30, y: 15, z: 5 },
      ];

      const middleSlash = [
        { x: -6, y: 22, z: -5 },
        { x: 6, y: -22, z: -5 },
        { x: -6, y: 22, z: 5 },
        { x: 6, y: -22, z: 5 },
      ];

      const rightBracket = [
        { x: 30, y: -15, z: -5 },
        { x: 45, y: 0, z: -5 },
        { x: 30, y: 15, z: -5 },
        { x: 30, y: -15, z: 5 },
        { x: 45, y: 0, z: 5 },
        { x: 30, y: 15, z: 5 },
      ];

      const drawSymbolPart = (vertices: Point3D[], color: string, connectingColor: string) => {
        const projected = vertices.map((v) =>
          projectVertex(
            v.x * scaleFactor,
            (v.y + yOffset) * scaleFactor,
            v.z * scaleFactor,
            cameraYaw,
            cameraPitch,
            centerX,
            centerY,
            focalLength
          )
        );

        const half = projected.length / 2;

        // Draw structural connection depth lines
        ctx.strokeStyle = connectingColor;
        ctx.lineWidth = 1;
        for (let i = 0; i < half; i++) {
          ctx.beginPath();
          ctx.moveTo(projected[i].xProj, projected[i].yProj);
          ctx.lineTo(projected[i + half].xProj, projected[i + half].yProj);
          ctx.stroke();
        }

        // Draw Front Path
        ctx.beginPath();
        ctx.moveTo(projected[0].xProj, projected[0].yProj);
        for (let i = 1; i < half; i++) {
          ctx.lineTo(projected[i].xProj, projected[i].yProj);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw Back Path
        ctx.beginPath();
        ctx.moveTo(projected[half].xProj, projected[half].yProj);
        for (let i = half + 1; i < projected.length; i++) {
          ctx.lineTo(projected[i].xProj, projected[i].yProj);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };

      drawSymbolPart(leftBracket, "rgba(255, 0, 110, 0.75)", "rgba(255, 0, 110, 0.2)");
      drawSymbolPart(middleSlash, "rgba(234, 179, 8, 0.75)", "rgba(234, 179, 8, 0.2)");
      drawSymbolPart(rightBracket, "rgba(6, 182, 212, 0.75)", "rgba(6, 182, 212, 0.2)");
    };

    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      time += 1;

      // Smooth mouse interpolation (lerp)
      const mouse = mouseRef.current;
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.06;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.06;

      // Adjust camera properties dynamically
      const cameraYaw = 0.05 * Math.sin(time * 0.002) + mouse.currentX * 0.12;
      const cameraPitch = 0.45 + mouse.currentY * 0.08; // slightly looking down
      const focalLength = 360;

      // Responsive positioning
      const centerX = isMobile ? dimensions.width * 0.5 : dimensions.width * 0.7;
      const centerY = isMobile ? dimensions.height * 0.75 : dimensions.height * 0.5;
      const scaleFactor = isMobile ? 0.75 : 1.1;

      // 1. Draw Static / Ground Layer Elements
      drawPlatform(cameraYaw, cameraPitch, centerX, centerY, focalLength, scaleFactor);

      // 2. Prepare Depth-Sorting List for floating elements
      const renderList: any[] = [];
      const activeBadges = isMobile ? mobileBadges : badges;

      // Float values
      const floatY = Math.sin(time * 0.02) * 6;

      // Render Central symbol placeholder in sorting queue
      renderList.push({
        type: "central",
        zDepth: 0,
      });

      // Prepare Orbiting Badge coordinates in rotation sorting queue
      activeBadges.forEach((b) => {
        const orbitAngle = b.angle + time * b.speed * 0.4;
        const localX = b.orbitRadius * Math.cos(orbitAngle);
        const localZ = b.orbitRadius * Math.sin(orbitAngle);
        const localY = -30 + Math.sin(time * b.floatFreq) * 8;

        const rotated = projectVertex(
          localX * scaleFactor,
          localY * scaleFactor,
          localZ * scaleFactor,
          cameraYaw,
          cameraPitch,
          centerX,
          centerY,
          focalLength
        );

        renderList.push({
          type: "badge",
          label: b.label,
          color: b.color,
          shadow: b.shadow,
          border: b.border,
          px: rotated.xProj,
          py: rotated.yProj,
          scale: rotated.scale,
          zDepth: rotated.zDepth,
        });
      });

      // Sort elements by Z depth (furthest drawn first)
      renderList.sort((a, b) => b.zDepth - a.zDepth);

      // 3. Draw sorted items with proper occlusion
      renderList.forEach((item) => {
        if (item.type === "central") {
          drawCentralSymbol(floatY, cameraYaw, cameraPitch, centerX, centerY, focalLength, scaleFactor);
        } else {
          drawBadge(item.label, item.px, item.py, item.scale, item.color, item.shadow, item.border);
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ opacity: isMobile ? 0.45 : 0.85 }}
    />
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative py-12 sm:py-16 md:py-28 overflow-hidden bg-gradient-to-b from-[#FFF2F7] via-[#FFFBEB] to-[#F8FAFC]"
    >
      {/* Background Decorative Gradients/Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-tr from-[#FF006E]/12 to-transparent rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-bl from-[#FFD60A]/25 to-transparent rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF006E/[0.02]_1px,transparent_1px),linear-gradient(to_bottom,#FF006E/[0.02]_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* 3D Interactive Battlefield Background Layer */}
      <div className="absolute inset-0 z-0 select-none overflow-hidden [mask-image:radial-gradient(circle_at_70%_50%,#000_50%,transparent_100%)] md:[mask-image:linear-gradient(to_right,transparent_15%,#000_55%)]">
        <Arena3D />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
        {/* Hero Header */}
        <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <Badge
              variant="accent"
              size="md"
              dot
              className="bg-[#FFD60A] text-[#0F172A] border-[#FFD60A] font-bold text-xs sm:text-sm px-3 py-1 shadow-sm"
            >
              Official Developer Community
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]"
          >
            Build. Compete.{" "}
            <span className="bg-gradient-to-r from-[#FF006E] to-[#FFD60A] bg-clip-text text-transparent">
              Innovate.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-lg text-[#475569] max-w-3xl leading-relaxed font-medium"
          >
            Join Frontend Arena and participate in premium hackathons, innovation challenges and developer events designed
            to help you build real-world projects, showcase your skills and grow with the community.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 w-full sm:w-auto z-20"
          >
            <Button asChild variant="default" size="lg" className="w-full sm:w-auto shadow-sm">
              <a href="#featured-hackathons" className="flex items-center justify-center gap-2">
                <span>Explore Hackathons</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-white/70 backdrop-blur-xs">
              <a
                href="https://chat.whatsapp.com/IEKu23HxPH19GMLfuKM3Eh"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Join Community</span>
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
