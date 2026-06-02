"use client";

import React from "react";

export interface GoalCardProps {
  title: string;
  progress: number;
  tags: string[];
  delta: string;
  done: number;
  total: number;
  animDelay: number;
  onClick?: () => void;
}

export function GoalCard({ title, progress, tags, delta, done, total, animDelay, onClick }: GoalCardProps) {
  const [width, setWidth] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setWidth(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  const stripColor = progress > 60 ? 'var(--ac)' : progress >= 30 ? 'var(--warn)' : 'var(--t3)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)',
        borderRadius: 20,
        border: `1px solid ${hovered ? 'var(--b2)' : 'var(--b1)'}`,
        padding: '18px 18px 18px 22px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 10,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), border-color 200ms ease',
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${animDelay}ms`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Left accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: stripColor, borderRadius: '20px 0 0 20px',
        transform: 'scaleY(0)',
        transformOrigin: 'top',
        animation: `stripGrow 0.4s ${animDelay + 200}ms cubic-bezier(0.16,1,0.3,1) both`,
      }} />

      {/* Glass top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 22, right: 18, height: 1,
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700, color: 'var(--t1)',
          letterSpacing: '0.03em', lineHeight: 1.3,
          flex: 1, paddingRight: 10,
        }}>{title}</h3>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--ac)',
          background: 'var(--ac-soft)', padding: '4px 10px',
          borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
        }}>{delta.includes('%') ? `↑ ${delta}` : delta}</span>
      </div>

      {/* Progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          flex: 1, height: 5, background: 'var(--card-3)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: 'var(--ac)', borderRadius: 3,
            width: `${width}%`,
            transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <span style={{
          fontSize: 16, fontWeight: 900, color: 'var(--t1)',
          minWidth: 42, textAlign: 'right', letterSpacing: '-0.3px',
        }}>{progress}%</span>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
              border: '1px solid var(--b1)', background: 'var(--card-3)',
              color: 'var(--t3)', borderRadius: 20, padding: '3px 8px',
            }}>{tag}</span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>
          {done}/{total} tasks
        </span>
      </div>
    </div>
  );
}
