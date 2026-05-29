"use client";

import React, { useState, useEffect } from "react";
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
  Cpu
} from "lucide-react";
import Link from "next/link";
import ConstellationBackground from "@/components/ConstellationBackground";

// ==========================================
// ABSTRACT HELPER COMPONENTS FOR THE SANDBOX
// ==========================================

// 1. Text scrambler/decrypter
function DecryptText({ text }: { text: string }) {
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
      className="font-mono cursor-default"
    >
      {displayText}
    </span>
  );
}

// 2. Continuous crypto ledger log stream simulator
function LedgerLogStream() {
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
    <div className="bg-black border border-neutral-900 rounded-lg p-3 font-mono text-[9px] text-neutral-400 space-y-1.5 h-36 overflow-hidden relative">
      <div className="scanline-overlay"></div>
      <div className="scanline-beam"></div>
      <div className="flex justify-between items-center text-[7px] text-neutral-600 border-b border-neutral-900 pb-1 mb-2">
        <span className="flex items-center gap-1">
          <Terminal size={8} />
          <span>AETHER PROTOCOL LOGGER</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
          <span>ONLINE</span>
        </span>
      </div>
      {logs.map((log, idx) => (
        <div key={idx} className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden transition-all duration-300">
          <span className="text-neutral-600">{(idx + 1).toString().padStart(2, "0")}</span>
          <span className={log.includes("[SYS]") ? "text-white" : log.includes("[SEC]") ? "text-neutral-500" : "text-neutral-400"}>
            {log}
          </span>
        </div>
      ))}
    </div>
  );
}

// 3. Interactive canvas floating particle constellation grid
function InteractiveParticleCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
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

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw vector network lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 45) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - dist / 45)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
        if (mouseDist < 75) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * (1 - mouseDist / 75)})`;
          ctx.lineWidth = 0.6;
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
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Vector Constellation Field</span>
        <span className="block text-[7px] font-mono text-neutral-600">INTERACTIVE MOUSE ATTRACTION MESH</span>
      </div>
    </div>
  );
}

// 4. Sliding morph tab pill
function GlassmorphicMorphTab() {
  const [activeTab, setActiveTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);

  const handleTabClick = (idx: number) => {
    setPrevTab(activeTab);
    setActiveTab(idx);
  };

  const isMovingRight = activeTab > prevTab;
  const isMovingLeft = activeTab < prevTab;

  return (
    <div className="flex bg-neutral-950 border border-neutral-900 p-1 rounded-lg relative overflow-hidden select-none">
      <div 
        className="absolute top-1 bottom-1 bg-white rounded-md"
        style={{
          left: activeTab === 0 ? "4px" : activeTab === 1 ? "34.5%" : "67.5%",
          right: activeTab === 0 ? "67.5%" : activeTab === 1 ? "34.5%" : "4px",
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
            activeTab === idx ? "text-black font-bold" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// 5. Orbital Concentric Dial Bezel Menu
function OrbitalBezelMenu() {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-neutral-900 bg-neutral-950 rounded-lg p-6 flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden select-none"
    >
      <div className="w-24 h-24 rounded-full border border-neutral-800 flex items-center justify-center relative transition-transform duration-700"
           style={{ transform: hovered ? "rotate(180deg)" : "rotate(0deg)" }}>
        
        {/* Outer Ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-neutral-600/40 animate-[spin_20s_linear_infinite]" />
        
        {/* Inner solid ring */}
        <div className="absolute inset-3 rounded-full border border-neutral-800" />
        
        {/* Floating marker dot */}
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full" style={{ top: "4px", left: "calc(50% - 3px)" }} />
        
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center absolute transition-transform duration-700"
             style={{ transform: hovered ? "rotate(-180deg)" : "rotate(0deg)" }}>
          <Compass size={14} className="text-white animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Orbital Concentric Dial</span>
        <span className="block text-[7px] font-mono text-neutral-600">HOVER TO TRANSMIT TELEMETRY ROTATION</span>
      </div>
    </div>
  );
}

// 6. Interactive flow field swirling currents (mockup vector grid)
function InteractiveVectorFlowField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

      const spacing = 16; // Dense vector grid spacing
      const lineLength = 8; // Length of grid vectors
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      // Draw vector flow grid
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          // Sandbox center swirl origin
          const centerX = width / 2;
          const centerY = height / 2;

          const dxToCenter = x - centerX;
          const dyToCenter = y - centerY;
          const distToCenter = Math.hypot(dxToCenter, dyToCenter) || 1;

          // Vortex swirl angle
          const spiralAngle = Math.atan2(dyToCenter, dxToCenter) + Math.PI / 2;
          const waveOffset = Math.sin(time * 0.015 + distToCenter * 0.015) * 0.3;
          const baseAngle = spiralAngle + waveOffset;

          let angle = baseAngle;
          const dxToMouse = mouse.x - x;
          const dyToMouse = mouse.y - y;
          const distToMouse = Math.hypot(dxToMouse, dyToMouse);

          let opacity = 0.15; // Sleeker resting opacity for higher contrast
          let scaleMultiplier = 1.0;

          if (mouse.x !== -1000 && mouse.y !== -1000) {
            const influenceRadius = 120; // Expanded active canvas sweep
            if (distToMouse < influenceRadius) {
              const influence = 1 - distToMouse / influenceRadius;
              const smoothInfluence = influence * influence * (3 - 2 * influence);
              
              // Hybrid dynamic physics: Points directly at pointer when close, swirls when further
              const directAngle = Math.atan2(dyToMouse, dxToMouse); 
              const swirlAngle = Math.atan2(dyToMouse, dxToMouse) + Math.PI / 2;
              
              const blendRatio = Math.min(1, distToMouse / 60); // 0 = close (attract), 1 = far (swirl)
              const mouseAngle = (1 - blendRatio) * directAngle + blendRatio * swirlAngle;
              
              angle = (1 - smoothInfluence) * baseAngle + smoothInfluence * mouseAngle;
              
              opacity = 0.15 + smoothInfluence * 0.72;
              scaleMultiplier = 1.0 + smoothInfluence * 0.65; // Dynamic length physical warp
            }
          }

          const halfL = (lineLength / 2) * scaleMultiplier;
          const lx = Math.cos(angle) * halfL;
          const ly = Math.sin(angle) * halfL;

          ctx.beginPath();
          ctx.moveTo(x - lx, y - ly);
          ctx.lineTo(x + lx, y + ly);
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = opacity > 0.3 ? 1.25 : 0.8;
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
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">Vector Flow Field</span>
        <span className="block text-[7px] font-mono text-neutral-600 uppercase">HIGH-FIDELITY VECTOR ROTATIONAL VORTEX GRID</span>
      </div>
    </div>
  );
}

// 7. Interactive CRT 3D grid mesh bulge
function InteractiveCRTGridBulge() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r][c+1].x, points[r][c+1].y);
            ctx.stroke();
          }
          if (r < rows - 1) {
            ctx.beginPath();
            ctx.moveTo(points[r][c].x, points[r][c].y);
            ctx.lineTo(points[r+1][c].x, points[r+1][c].y);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.moveTo(points[r][c].x - 2, points[r][c].y);
          ctx.lineTo(points[r][c].x + 2, points[r][c].y);
          ctx.moveTo(points[r][c].x, points[r][c].y - 2);
          ctx.lineTo(points[r][c].x, points[r][c].y + 2);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
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
        <span className="block text-[9px] font-mono text-neutral-400 uppercase tracking-widest">CRT Coordinate Mesh</span>
        <span className="block text-[7px] font-mono text-neutral-600">3D VECTOR DISTORTION & BULGE DYNAMICS</span>
      </div>
    </div>
  );
}

// ==========================================
// MAIN SANDBOX WRAPPER COMPONENT
// ==========================================
export default function MotionSandbox() {
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

  return (
    <div className="min-h-screen bg-black text-white md:max-w-xl md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 pb-20 relative overflow-hidden">
      <ConstellationBackground opacity={0.45} particleCount={100} />
      {/* Injecting CSS scope directly so it remains fully isolated and safe */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Core animation definitions for sandbox */
        
        /* 1. Strike-through sweep */
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
          background-color: #a3a3a3;
          animation: strikeSweep 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* 2. Spring checkbox pop */
        @keyframes checkboxSpring {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-checkbox-spring {
          animation: checkboxSpring 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 3. Border sweep animation */
        @keyframes borderSweep {
          0% { background-position: center, 150% center; }
          100% { background-position: center, -50% center; }
        }
        .border-sweep-container {
          position: relative;
          border: 1px solid transparent;
          background: linear-gradient(#0a0a0a, #0a0a0a) padding-box,
                      linear-gradient(#262626, #262626) border-box;
          transition: transform 0.25s ease, background 0.25s ease;
        }
        .border-sweep-container:hover {
          background: linear-gradient(#0a0a0a, #0a0a0a) padding-box,
                      linear-gradient(90deg, #262626 0%, #262626 40%, #ffffff 50%, #262626 60%, #262626 100%) border-box;
          background-size: auto, 200% auto;
          background-position: center, 150% center;
          animation: borderSweep 2.2s linear infinite;
          transform: translateY(-2px);
        }

        /* 4. Pulse halo heartbeat */
        @keyframes haloPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.55;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        .pulse-halo::before {
          content: '';
          position: absolute;
          inset: -6px;
          border: 1.5px solid #ffffff;
          border-radius: 6px;
          animation: haloPulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          pointer-events: none;
        }

        /* 5. Breathing Aura Glow */
        @keyframes auraBreathing {
          0%, 100% {
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
          }
          50% {
            box-shadow: 0 0 24px rgba(255, 255, 255, 0.22);
          }
        }
        .aura-glow-button {
          animation: auraBreathing 3s ease-in-out infinite;
        }

        /* 6. Segments breathing glow pulse */
        @keyframes breathingSegment {
          0%, 100% { opacity: 0.65; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
        .segment-breath {
          animation: breathingSegment 2s ease-in-out infinite;
        }

        /* 7. Slide-up with spring overshoot */
        @keyframes springSlideUp {
          0% {
            transform: translateY(100%);
          }
          75% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-spring-slide-up {
          animation: springSlideUp 0.48s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* 8. Rotate border loader */
        @keyframes borderRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-border-rotate {
          animation: borderRotate 0.6s linear;
        }

        /* 9. Liquid mercury chrome fluid text gradient */
        @keyframes chromeLiquid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .liquid-chrome-text {
          background: linear-gradient(
            110deg,
            #888888 0%,
            #444444 35%,
            #ffffff 50%,
            #444444 65%,
            #888888 100%
          );
          background-size: 300% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: chromeLiquid 5s ease-in-out infinite;
        }

        /* 10. Glitch glitch layer clip animation */
        @keyframes glitchClip1 {
          0% { clip-path: inset(40% 0 61% 0); }
          20% { clip-path: inset(92% 0 1% 0); }
          40% { clip-path: inset(25% 0 58% 0); }
          60% { clip-path: inset(80% 0 5% 0); }
          80% { clip-path: inset(11% 0 85% 0); }
          100% { clip-path: inset(40% 0 61% 0); }
        }
        @keyframes glitchClip2 {
          0% { clip-path: inset(12% 0 85% 0); }
          20% { clip-path: inset(55% 0 35% 0); }
          40% { clip-path: inset(78% 0 10% 0); }
          60% { clip-path: inset(15% 0 80% 0); }
          80% { clip-path: inset(95% 0 2% 0); }
          100% { clip-path: inset(12% 0 85% 0); }
        }
        .glitch-hover:hover .glitch-layer-1 {
          animation: glitchClip1 0.7s steps(2) infinite alternate-reverse;
        }
        .glitch-hover:hover .glitch-layer-2 {
          animation: glitchClip2 0.7s steps(2) infinite alternate-reverse;
        }

        /* Retro screen CRT scanning scanlines overlay */
        .scanline-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            rgba(18, 18, 18, 0) 50%,
            rgba(0, 0, 0, 0.3) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.03),
            rgba(0, 255, 0, 0.01),
            rgba(0, 0, 255, 0.03)
          );
          background-size: 100% 3px, 3px 100%;
          pointer-events: none;
          z-index: 10;
        }
        .scanline-beam {
          position: absolute;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0)
          );
          animation: scanlineScroll 6s linear infinite;
          pointer-events: none;
          z-index: 11;
        }
        @keyframes scanlineScroll {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-900 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase">Aether Motion Sandbox</h1>
            <p className="text-[10px] text-neutral-500 font-mono">Interactive Motion UI playground</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800 px-2 py-1 rounded text-[9px] font-mono text-neutral-400 select-none">
          <Sparkles size={10} className="text-white animate-pulse" />
          <span>V1.2</span>
        </div>
      </header>

      {/* Intro info box */}
      <div className="m-6 p-4 border border-neutral-900 bg-neutral-950/40 rounded-lg flex items-start gap-3 select-none">
        <Info size={16} className="text-neutral-400 shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-neutral-400 tracking-wide leading-relaxed">
          Welcome to the expanded sandbox! This page is fully isolated and does not affect the production app. Click, hover, and test the animations below, then choose the ones you want us to integrate.
        </p>
      </div>

      {/* MAIN SANDBOX OPTIONS SECTION */}
      <main className="px-6 space-y-10">

        {/* NEW SECTION 0: ABSTRACT CYBERNETIC SYSTEMS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-red-500 flex items-center gap-1.5">
              <Cpu size={12} className="animate-pulse" />
              <span>Abstract Retro-Tech Systems</span>
            </h2>
            <p className="text-[10px] text-neutral-600 font-mono">Cybernetic feedback, vector fields, and liquid metals</p>
          </div>

          <div className="grid grid-cols-1 gap-6">

            {/* A. Liquid Mercury Chrome Text */}
            <div className="p-5 border border-neutral-900 bg-neutral-950/80 rounded-lg space-y-3 relative overflow-hidden select-none">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">A. Liquid Mercury Chrome Mask</span>
              <div className="text-center py-4">
                <h3 className="text-4xl font-extrabold tracking-tighter uppercase liquid-chrome-text">
                  Aether goals
                </h3>
              </div>
              <p className="text-[9px] font-mono text-neutral-500 leading-relaxed text-center">
                Uses smooth background size scrolling across a high-contrast multi-stop silver gradient to simulate liquid silver/mercury.
              </p>
            </div>

            {/* B. Cyber Glitch & Decoder Card */}
            <div className="p-5 border border-neutral-900 bg-neutral-950/80 rounded-lg space-y-4 select-none cursor-pointer glitch-hover relative overflow-hidden">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">B. Hover Glitch & Decrypt Text Card</span>
              
              <div className="relative">
                {/* Real text + decrypter */}
                <h4 className="text-lg font-bold text-white tracking-tight relative z-10">
                  <DecryptText text="ESTABLISHING QUANTUM PROTOCOL" />
                </h4>
                
                {/* Glitch overlays appearing on hover */}
                <span className="absolute inset-0 text-lg font-bold text-red-600 tracking-tight z-0 opacity-0 glitch-layer-1 pointer-events-none select-none font-mono">
                  ESTABLISHING QUANTUM PROTOCOL
                </span>
                <span className="absolute inset-0 text-lg font-bold text-cyan-600 tracking-tight z-0 opacity-0 glitch-layer-2 pointer-events-none select-none font-mono">
                  ESTABLISHING QUANTUM PROTOCOL
                </span>
              </div>

              <p className="text-[9px] font-mono text-neutral-500 leading-relaxed">
                Hover card to split and glitch the text container geographically, while dynamically scrambling individual characters at 40Hz.
              </p>
            </div>

            {/* C. Interactive Constellation Vector Grid */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">C. Interactive Vector Network field</span>
              <InteractiveParticleCanvas />
            </div>

            {/* D. Cryptographic Ledger Logging Terminal */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">D. System Ledger Console Simulator</span>
              <LedgerLogStream />
            </div>

            {/* E. Glassmorphic Morph-Pill Tabs */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">E. Morphing Pill Tab Switcher</span>
              <GlassmorphicMorphTab />
            </div>

            {/* F. Orbital Concentric Dial Bezel */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">F. Orbital Concentric Telemetry Bezel</span>
              <OrbitalBezelMenu />
            </div>

            {/* G. Swirling Flow Field */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">G. Interactive Swirling Flow Field</span>
              <InteractiveVectorFlowField />
            </div>

            {/* H. CRT Grid Bulge */}
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">H. CRT 3D Coordinate Grid Bulge</span>
              <InteractiveCRTGridBulge />
            </div>

          </div>
        </section>

        {/* SECTION 1: INTERACTIVE CARDS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">1. Interactive Goal Cards</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Test hover states & click/tap responses</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Style A: Standard Hover */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400">Option A: Transparent Minimal (Crystalline Border)</span>
              <div className="p-4 bg-white/[0.02] border border-white/[0.05] backdrop-blur-[12px] rounded-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_4px_32px_rgba(255,255,255,0.04)] cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Option A</span>
                  <MoreHorizontal size={14} className="text-neutral-500" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Sleek Flat Glass Border</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/3" />
                </div>
              </div>
            </div>

            {/* Style B: Tactile Spring & Shadow Elevation */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400">Option B: Tactile Glass Spring & Diffused Glow</span>
              <div className="p-4 bg-white/[0.04] border border-white/[0.07] backdrop-blur-[16px] rounded-lg transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(255,255,255,0.06)] active:scale-[0.97] active:translate-y-0.5 cursor-pointer select-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Tactile</span>
                  <MoreHorizontal size={14} className="text-neutral-500 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Hover to lift. Tap/Hold to depress.</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-2/3" />
                </div>
              </div>
            </div>

            {/* Style C: Signature Ultra-Glassmorphic Border Sweep */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400">Option C: Signature Crystalline Glass & Masked Sweep (Production Standard)</span>
              <div className="p-4 border-sweep-card cursor-pointer select-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-900 bg-neutral-950/80 backdrop-blur-sm rounded-md">Masked Sweep</span>
                  <MoreHorizontal size={14} className="text-neutral-500" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Frosted glass & masked gradient sweep</h3>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-1/2" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: PROGRESS BARS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">2. Segmented Progress Bar Entrances</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Staggered cascades vs. breathing glow modes</p>
          </div>

          <div className="space-y-6">
            
            {/* Cascade Staggered Fill */}
            <div className="p-4 border border-neutral-800 bg-neutral-950 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-400">Style A: Staggered &ldquo;Boot-Up&rdquo; Cascade</span>
                <button
                  onClick={() => setCascadeTrigger1(prev => prev + 1)}
                  className="px-2 py-1 bg-white text-black text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1 hover:bg-neutral-200 active:scale-95 transition-all"
                >
                  <Play size={8} fill="black" />
                  <span>Trigger</span>
                </button>
              </div>

              {/* Segmented display */}
              <div className="flex gap-[3px] h-6 w-full" key={`cascade-1-${cascadeTrigger1}`}>
                {Array.from({ length: 20 }).map((_, idx) => {
                  const isActive = idx < 12;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-full rounded-[1px] transition-all duration-300 ${
                        isActive ? "bg-white" : "bg-neutral-800"
                      }`}
                      style={{
                        animation: isActive ? "fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                        animationDelay: isActive ? `${idx * 15}ms` : "0ms",
                        opacity: isActive ? 0 : 1, // Start hidden to let fadeIn animate it
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Breathing Organic Glow */}
            <div className="p-4 border border-neutral-800 bg-neutral-950 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-400">Style B: Breathing Engine Glow</span>
                <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">Autonomous loop</span>
              </div>

              {/* Segmented display */}
              <div className="flex gap-[3px] h-6 w-full">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const isActive = idx < 15;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-full rounded-[1px] ${
                        isActive ? "bg-white segment-breath" : "bg-neutral-800"
                      }`}
                      style={{
                        animationDelay: isActive ? `${idx * 40}ms` : "0ms",
                      }}
                    />
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: SUBTASKS CHECKLIST */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">3. Checklist Micro-Animations</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Strike-through styles and checkbox feedback</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Style A: Spring checkbox + sweep line */}
            <div 
              onClick={() => setSubtaskChecked1(!subtaskChecked1)}
              className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-lg cursor-pointer hover:border-neutral-800 hover:bg-neutral-950 select-none transition-all duration-200"
            >
              {/* Checkbox */}
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${
                  subtaskChecked1
                    ? "bg-white border-white text-black animate-checkbox-spring"
                    : "border-neutral-700 bg-transparent text-transparent hover:border-neutral-500"
                }`}
              >
                <Check size={11} strokeWidth={3.5} />
              </div>

              {/* Checked strike line through text */}
              <span
                className={`text-xs font-mono transition-all duration-300 ${
                  subtaskChecked1 
                    ? "text-neutral-500 animate-strike-sweep" 
                    : "text-white"
                }`}
              >
                Task Style A: Checkbox spring & sweep strike-through line
              </span>
            </div>

            {/* Style B: Rotate check + blur fade */}
            <div 
              onClick={() => setSubtaskChecked2(!subtaskChecked2)}
              className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-lg cursor-pointer hover:border-neutral-800 hover:bg-neutral-950 select-none transition-all duration-200"
            >
              {/* Checkbox */}
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all duration-300 ${
                  subtaskChecked2
                    ? "bg-white border-white text-black animate-border-rotate"
                    : "border-neutral-700 bg-transparent text-transparent hover:border-neutral-500"
                }`}
              >
                <Check size={11} strokeWidth={3.5} />
              </div>

              {/* Text fades and blurs slightly */}
              <span
                className={`text-xs font-mono transition-all duration-300 ${
                  subtaskChecked2 
                    ? "text-neutral-600 blur-[0.4px] opacity-40 line-through" 
                    : "text-white"
                }`}
              >
                Task Style B: Circular rotate loader check & text blur fade
              </span>
            </div>

          </div>
        </section>

        {/* SECTION 4: HEADER COMPRESSION (DEVICE MOCK) */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">4. Scroll-Driven Header Compression</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Scroll the phone box to see padding & blur adapt</p>
          </div>

          {/* Interactive device frame mock */}
          <div className="border border-neutral-800 bg-black rounded-xl overflow-hidden shadow-2xl relative max-w-sm mx-auto">
            {/* Floating indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-neutral-900 rounded-full z-50 flex items-center justify-center">
              <span className="text-[6px] text-neutral-500 font-mono tracking-widest uppercase">Aether OS</span>
            </div>

            {/* Sim Scroll Area */}
            <div 
              className="h-64 overflow-y-auto pt-16 pb-8 px-4 space-y-4"
              onScroll={handleScrollSim}
            >
              {/* Scrollable grid filler */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="p-3 border border-neutral-900 bg-neutral-950/60 rounded-md select-none">
                  <div className="w-1/3 h-1.5 bg-neutral-800 rounded mb-2" />
                  <div className="w-full h-3 bg-neutral-900 rounded" />
                </div>
              ))}
            </div>

            {/* Absolute Compressing Header Mock */}
            <div 
              className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 border-b flex items-center justify-between px-4 ${
                scrollY > 20 
                  ? "py-2 bg-neutral-950/80 backdrop-blur-md border-neutral-900 shadow-md" 
                  : "py-5 bg-transparent border-transparent"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full bg-white ${scrollY > 20 ? "animate-pulse" : ""}`} />
                <span className={`font-black tracking-tight transition-all uppercase ${scrollY > 20 ? "text-xs" : "text-sm"}`}>Aether</span>
              </div>
              <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest">
                {scrollY > 20 ? "DOCK MINIMAL" : "LEADERBOARD ACTIVE"}
              </span>
            </div>

            {/* Overlay description */}
            <div className="p-2 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-[8px] font-mono text-neutral-400">
              <span>Scroll Y: {scrollY}px</span>
              <span>Header: {scrollY > 20 ? "Compressed (80% transparent + blur)" : "Default (Large)"}</span>
            </div>

          </div>
        </section>

        {/* SECTION 5: FLOATING ACTION BUTTON PULSING HALOS */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">5. New Goal Action Button Pulses</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Attract attention elegantly in dark themes</p>
          </div>

          <div className="flex flex-wrap justify-around items-center gap-6 p-6 border border-neutral-800 bg-neutral-950 rounded-lg">
            
            {/* Style A: Heartbeat Ring Halo */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">Style A: Heartbeat Halo</span>
              <button className="relative flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md pulse-halo hover:bg-neutral-200 active:scale-95 transition-all">
                <Plus size={11} strokeWidth={3} />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Style B: Aura Breathing Glow */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">Style B: Breathing Aura</span>
              <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md aura-glow-button hover:bg-neutral-200 active:scale-95 transition-all">
                <Plus size={11} strokeWidth={3} />
                <span>Add Goal</span>
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 6: MODAL SLIDE-UP SPRING DRAWER */}
        <section className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-500">6. Spring-Overshoot Sheet Modal</h2>
            <p className="text-[10px] text-neutral-600 font-mono">Simulates iOS bottom sheet dynamics on click</p>
          </div>

          <div className="p-4 border border-neutral-800 bg-neutral-950 rounded-lg flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded transition-all active:scale-95"
            >
              Open Spring Drawer
            </button>
            <span className="text-[8px] font-mono text-neutral-500">Includes backdrop blur + spring overshoot slide</span>
          </div>
        </section>

      </main>

      {/* DETACHED SIMULATED BOTTOM SPRING DRAWER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in md:max-w-xl md:mx-auto">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0 z-10" onClick={() => setIsModalOpen(false)} />

          {/* Sliding Sheet Panel with Spring Overshoot animation */}
          <div className="w-full bg-neutral-950 border-t border-neutral-800 px-6 pt-3 pb-8 rounded-t-2xl z-20 space-y-6 shadow-2xl animate-spring-slide-up relative">
            
            {/* Drag Handle aesthetic bar */}
            <div className="w-10 h-1 bg-neutral-800 rounded-full mx-auto mb-3" />

            <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide font-mono text-white">Simulation: Spring Drawer</h3>
                <p className="text-[9px] text-neutral-500 font-mono">Feels snappy, responsive, and tactile</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-2.5 py-1 border border-neutral-800 hover:border-neutral-600 bg-black text-[9px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white rounded"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Observe how this drawer slides up. Instead of a linear sliding motion, it slightly overshoots the target resting place and then settles down dynamically. This micro-rebound mimics mechanical physics.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 bg-black border border-neutral-900 rounded-lg flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Bezier Curve</span>
                <span>cubic-bezier(0.25, 1, 0.5, 1)</span>
              </div>
              <div className="p-3 bg-black border border-neutral-900 rounded-lg flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>Transition Duration</span>
                <span>480ms with 8px overshoot</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
