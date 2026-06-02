"use client";

import React from "react";
import { Edit2 } from "lucide-react";
import { Goal, Subtask } from "@/lib/types";
import { useGoalsStore } from "@/lib/store";
import { useToast } from "../ToastProvider";

interface GoalDetailContentProps {
  goal: Goal;
  onClose: () => void;
  onEditTap?: (type: "goal", data: Goal) => void;
}

export function GoalDetailContent({ goal, onClose, onEditTap }: GoalDetailContentProps) {
  const toast = useToast();
  const { goals, toggleSubtask } = useGoalsStore();

  // Find live item from store
  const activeGoal = goals.find(g => g.id === goal.id) || goal;

  const subtasks: Subtask[] = activeGoal.subtasks || [];
  const completedTasksCount = subtasks.filter((s: Subtask) => s.is_complete).length;
  const totalTasksCount = subtasks.length;
  const goalProgress = Math.round((totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: "var(--ac-soft)", color: "var(--ac)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          padding: "4px 10px", borderRadius: 20, textTransform: "uppercase",
        }}>
          Goal Details
        </span>
        <button
          onClick={() => onEditTap?.("goal", activeGoal)}
          aria-label="Edit Goal"
          style={{
            background: "transparent", border: "none", color: "var(--t2)", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center", transition: "color 0.2s",
            outline: "none"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--t2)"}
          title="Edit Goal"
        >
          <Edit2 size={15} />
        </button>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 12, marginBottom: 6, letterSpacing: "-0.3px" }}>
        {activeGoal.title}
      </h2>
      <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20 }}>
        Track your progress and subtask status.
      </p>

      {/* Progress Segment */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22 }}>
        <div style={{ flex: 1, height: 6, background: "var(--card-3)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "var(--ac)", borderRadius: 3,
            width: `${goalProgress}%`,
            transition: "width 300ms ease",
          }} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", minWidth: 42, textAlign: "right" }}>
          {goalProgress}%
        </span>
      </div>

      {/* Checklist */}
      <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        Subtasks checklist ({completedTasksCount} of {totalTasksCount})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, maxHeight: 180, overflowY: "auto" }}>
        {subtasks.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-2">No subtasks defined. Tap Edit to add checkpoint tasks.</p>
        ) : (
          subtasks.map((task: Subtask) => {
            return (
              <div 
                key={task.id}
                role="button"
                tabIndex={0}
                aria-label={`Toggle subtask ${task.title}`}
                onClick={async () => {
                  try {
                    await toggleSubtask(task.id);
                    toast(task.is_complete ? "Task marked incomplete" : "Task completed! 💪");
                  } catch {
                    toast("Could not update task", "error");
                  }
                }}
                onKeyDown={async e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    try {
                      await toggleSubtask(task.id);
                      toast(task.is_complete ? "Task marked incomplete" : "Task completed! 💪");
                    } catch {
                      toast("Could not update task", "error");
                    }
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "var(--bg)", borderRadius: 12,
                  border: "1px solid var(--b1)", cursor: "pointer",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: task.is_complete ? "none" : "1px solid var(--t3)",
                  background: task.is_complete ? "var(--ac)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  {task.is_complete && <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: task.is_complete ? "var(--t2)" : "var(--t1)",
                  textDecoration: task.is_complete ? "line-through" : "none",
                  transition: "color 0.2s",
                }}>{task.title}</span>
              </div>
            );
          })
        )}
      </div>

      <button 
        onClick={onClose}
        style={{
          width: "100%", height: 46, borderRadius: 12, background: "var(--ac)", border: "none",
          color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(204,255,0,0.3)",
        }}
      >
        Done
      </button>
    </div>
  );
}
