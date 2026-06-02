"use client";

import React from "react";
import { useToast } from "../../dashboard/components/ToastProvider";
import { useCountdown } from "../hooks/useCountdown";
import { formatTime } from "../utils/deadlineStatus";
import { DeadlineProps } from "../types";

export function FeaturedDeadline({ id, title, sub, priority, due, total, completed, onToggle, onClick }: DeadlineProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const targetDate = React.useMemo(() => new Date(due), [due]);
  const time = useCountdown(targetDate);
  const formattedText = mounted ? (completed ? "DONE" : formatTime(time)) : "--h --m left";

  // Compute elapsed percentage
  const remainingMs = Math.max(0, due - Date.now());
  const elapsedPercent = completed ? 100 : Math.round(Math.min(100, Math.max(0, (1 - remainingMs / total) * 100)));

  return (
    <div 
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 16,
        borderLeft: completed ? "4px solid var(--ok)" : "4px solid var(--danger)",
        backgroundImage: completed 
          ? "linear-gradient(90deg, rgba(74,222,128,0.04) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(255,92,92,0.04) 0%, transparent 100%)",
        borderTop: "1px solid var(--b1)",
        borderRight: "1px solid var(--b1)",
        borderBottom: "1px solid var(--b1)",
        padding: 20,
        minHeight: 200,
        position: "relative",
        overflow: "hidden",
        marginBottom: 12,
        animation: "fadeUp 400ms ease both",
        animationDelay: "550ms",
        cursor: onClick ? 'pointer' : 'default',
        transition: "all 0.2s ease",
      }}
    >
      {/* Glass highlight first child */}
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Pulsing dot before badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!completed && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ff4040',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          )}
          <span style={{
            background: completed ? "rgba(74,222,128,0.2)" : "rgba(255, 92, 92, 0.2)",
            color: completed ? "var(--ok)" : "var(--danger)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 20
          }}>
            {priority}
          </span>
        </div>
        <span style={{
          fontSize: 28,
          fontWeight: 900,
          color: completed ? "var(--ok)" : "var(--danger)",
          animation: completed ? "none" : "pulse 1.5s ease-in-out infinite"
        }}>
          {formattedText}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>{sub}</p>
      </div>

      {/* Progress container */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 16 }}>
        <div style={{
          flex: 1,
          height: 6,
          background: "var(--card-3)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            background: completed ? "var(--ok)" : "var(--danger)",
            borderRadius: 3,
            width: `${elapsedPercent}%`,
            transition: "width 800ms ease"
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)" }}>
          {completed ? "100% achieved" : `${elapsedPercent}% elapsed`}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        style={{
          width: "100%",
          height: 48,
          background: completed ? "var(--card-3)" : "var(--ac)",
          color: completed ? "var(--t2)" : "#000000",
          borderRadius: 14,
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        {completed ? "✓ Completed" : "Mark Complete"}
      </button>
    </div>
  );
}

interface DeadlineListItemProps extends DeadlineProps {
  index: number;
}

export function DeadlineListItem({ index, title, priority, due, total, completed, onClick }: DeadlineListItemProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const targetDate = React.useMemo(() => new Date(due), [due]);
  const time = useCountdown(targetDate);
  const formattedText = mounted ? (completed ? "DONE" : formatTime(time)) : "--h --m left";

  const remainingMs = Math.max(0, due - Date.now());
  const elapsedPercent = completed ? 100 : Math.round(Math.min(100, Math.max(0, (1 - remainingMs / total) * 100)));

  return (
    <div 
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 16,
        border: completed ? "1px solid rgba(74,222,128,0.18)" : "1px solid var(--b1)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 12,
        animation: "fadeUp 400ms ease both",
        animationDelay: `${550 + (index - 1) * 80}ms`,
        cursor: onClick ? 'pointer' : 'default',
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            background: completed ? "rgba(74,222,128,0.15)" : "var(--ac-soft)",
            color: completed ? "var(--ok)" : "var(--ac)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 20
          }}>
            {priority}
          </span>
          <h4 style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            color: completed ? "var(--t2)" : "var(--t1)",
            textDecoration: completed ? "line-through" : "none"
          }}>{title}</h4>
        </div>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 700, 
          color: completed ? "var(--ok)" : "var(--t1)" 
        }}>
          {formattedText}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          flex: 1,
          height: 3,
          background: "var(--card-3)",
          borderRadius: 1.5,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            background: completed ? "var(--ok)" : "var(--ac)",
            borderRadius: 1.5,
            width: `${elapsedPercent}%`
          }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--t2)" }}>{completed ? "100% achieved" : `${elapsedPercent}% elapsed`}</span>
        <span style={{ fontSize: 16, color: "var(--t3)", userSelect: "none" }}>›</span>
      </div>
    </div>
  );
}
