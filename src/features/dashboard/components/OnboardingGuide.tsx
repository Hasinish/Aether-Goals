"use client";

import React from "react";
import { Sparkles, Target, Clock, Zap, ArrowRight } from "lucide-react";

interface OnboardingGuideProps {
  goalsCount: number;
  deadlinesCount: number;
  habitsCount: number;
  onAction: (type: "goal" | "habit" | "deadline") => void;
}

export function OnboardingGuide({
  goalsCount,
  deadlinesCount,
  habitsCount,
  onAction
}: OnboardingGuideProps) {
  // Determine onboarding stage
  // Stage 1: No goals -> Create Goal
  // Stage 2: Has goals, no deadlines -> Create Deadline
  // Stage 3: Has goals & deadlines, no habits -> Create Habit
  // Stage 4: Completed all -> Hide guide (null)
  
  if (goalsCount > 0 && deadlinesCount > 0 && habitsCount > 0) {
    return null;
  }

  let phase = 1;
  let title = "Set Your Core Goal";
  let description = "Establish a core milestone. Every journey begins with a defined target.";
  let buttonText = "Create First Goal";
  let targetType: "goal" | "habit" | "deadline" = "goal";
  let Icon = Target;
  let glowColor = "var(--ac)";

  if (goalsCount > 0 && deadlinesCount === 0) {
    phase = 2;
    title = "Establish a Target Deadline";
    description = "Milestones need timelines. Add a target date to build urgency.";
    buttonText = "Set Deadline Date";
    targetType = "deadline";
    Icon = Clock;
    glowColor = "var(--warn)";
  } else if (goalsCount > 0 && deadlinesCount > 0 && habitsCount === 0) {
    phase = 3;
    title = "Build Daily Habits";
    description = "Consistency feeds ambition. Set daily routines to fuel your streaks.";
    buttonText = "Start Daily Habit";
    targetType = "habit";
    Icon = Zap;
    glowColor = "var(--ac)";
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid var(--b1)",
        borderRadius: 24,
        padding: "20px 22px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fadeUp 0.5s ease both",
        borderLeft: `4px solid ${glowColor}`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), 0 0 16px ${glowColor}08`
      }}
    >
      {/* Subtle background ambient gradient dot */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: `radial-gradient(circle, ${glowColor}0d 0%, transparent 70%)`,
          pointerEvents: "none",
          filter: "blur(8px)"
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--t2)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: 20,
              textTransform: "uppercase"
            }}
          >
            Phase {phase} of 3
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={11} color="var(--ac)" className="animate-pulse" />
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ac)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Guided Path
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--b1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: glowColor
          }}
        >
          <Icon size={20} />
        </div>
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "var(--t1)",
              letterSpacing: "-0.2px",
              marginBottom: 4
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.45, fontWeight: 400 }}>
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 14, marginTop: 10 }}>
        {/* Onboarding Action Button */}
        <button
          onClick={() => onAction(targetType)}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            background: targetType === "deadline" ? "var(--warn)" : "var(--ac)",
            color: "#000",
            fontSize: 12,
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.2s ease",
            boxShadow: `0 4px 14px ${targetType === "deadline" ? "rgba(251,191,36,0.25)" : "rgba(204,255,0,0.25)"}`
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {buttonText}
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>

        {/* 3-segment pill indicators */}
        <div style={{ display: "flex", gap: 4, width: 64 }}>
          {[1, 2, 3].map((step) => {
            const isCompleted = step < phase;
            const isActive = step === phase;
            return (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 2.5,
                  background: isCompleted || isActive ? glowColor : "rgba(255,255,255,0.06)",
                  boxShadow: isActive ? `0 0 8px ${glowColor}` : "none",
                  transition: "all 0.4s ease",
                  opacity: isActive ? 1 : isCompleted ? 0.6 : 0.25
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
