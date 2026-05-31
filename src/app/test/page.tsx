"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft, LogOut, Plus, Search, MoreHorizontal, Edit2, Trash2, ChevronUp, ChevronDown, AlertTriangle, Check, Calendar, Activity, Flame, ShieldCheck, GlassWater, BookOpen, Brain, Heart, Moon, Sparkles, Dumbbell, Apple, Coffee, Clock } from "lucide-react";

// ─── STAGE LOAD DELAY STYLE ANIMATIONS ───────────────────────────────────
// Inject custom Google Font (JetBrains Mono) and keyframe animations
const CSS_STYLE_BLOCK = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');

* {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideLeft {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-accent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes scan-line {
  0% { transform: translateY(-200px); opacity: 0.2; }
  50% { opacity: 0.6; }
  100% { transform: translateY(800px); opacity: 0.2; }
}

@keyframes border-breathe {
  0%, 100% { border-color: rgba(232,255,71,0.3); }
  50% { border-color: rgba(232,255,71,0.85); }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.anim-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.anim-slide-up {
  opacity: 0;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.anim-slide-left {
  opacity: 0;
  animation: slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

// ─── COUNT-UP ANIMATION ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  
  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  
  return value;
}

// ─── COUNTDOWN TIMER ─────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  
  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  
  return timeLeft;
}

// ─── CANVAS 1: NEURAL BACKGROUND ─────────────────────────────────────────
function NeuralCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let running = true;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const nodeCount = 40;
    const nodes: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      phase: number;
      phaseSpeed: number;
    }[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.02 + Math.random() * 0.03
      });
    }
    
    let activeIndices = [0, 1, 2];
    const intervalId = setInterval(() => {
      activeIndices = [
        Math.floor(Math.random() * nodeCount),
        Math.floor(Math.random() * nodeCount),
        Math.floor(Math.random() * nodeCount)
      ];
    }, 2000);
    
    let frameId: number;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      
      // Update nodes coordinates
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += n.phaseSpeed;
        
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });
      
      // Connect nodes
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.15;
            const isActiveLink = activeIndices.includes(i) || activeIndices.includes(j);
            ctx.strokeStyle = isActiveLink ? `rgba(232, 255, 71, ${opacity * 1.6})` : `rgba(255, 255, 255, ${opacity * 0.6})`;
            ctx.lineWidth = isActiveLink ? 1.2 : 0.6;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }
      
      // Draw individual nodes
      nodes.forEach((n, idx) => {
        const pulse = 2.2 + Math.sin(n.phase) * 1.3;
        const isActive = activeIndices.includes(idx);
        
        ctx.fillStyle = isActive ? "#e8ff47" : "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, isActive ? pulse + 0.8 : pulse, 0, Math.PI * 2);
        ctx.fill();
        
        if (isActive) {
          ctx.strokeStyle = "rgba(232, 255, 71, 0.2)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulse + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);
  
  return <canvas ref={canvasRef} className="w-full h-full block bg-black" />;
}

// ─── CANVAS 2: ORBITAL BACKGROUND ────────────────────────────────────────
function OrbitalCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let running = true;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const orbits = [
      { radius: 45, speed: 0.007, dots: 4, dir: 1 },
      { radius: 75, speed: 0.005, dots: 5, dir: -1 },
      { radius: 105, speed: 0.003, dots: 6, dir: 1 }
    ];
    
    let angleOffset = 0;
    
    let frameId: number;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      
      angleOffset += 0.01;
      
      // Central precision targets
      ctx.strokeStyle = "#e8ff47";
      ctx.lineWidth = 0.8;
      
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16);
      ctx.stroke();
      
      ctx.fillStyle = "#e8ff47";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "rgba(232, 255, 71, 0.25)";
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
      
      // Rotating orbits
      orbits.forEach((orbit) => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, orbit.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        for (let i = 0; i < orbit.dots; i++) {
          const angle = (i / orbit.dots) * Math.PI * 2 + angleOffset * orbit.speed * 220 * orbit.dir;
          const dotX = cx + Math.cos(angle) * orbit.radius;
          const dotY = cy + Math.sin(angle) * orbit.radius;
          
          ctx.fillStyle = i === 0 ? "#e8ff47" : "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(dotX, dotY, i === 0 ? 3.5 : 2.2, 0, Math.PI * 2);
          ctx.fill();
          
          if (i === 0) {
            ctx.strokeStyle = "rgba(232, 255, 71, 0.3)";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 6.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
      
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);
  
  return <canvas ref={canvasRef} className="w-full h-full block bg-black" />;
}

// ─── CANVAS 3: CONSTELLATION BACKGROUND ──────────────────────────────────
function ConstellationCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let running = true;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseVx: number;
      baseVy: number;
    }[] = [];
    
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.3;
      const vy = (Math.random() - 0.5) * 0.3;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy
      });
    }
    
    let mouseX = -9999;
    let mouseY = -9999;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    
    let frameId: number;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p) => {
        if (mouseX !== -9999) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            const force = (1 - dist / 150) * 0.15;
            p.vx += (dx / dist) * force * 0.25;
            p.vy += (dy / dist) * force * 0.25;
          } else {
            p.vx = p.vx * 0.95 + p.baseVx * 0.05;
            p.vy = p.vy * 0.95 + p.baseVy * 0.05;
          }
        } else {
          p.vx = p.vx * 0.95 + p.baseVx * 0.05;
          p.vy = p.vy * 0.95 + p.baseVy * 0.05;
        }
        
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });
      
      // Draw lines
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 70) {
            ctx.strokeStyle = `rgba(232, 255, 71, ${(1 - dist / 70) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      particles.forEach((p) => {
        ctx.fillStyle = "rgba(232, 255, 71, 0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);
  
  return <canvas ref={canvasRef} className="w-full h-full block bg-black" />;
}

// ─── CANVAS 4: FLOW FIELD BACKGROUND ─────────────────────────────────────
function FlowFieldCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let running = true;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const gridCols = 16;
    const gridRows = 8;
    
    let time = 0;
    
    let frameId: number;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      
      time += 0.005;
      
      const cellWidth = width / gridCols;
      const cellHeight = height / gridRows;
      
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const cx = c * cellWidth + cellWidth / 2;
          const cy = r * cellHeight + cellHeight / 2;
          
          const noiseVal = Math.sin(c * 0.3 + time) * Math.cos(r * 0.4 - time * 1.5) * Math.PI * 2;
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(noiseVal);
          
          const angleNorm = (noiseVal + Math.PI * 2) % (Math.PI * 2);
          const ratio = Math.abs(Math.sin(angleNorm));
          
          // Interpolate arrow color from dim white to accent #e8ff47
          ctx.strokeStyle = `rgba(${Math.round(255 - (255 - 232) * ratio)}, ${Math.round(255 - (255 - 255) * ratio)}, ${Math.round(255 - (255 - 71) * ratio)}, ${0.1 + ratio * 0.65})`;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.lineTo(3, -2);
          ctx.moveTo(6, 0);
          ctx.lineTo(3, 2);
          ctx.stroke();
          
          ctx.restore();
        }
      }
      
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);
  
  return <canvas ref={canvasRef} className="w-full h-full block bg-black" />;
}

// ─── HERO STAT CELL COMPONENT ────────────────────────────────────────────
function HeroStatCell({ 
  label, 
  value, 
  sub, 
  active, 
  onClick 
}: { 
  label: string; 
  value: number; 
  sub: string; 
  active: boolean; 
  onClick: () => void 
}) {
  const animatedValue = useCountUp(value);
  const formattedVal = String(animatedValue).padStart(2, "0");
  
  return (
    <div 
      onClick={onClick}
      className={`flex-1 p-4 cursor-pointer select-none transition-all duration-300 border-r border-white/5 last:border-r-0 ${
        active 
          ? "bg-[#e8ff47]/5 border-l-[3px] border-l-[#e8ff47]" 
          : "hover:bg-white/[0.02] border-l-[3px] border-l-transparent"
      }`}
    >
      <span className="text-[10px] uppercase tracking-widest text-[#888888] font-light block select-none">
        {label}
      </span>
      <span className="text-5xl font-bold tracking-tight text-white block mt-2.5 tabular-nums select-none">
        {formattedVal}
      </span>
      <span className={`text-[10px] font-medium block mt-1.5 select-none ${active ? "text-[#e8ff47]" : "text-[#444444]"}`}>
        {sub}
      </span>
    </div>
  );
}

// ─── SEGMENTED PROGRESS BAR COMPONENT ────────────────────────────────────
function SegmentedBar({ progress, segments = 20 }: { progress: number; segments?: number }) {
  const filled = Math.round((progress / 100) * segments);
  return (
    <div className="flex gap-[3.5px] items-center select-none">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-[7px] rounded-[1px] transition-all duration-300"
          style={{
            backgroundColor: i < filled ? "#e8ff47" : "rgba(255,255,255,0.06)",
            boxShadow: i < filled ? "0 0 4px rgba(232,255,71,0.25)" : "none"
          }}
        />
      ))}
    </div>
  );
}

// ─── GOAL CARD COMPONENT ─────────────────────────────────────────────────
function GoalCardComponent({ 
  title, 
  progress, 
  tags, 
  delta, 
  tasks 
}: { 
  title: string; 
  progress: number; 
  tags: string[]; 
  delta: number; 
  tasks: { done: number; total: number } 
}) {
  const isHighProgress = progress > 50;
  
  return (
    <div 
      className="p-4 bg-[#111111] border border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]/40 transition-all duration-300 flex flex-col justify-between min-h-[92px] relative group"
      style={{
        borderLeft: isHighProgress ? "2.5px solid #e8ff47" : "2.5px solid rgba(255,255,255,0.06)"
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-xs font-bold tracking-wide text-[#f5f5f5] uppercase font-mono group-hover:text-[#e8ff47] transition-colors select-none">
          ▸ {title}
        </h3>
        <div className="flex gap-1 shrink-0 select-none">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-0.5 text-[8px] font-bold text-[#888888] border border-white/5 rounded-full uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SegmentedBar progress={progress} segments={20} />
        </div>
        
        <div className="flex items-center gap-3 shrink-0 select-none">
          <span className="text-xs font-bold text-white tabular-nums">{progress}%</span>
          <span className="text-[10px] text-[#444444] font-medium uppercase">{tasks.done}/{tasks.total} Tasks</span>
          <span className="text-[10px] text-[#e8ff47] font-bold tabular-nums">↑+{delta}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── HABIT ROW COMPONENT ─────────────────────────────────────────────────
function HabitRow({ 
  title, 
  target, 
  logs, 
  streak,
  rate 
}: { 
  title: string; 
  target: number; 
  logs: number[]; 
  streak: number;
  rate: number;
}) {
  return (
    <div className="space-y-2.5 py-3.5 border-b border-white/5 last:border-b-0">
      <div className="flex justify-between items-center select-none">
        <span className="text-xs font-bold text-white tracking-wide uppercase font-sans">
          {title}
        </span>
        <span className="text-[9px] text-[#888888] tracking-widest font-light font-mono">
          TARGET: {target}/DAY
        </span>
      </div>

      {/* 30 Day grid squares */}
      <div className="flex gap-[3.5px] overflow-hidden select-none">
        {logs.map((val, idx) => {
          let cellStyle = "bg-[#1a1a1a] border border-white/5"; 
          if (val === 1) {
            cellStyle = "bg-[#e8ff47]";
          } else if (val === 0.5) {
            cellStyle = "bg-[#e8ff47]/25";
          }
          
          return (
            <div 
              key={idx} 
              className={`flex-1 aspect-square rounded-[1px] ${cellStyle} transition-all duration-300 hover:scale-110 cursor-crosshair`}
              title={`DAY -${30 - 1 - idx} // STATUS: ${val === 1 ? "TARGET MET" : val === 0.5 ? "PARTIAL" : "INCOMPLETE"}`}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] font-sans tracking-widest text-[#888888] font-light select-none">
        <span>STREAK: <strong className="text-white font-bold">{streak} DAYS</strong></span>
        <span>RATE: <strong className="text-[#e8ff47] font-bold">{rate}%</strong></span>
      </div>
    </div>
  );
}

// ─── DEADLINE ROW COMPONENT ──────────────────────────────────────────────
function DeadlineRow({ 
  index, 
  priority, 
  title, 
  dueDate,
  totalDuration
}: { 
  index: number; 
  priority: "CRITICAL" | "HIGH" | "NOMINAL"; 
  title: string; 
  dueDate: Date;
  totalDuration: number;
}) {
  const timeLeft = useCountdown(dueDate);
  const formattedIndex = String(index).padStart(2, "0");
  
  const now = Date.now();
  const timeTotal = totalDuration;
  const timeRemaining = dueDate.getTime() - now;
  const progressPercent = Math.max(0, Math.min(100, ((timeTotal - timeRemaining) / timeTotal) * 100));

  const isOverdue = timeRemaining <= 0;

  const badgeColors = {
    CRITICAL: "bg-[#ff4444] text-black font-bold",
    HIGH: "bg-[#e8ff47] text-black font-bold",
    NOMINAL: "bg-[#1a1a1a] text-[#888888]",
  }[priority];

  const timerText = isOverdue
    ? "00d 00h 00m 00s"
    : `${String(timeLeft.d).padStart(2, "0")}d ${String(timeLeft.h).padStart(2, "0")}h ${String(timeLeft.m).padStart(2, "0")}m ${String(timeLeft.s).padStart(2, "0")}s`;

  return (
    <div 
      className={`p-3 bg-[#111111] border border-white/5 hover:translate-x-0.5 transition-all duration-300 flex items-center justify-between gap-4 font-mono select-none ${
        isOverdue ? "bg-[#ff4444]/5 border-l-[3.5px] border-l-[#ff4444]" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] text-[#444444] tracking-wider shrink-0 tabular-nums">
          {formattedIndex}
        </span>
        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider rounded-md shrink-0 font-bold ${badgeColors}`}>
          {priority}
        </span>
        <span className="text-xs text-white font-medium truncate max-w-[130px] sm:max-w-none">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[10px] font-bold tabular-nums ${isOverdue ? "text-[#ff4444] animate-pulse" : "text-[#888888]"}`}>
          {timerText}
        </span>
        
        {/* Progress Countdown Bar */}
        <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-[1px] overflow-hidden hidden sm:flex shrink-0">
          <div 
            className={`h-full rounded-[1px] transition-all duration-1000 ${isOverdue ? "bg-[#ff4444]" : "bg-[#e8ff47]"}`}
            style={{ width: `${isOverdue ? 100 : progressPercent}%` }}
          />
        </div>

        {isOverdue && (
          <span className="text-[9px] font-bold text-[#ff4444] tracking-widest shrink-0 animate-pulse">
            OVERDUE
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const MOCK_GOALS = [
  {
    title: 'CODE EXECUTION VISUALIZER',
    progress: 67,
    tags: ['DEV', 'FRONT-END'],
    delta: 14,
    tasks: { done: 4, total: 6 }
  },
  {
    title: 'JOB APPLICATIONS',
    progress: 33,
    tags: ['CAREER', 'OUTREACH'],
    delta: 25,
    tasks: { done: 2, total: 9 }
  },
  {
    title: 'THESIS PUBLICATION',
    progress: 20,
    tags: ['ACADEMIC', 'RESEARCH'],
    delta: 8,
    tasks: { done: 1, total: 5 }
  },
];

// Generate stable habit logs seeded consistently
const generateHabitLogs = (streak: number, rate: number, days = 30) => {
  return Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    if (daysAgo < streak) return 1; // Completed
    
    // Stable pseudo-random wave values
    const val = Math.sin(i * 2.7 + rate);
    if (val > (1 - rate)) return 1;
    if (val > (0.6 - rate)) return 0.5; // Partial
    return 0; // Incomplete
  });
};

const MOCK_HABITS = [
  {
    title: 'DEEP WORK SESSIONS',
    target: 3,
    completionsToday: 2,
    streak: 12,
    rate: 84,
    logs: generateHabitLogs(12, 0.84),
  },
  {
    title: 'DSA PRACTICE',
    target: 1,
    completionsToday: 1,
    streak: 18,
    rate: 91,
    logs: generateHabitLogs(18, 0.91),
  },
  {
    title: 'PHYSICAL TRAINING',
    target: 1,
    completionsToday: 0,
    streak: 7,
    rate: 71,
    logs: generateHabitLogs(7, 0.71),
  },
];

const MOCK_DEADLINES = [
  {
    title: 'CV SUBMISSION',
    priority: 'CRITICAL' as const,
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    totalDuration: 7 * 24 * 60 * 60 * 1000, 
  },
  {
    title: 'BRAIN STATION APPLICATION',
    priority: 'HIGH' as const,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    totalDuration: 7 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'CODE VISUALIZER MVP',
    priority: 'NOMINAL' as const,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days
    totalDuration: 14 * 24 * 60 * 60 * 1000,
  },
];

// ─── MAIN STANDALONE TEST PAGE ───────────────────────────────────────────
export default function TestPage() {
  const [activeCellTab, setActiveCellTab] = useState<"goals" | "habits" | "deadlines">("goals");
  const [activeCanvas, setActiveCanvas] = useState<"NEURAL" | "ORBITAL" | "CONSTELLATION" | "FLOW FIELD">("NEURAL");
  
  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between overflow-hidden selection:bg-[#e8ff47] selection:text-black">
      {/* Custom Styles and Font Inject */}
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLE_BLOCK }} />
      
      {/* Precision grid scanning line overlay */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-[#e8ff47]/15 blur-[0.5px] pointer-events-none z-50 animate-[scan-line_4.5s_linear_infinite]" />
      
      {/* Standalone Simulator Frame Container */}
      <div className="w-full md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-white/5 min-h-screen relative flex flex-col justify-between bg-black z-10 pb-20">
        
        {/* 1. HEADER BAR */}
        <header className="py-4 px-5 border-b border-white/5 flex items-center justify-between select-none anim-fade-in shrink-0">
          <a 
            href="/"
            className="flex items-center gap-1 text-[10px] text-[#888888] hover:text-[#e8ff47] transition-colors tracking-widest font-mono uppercase font-bold"
          >
            <ArrowLeft size={10} className="stroke-[3]" />
            Back
          </a>
          
          <span className="text-[10px] text-white tracking-[0.2em] font-mono font-bold">
            AETHER / TEST.EXE
          </span>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] text-[#e8ff47] font-bold tracking-widest font-mono">
              STATUS: LIVE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8ff47] animate-[pulse-accent_1.4s_infinite]" />
          </div>
        </header>

        {/* 2. HERO STATS ROW */}
        <section className="border-b border-white/5 flex anim-slide-up shrink-0 [animation-delay:100ms]">
          <HeroStatCell
            label="Goals"
            value={6}
            sub="+2 this wk"
            active={activeCellTab === "goals"}
            onClick={() => setActiveCellTab("goals")}
          />
          <HeroStatCell
            label="Habits"
            value={12}
            sub="84% rate"
            active={activeCellTab === "habits"}
            onClick={() => setActiveCellTab("habits")}
          />
          <HeroStatCell
            label="Deadlines"
            value={3}
            sub="2 overdue"
            active={activeCellTab === "deadlines"}
            onClick={() => setActiveCellTab("deadlines")}
          />
        </section>

        {/* 3. LIVE CANVAS BACKGROUND PREVIEW STRIP */}
        <section className="border-b border-white/5 py-4 px-5 space-y-3 anim-slide-up shrink-0 [animation-delay:250ms]">
          <div className="flex gap-1 overflow-x-auto select-none scrollbar-none justify-between border border-white/5 p-1 bg-[#080808]">
            {(["NEURAL", "ORBITAL", "CONSTELLATION", "FLOW FIELD"] as const).map((canvasType) => {
              const isSelected = activeCanvas === canvasType;
              return (
                <button
                  key={canvasType}
                  onClick={() => setActiveCanvas(canvasType)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                    isSelected
                      ? "bg-[#e8ff47] text-black"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  {canvasType}
                </button>
              );
            })}
          </div>
          
          {/* Canvas container frame */}
          <div className="w-full h-[200px] border border-white/5 relative bg-black overflow-hidden select-none">
            {activeCanvas === "NEURAL" && <NeuralCanvas active={activeCanvas === "NEURAL"} />}
            {activeCanvas === "ORBITAL" && <OrbitalCanvas active={activeCanvas === "ORBITAL"} />}
            {activeCanvas === "CONSTELLATION" && <ConstellationCanvas active={activeCanvas === "CONSTELLATION"} />}
            {activeCanvas === "FLOW FIELD" && <FlowFieldCanvas active={activeCanvas === "FLOW FIELD"} />}
            
            {/* Visual target reticle box overlay */}
            <div className="absolute inset-0 border border-white/5 pointer-events-none" />
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/10 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/10 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-white/10 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/10 pointer-events-none" />
          </div>
        </section>

        {/* 4. GOAL CARDS — REDESIGNED */}
        <section className="py-5 px-5 space-y-3.5 anim-slide-up [animation-delay:350ms]">
          <div className="flex items-center justify-between select-none">
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest font-mono">
              // ACTIVE GOALS SYSTEM
            </span>
            <span className="text-[9px] text-[#444444] font-mono">
              TOTAL: {MOCK_GOALS.length} ACTIVE
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {MOCK_GOALS.map((goal, idx) => (
              <div 
                key={goal.title} 
                className="anim-slide-left"
                style={{ animationDelay: `${400 + idx * 80}ms` }}
              >
                <GoalCardComponent
                  title={goal.title}
                  progress={goal.progress}
                  tags={goal.tags}
                  delta={goal.delta}
                  tasks={goal.tasks}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. HABIT GRID — REDESIGNED */}
        <section className="py-5 px-5 border-t border-white/5 anim-slide-up [animation-delay:550ms]">
          <div className="flex items-center justify-between select-none mb-3">
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest font-mono">
              HABIT MATRIX // LAST 30 DAYS
            </span>
            <span className="text-[9px] text-[#444444] font-mono">
              MATRIX STATE: ACTIVE
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {MOCK_HABITS.map((habit) => (
              <HabitRow
                key={habit.title}
                title={habit.title}
                target={habit.target}
                logs={habit.logs}
                streak={habit.streak}
                rate={habit.rate}
              />
            ))}
          </div>
        </section>

        {/* 6. DEADLINE TICKER */}
        <section className="py-5 px-5 border-t border-white/5 anim-slide-up [animation-delay:700ms]">
          <div className="flex items-center justify-between select-none mb-3">
            <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest font-mono">
              DEADLINE QUEUE // SORTED BY URGENCY
            </span>
            <span className="text-[9px] text-red-500 font-mono animate-pulse">
              QUEUE CHECKED
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {MOCK_DEADLINES.map((deadline, idx) => (
              <DeadlineRow
                key={deadline.title}
                index={idx + 1}
                priority={deadline.priority}
                title={deadline.title}
                dueDate={deadline.dueDate}
                totalDuration={deadline.totalDuration}
              />
            ))}
          </div>
        </section>

        {/* 7. SYSTEM FOOTER */}
        <footer className="py-4 border-t border-white/5 text-center anim-slide-up [animation-delay:900ms] shrink-0 mt-8">
          <div className="text-[9px] font-mono font-light tracking-widest text-[#444444] select-none uppercase space-y-1">
            <p>
              AETHER GOALS v0.1.0 · HASIN ISHRAK · BRACU 2026
            </p>
            <p>
              SYSTEM IN <span className="text-[#e8ff47] font-bold animate-[pulse-accent_1.4s_infinite]">[SANDBOX MODE]</span>
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}
