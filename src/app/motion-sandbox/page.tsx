"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Check, 
  Plus, 
  MoreHorizontal,
  Info,
  Terminal,
  Compass,
  Cpu,
  Volume2,
  Sliders,
  Palette
} from "lucide-react";
import Link from "next/link";
import ConstellationBackground from "@/components/ConstellationBackground";
import MatrixBackground from "@/components/MatrixBackground";
import { MatrixPanel } from "@/components/MatrixPanel";
import GlyphIcon from "@/components/GlyphIcon";
import CRTScreen from "@/components/CRTScreen";
import MatrixSpinner from "@/components/MatrixSpinner";
import RadialNavBar from "@/components/RadialNavBar";

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  rgbPrimary: string;
  rgbSecondary: string;
  gradient: string;
}

// ==========================================
// 19. ACTIVE ACCENT THEME ENGINE DICTIONARY
// ==========================================
const ACCENT_THEMES = {
  cyan: {
    id: "cyan",
    name: "Cyber Cyan",
    primary: "#06b6d4",
    secondary: "#3b82f6",
    rgbPrimary: "6, 182, 212",
    rgbSecondary: "59, 130, 246",
    gradient: "linear-gradient(135deg, #f5e0ff 0%, #06b6d4 35%, #3b82f6 70%, #09090b 100%)",
  },
  purple: {
    id: "purple",
    name: "Cosmic Purple",
    primary: "#d946ef",
    secondary: "#8b5cf6",
    rgbPrimary: "217, 70, 239",
    rgbSecondary: "139, 92, 246",
    gradient: "linear-gradient(135deg, #f472b6 0%, #d946ef 35%, #8b5cf6 70%, #1e1b4b 100%)",
  },
  emerald: {
    id: "emerald",
    name: "Matrix Emerald",
    primary: "#10b981",
    secondary: "#06b6d4",
    rgbPrimary: "16, 185, 129",
    rgbSecondary: "6, 182, 212",
    gradient: "linear-gradient(135deg, #e9d5ff 0%, #10b981 35%, #059669 70%, #022c22 100%)",
  },
  amber: {
    id: "amber",
    name: "Solar Amber",
    primary: "#f59e0b",
    secondary: "#ef4444",
    rgbPrimary: "245, 158, 11",
    rgbSecondary: "239, 68, 68",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #ef4444 75%, #450a0a 100%)",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Threat",
    primary: "#ef4444",
    secondary: "#7f1d1d",
    rgbPrimary: "239, 68, 68",
    rgbSecondary: "127, 29, 29",
    gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 40%, #b91c1c 70%, #450a0a 100%)",
  }
};

// ==========================================
// ABSTRACT HELPER COMPONENTS FOR THE SANDBOX
// ==========================================

// 2. Quantum Decrypt Scrambler
function DecryptText({ text, theme }: { text: string; theme: Theme }) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (!isHovered) {
      setDisplayText(text);
      return;
    }
    let iterations = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*()";
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iterations) return text[index];
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      if (iterations >= text.length) {
        clearInterval(interval);
      }
      iterations += 1/3;
    }, 25);
    return () => clearInterval(interval);
  }, [isHovered, text]);

  return (
    <span 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="font-mono cursor-default text-transparent bg-clip-text transition-all duration-300 select-none"
      style={{
        backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary || theme.primary})`
      }}
    >
      {displayText}
    </span>
  );
}

// 4. Holographic Cryptographic Log Stream
function LedgerLogStream({ theme }: { theme: Theme }) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const prefixes = ["[SYS]", "[AUTH]", "[LEDGER]", "[SYNC]", "[DB]", "[SEC]"];
    const actions = [
      "COMPILING SHARD INTEGRITY",
      "GUEST SANDBOX SYNCHRONIZED",
      "RECALCULATING PROGRESS WEIGHTS",
      "VALIDATING LEDGER SIGNATURE",
      "ESTABLISHING AETHER CONDUIT",
      "ROTATING CRYPTO KEYS",
      "FLUSHING EPHEMERAL SEGMENTS"
    ];
    const generateLog = () => {
      const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
      const act = actions[Math.floor(Math.random() * actions.length)];
      const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `${pfx} ${hash} -- ${act} -- [OK]`;
    };

    setLogs(Array.from({ length: 5 }, generateLog));

    const interval = setInterval(() => {
      setLogs((prev) => [...prev.slice(1), generateLog()]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="bg-black border rounded-lg p-3 font-mono text-[9px] text-neutral-400 space-y-1.5 h-36 overflow-hidden relative transition-all duration-500"
      style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.15)`, boxShadow: `0 0 25px rgba(${theme.rgbPrimary}, 0.05)` }}
    >
      <div className="scanline-overlay"></div>
      <div className="scanline-beam"></div>
      <div className="flex justify-between items-center text-[7px] text-neutral-600 border-b border-neutral-900 pb-1 mb-2">
        <span className="flex items-center gap-1 animate-pulse" style={{ color: theme.primary }}>
          <Terminal size={8} />
          <span>AETHER PROTOCOL LOGGER</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: theme.primary }}></span>
          <span className="font-bold animate-pulse" style={{ color: theme.primary }}>ONLINE</span>
        </span>
      </div>
      {logs.map((log, idx) => {
        let style = {};
        if (log.includes("[SYS]")) style = { color: theme.primary, fontWeight: 600 };
        else if (log.includes("[SEC]")) style = { color: theme.secondary || theme.primary, fontWeight: 600 };
        else if (log.includes("[AUTH]")) style = { color: `rgba(${theme.rgbPrimary}, 0.7)` };
        else if (log.includes("[LEDGER]")) style = { color: "rgba(255, 255, 255, 0.8)" };
        else if (log.includes("[SYNC]")) style = { color: "rgba(150, 150, 150, 0.6)" };
        return (
          <div key={idx} className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden transition-all duration-300 animate-fade-in">
            <span className="text-neutral-700">{(idx + 1).toString().padStart(2, "0")}</span>
            <span style={style}>
              {log}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 3. Cyber Constellation Mesh
function InteractiveParticleCanvas({ theme }: { theme: Theme }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 160);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 160;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.5 + 0.8
    }));

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const currentTheme = themeRef.current;

      // Draw vector network lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? currentTheme.primary : `rgba(${currentTheme.rgbSecondary}, 0.7)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 45) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${currentTheme.rgbPrimary}, ${0.25 * (1 - dist / 45)})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }

        const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
        if (mouseDist < 75) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${currentTheme.rgbSecondary}, ${0.5 * (1 - mouseDist / 75)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="border border-neutral-900 bg-neutral-950/40 rounded-lg overflow-hidden h-40 relative flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-auto" />
      <div className="z-10 absolute pointer-events-none text-center bg-black/75 backdrop-blur-[2px] border border-neutral-800/50 p-2.5 rounded-lg select-none">
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Upgrade #3: Cyber Constellation Mesh</span>
        <span className="block text-[7px] font-mono text-neutral-600">MAGNETIC CURSOR ATTRACTION & CONNECTIONS</span>
      </div>
    </div>
  );
}

// 5. Glassmorphic Morphing Tab
function GlassmorphicMorphTab({ theme }: { theme: Theme }) {
  const [activeTab, setActiveTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);

  const handleTabClick = (idx: number) => {
    setPrevTab(activeTab);
    setActiveTab(idx);
  };

  const isMovingRight = activeTab > prevTab;
  const isMovingLeft = activeTab < prevTab;

  return (
    <div 
      className="flex bg-neutral-950 border p-1 rounded-lg relative overflow-hidden select-none transition-all duration-300"
      style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.15)` }}
    >
      <div 
        className="absolute top-1 bottom-1 rounded-md border transition-all"
        style={{
          left: activeTab === 0 ? "4px" : activeTab === 1 ? "34.5%" : "67.5%",
          right: activeTab === 0 ? "67.5%" : activeTab === 1 ? "34.5%" : "4px",
          background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
          boxShadow: `0 0 15px rgba(${theme.rgbPrimary}, 0.45)`,
          borderColor: "rgba(255, 255, 255, 0.15)",
          transition: `
            left ${isMovingLeft ? "0.22s cubic-bezier(0.16, 1, 0.3, 1)" : "0.32s cubic-bezier(0.25, 1, 0.5, 1)"},
            right ${isMovingRight ? "0.22s cubic-bezier(0.16, 1, 0.3, 1)" : "0.32s cubic-bezier(0.25, 1, 0.5, 1)"}
          `
        }}
      />
      {["METRIC", "LEDGER", "ORBITAL"].map((tab, idx) => (
        <button
          key={tab}
          onClick={() => handleTabClick(idx)}
          className={`flex-1 text-center py-2 text-[9px] font-mono uppercase tracking-wider relative z-10 transition-colors duration-300 ${
            activeTab === idx ? "text-white font-black" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// 6. Orbital Concentric Dial Bezel Menu
function OrbitalBezelMenu({ theme }: { theme: Theme }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border bg-neutral-950/45 rounded-lg p-6 flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden select-none transition-all duration-300"
      style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.15)`, boxShadow: `0 0 30px rgba(${theme.rgbPrimary}, 0.05)` }}
    >
      <div className="w-24 h-24 rounded-full border border-neutral-800/80 flex items-center justify-center relative transition-transform duration-700"
           style={{ transform: hovered ? "rotate(180deg)" : "rotate(0deg)" }}>
        
        {/* Outer Ring - Accent dashed */}
        <div className="absolute inset-1 rounded-full border border-dashed animate-[spin_20s_linear_infinite]" 
             style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.4)` }} />
        
        {/* Inner solid ring - Secondary/Primary accent glow */}
        <div className="absolute inset-3 rounded-full border shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
             style={{ borderColor: `rgba(${theme.rgbSecondary}, 0.25)`, boxShadow: `inset 0 0 10px rgba(${theme.rgbPrimary}, 0.15)` }} />
        
        {/* Floating marker dot */}
        <div className="absolute w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" 
             style={{ top: "4px", left: "calc(50% - 3px)", backgroundColor: theme.primary }} />
        
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800/50 flex items-center justify-center absolute transition-transform duration-700"
             style={{ transform: hovered ? "rotate(-180deg)" : "rotate(0deg)" }}>
          <Compass size={14} className="animate-pulse animate-duration-1000" style={{ color: theme.primary }} />
        </div>
      </div>
      <div className="text-center">
        <span className="block text-[9px] font-mono uppercase tracking-widest font-bold font-mono" style={{ color: theme.primary }}>Upgrade #6: Orbital Dial Bezel</span>
        <span className="block text-[7px] font-mono text-neutral-600">HOVER TO TRANSMIT TELEMETRY ROTATION</span>
      </div>
    </div>
  );
}

// 7. Interactive Swirling Flow Field
function InteractiveVectorFlowField({ theme }: { theme: Theme }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 160);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 160;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.5;

      const currentTheme = themeRef.current;
      const spacing = 16;
      const lineLength = 8;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          const centerX = width / 2;
          const centerY = height / 2;

          const dxToCenter = x - centerX;
          const dyToCenter = y - centerY;
          const distToCenter = Math.hypot(dxToCenter, dyToCenter) || 1;

          const spiralAngle = Math.atan2(dyToCenter, dxToCenter) + Math.PI / 2;
          const waveOffset = Math.sin(time * 0.015 + distToCenter * 0.015) * 0.3;
          const baseAngle = spiralAngle + waveOffset;

          let angle = baseAngle;
          const dxToMouse = mouse.x - x;
          const dyToMouse = mouse.y - y;
          const distToMouse = Math.hypot(dxToMouse, dyToMouse);

          let opacity = 0.15;
          let scaleMultiplier = 1.0;

          if (mouse.x !== -1000 && mouse.y !== -1000) {
            const influenceRadius = 120;
            if (distToMouse < influenceRadius) {
              const influence = 1 - distToMouse / influenceRadius;
              const smoothInfluence = influence * influence * (3 - 2 * influence);
              
              const directAngle = Math.atan2(dyToMouse, dxToMouse); 
              const swirlAngle = Math.atan2(dyToMouse, dxToMouse) + Math.PI / 2;
              
              const blendRatio = Math.min(1, distToMouse / 60);
              const mouseAngle = (1 - blendRatio) * directAngle + blendRatio * swirlAngle;
              
              angle = (1 - smoothInfluence) * baseAngle + smoothInfluence * mouseAngle;
              
              opacity = 0.15 + smoothInfluence * 0.72;
              scaleMultiplier = 1.0 + smoothInfluence * 0.65;
            }
          }

          const halfL = (lineLength / 2) * scaleMultiplier;
          const lx = Math.cos(angle) * halfL;
          const ly = Math.sin(angle) * halfL;

          ctx.beginPath();
          ctx.moveTo(x - lx, y - ly);
          ctx.lineTo(x + lx, y + ly);
          
          ctx.strokeStyle = `rgba(${currentTheme.rgbPrimary}, ${opacity})`;
          ctx.lineWidth = opacity > 0.3 ? 1.25 : 0.75;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="border border-neutral-900 bg-black rounded-lg overflow-hidden h-40 relative flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-auto" />
      <div className="z-10 absolute pointer-events-none text-center bg-black/85 backdrop-blur-[2px] border border-neutral-800/60 p-2.5 rounded-lg select-none">
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Upgrade #7: Swirling Vector Vortex</span>
        <span className="block text-[7px] font-mono text-neutral-600 uppercase">HIGH-FIDELITY ROTATIONAL DYNAMIC FIELD</span>
      </div>
    </div>
  );
}

// 8. CRT 3D Grid Bulge
function InteractiveCRTGridBulge({ theme }: { theme: Theme }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 160);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 300;
      height = canvas.height = 160;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const spacing = 22;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const currentTheme = themeRef.current;

      const rows = Math.ceil(height / spacing) + 1;
      const cols = Math.ceil(width / spacing) + 1;

      const points: Array<Array<{ x: number; y: number }>> = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const origX = c * spacing;
          const origY = r * spacing;

          const dist = Math.hypot(origX - mouse.x, origY - mouse.y);
          let dispX = 0;
          let dispY = 0;

          if (dist < 100) {
            const force = (100 - dist) / 100;
            const angle = Math.atan2(origY - mouse.y, origX - mouse.x);
            dispX = Math.cos(angle) * force * 16;
            dispY = Math.sin(angle) * force * 16;
          }

          points[r][c] = {
            x: origX + dispX,
            y: origY + dispY
          };
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r][c+1].x, points[r][c+1].y);
            ctx.strokeStyle = `rgba(${currentTheme.rgbPrimary}, ${0.15 * (1 + Math.abs(points[r][c].x - c * spacing) / 8)})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
          if (r < rows - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r+1][c].x, points[r+1][c].y);
            ctx.strokeStyle = `rgba(${currentTheme.rgbPrimary}, ${0.15 * (1 + Math.abs(points[r][c].y - r * spacing) / 8)})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.moveTo(points[r][c].x - 2, points[r][c].y);
          ctx.lineTo(points[r][c].x + 2, points[r][c].y);
          ctx.moveTo(points[r][c].x, points[r][c].y - 2);
          ctx.lineTo(points[r][c].x, points[r][c].y + 2);
          ctx.strokeStyle = `rgba(${currentTheme.rgbPrimary}, 0.35)`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="border border-neutral-900 bg-black rounded-lg overflow-hidden h-40 relative flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-auto" />
      <div className="z-10 absolute pointer-events-none text-center bg-black/75 backdrop-blur-[2px] border border-neutral-800/50 p-2.5 rounded-lg select-none">
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Upgrade #8: CRT 3D Elastic Grid mesh</span>
        <span className="block text-[7px] font-mono text-neutral-600 font-mono">3D VECTOR DISTORTION & COORDINATE WARPING</span>
      </div>
    </div>
  );
}

// 14. Audio-Reactive Neural Equalizer Waveform
function InteractiveNeuralEqualizer({ theme }: { theme: Theme }) {
  const [hoverSpeed, setHoverSpeed] = useState(1);
  const prevMouseX = useRef(0);
  const prevTime = useRef(Date.now());

  const handleMouseMove = (e: React.MouseEvent) => {
    const now = Date.now();
    const deltaT = now - prevTime.current || 1;
    const deltaX = Math.abs(e.clientX - prevMouseX.current);
    const speed = Math.min(10, Math.max(1, (deltaX / deltaT) * 15));
    setHoverSpeed(speed);
    prevMouseX.current = e.clientX;
    prevTime.current = now;
  };

  const handleMouseLeave = () => {
    setHoverSpeed(1);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="p-4 border bg-neutral-950/80 rounded-lg space-y-3 relative overflow-hidden select-none transition-all duration-500"
      style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.15)`, boxShadow: `0 0 25px rgba(${theme.rgbPrimary}, 0.05)` }}
    >
      <div className="flex justify-between items-center text-[9px] font-mono">
        <span className="uppercase tracking-widest text-neutral-400 font-mono">Upgrade #14: Neural Frequency Visualizer</span>
        <span className="text-neutral-500 uppercase flex items-center gap-1 font-mono">
          <Volume2 size={10} className="animate-pulse" />
          <span>Interactive Waveform</span>
        </span>
      </div>

      {/* 24 Audio EQ bars */}
      <div className="flex items-end justify-between h-12 pt-2 px-1">
        {Array.from({ length: 24 }).map((_, idx) => {
          const randomSpeedScale = 0.3 + (idx % 5) * 0.15;
          const animDuration = `${1.2 / (hoverSpeed * randomSpeedScale)}s`;
          return (
            <div 
              key={idx}
              className="w-1 rounded-t transition-all"
              style={{
                background: `linear-gradient(to top, ${theme.primary}, ${theme.secondary || theme.primary})`,
                animation: `eqBarAnim ${animDuration} ease-in-out infinite alternate`,
                boxShadow: `0 0 8px rgba(${theme.rgbPrimary}, 0.35)`
              }}
            />
          );
        })}
      </div>

      <p className="text-[8px] font-mono text-neutral-600 text-center leading-relaxed">
        Swipe cursor across card to accelerate equalizer frequencies. Neural sound-mesh maps movement velocity in real time.
      </p>

      {/* Injected Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes eqBarAnim {
          0% { height: 12%; }
          100% { height: 98%; }
        }
      `}} />
    </div>
  );
}

// ==========================================
// MAIN SANDBOX WRAPPER COMPONENT
// ==========================================
export default function MotionSandbox() {
  // Theme customizer state
  const [activeAccent, setActiveAccent] = useState<"cyan" | "purple" | "emerald" | "amber" | "crimson">("cyan");
  const [matrixMode, setMatrixMode] = useState(false);
  
  // States for subtasks
  const [subtaskChecked1, setSubtaskChecked1] = useState(false);
  const [subtaskChecked2, setSubtaskChecked2] = useState(false);

  // States for progress bar cascade triggers
  const [cascadeTrigger1, setCascadeTrigger1] = useState(0);

  // State for mock modal drawer
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scrolling simulation for Header Compress
  const [scrollY, setScrollY] = useState(0);
  const handleScrollSim = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const theme = ACCENT_THEMES[activeAccent];

  return (
    <div className="min-h-screen bg-black text-white md:max-w-xl md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-20 relative overflow-hidden">
      {matrixMode ? (
        <MatrixBackground density={80} />
      ) : (
        <ConstellationBackground opacity={0.75} particleCount={150} />
      )}
      
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full blur-[130px] pointer-events-none opacity-[0.38] mix-blend-screen transition-all duration-1000 animate-pulse animate-duration-3000"
        style={{
          background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary || theme.primary} 55%, transparent 100%)`
        }}
      />
      
      {/* Injecting CSS scope dynamically based on the Dynamic Accent Theme Picker! */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --theme-primary: ${theme.primary};
          --theme-secondary: ${theme.secondary};
          --theme-rgb-primary: ${theme.rgbPrimary};
          --theme-rgb-secondary: ${theme.rgbSecondary};
        }

        /* Core animation definitions for sandbox */
        
        /* 15. Strike-through sweep gradient */
        @keyframes strikeSweep {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-strike-sweep {
          position: relative;
        }
        .animate-strike-sweep::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          height: 1.5px;
          background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
          animation: strikeSweep 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Spring checkbox pop */
        @keyframes checkboxSpring {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-checkbox-spring {
          animation: checkboxSpring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 11. Prism masked border sweep */
        @keyframes borderSweep {
          0% { background-position: center, 150% center; }
          100% { background-position: center, -50% center; }
        }
        .border-sweep-container {
          position: relative;
          border: 1px solid transparent;
          background: linear-gradient(#050505, #050505) padding-box,
                      linear-gradient(#181818, #181818) border-box;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), background 0.28s ease, box-shadow 0.28s ease;
        }
        .border-sweep-container:hover {
          background: linear-gradient(#050505, #050505) padding-box,
                      linear-gradient(90deg, #181818 0%, #181818 40%, var(--theme-primary) 50%, #181818 60%, #181818 100%) border-box;
          background-size: auto, 200% auto;
          background-position: center, 150% center;
          animation: borderSweep 2s linear infinite;
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(var(--theme-rgb-primary), 0.08);
        }

        /* 18. Pulsing Action Halo Heartbeat */
        @keyframes haloPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.85;
            box-shadow: 0 0 0 0px rgba(var(--theme-rgb-primary), 0.5);
          }
          70% {
            transform: scale(1.05);
            opacity: 0;
            box-shadow: 0 0 0 12px rgba(var(--theme-rgb-primary), 0);
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
            box-shadow: 0 0 0 0px rgba(var(--theme-rgb-primary), 0);
          }
        }
        /* .pulse-halo::before removed - neon halo effect disabled */

        /* 19. Breathing Action Aura Glow */
        /* Aura breathing glow animation removed */

        /* 13. Segments breathing glow pulse */
        @keyframes breathingSegment {
          0%, 100% { opacity: 0.55; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 4px var(--theme-primary)); }
        }
        .segment-breath {
          animation: breathingSegment 2.2s ease-in-out infinite;
        }

        /* 20. Spring-overshoot Modal transition */
        @keyframes springSlideUp {
          0% {
            transform: translateY(100%);
          }
          75% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-spring-slide-up {
          animation: springSlideUp 0.48s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* Rotate loader check */
        @keyframes borderRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-border-rotate {
          animation: borderRotate 0.6s linear;
        }

        /* 1. Grainy cosmic liquid shifting title */
        @keyframes chromeLiquid {
          0% { background-position: 0px 0px, 0% 50%; }
          50% { background-position: 0px 0px, 100% 50%; }
          100% { background-position: 0px 0px, 0% 50%; }
        }
        .liquid-chrome-text {
          background-image: 
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.99' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0.68 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"), 
            linear-gradient(135deg, #f5e0ff 0%, var(--theme-primary) 30%, var(--theme-secondary) 65%, #09090b 100%);
          background-size: 150px 150px, 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: chromeLiquid 8s ease-in-out infinite;
        }

        /* Retro scanning overlays */
        /* Scanline overlay removed - neon style disabled */
        /* Scanline beam and animation removed */
      `}} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-900 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          >
            <GlyphIcon Icon={ArrowLeft} size={16} matrixMode={matrixMode} />
          </Link>
          <button
            onClick={() => setMatrixMode(!matrixMode)}
            className="ml-2 px-2 py-1 text-xs bg-green-900 text-green-200 rounded hover:bg-green-800 transition-colors"
          >
            {matrixMode ? "Matrix OFF" : "Matrix ON"}
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase">Aether Motion Sandbox</h1>
            <p className="text-[10px] text-neutral-350 font-mono">Interactive Motion UI playground</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800 px-2 py-1 rounded text-[9px] font-mono text-neutral-250 select-none">
          <Sparkles size={10} className="text-white animate-pulse" />
          <span>V1.2</span>
        </div>
      </header>

      {/* Intro info box */}
      <div className="m-6 p-4 border border-neutral-900 bg-neutral-950/40 rounded-lg flex items-start gap-3 select-none">
        <Info size={16} className="text-neutral-250 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[10px] font-mono text-neutral-200 tracking-wide leading-relaxed">
          Welcome to the visual engine! Play with the <strong>Theme picker widget</strong> below to dynamically repaint all 20 of our state-of-the-art interactive micro-animations and motion widgets.
        </p>
      </div>

      {/* ==========================================
          19. FLOATING THEME CUSTOMIZER ENGINE WIDGET
          ========================================== */}
      <div className="mx-6 mb-8 p-4 border border-neutral-800 bg-neutral-950/70 backdrop-blur-md rounded-xl space-y-3 shadow-2xl relative select-none z-30 transition-all duration-300"
           style={{ borderColor: `rgba(${theme.rgbPrimary}, 0.2)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-neutral-250 font-bold">
            <Palette size={12} className="text-white animate-pulse" />
            <span>Active Accent Theme Engine</span>
          </div>
          <span className="text-[8px] font-mono bg-neutral-900 text-neutral-250 px-2 py-0.5 rounded border border-neutral-800">
            UPGRADE #19
          </span>
        </div>
        <p className="text-[9px] font-mono text-neutral-300 leading-relaxed">
          Select an dynamic accent palette. All responsive vectors, coordinate meshes, tab pills, canvas streams, sound curves, and glowing check overlays repaint instantly.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.values(ACCENT_THEMES).map((themeOption) => {
            const isSelected = activeAccent === themeOption.id;
            return (
              <button
                key={themeOption.id}
                onClick={() => setActiveAccent(themeOption.id as "cyan" | "purple" | "emerald" | "amber" | "crimson")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                  isSelected 
                    ? "bg-white text-black border-white shadow-xl scale-[1.03]" 
                    : "bg-neutral-900 border-neutral-800 text-neutral-250 hover:text-white hover:border-neutral-600"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full animate-pulse animate-duration-1000" style={{ backgroundColor: themeOption.primary }} />
                <span>{themeOption.name}</span>
              </button>
            );
          })}
        </div>
        
        {/* Matrix Systems Panels */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-900">
          <MatrixPanel title="Breach Level" value={matrixMode ? "CRITICAL (0.98)" : "SECURE (0.01)"} matrixMode={matrixMode} theme={theme} />
          <MatrixPanel title="Core Mainframe" value={matrixMode ? "OVERLOAD 99%" : "IDLE 4%"} matrixMode={matrixMode} theme={theme} />
          <MatrixPanel title="Signal Shards" value="1,490 active" matrixMode={matrixMode} theme={theme} />
          <MatrixPanel title="Aether Key" value="0x7F...9A" matrixMode={matrixMode} theme={theme} />
        </div>
      </div>

      {/* MAIN SANDBOX OPTIONS SECTION */}
      <main className="px-6 space-y-10">

        {/* SECTION 0: ABSTRACT CYBERNETIC SYSTEMS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Cpu size={12} className="animate-pulse" />
              <span>Abstract Retro-Tech Systems</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Dynamic matrix coordinates, vector nodes, and concentric dials</p>
            <CRTScreen matrixMode={matrixMode} theme={theme} />
          </div>

          <div className="grid grid-cols-1 gap-6">

            {/* 1. Cosmic Grainy Gradient Title */}
            <div className="p-5 border border-neutral-900 bg-neutral-950/80 rounded-lg space-y-3 relative overflow-hidden select-none">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-mono text-neutral-300">
                <span>A. Shimmering Liquid Chrome Mask</span>
                <span>UPGRADE #1</span>
              </div>
              <div className="text-center py-4 relative">
                  <h3 className="text-4xl font-extrabold tracking-tighter uppercase liquid-chrome-text select-none">
                    Aether goals
                  </h3>
                </div>
              <p className="text-[9px] font-mono text-neutral-300 leading-relaxed text-center">
                Uses high-frequency digital paper grain layered over an animated flowing gradient shifting colors under the static grain.
              </p>
            </div>

            {/* 2. Cyber-Matrix Glitch Scrambler */}
            <div className="p-5 border border-neutral-900 bg-neutral-950/80 rounded-lg space-y-4 select-none cursor-pointer glitch-hover relative overflow-hidden transition-all duration-300 hover:border-neutral-800">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-mono text-neutral-300">
                <span>B. Hover Glitch & Decrypt Text Card</span>
                <span>UPGRADE #2</span>
              </div>
              
              <div className="relative">
                <h4 className="text-lg font-bold text-white tracking-tight relative z-10 font-mono">
                  <DecryptText text="ESTABLISHING QUANTUM PROTOCOL" theme={theme} />
                </h4>
                
                {/* Glitch overlays appearing on hover */}
                <span className="absolute inset-0 text-lg font-bold tracking-tight z-0 opacity-0 glitch-layer-1 pointer-events-none select-none font-mono"
                      style={{ color: theme.primary }}>
                  ESTABLISHING QUANTUM PROTOCOL
                </span>
                <span className="absolute inset-0 text-lg font-bold tracking-tight z-0 opacity-0 glitch-layer-2 pointer-events-none select-none font-mono"
                      style={{ color: theme.secondary }}>
                  ESTABLISHING QUANTUM PROTOCOL
                </span>
              </div>

              <p className="text-[9px] font-mono text-neutral-300 leading-relaxed">
                Hover card to scramble individual characters at 40Hz and trigger chromatic offset coordinate glitch layers.
              </p>
            </div>

            {/* 3. Cyber Constellation Mesh Grid */}
            <div className="space-y-1.5">
              <InteractiveParticleCanvas theme={theme} />
            </div>

            {/* 4. Holographic Cryptographic Ledger Console */}
            <div className="space-y-1.5">
              <LedgerLogStream theme={theme} />
            </div>

            {/* 5. Glassmorphic Morph-Pill Tabs */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-mono text-neutral-300 px-1">
                <span>E. Morphing Pill Tab Switcher</span>
                <span>UPGRADE #5</span>
              </div>
              <GlassmorphicMorphTab theme={theme} />
            </div>

            {/* 6. Orbital Concentric Dial Bezel */}
            <div className="space-y-1.5">
              <OrbitalBezelMenu theme={theme} />
            </div>

            {/* 7. Swirling Flow Field */}
            <div className="space-y-1.5">
              <InteractiveVectorFlowField theme={theme} />
            </div>

            {/* 8. CRT Grid Bulge */}
            <div className="space-y-1.5">
              <InteractiveCRTGridBulge theme={theme} />
            </div>

          </div>
        </section>

        {/* SECTION 1: INTERACTIVE CARDS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Sliders size={12} className="animate-pulse" />
              <span>1. Interactive Goal Cards</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Frosted glassmorphism, 3D springs, and masked sweeps</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* 9. Transparent Minimal Crystalline Card */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-neutral-250">
                <span>Option A: Transparent Minimal (Crystalline Border)</span>
                <span>UPGRADE #9</span>
              </div>
              <div className="p-4 bg-white/[0.02] border border-white/50 backdrop-blur-[12px] rounded-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_4px_32px_rgba(255,255,255,0.04)] cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-200 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Option A</span>
                  <MoreHorizontal size={14} className="text-neutral-350" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Sleek Flat Glass Border</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/3 animate-pulse" />
                </div>
              </div>
            </div>

            {/* 10. Tactile Glass Spring Card */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-neutral-250">
                <span>Option B: Glass Spring & Dynamic Accent Shadow</span>
                <span>UPGRADE #10</span>
              </div>
              <div 
                className="p-4 bg-white/[0.04] border border-white/50 backdrop-blur-[16px] rounded-lg transition-all duration-300 hover:border-white/20 hover:-translate-y-1.5 active:scale-[0.97] active:translate-y-0.5 cursor-pointer select-none"
                style={{
                  boxShadow: `0 8px 30px rgba(${theme.rgbPrimary}, 0.03)`
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-200 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Tactile</span>
                  <MoreHorizontal size={14} className="text-neutral-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Hover to elevate. Tap/Hold to depress physically.</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full w-2/3" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }} />
                </div>
              </div>
            </div>

            {/* 11. Prism masked Border Sweep Card */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-neutral-250">
                <span>Option C: Accent-Masked Border Sweep</span>
                <span>UPGRADE #11</span>
              </div>
              <div className="p-4 border-sweep-container cursor-pointer select-none rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-200 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Prism Mask</span>
                  <MoreHorizontal size={14} className="text-neutral-500" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Frosted glass & sliding accent sweep on hover</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full w-1/2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }} />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: PROGRESS BARS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Volume2 size={12} className="animate-pulse" />
              <span>2. Segmented Fills & Neural Equalizers</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Staggered cascades vs. dynamic audio waveforms</p>
          </div>

          <div className="space-y-6">
            
            {/* 12. Cascade Progress Bar (Boot-up) */}
            <div className="p-4 border border-neutral-850 bg-neutral-950 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-250">Style A: Staggered Fill Cascade</span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-neutral-350">UPGRADE #12</span>
                  <button
                    onClick={() => setCascadeTrigger1(prev => prev + 1)}
                    className="px-2 py-1 bg-white text-black text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1 hover:bg-neutral-200 active:scale-95 transition-all shadow-md"
                  >
                    <Play size={8} fill="black" />
                    <span>Boot sequence</span>
                  </button>
                </div>
              </div>

              {/* Segmented display */}
              <div className="flex gap-[3px] h-6 w-full" key={`cascade-1-${cascadeTrigger1}`}>
                {Array.from({ length: 20 }).map((_, idx) => {
                  const isActive = idx < 13;
                  return (
                    <div
                      key={idx}
                      className="flex-1 h-full rounded-[1px] transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? theme.primary : "#171717",
                        animation: isActive ? "fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                        animationDelay: isActive ? `${idx * 20}ms` : "0ms",
                        opacity: isActive ? 0 : 1,
                        boxShadow: isActive ? `0 0 10px rgba(${theme.rgbPrimary}, 0.5)` : "none"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 13. Breathing Engine Progress Bar */}
            <div className="p-4 border border-neutral-850 bg-neutral-950 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-250">Style B: Breathing Engine Glow</span>
                <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-350 font-mono">UPGRADE #13 -- Autonomous</span>
              </div>

              {/* Segmented display */}
              <div className="flex gap-[3px] h-6 w-full">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const isActive = idx < 16;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-full rounded-[1px] transition-all ${
                        isActive ? "segment-breath" : ""
                      }`}
                      style={{
                        backgroundColor: isActive ? theme.primary : "#171717",
                        animationDelay: isActive ? `${idx * 45}ms` : "0ms",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* 14. Neural Frequency Equalizer Waveform */}
            <InteractiveNeuralEqualizer theme={theme} />

          </div>
        </section>

        {/* SECTION 3: SUBTASKS CHECKLIST */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Check size={12} className="animate-pulse" />
              <span>3. Subtask Checklist Micro-Animations</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Elastic spring checkpoints and dynamic strike sweeps</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* 15. Checkbox Spring Checkpoint + Strike Sweep */}
            <div 
              onClick={() => setSubtaskChecked1(!subtaskChecked1)}
              className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-lg cursor-pointer hover:border-neutral-800 hover:bg-neutral-950 select-none transition-all duration-200"
            >
              {/* Checkbox */}
              <div
                className="flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200"
                style={{
                  backgroundColor: subtaskChecked1 ? theme.primary : "transparent",
                  borderColor: subtaskChecked1 ? theme.primary : "#404040",
                  color: subtaskChecked1 ? "black" : "transparent"
                }}
              >
                <Check size={11} strokeWidth={3.5} className={subtaskChecked1 ? "animate-checkbox-spring" : ""} />
              </div>

              {/* Checked strike line through text */}
              <div className="flex justify-between items-center flex-1">
                <span
                  className={`text-xs font-mono transition-all duration-300 ${
                    subtaskChecked1 
                      ? "text-neutral-450 animate-strike-sweep font-mono" 
                      : "text-white font-mono"
                  }`}
                >
                  Task Style A: Elastic checkpoint & sweep strike-through
                </span>
                <span className="text-[7px] font-mono text-neutral-300 uppercase">UPGRADE #15</span>
              </div>
            </div>

            {/* 16. Circular Rotate Check & Blur Fade */}
            <div 
              onClick={() => setSubtaskChecked2(!subtaskChecked2)}
              className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-lg cursor-pointer hover:border-neutral-800 hover:bg-neutral-950 select-none transition-all duration-200"
            >
              {/* Checkbox */}
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300"
                style={{
                  backgroundColor: subtaskChecked2 ? theme.primary : "transparent",
                  borderColor: subtaskChecked2 ? theme.primary : "#404040",
                  color: subtaskChecked2 ? "black" : "transparent"
                }}
              >
                <Check size={11} strokeWidth={3.5} className={subtaskChecked2 ? "animate-border-rotate" : ""} />
              </div>

              {/* Text fades and blurs slightly */}
              <div className="flex justify-between items-center flex-1">
                <span
                  className={`text-xs font-mono transition-all duration-300 ${
                    subtaskChecked2 
                      ? "text-neutral-450 blur-[0.4px] opacity-40 line-through" 
                      : "text-white"
                  }`}
                >
                  Task Style B: Circular loader dial & text blur decay
                </span>
                <span className="text-[7px] font-mono text-neutral-300 uppercase">UPGRADE #16</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: HEADER COMPRESSION (DEVICE MOCK) */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Compass size={12} className="animate-pulse" />
              <span>4. Scroll-Driven Mockup Adaptations</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Scroll the simulator to see dynamic header padding adapt</p>
          </div>

          {/* 17. Device frame mockup */}
          <div className="border border-neutral-850 bg-black rounded-xl overflow-hidden shadow-2xl relative max-w-sm mx-auto select-none">
            {/* Absolute Device Notch status pill */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-neutral-900 rounded-full z-50 flex items-center justify-center border border-neutral-800/40">
              <span className="text-[5px] text-neutral-300 font-mono tracking-widest uppercase flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <span>Aether OS</span>
              </span>
            </div>

            {/* Sim Scroll Area */}
            <div 
              className="h-64 overflow-y-auto pt-16 pb-8 px-4 space-y-4 touch-pan-y"
              onScroll={handleScrollSim}
            >
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="p-3 border border-neutral-900 bg-neutral-950/60 rounded-md select-none">
                  <div className="w-1/3 h-1.5 bg-neutral-800 rounded mb-2" />
                  <div className="w-full h-3 bg-neutral-900 rounded" />
                </div>
              ))}
            </div>

            {/* Absolute Compressing Header Mock */}
            <div 
              className="absolute top-0 left-0 right-0 z-40 transition-all duration-300 border-b flex items-center justify-between px-4"
              style={{
                paddingTop: scrollY > 20 ? "10px" : "24px",
                paddingBottom: scrollY > 20 ? "10px" : "16px",
                backgroundColor: scrollY > 20 ? "rgba(5, 5, 5, 0.85)" : "transparent",
                backdropFilter: scrollY > 20 ? "blur(12px)" : "none",
                borderColor: scrollY > 20 ? "rgba(255, 255, 255, 0.08)" : "transparent",
                boxShadow: scrollY > 20 ? `0 4px 20px rgba(0, 0, 0, 0.95)` : "none"
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                <span className={`font-black tracking-tight transition-all uppercase ${scrollY > 20 ? "text-xs" : "text-sm"}`}>Aether</span>
              </div>
              <span className="text-[7px] font-mono text-neutral-300 uppercase tracking-widest flex items-center gap-1.5">
                <span>UPGRADE #17</span>
                <span className="text-white bg-neutral-900 px-1 py-0.5 rounded border border-neutral-850">
                  {scrollY > 20 ? "COMPRESSED" : "LARGE"}
                </span>
              </span>
            </div>

            {/* Overlay description */}
            <div className="p-2 bg-neutral-950 border-t border-neutral-900 flex justify-between items-center text-[7px] font-mono text-neutral-300">
              <span>Scroll Y: {scrollY}px</span>
              <span>Mock state: {scrollY > 20 ? "Condensed (85% frosted)" : "Expanded"}</span>
            </div>

          </div>
        </section>

        {/* SECTION 5: FLOATING ACTION BUTTON PULSING HALOS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Plus size={12} className="animate-pulse" />
              <span>5. Action Button Pulsing Halos</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Attract user visual focus dynamically in dark themes</p>
          </div>

          <div className="flex flex-wrap justify-around items-center gap-6 p-6 border border-neutral-900 bg-neutral-950 rounded-lg">
            
            {/* 18. Pulsing Action button halo */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-mono text-neutral-300">
                <span>Style A: Heartbeat Ring</span>
                <span>UPGRADE #18</span>
              </div>
              <button 
                className="relative flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md pulse-halo hover:bg-neutral-200 active:scale-95 transition-all"
              >
                <Plus size={11} strokeWidth={3} />
                <span>Add Goal</span>
              </button>
            </div>

            {/* 19. Pulsing action button aura */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-mono text-neutral-300">
                <span>Style B: Double Aura Glow</span>
                <span>UPGRADE #19</span>
              </div>
              <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md aura-glow-button hover:bg-neutral-200 active:scale-95 transition-all border border-white/50">
                <Plus size={11} strokeWidth={3} />
                <span>Add Goal</span>
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 6: MODAL SLIDE-UP SPRING DRAWER */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Sliders size={12} className="animate-pulse" />
              <span>6. iOS-Style Spring-Overshoot Sheet Modal</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Tactile sheets sliding with programmatic elastic rebounds</p>
          </div>

          <div className="p-4 border border-neutral-900 bg-neutral-950 rounded-lg flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded transition-all active:scale-95"
              >
                Open Spring Drawer
              </button>
              <span className="text-[8px] font-mono bg-neutral-900 border border-neutral-850 px-2 py-1 rounded text-neutral-300">
                UPGRADE #20
              </span>
            </div>
            <span className="text-[8px] font-mono text-neutral-350">Includes backdrop blur + mechanical spring slide overshoot</span>
          </div>
        </section>

        {/* SECTION 7: BOTTOM RADIAL NAVIGATION DIAL */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono flex items-center gap-1.5 font-bold"
                style={{ color: theme.primary }}>
              <Compass size={12} className="animate-pulse" />
              <span>7. Swipeable Bottom Radial Navigation Dial</span>
            </h2>
            <p className="text-[10px] text-neutral-350 font-mono">Mechanical rotating arc wheel menu for fluid views transition</p>
          </div>

          <div className="p-4 border border-neutral-900 bg-neutral-950 rounded-lg flex flex-col items-center justify-center">
            <RadialNavBar theme={theme} />
          </div>
        </section>

      </main>

      {/* 20. SPRING DRAWER MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-[4px] animate-fade-in md:max-w-xl md:mx-auto">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0 z-10" onClick={() => setIsModalOpen(false)} />

          {/* Sliding Sheet Panel with Spring Overshoot animation */}
          <div className="w-full bg-neutral-950 border-t border-neutral-800 px-6 pt-3 pb-8 rounded-t-2xl z-20 space-y-6 shadow-[0_-12px_45px_rgba(0,0,0,0.85)] animate-spring-slide-up relative">
            
            {/* Drag Handle aesthetic bar */}
            <div className="w-10 h-1 bg-neutral-800 rounded-full mx-auto mb-3" />

            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide font-mono flex items-center gap-1.5" style={{ color: theme.primary }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
                  <span>Simulation: Spring Drawer</span>
                </h3>
                <p className="text-[9px] text-neutral-300 font-mono">Feels snappy, responsive, and physically real</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-2.5 py-1 border border-neutral-800 hover:border-neutral-600 bg-black text-[9px] font-mono uppercase tracking-widest text-neutral-250 hover:text-white rounded"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-neutral-200 leading-relaxed font-light">
              Observe how this drawer slides up. Instead of a linear sliding motion, it slightly overshoots the target resting place and then settles down dynamically. This micro-rebound mimics mechanical physics.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 bg-black border border-neutral-900 rounded-lg flex items-center justify-between text-[10px] font-mono text-neutral-200">
                <span>Bezier Curve</span>
                <span>cubic-bezier(0.25, 1, 0.5, 1)</span>
              </div>
              <div className="p-3 bg-black border border-neutral-900 rounded-lg flex items-center justify-between text-[10px] font-mono text-neutral-200">
                <span>Transition Duration</span>
                <span className="flex items-center gap-1.5">
                  <span style={{ color: theme.primary }}>480ms with 10px overshoot</span>
                  <span className="text-[8px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-350 font-bold uppercase font-mono">UPGRADE #20</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {matrixMode && <MatrixSpinner />}
    </div>
  );
}
