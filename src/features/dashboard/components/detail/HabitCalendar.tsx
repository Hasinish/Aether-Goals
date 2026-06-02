"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface CalendarDay {
  dateStr: string;
  dayNumber: number;
  state: "complete" | "partial" | "empty" | "future";
  completions: number;
}

interface HabitCalendarProps {
  calendarDays: CalendarDay[];
  habitTarget: number;
}

export function HabitCalendar({ calendarDays, habitTarget }: HabitCalendarProps) {
  return (
    <div style={{
      border: "1px solid var(--b1)", background: "var(--bg)", 
      padding: 14, borderRadius: 16, marginBottom: 22
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t2)", marginBottom: 12 }}>
        <Calendar size={14} color="var(--ac)" />
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "monospace", fontWeight: 600 }}>
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>

      <div style={{ 
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center",
        fontSize: 9, fontFamily: "monospace", color: "var(--t3)", fontWeight: "bold",
        borderBottom: "1px solid var(--b1)", paddingBottom: 6, marginBottom: 8
      }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(lbl => (
          <div key={lbl}>{lbl}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, maxHeight: 150, overflowY: "auto" }}>
        {calendarDays.map((day, idx) => {
          if (day.dayNumber === 0) {
            return <div key={`empty-${idx}`} />;
          }

          const isDayComplete = day.state === "complete";
          const isDayPartial = day.state === "partial";
          const isDayFuture = day.state === "future";

          let bg = "rgba(255,255,255,0.02)";
          let border = "1px solid rgba(255,255,255,0.08)";
          let color = "var(--t2)";

          if (isDayComplete) {
            bg = "var(--ac)";
            border = "1px solid transparent";
            color = "#000";
          } else if (isDayPartial) {
            bg = "rgba(204,255,0,0.15)";
            border = "1px solid rgba(204,255,0,0.3)";
            color = "var(--ac)";
          } else if (isDayFuture) {
            bg = "transparent";
            border = "1px solid transparent";
            color = "var(--t3)";
          }

          return (
            <div
              key={day.dateStr}
              style={{
                aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", border, background: bg, color,
                fontSize: 10, fontFamily: "monospace", fontWeight: "bold", transition: "all 0.3s"
              }}
              title={`${day.completions}/${habitTarget} completions`}
            >
              {day.dayNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
}
