"use client";

import React, { useState, useEffect } from "react";
import { Home as HomeIcon, Target, Plus, Activity, Settings, Clock, Flame, Check, AlertTriangle, ArrowLeft } from "lucide-react";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────
interface GoalItem {
  title: string;
  progress: number;
  tags: string[];
  delta: string;
  done: number;
  total: number;
}

interface HabitItem {
  name: string;
  target: number;
  done: number;
  streak: number;
  rate: number;
}

interface DeadlineItem {
  title: string;
  sub: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  due: Date;
  total: number;
}

// ─── STATE HOOKS ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return value;
}

function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, overdue: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      overdue: false,
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
}

function formatTime(t: ReturnType<typeof useCountdown>): string {
  if (t.overdue) return "OVERDUE";
  if (t.d > 0) return `${t.d}d ${String(t.h).padStart(2, "0")}h left`;
  return `${String(t.h).padStart(2, "0")}h ${String(t.m).padStart(2, "0")}m left`;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div className="h-11 px-6 flex justify-between items-center text-xs font-semibold text-white/95 select-none bg-transparent shrink-0">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal dots */}
        <div className="flex gap-0.5 items-end">
          <div className="w-[3px] h-1.5 bg-white rounded-[0.5px]" />
          <div className="w-[3px] h-2 bg-white rounded-[0.5px]" />
          <div className="w-[3px] h-2.5 bg-white rounded-[0.5px]" />
          <div className="w-[3px] h-3 bg-white rounded-[0.5px]" />
        </div>
        {/* WiFi SVG representation */}
        <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12 21a2 2 0 1 1-2-2 2 2 0 0 1 2 2zm10-10a14 14 0 0 0-20 0l2 2a11.12 11.12 0 0 1 16 0zm-3 3a10 10 0 0 0-14 0l2 2a6.93 6.93 0 0 1 10 0z" />
        </svg>
        {/* Battery shape */}
        <div className="w-[20px] h-[10px] border border-white/60 rounded-[2.5px] p-[1px] flex items-center relative">
          <div className="w-full h-full bg-white rounded-[1px]" />
          <div className="w-[1.5px] h-1 bg-white/60 rounded-r-[0.5px] absolute -right-[2.5px]" />
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex justify-between items-center select-none shrink-0 py-3 mt-1.5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-white font-sans">
          Overview
        </h1>
        <p className="text-[13px] font-normal text-[#9a9a9a] mt-0.5">
          Mon, June 2026
        </p>
      </div>
      
      {/* Premium Apple-Style Avatar capsule */}
      <div className="w-10 h-10 rounded-full bg-[#d4ff00] text-black font-extrabold text-sm flex items-center justify-center shadow-[0_4px_16px_rgba(212,255,0,0.2)]">
        H
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex justify-between items-center select-none py-1.5 mb-3.5 mt-6 shrink-0">
      <h2 className="text-base font-bold text-white tracking-wide">
        {title}
      </h2>
      <span className="text-[13px] font-semibold text-[#d4ff00] cursor-pointer hover:underline">
        See all →
      </span>
    </div>
  );
}

function HeroCard({ 
  accentFilled, 
  label, 
  value, 
  sub 
}: { 
  accentFilled?: boolean; 
  label: string; 
  value: string | number; 
  sub: string 
}) {
  const svgColor = accentFilled ? "#000000" : "#d4ff00";
  
  return (
    <div 
      className="p-5 rounded-[20px] h-[160px] flex flex-col justify-between select-none animate-[scaleIn_500ms_ease_both] border"
      style={{
        backgroundColor: accentFilled ? "#d4ff00" : "#1e1e1e",
        borderColor: accentFilled ? "transparent" : "rgba(255,255,255,0.07)",
        color: accentFilled ? "#000000" : "#ffffff",
        boxShadow: accentFilled ? "0 8px 30px rgba(212,255,0,0.15)" : "none"
      }}
    >
      <div className="flex items-center justify-between">
        {accentFilled ? (
          /* Inline targets SVG */
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={svgColor} strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        ) : (
          /* Inline graph SVG */
          <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke={svgColor} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
          </svg>
        )}
      </div>

      <div className="space-y-1 mt-3">
        <span className="text-[48px] font-extrabold tracking-tighter leading-none block font-sans tabular-nums">
          {value}
        </span>
        <span className={`text-[12px] font-medium block leading-none ${accentFilled ? "text-black/70" : "text-[#9a9a9a]"}`}>
          {label}
        </span>
      </div>

      <span className={`text-[11px] font-medium block mt-1.5 ${accentFilled ? "text-black/60" : "text-[#9a9a9a]"}`}>
        {sub}
      </span>
    </div>
  );
}

function GoalCard({ 
  title, 
  progress, 
  tags, 
  delta, 
  done, 
  total,
  animDelay 
}: GoalItem & { animDelay: number }) {
  const [percent, setPercent] = useState(0);
  
  useEffect(() => {
    const t = setTimeout(() => {
      setPercent(progress);
    }, animDelay + 100);
    return () => clearTimeout(t);
  }, [progress, animDelay]);

  const stripColor = progress > 60
    ? "#d4ff00"
    : progress >= 30
    ? "#fbbf24"
    : "#555555";

  return (
    <div 
      className="bg-[#1e1e1e] rounded-[16px] border border-white/[0.07] hover:border-white/[0.13] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden pl-[20px] pr-5 py-4 flex flex-col justify-between min-h-[110px] mb-3 shrink-0"
      style={{
        animation: `fadeSlideUp 400ms ease ${animDelay}ms both`
      }}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: stripColor }}
      />
      
      <div className="flex justify-between items-center gap-3">
        <h3 className="text-[13px] font-bold text-white tracking-wide truncate max-w-[195px] uppercase font-sans">
          {title}
        </h3>
        <div className="flex gap-1 select-none shrink-0">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2.5 py-0.5 text-[9px] font-semibold text-[#9a9a9a] bg-[#2e2e2e] border border-white/[0.07] rounded-full uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-[6px] bg-[#2e2e2e] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#d4ff00] rounded-full transition-all duration-[600ms] ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[13px] font-bold text-white tabular-nums shrink-0 select-none">
          {progress}%
        </span>
      </div>

      <div className="flex justify-between items-center mt-3 text-[11px] text-[#9a9a9a] select-none">
        <span>{done} of {total} subtasks complete</span>
        <div className="flex items-center gap-1.5 shrink-0 font-sans">
          <span className="px-2.5 py-0.5 text-[9px] font-bold text-[#d4ff00] bg-[rgba(212,255,0,0.12)] border border-[rgba(212,255,0,0.15)] rounded-full">
            {delta}
          </span>
          <span className="text-[#555555] text-lg font-bold">›</span>
        </div>
      </div>
    </div>
  );
}

function CircleRing({ 
  size = 52, 
  stroke = 4, 
  progress, 
  label,
  sublabel 
}: { 
  size?: number; 
  stroke?: number; 
  progress: number; 
  label: string; 
  sublabel: string 
}) {
  const r = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  
  // Set starting values, then trigger animation to avoid zero transition glitch
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const t = setTimeout(() => {
      const calculatedOffset = circumference - (progress / 100) * circumference;
      setOffset(calculatedOffset);
    }, 150);
    return () => clearTimeout(t);
  }, [progress, circumference]);

  const center = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={progress > 0 ? "#d4ff00" : "rgba(255,255,255,0.08)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 0,
      }}>
        <span className="font-extrabold text-[13px] text-white leading-none font-sans">{label}</span>
        <span className="text-[9px] text-[#666] leading-[1.2] font-semibold tracking-wider font-sans">{sublabel}</span>
      </div>
    </div>
  );
}

function HabitCard({ 
  name, 
  target, 
  done, 
  streak, 
  rate,
  animDelay 
}: HabitItem & { animDelay: number }) {
  const progressPct = Math.min((done / target) * 100, 100);
  const isCompleted = done >= target;

  return (
    <div 
      className="rounded-[16px] border p-4 flex gap-4 items-center transition-all duration-350 hover:border-white/[0.13] mb-3 shrink-0"
      style={{
        animation: `fadeSlideUp 400ms ease ${animDelay}ms both`,
        backgroundColor: isCompleted ? "rgba(212,255,0,0.02)" : "#1e1e1e",
        borderColor: isCompleted ? "rgba(212,255,0,0.15)" : "rgba(255,255,255,0.07)"
      }}
    >
      <CircleRing 
        size={52} 
        stroke={4} 
        progress={progressPct} 
        label={String(done)} 
        sublabel={`/${target}`} 
      />

      <div className="flex-1 flex flex-col justify-between min-h-[52px]">
        <div className="flex justify-between items-center select-none gap-2">
          <h4 className="text-[13px] font-bold text-white line-clamp-1 truncate max-w-[170px] uppercase font-sans">
            {name}
          </h4>
          <span className="text-[11px] text-[#d4ff00] font-extrabold font-sans shrink-0">{Math.round(progressPct)}%</span>
        </div>
        
        <div className="w-full h-[4px] bg-[#2e2e2e] rounded-full overflow-hidden mt-1.5 relative">
          <div 
            className="h-full bg-[#d4ff00] rounded-full transition-all duration-[700ms] ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2.5 text-[11px] text-[#9a9a9a] select-none">
          <span>{done} of {target} check-ins</span>
          <span className="flex items-center gap-1 font-semibold">
            🔥 <span className="text-white font-bold">{streak} day streak</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturedDeadline({ title, sub, priority, due, total }: DeadlineItem) {
  const timeLeft = useCountdown(due);
  const timeText = formatTime(timeLeft);
  const now = Date.now();
  const timeTotal = total;
  const timeRemaining = due.getTime() - now;
  const progressPercent = Math.max(0, Math.min(100, ((timeTotal - timeRemaining) / timeTotal) * 100));

  return (
    <div 
      className="bg-[#1e1e1e] rounded-[16px] border border-white/[0.07] border-l-[3.5px] border-l-[#ff5c5c] pl-4 pr-5 py-4 space-y-3.5 relative overflow-hidden mb-3.5 shrink-0"
      style={{
        animation: "fadeSlideUp 400ms ease 550ms both",
        backgroundColor: "rgba(255,92,92,0.02)",
      }}
    >
      <div className="flex justify-between items-center select-none">
        <span className="px-2.5 py-0.5 text-[9px] font-bold text-[#ff5c5c] bg-[#ff5c5c]/10 border border-[#ff5c5c]/20 rounded-md">
          {priority}
        </span>
        <span className="text-[11px] font-semibold text-[#ff5c5c] tracking-wide uppercase font-sans">
          {timeText}
        </span>
      </div>

      <div>
        <h3 className="text-base font-bold text-white tracking-wide font-sans">
          {title}
        </h3>
        <p className="text-[11px] text-[#9a9a9a] mt-0.5">
          {sub}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] text-[#9a9a9a] font-bold tracking-wider select-none">
          <span>TIME EXHAUSTED</span>
          <span className="text-[#ff5c5c] font-bold">{Math.round(progressPercent)}% ELAPSED</span>
        </div>
        <div className="w-full h-1.5 bg-[#2e2e2e] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ff5c5c] rounded-full transition-all duration-[800ms]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <button className="w-full h-[40px] bg-[#d4ff00] hover:bg-[#c3eb00] text-black font-extrabold text-[13px] rounded-xl transition-all select-none active:scale-[0.985] font-sans shadow-md">
        Mark Complete
      </button>
    </div>
  );
}

function DeadlineListItem({ 
  index, 
  title, 
  priority, 
  due, 
  total,
  animDelay
}: DeadlineItem & { index: number; animDelay: number }) {
  const timeLeft = useCountdown(due);
  const timeText = formatTime(timeLeft);
  const now = Date.now();
  const timeTotal = total;
  const timeRemaining = due.getTime() - now;
  const progressPercent = Math.max(0, Math.min(100, ((timeTotal - timeRemaining) / timeTotal) * 100));

  return (
    <div 
      className="bg-[#1e1e1e] rounded-[16px] border border-white/[0.07] p-4 space-y-3.5 hover:border-white/[0.13] transition-all duration-300 mb-3 shrink-0"
      style={{
        animation: `fadeSlideUp 400ms ease ${animDelay}ms both`
      }}
    >
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 text-[9px] font-bold text-[#d4ff00] bg-[rgba(212,255,0,0.12)] border border-[rgba(212,255,0,0.2)] rounded-md">
            {priority}
          </span>
          <h4 className="text-[13px] font-bold text-white truncate max-w-[145px] font-sans uppercase">
            {title}
          </h4>
        </div>
        <span className="text-[11px] font-bold text-white shrink-0 font-sans tabular-nums">{timeText}</span>
      </div>

      <div className="flex items-center gap-3 select-none">
        <div className="flex-1 h-1 bg-[#2e2e2e] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#d4ff00] rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-[#9a9a9a] shrink-0 font-bold font-sans">{Math.round(progressPercent)}% elapsed</span>
      </div>
    </div>
  );
}

function BottomNav({ 
  active, 
  onSelect 
}: { 
  active: string; 
  onSelect: (val: string) => void 
}) {
  const tabs = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "goals", label: "Goals", icon: Target },
    { id: "add", label: "Add", icon: Plus, isSpecial: true },
    { id: "habits", label: "Habits", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 bg-[#1e1e1e]/85 backdrop-blur-xl border-t border-white/[0.07] h-[80px] pb-4 flex justify-around items-center select-none anim-fade-in [animation-delay:800ms] shrink-0">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const IconComponent = tab.icon;
        
        if (tab.isSpecial) {
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className="relative w-12 h-12 bg-[#d4ff00] text-black rounded-full flex items-center justify-center -translate-y-3 shadow-[0_4px_24px_rgba(212,255,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
              aria-label="Add Item"
            >
              <IconComponent size={24} strokeWidth={3} />
            </button>
          );
        }
        
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="flex flex-col items-center justify-center gap-1.5 shrink-0"
          >
            <div 
              className={`px-4.5 py-1 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? "bg-[#d4ff00] text-black" 
                  : "text-[#555555] hover:text-white"
              }`}
            >
              <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span 
              className={`text-[9px] font-extrabold uppercase tracking-widest ${
                isActive ? "text-[#d4ff00]" : "text-[#555555]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const GOALS: GoalItem[] = [
  { title: "CODE EXECUTION VISUALIZER", progress: 67, tags: ["DEV", "TYPESCRIPT"], delta: "+14%", done: 4, total: 6 },
  { title: "JOB APPLICATIONS",          progress: 33, tags: ["CAREER", "OUTREACH"],  delta: "+25%", done: 2, total: 9 },
  { title: "THESIS PUBLICATION",        progress: 20, tags: ["RESEARCH", "ML"],      delta: "+8%",  done: 1, total: 5 },
];

const HABITS: HabitItem[] = [
  { name: "DEEP WORK SESSIONS", target: 3, done: 2, streak: 12, rate: 67 },
  { name: "DSA PRACTICE",       target: 1, done: 1, streak: 18, rate: 100 },
  { name: "PHYSICAL TRAINING",  target: 1, done: 0, streak: 7,  rate: 0 },
];

const now = Date.now();
const DEADLINES: DeadlineItem[] = [
  { title: "CV Submission",             sub: "Due today, urgent action required",        priority: "CRITICAL", due: new Date(now + 4.5 * 3600000),   total: 7 * 86400000   },
  { title: "Brain Station Application", sub: "Job application deadline",  priority: "HIGH",     due: new Date(now + 3.5 * 86400000),  total: 7 * 86400000   },
  { title: "Code Visualizer MVP",       sub: "Portfolio project launch",  priority: "HIGH",     due: new Date(now + 12 * 86400000),   total: 14 * 86400000  },
];

// ─── MAIN STANDALONE PORTFOLIO SHOWCASE ──────────────────────────────────
export default function TestPage() {
  const [activeNav, setActiveNav] = useState("home");
  
  const goalsCount = useCountUp(6, 1000, 0);
  const rateCount = useCountUp(73, 1200, 100);

  return (
    <>
      {/* Global CSS Inject */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          background: #141414;
        }
        
        ::-webkit-scrollbar {
          display: none;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        
        .anim-fade-in {
          animation: fadeSlideUp 0.5s ease both;
        }
      `}} />

      {/* Standalone Simulator Cap */}
      <div 
        className="min-h-screen text-white relative flex flex-col justify-between bg-[#141414]"
        style={{
          maxWidth: 390,
          margin: "0 auto",
          fontFamily: "'Plus Jakarta Sans', -apple-system, 'SF Pro Display', sans-serif",
        }}
      >
        <StatusBar />
        
        {/* Scroll Content Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <PageHeader />
          
          {/* Two Hero Cards */}
          <div className="grid grid-cols-2 gap-3.5 my-5">
            <HeroCard accentFilled label="Total Goals" value={goalsCount} sub="↑ +2 this week" />
            <HeroCard label="Completion" value={`${rateCount}%`} sub="↑ trending up" />
          </div>
          
          {/* Goals section */}
          <SectionHeader title="Active Goals" />
          {GOALS.map((g, i) => (
            <GoalCard 
              key={i} 
              title={g.title}
              progress={g.progress}
              tags={g.tags}
              delta={g.delta}
              done={g.done}
              total={g.total}
              animDelay={200 + i * 80} 
            />
          ))}

          {/* Habits section */}
          <SectionHeader title="Daily Habits" />
          {HABITS.map((h, i) => (
            <HabitCard 
              key={i} 
              name={h.name}
              target={h.target}
              done={h.done}
              streak={h.streak}
              rate={h.rate}
              animDelay={400 + i * 80} 
            />
          ))}

          {/* Deadlines section */}
          <SectionHeader title="Upcoming Deadlines" />
          <FeaturedDeadline {...DEADLINES[0]} />
          {DEADLINES.slice(1).map((d, i) => (
            <DeadlineListItem 
              key={i} 
              index={i + 2} 
              title={d.title}
              sub={d.sub}
              priority={d.priority}
              due={d.due}
              total={d.total}
              animDelay={550 + i * 80} 
            />
          ))}
        </div>
        
        {/* Bottom Nav Bar */}
        <BottomNav active={activeNav} onSelect={setActiveNav} />
      </div>
    </>
  );
}
