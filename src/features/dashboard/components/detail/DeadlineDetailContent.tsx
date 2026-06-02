"use client";

import React from "react";
import { Edit2, Zap } from "lucide-react";
import { Deadline } from "@/lib/types";
import { useDeadlinesStore } from "@/lib/deadlineStore";
import { useToast } from "../ToastProvider";
import { useCountdown } from "@/features/deadlines/hooks/useCountdown";
import { formatTime, mapDeadlineProps } from "@/features/deadlines/utils/deadlineStatus";

interface DeadlineDetailContentProps {
  deadline: Deadline;
  onEditTap?: (type: "deadline", data: Deadline) => void;
}

export function DeadlineDetailContent({ deadline, onEditTap }: DeadlineDetailContentProps) {
  const toast = useToast();
  const { deadlines, toggleDeadlineCompletion } = useDeadlinesStore();

  // Find live item from store
  const activeDeadline = deadlines.find(d => d.id === deadline.id) || deadline;

  const dueDate = activeDeadline.due_date || null;
  const time = useCountdown(React.useMemo(() => {
    return dueDate ? new Date(dueDate) : new Date();
  }, [dueDate]));

  const deadlineProps = mapDeadlineProps(activeDeadline);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: "rgba(255,64,64,0.12)", color: "#ff4040",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          padding: "4px 10px", borderRadius: 20, textTransform: "uppercase",
        }}>
          Urgent Deadline
        </span>
        <button
          onClick={() => onEditTap?.("deadline", activeDeadline)}
          aria-label="Edit Deadline"
          style={{
            background: "transparent", border: "none", color: "var(--t2)", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center", transition: "color 0.2s",
            outline: "none"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--t2)"}
          title="Edit Deadline"
        >
          <Edit2 size={15} />
        </button>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 12, marginBottom: 6, letterSpacing: "-0.3px" }}>
        {activeDeadline.title}
      </h2>
      <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20 }}>
        {deadlineProps.sub}
      </p>

      {/* Progress countdown section */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", background: "var(--bg)", borderRadius: 16,
        border: "1px solid var(--b1)", marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Target Countdown
          </div>
          <div style={{ 
            fontSize: 26, fontWeight: 900, 
            color: activeDeadline.completed ? "var(--ok)" : "#ff4040", 
            marginTop: 4, letterSpacing: "-0.5px" 
          }}>
            {activeDeadline.completed ? "COMPLETED" : formatTime(time)}
          </div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: activeDeadline.completed ? "rgba(74,222,128,0.1)" : "rgba(255,64,64,0.1)",
          border: activeDeadline.completed ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,64,64,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={20} color={activeDeadline.completed ? "var(--ok)" : "#ff4040"} fill={activeDeadline.completed ? "rgba(74,222,128,0.3)" : "rgba(255,64,64,0.3)"} />
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.4, marginBottom: 26 }}>
        {activeDeadline.completed ? "This deadline has been completed successfully! ✓" : "This deadline is currently active."}
      </p>
      <button 
        onClick={async () => {
          try {
            await toggleDeadlineCompletion(activeDeadline.id);
            toast(activeDeadline.completed ? "Marked incomplete" : "Deadline complete! ✓");
          } catch {
            toast("Failed to update deadline. Please try again.", "error");
          }
        }}
        style={{
          width: "100%", height: 46, borderRadius: 12, 
          background: activeDeadline.completed ? "var(--card-3)" : "var(--danger)", 
          color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
          border: "none", boxShadow: activeDeadline.completed ? "none" : "0 4px 14px rgba(255,92,92,0.3)",
        }}
      >
        {activeDeadline.completed ? "Undo Completion" : "Mark Complete"}
      </button>
    </div>
  );
}
