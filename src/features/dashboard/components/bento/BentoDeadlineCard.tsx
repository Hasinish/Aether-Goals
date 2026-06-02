"use client";

import React from "react";
import { Zap } from "lucide-react";
import { Deadline } from "@/lib/types";
import { ActiveDrawer } from "../DetailDrawer";
import { useCountdown } from "@/features/deadlines/hooks/useCountdown";
import { formatTime } from "@/features/deadlines/utils/deadlineStatus";
import { bentoCardBaseStyle } from "./bentoStyles";

interface BentoDeadlineProps {
  onDrawer: (d: ActiveDrawer) => void;
  onNav: (id: string) => void;
  deadline: Deadline | null;
}

export function BentoDeadline({ onDrawer, onNav, deadline }: BentoDeadlineProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const time = useCountdown(React.useMemo(() => {
    return deadline ? new Date(deadline.due_date) : new Date();
  }, [deadline]));

  const display = mounted 
    ? (deadline ? formatTime(time) : "No Deadlines") 
    : "--h --m left";

  const diff = deadline ? new Date(deadline.due_date).getTime() - Date.now() : 0;
  const isCritical = diff > 0 && diff < 24 * 3600 * 1000;
  const isHigh = diff > 0 && diff >= 24 * 3600 * 1000 && diff < 3 * 24 * 3600 * 1000;
  const priorityLabel = deadline ? (deadline.completed ? "COMPLETED" : (isCritical ? "CRITICAL" : (isHigh ? "HIGH" : "NORMAL"))) : "ALL CLEAR";

  const handleCardClick = () => {
    if (deadline) {
      onDrawer({ type: "deadline", data: deadline });
    } else {
      onNav("deadlines");
    }
  };

  return (
    <div 
      onClick={handleCardClick}
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
        animation: "fadeUp 0.4s 0.29s ease both", 
        cursor: "pointer",
        transition: "transform 200ms ease, border-color 200ms ease",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 1,
        background: "rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: deadline && deadline.completed ? "rgba(74,222,128,0.1)" : "rgba(255,64,64,0.1)",
          border: deadline && deadline.completed ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,64,64,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={20} color={deadline && deadline.completed ? "var(--ok)" : "#ff4040"} fill={deadline && deadline.completed ? "rgba(74,222,128,0.3)" : "rgba(255,64,64,0.3)"} />
        </div>
        {deadline && !deadline.completed && (
          <div style={{
            width: 8, height: 8, borderRadius: "50%", 
            background: isCritical ? "#ff4040" : (isHigh ? "var(--warn)" : "var(--ok)"),
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        )}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 900, 
        color: deadline && deadline.completed ? "var(--ok)" : (isCritical ? "#ff4040" : (isHigh ? "var(--warn)" : "#fff")),
        lineHeight: 0.9, letterSpacing: "-0.5px", marginBottom: 6,
      }}>{display}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
        {deadline ? deadline.title : "All Clear"}
      </div>
      <div style={{
        display: "inline-block", marginTop: 6,
        background: deadline && deadline.completed ? "rgba(74,222,128,0.12)" : (isCritical ? "rgba(255,64,64,0.12)" : "var(--ac-soft)"), 
        color: deadline && deadline.completed ? "var(--ok)" : (isCritical ? "#ff4040" : "var(--ac)"),
        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
        padding: "3px 8px", borderRadius: 20,
      }}>{priorityLabel}</div>
    </div>
  );
}
