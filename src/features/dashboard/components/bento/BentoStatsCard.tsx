"use client";

import React from "react";
import { Flame } from "lucide-react";
import { Habit } from "@/lib/types";
import { useToast } from "../ToastProvider";
import { useCountUp } from "@/hooks/useCountUp";
import { bentoCardBaseStyle } from "./bentoStyles";

// 1. Bento Streak Component
interface BentoStreakProps {
  onNav: (id: string) => void;
  habit: Habit | null;
}

export function BentoStreak({ onNav, habit }: BentoStreakProps) {
  const streakVal = habit ? (habit.streak || 0) : 0;
  const habitName = habit ? habit.title : "No Habits Tracked";
  const streak = useCountUp(streakVal, 800, 220);
  const toast = useToast();

  return (
    <div 
      onClick={() => { onNav("habits"); toast("Viewing habit streaks"); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140,
        animation: "fadeUp 0.4s 0.22s ease both", 
        cursor: "pointer",
        transition: "transform 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        bottom: 20, left: 10,
        width: 80, height: 60,
        background: "radial-gradient(ellipse, rgba(204,255,0,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        filter: "blur(12px)",
      }} />

      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "rgba(204,255,0,0.1)",
        border: "1px solid rgba(204,255,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
        position: "relative", zIndex: 1,
      }}>
        <Flame size={20} color="var(--ac)" fill="rgba(204,255,0,0.35)" />
      </div>
      <div style={{
        fontSize: 48, fontWeight: 900, color: "#fff",
        lineHeight: 0.9, letterSpacing: "-1px", marginBottom: 6,
        position: "relative", zIndex: 1,
      }}>{streak}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", position: "relative", zIndex: 1 }}>day streak</div>
      <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2, position: "relative", zIndex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{habitName}</div>
    </div>
  );
}

// 2. Bento Completion Component
interface BentoCompletionProps {
  onNav: (id: string) => void;
  progress: number;
}

export function BentoCompletion({ onNav, progress: progressPercent }: BentoCompletionProps) {
  const rate = useCountUp(progressPercent, 900, 240);
  const toast = useToast();
  const [ring, setRing] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setRing(progressPercent), 400);
    return () => clearTimeout(t);
  }, [progressPercent]);

  const size = 56, stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (ring / 100) * circ;
  const c = size / 2;

  return (
    <div 
      onClick={() => { onNav("goals"); toast("Viewing all goals", "info"); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        animation: "fadeUp 0.4s 0.36s ease both", 
        cursor: "pointer",
        transition: "transform 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--ac)" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }} />
        </svg>
        <div style={{
          fontSize: 36, fontWeight: 900, color: "var(--ac)",
          lineHeight: 0.9, letterSpacing: "-0.5px", textAlign: "right",
        }}>{rate}%</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>Completion</div>
      <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 700, marginTop: 4 }}>Goal progress</div>
    </div>
  );
}

// 3. Bento Habits Today Component
interface BentoHabitsTodayProps {
  onNav: (id: string) => void;
  completed: number;
  total: number;
}

export function BentoHabitsToday({ onNav, completed, total }: BentoHabitsTodayProps) {
  const toast = useToast();

  const activeSlots = Math.max(3, total);

  return (
    <div 
      onClick={() => { onNav("habits"); toast("Viewing daily habits", "info"); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        animation: "fadeUp 0.4s 0.43s ease both", 
        cursor: "pointer",
        transition: "transform 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 6 }}>
        <span style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 0.9 }}>{completed}</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: "var(--t3)", lineHeight: 1 }}>/{total}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", marginBottom: 14 }}>
        Habits Today
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: activeSlots }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 10, borderRadius: 3,
            background: i < completed ? "var(--ac)" : "var(--card-3)",
            boxShadow: i < completed ? "0 0 10px rgba(204,255,0,0.4)" : "none",
            transition: `background 0.5s ${i * 0.15}s ease, box-shadow 0.5s ${i * 0.15}s ease`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 6 }}>Today</div>
    </div>
  );
}
