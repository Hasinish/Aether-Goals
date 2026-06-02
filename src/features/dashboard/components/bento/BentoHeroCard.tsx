"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";
import { useCountUp } from "@/hooks/useCountUp";
import { ActiveDrawer } from "../DetailDrawer";
import { ParallaxCard } from "@/components/ParallaxCard";

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
    <ParallaxCard 
      onClick={handleCardClick}
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
      }}
    >
      <style>{`
        @keyframes bentoDotWave {
          0%, 100% {
            transform: scale(0.65) translateY(0px) translateX(0px);
          }
          50% {
            transform: scale(1.35) translateY(-3px) translateX(1px);
          }
        }
        @keyframes bentoRotateCW {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bentoRotateCCW {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes bentoRingPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1.0; }
        }
        @keyframes bentoWaveFlow {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bentoWaveSway {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5px, 2px) scale(1.03); }
        }
        
        .bento-dot {
          animation: bentoDotWave 3.8s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .bento-ring-cw {
          animation: bentoRotateCW 35s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .bento-ring-ccw {
          animation: bentoRotateCCW 25s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .bento-ring-pulse {
          animation: bentoRingPulse 7s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .bento-wave {
          stroke-dasharray: 12, 8;
          animation: bentoWaveFlow 2.8s linear infinite;
        }
        .bento-wave-svg {
          animation: bentoWaveSway 6.5s ease-in-out infinite;
          transform-origin: bottom left;
        }
      `}</style>

      {/* Glass top edge highlight */}
      <div style={{
        position: "absolute", top: 0, left: 20, right: 20, height: 1,
        background: "rgba(255,255,255,0.5)", pointerEvents: "none",
      }} />

      {/* Dot grid */}
      <svg
        style={{ position: "absolute", top: 14, right: 14, overflow: "visible", pointerEvents: "none" }}
        width="96" height="72" viewBox="0 0 96 72"
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
                className="bento-dot"
                style={{
                  animationDelay: `${(row + col) * 0.16}s`,
                }}
                cx={col * 12 + 6} cy={row * 10 + 5} r={2.2}
                fill="#000"
                opacity={opacity}
              />
            );
          })
        )}
      </svg>

      {/* Decorative rings SVG */}
      <svg
        style={{
          position: "absolute",
          bottom: -60,
          right: -60,
          width: 190,
          height: 190,
          pointerEvents: "none",
        }}
        viewBox="0 0 190 190"
      >
        {/* Outer dashed ring (rotating clockwise) */}
        <circle
          cx="95"
          cy="95"
          r="82"
          fill="none"
          stroke="rgba(0,0,0,0.11)"
          strokeWidth="1.5"
          strokeDasharray="10 8"
          className="bento-ring-cw"
          style={{
            transformOrigin: "95px 95px",
          }}
        />
        {/* Middle dotted/dashed ring (rotating counter-clockwise) */}
        <circle
          cx="95"
          cy="95"
          r="62"
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="2"
          strokeDasharray="3 7"
          className="bento-ring-ccw"
          style={{
            transformOrigin: "95px 95px",
          }}
        />
        {/* Inner solid ring (pulsing size/opacity) */}
        <circle
          cx="95"
          cy="95"
          r="44"
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="18"
          className="bento-ring-pulse"
          style={{
            transformOrigin: "95px 95px",
          }}
        />
        {/* Inner fine solid detail orbit */}
        <circle
          cx="95"
          cy="95"
          r="28"
          fill="none"
          stroke="rgba(0,0,0,0.04)"
          strokeWidth="1"
        />
      </svg>

      {/* Wave lines */}
      <svg
        className="bento-wave-svg"
        style={{ position: "absolute", bottom: 14, left: 18, opacity: 0.12, pointerEvents: "none" }}
        width="90" height="32" viewBox="0 0 90 32"
      >
        {[8, 16, 24].map((y, i) => (
          <path key={i}
            className="bento-wave"
            style={{
              animationDelay: `${i * 0.25}s`
            }}
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
    </ParallaxCard>
  );
}
