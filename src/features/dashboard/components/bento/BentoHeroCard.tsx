"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";
import { useCountUp } from "@/hooks/useCountUp";
import { ActiveDrawer } from "../DetailDrawer";

interface BentoHeroCardProps {
  onDrawer: (d: ActiveDrawer) => void;
  onNav: (tab: string) => void;
}

export function BentoHeroCard({ onDrawer, onNav }: BentoHeroCardProps) {
  const { goals } = useGoalsStore();
  const goal = goals[0];

  const title = goal ? goal.title : "INITIALIZE FIRST MILESTONE";
  const progressPercent = goal ? (goal.progressPercent || 0) : 0;
  const completedTasks = goal ? (goal.subtasks?.filter(s => s.is_complete).length || 0) : 0;
  const totalTasks = goal ? (goal.subtasks?.length || 0) : 0;
  const tags = goal ? goal.tags : ["BEGIN", "AETHER"];
  
  const deltaText = goal && goal.deltaPercent !== undefined 
    ? `${goal.deltaPercent >= 0 ? "↑ +" : "↓ "}${Math.abs(goal.deltaPercent)}% this week` 
    : "Tracking";
    
  const firstTag = tags[0] ? `#${tags[0].toUpperCase()}` : "#GOAL";

  const progress = useCountUp(progressPercent, 1000, 200);
  const [barWidth, setBarWidth] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setBarWidth(progressPercent), 500);
    return () => clearTimeout(t);
  }, [progressPercent]);

  const handleCardClick = () => {
    if (goal) {
      onDrawer({ type: "goal", data: goal });
    } else {
      onNav("add");
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
      style={{
        background: "var(--ac)",
        borderRadius: 28,
        padding: "22px 22px 20px",
        minHeight: 240,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        animation: "scaleIn 0.55s 0.12s ease both",
        marginBottom: 10,
        cursor: "pointer",
        transition: "transform 200ms ease, border-color 200ms ease",
      }}
    >
      {/* Glass top edge highlight */}
      <div style={{
        position: "absolute", top: 0, left: 20, right: 20, height: 1,
        background: "rgba(255,255,255,0.5)", pointerEvents: "none",
      }} />

      {/* Dot grid */}
      <svg
        style={{ position: "absolute", top: 14, right: 14, pointerEvents: "none" }}
        width="88" height="72" viewBox="0 0 88 72"
      >
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const normX = col / 7;
            const normY = row / 6;
            const dist = Math.sqrt(normX * normX + normY * normY) / Math.SQRT2;
            const opacity = Math.max(0, 0.55 - dist * 0.9);
            return (
              <circle
                key={`${row}-${col}`}
                cx={col * 12 + 6} cy={row * 10 + 5} r={2.2}
                fill="#000" opacity={opacity}
              />
            );
          })
        )}
      </svg>

      {/* Decorative rings */}
      <div style={{
        position: "absolute", bottom: -50, right: -50,
        width: 160, height: 160, borderRadius: "50%",
        border: "2px solid rgba(0,0,0,0.1)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -25, right: -25,
        width: 110, height: 110, borderRadius: "50%",
        background: "rgba(0,0,0,0.07)", pointerEvents: "none",
      }} />

      {/* Wave lines */}
      <svg
        style={{ position: "absolute", bottom: 14, left: 18, opacity: 0.12, pointerEvents: "none" }}
        width="90" height="32" viewBox="0 0 90 32"
      >
        {[8, 16, 24].map((y, i) => (
          <path key={i}
            d={`M0 ${y} Q11 ${y - 8} 22 ${y} Q33 ${y + 8} 44 ${y} Q55 ${y - 8} 66 ${y} Q77 ${y + 8} 88 ${y}`}
            fill="none" stroke="#000" strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* TOP ROW: tag */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 2,
      }}>
        <span style={{
          background: "rgba(0,0,0,0.18)", color: "#000",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          padding: "5px 12px", borderRadius: 20,
        }}>
          {firstTag}
        </span>
        <button style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(0,0,0,0.15)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(0,0,0,0.6)" }} />
            ))}
          </div>
        </button>
      </div>

      {/* BOTTOM: percentage, meta, bar */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.55)",
          letterSpacing: "0.03em", marginBottom: 6, textTransform: "uppercase",
        }}>
          {title}
        </div>

        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#000",
          letterSpacing: "-3px",
          lineHeight: 0.88,
          marginBottom: 8,
        }}>
          {progress}%
        </div>

        <div style={{
          fontSize: 12, color: "rgba(0,0,0,0.5)", fontWeight: 600, marginBottom: 14,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{completedTasks} of {totalTasks} subtasks</span>
          <span style={{ color: "rgba(0,0,0,0.3)" }}>·</span>
          <span style={{ color: "#000", fontWeight: 800 }}>{deltaText}</span>
        </div>

        <div style={{
          height: 7, background: "rgba(0,0,0,0.15)", borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", background: "rgba(0,0,0,0.85)", borderRadius: 4,
            width: `${barWidth}%`,
            transition: "width 1s 0.5s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 14, alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                background: "rgba(0,0,0,0.15)", color: "#000",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                padding: "4px 10px", borderRadius: 20,
              }}>{tag}</span>
            ))}
          </div>
          <span style={{
            background: "rgba(0,0,0,0.2)", color: "#000",
            fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
          }}>{completedTasks}/{totalTasks}</span>
        </div>
      </div>
    </div>
  );
}
