"use client";

import React from "react";
import { Edit2 } from "lucide-react";
import { Habit, HabitLog } from "@/lib/types";
import { useHabitsStore } from "@/lib/habitStore";
import { useToast } from "../ToastProvider";
import { HabitCalendar } from "./HabitCalendar";

interface HabitDetailContentProps {
  habit: Habit;
  onEditTap?: (type: "habit", data: Habit) => void;
}

export function HabitDetailContent({ habit, onEditTap }: HabitDetailContentProps) {
  const toast = useToast();
  const { habits, logCompletion } = useHabitsStore();

  // Find live item from store
  const activeHabit = habits.find(h => h.id === habit.id) || habit;

  const habitTarget = activeHabit.daily_target || 1;
  const habitDone = activeHabit.completionsToday || 0;
  const habitCheckedIn = habitDone >= habitTarget;
  const habitProgress = Math.round((habitDone / habitTarget) * 100);

  // Radial ring properties for habit
  const size = 68, stroke = 6;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, habitProgress) / 100) * circ;
  const c = size / 2;


  // Build monthly logs and calendar days dynamically
  const { calendarDays } = React.useMemo(() => {
    const logMap = new Map<string, number>();
    const logs: HabitLog[] = activeHabit.logs || [];
    logs.forEach((l: HabitLog) => logMap.set(l.log_date, l.completions));

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map Sun-based getDay() to Mon-based (0 = Mon, ..., 6 = Sun)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: {
      dateStr: string;
      dayNumber: number;
      state: "complete" | "partial" | "empty" | "future";
      completions: number;
    }[] = [];

    // Empty spaces before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        dateStr: "",
        dayNumber: 0,
        state: "future",
        completions: 0,
      });
    }

    let perfectDays = 0;
    let partialDays = 0;
    let trackableDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const completions = logMap.get(dateStr) ?? 0;
      const isFuture = current > now;

      let state: "complete" | "partial" | "empty" | "future";
      if (isFuture) {
        state = "future";
      } else {
        trackableDays++;
        if (completions >= habitTarget) {
          state = "complete";
          perfectDays++;
        } else if (completions > 0) {
          state = "partial";
          partialDays++;
        } else {
          state = "empty";
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        state,
        completions,
      });
    }

    const completionRate = trackableDays > 0 ? Math.round((perfectDays / trackableDays) * 100) : 0;

    return {
      calendarDays: days,
      stats: {
        totalCompleted: perfectDays,
        completionRate,
        partialDays,
        perfectDays,
      },
    };
  }, [activeHabit, habitTarget]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: "var(--ac-soft)", color: "var(--ac)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          padding: "4px 10px", borderRadius: 20, textTransform: "uppercase",
        }}>
          Habit Tracker
        </span>
        <button
          onClick={() => onEditTap?.("habit", activeHabit)}
          aria-label="Edit Habit"
          style={{
            background: "transparent", border: "none", color: "var(--t2)", cursor: "pointer",
            padding: 4, display: "flex", alignItems: "center", transition: "color 0.2s",
            outline: "none"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--t2)"}
          title="Edit Habit"
        >
          <Edit2 size={15} />
        </button>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 12, marginBottom: 6, letterSpacing: "-0.3px" }}>
        {activeHabit.title}
      </h2>
      <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 20 }}>
        Maintain streaks and check in daily to build routine memory.
      </p>

      {/* Circular Ring and Stats */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20,
        padding: "16px 20px", background: "var(--bg)", borderRadius: 20,
        border: "1px solid var(--b1)", marginBottom: 22,
      }}>
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            <circle cx={c} cy={c} r={r} fill="none"
              stroke={habitProgress > 0 ? "var(--ac)" : "rgba(255,255,255,0.06)"}
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 400ms ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {habitCheckedIn ? (
              <span style={{ fontSize: 22, fontWeight: 900, color: "var(--ac)" }}>✓</span>
            ) : (
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", display: "flex", alignItems: "baseline" }}>
                {habitDone}
                <span style={{ fontSize: 12, color: "var(--t3)", fontWeight: 500 }}>/{habitTarget}</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ac)" }}>
            {habitProgress}% Rate
          </div>
          <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 4 }}>
            Streak: 🔥 {activeHabit.streak || 0} days active
          </div>
          <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
            Check-ins: {habitDone} out of target {habitTarget}
          </div>
        </div>
      </div>

      {/* Monthly analytics calendar */}
      <HabitCalendar calendarDays={calendarDays} habitTarget={habitTarget} />

      <button 
        onClick={async () => {
          try {
            await logCompletion(activeHabit.id);
            toast(habitCheckedIn ? "Check-in removed" : "Habit logged successfully! 🔥");
          } catch {
            toast("Failed to update check-in. Please try again.", "error");
          }
        }}
        style={{
          width: "100%", height: 46, borderRadius: 12,
          background: habitCheckedIn ? "var(--card-3)" : "var(--ac)",
          color: habitCheckedIn ? "var(--t1)" : "#000",
          border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: habitCheckedIn ? "none" : "0 4px 14px rgba(204,255,0,0.3)",
        }}
      >
        {habitCheckedIn ? "✓ Already Checked In (Undo)" : "Complete Daily Check-in"}
      </button>
    </div>
  );
}
