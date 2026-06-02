"use client";

import React from "react";

interface HabitFormFieldsProps {
  habitTitle: string;
  setHabitTitle: (v: string) => void;
  habitTags: string;
  setHabitTags: (v: string) => void;
  habitTarget: number;
  setHabitTarget: (v: number) => void;
}

export function HabitFormFields({
  habitTitle,
  setHabitTitle,
  habitTags,
  setHabitTags,
  habitTarget,
  setHabitTarget
}: HabitFormFieldsProps) {
  return (
    <>
      <div>
        <label 
          htmlFor="habit-name-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Habit Name
        </label>
        <input 
          id="habit-name-input"
          type="text" 
          value={habitTitle}
          onChange={e => setHabitTitle(e.target.value)}
          placeholder="e.g. DEEP WORK SESSIONS" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>

      <div>
        <label 
          htmlFor="habit-category-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Habit Category Tag
        </label>
        <input 
          id="habit-category-input"
          type="text" 
          value={habitTags}
          onChange={e => setHabitTags(e.target.value)}
          placeholder="e.g. WORK, HEALTH" 
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>

      <div>
        <label 
          htmlFor="habit-target-input"
          style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}
        >
          Daily Target Check-ins
        </label>
        <input 
          id="habit-target-input"
          type="number" 
          value={habitTarget}
          onChange={e => setHabitTarget(Math.max(1, parseInt(e.target.value) || 1))}
          style={{
            width: "100%", height: 46, borderRadius: 12, background: "var(--bg)", border: "1px solid var(--b1)",
            padding: "0 14px", color: "#fff", fontSize: 13, fontFamily: "inherit",
            outline: "none", transition: "border-color 0.2s",
          }}
        />
      </div>
    </>
  );
}
