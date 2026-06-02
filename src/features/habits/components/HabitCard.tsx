"use client";

import React from "react";

export interface HabitCardProps {
  name: string;
  target: number;
  done: number;
  streak: number;
  rate: number;
  animDelay: number;
  onClick?: () => void;
  onCheckIn?: () => void;
}

export function HabitCard({ name, target, done, streak, rate, animDelay, onClick, onCheckIn }: HabitCardProps) {
  const [hovered, setHovered] = React.useState(false);
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

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isComplete ? 'rgba(204,255,0,0.06)' : 'var(--card)',
        borderRadius: 20,
        border: `1px solid ${
          isComplete ? 'rgba(204,255,0,0.18)' 
          : hovered ? 'var(--b2)' 
          : 'var(--b1)'
        }`,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 10,
        transition: 'all 220ms ease',
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
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{done}</span>
          <span style={{ fontSize: 9, color: 'var(--t3)', lineHeight: 1.2 }}>/{target}</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.02em' }}>{name}</h3>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ac)' }}>{rate}%</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 8 }}>
          {done} of {target} check-ins
        </span>
        {/* Thicker progress bar */}
        <div style={{ height: 5, background: 'var(--card-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--ac)', borderRadius: 3,
            width: `${ringProg}%`,
            transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>
            {streak} day streak
          </span>
        </div>
      </div>
    </div>
  );
}
