"use client";

import React from "react";
import { CheckSquare } from "lucide-react";
import { Habit } from "@/lib/types";
import { useToast } from "../ToastProvider";
import { useCountUp } from "@/hooks/useCountUp";
import { bentoCardBaseStyle } from "./bentoStyles";
import { ParallaxCard } from "@/components/ParallaxCard";

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
    <ParallaxCard 
      onClick={() => { onNav("habits"); toast("Viewing habit streaks"); }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140,
        animation: "fadeUp 0.4s 0.22s ease both", 
        cursor: "pointer",
      }}
    >
      <style jsx global>{`
        @keyframes flameOuterFlicker {
          0%, 100% { transform: scale(1) rotate(-1.5deg); }
          50% { transform: scale(1.08, 0.92) rotate(1.5deg); }
        }
        @keyframes flameInnerFlicker {
          0%, 100% { transform: scale(1) rotate(2deg) skewX(1deg); }
          50% { transform: scale(0.92, 1.08) rotate(-2deg) skewX(-1deg); }
        }
        @keyframes flameCoreFlicker {
          0%, 100% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes flameGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(204,255,0,0.4)); }
          50% { filter: drop-shadow(0 0 10px rgba(204,255,0,0.75)); }
        }
        .flame-outer {
          animation: flameOuterFlicker 1.5s ease-in-out infinite;
          transform-origin: 12px 18px;
          transform-box: fill-box;
        }
        .flame-inner {
          animation: flameInnerFlicker 1s ease-in-out infinite;
          transform-origin: 12px 18px;
          transform-box: fill-box;
        }
        .flame-core {
          animation: flameCoreFlicker 0.65s ease-in-out infinite;
          transform-origin: 12px 18px;
          transform-box: fill-box;
        }
      `}</style>

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

      {/* Animated Flame Container */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "rgba(204,255,0,0.1)",
        border: "1px solid rgba(204,255,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10,
        position: "relative", zIndex: 1,
      }}>
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="var(--ac)" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            animation: "flameGlowPulse 2.2s ease-in-out infinite",
            overflow: "visible"
          }}
        >
          {/* Outer glowing flame layer */}
          <path
            className="flame-outer"
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            fill="rgba(204,255,0,0.15)"
            stroke="rgba(204,255,0,0.35)"
            strokeWidth="1.5"
          />
          {/* Inner active flame layer */}
          <path
            className="flame-inner"
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
            fill="rgba(204,255,0,0.45)"
            stroke="var(--ac)"
            strokeWidth="2.2"
          />
          {/* Core flame spark layer */}
          <path
            className="flame-core"
            d="M10.5 14.5c0-.4.4-.7.6-1.1.2-.3.2-1 .2-1s.4.5.6.8.2.7.2 1a1.2 1.2 0 1 1-1.6 0z"
            fill="#FFF"
            stroke="none"
          />
        </svg>
      </div>

      <div style={{
        fontSize: 42, fontWeight: 900, color: "#fff",
        lineHeight: 0.9, letterSpacing: "-1px", marginBottom: 4,
        position: "relative", zIndex: 1,
      }}>{streak}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", position: "relative", zIndex: 1 }}>day streak</div>
      <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 2, position: "relative", zIndex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{habitName}</div>
    </ParallaxCard>
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

  const size = 46, stroke = 4;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (ring / 100) * circ;
  const c = size / 2;

  return (
    <ParallaxCard 
      onClick={() => { onNav("goals"); toast("Viewing all goals", "info"); }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140,
        animation: "fadeUp 0.4s 0.36s ease both", 
        cursor: "pointer",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--ac)" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }} />
        </svg>
        <div style={{
          fontSize: 30, fontWeight: 900, color: "var(--ac)",
          lineHeight: 0.9, letterSpacing: "-0.5px", textAlign: "right",
        }}>{rate}%</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>Completion</div>
      <div style={{ fontSize: 10, color: "var(--t3)", fontWeight: 700, marginTop: 4 }}>Goal progress</div>
    </ParallaxCard>
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
    <ParallaxCard 
      onClick={() => { onNav("habits"); toast("Viewing daily habits", "info"); }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140,
        animation: "fadeUp 0.4s 0.43s ease both", 
        cursor: "pointer",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 0.9 }}>{completed}</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--t3)", lineHeight: 1 }}>/{total}</span>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(204,255,0,0.1)",
          border: "1px solid rgba(204,255,0,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 1,
        }}>
          <CheckSquare size={20} color="var(--ac)" />
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>
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
    </ParallaxCard>
  );
}
