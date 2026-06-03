"use client";

import React from "react";
import { ParallaxCard } from "@/components/ParallaxCard";
import { HabitLog } from "@/lib/types";

export interface HabitCardProps {
  name: string;
  target: number;
  done: number;
  streak: number;
  rate: number;
  animDelay: number;
  logs?: HabitLog[];
  onClick?: () => void;
  onCheckIn?: () => void;
}

export function HabitCard({ name, target, done, streak, rate, animDelay, logs, onClick, onCheckIn }: HabitCardProps) {
  const [ringProg, setRingProg] = React.useState(0);
  const isComplete = done >= target;

  React.useEffect(() => {
    const t = setTimeout(() => setRingProg(rate), 300);
    return () => clearTimeout(t);
  }, [rate]);

  const size = 54, stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (ringProg / 100) * circ;
  const c = size / 2;

  const gridData = React.useMemo(() => {
    const data: boolean[] = [];
    const logMap = new Set<string>();
    
    logs?.forEach((log) => {
      if (log.completions >= target) {
        logMap.add(log.log_date);
      }
    });

    const today = new Date();
    // Generate the last 100 days ending on today
    for (let i = 99; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      data.push(logMap.has(dateStr));
    }
    return data;
  }, [logs, target]);

  return (
    <ParallaxCard
      onClick={onClick}
      style={{
        background: isComplete ? 'rgba(204,255,0,0.06)' : 'var(--card)',
        borderRadius: 20,
        borderLeft: `4px solid ${isComplete ? 'var(--ac)' : 'rgba(255, 255, 255, 0.12)'}`,
        borderTop: `1px solid ${isComplete ? 'rgba(204,255,0,0.18)' : 'var(--b1)'}`,
        borderRight: `1px solid ${isComplete ? 'rgba(204,255,0,0.18)' : 'var(--b1)'}`,
        borderBottom: `1px solid ${isComplete ? 'rgba(204,255,0,0.18)' : 'var(--b1)'}`,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 10,
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${animDelay}ms`,
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Glass top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 18, height: 1,
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      {/* Circle ring — inline SVG */}
      <div 
        onClick={(e) => { e.stopPropagation(); onCheckIn?.(); }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        style={{ 
          position: 'relative', width: size, height: size, flexShrink: 0, cursor: 'pointer',
          transition: 'transform 100ms ease',
          marginTop: 2,
        }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle cx={c} cy={c} r={r} fill="none"
            stroke={rate > 0 ? 'var(--ac)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        {/* Center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isComplete ? (
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ac)' }}>✓</span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'baseline' }}>
              {done}
              <span style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 500 }}>/{target}</span>
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.02em' }}>{name}</h3>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ac)' }}>{rate}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>
            {streak} day streak
          </span>
        </div>

        {/* 100-Day Activity Grid (Minimalist raw circular dots - Enlarged) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(20, 1fr)",
          gap: "3.5px",
          width: "fit-content",
          marginTop: 2,
        }}>
          {gridData.map((completed, index) => (
            <div
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: completed ? "var(--ac)" : "rgba(255, 255, 255, 0.08)",
                boxShadow: completed ? "0 0 4px rgba(204, 255, 0, 0.45)" : "none",
              }}
              title={`Day ${100 - index} ago: ${completed ? "Completed" : "Incomplete"}`}
            />
          ))}
        </div>
      </div>
    </ParallaxCard>
  );
}
