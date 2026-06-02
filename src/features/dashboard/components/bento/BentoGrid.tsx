"use client";

import React from "react";
import { Habit, Deadline } from "@/lib/types";
import { ActiveDrawer } from "../DetailDrawer";
import { BentoStreak, BentoCompletion, BentoHabitsToday } from "./BentoStatsCard";
import { BentoDeadline } from "./BentoDeadlineCard";

interface BentoGridProps {
  onNav: (id: string) => void;
  onDrawer: (d: ActiveDrawer) => void;
  streakHabit: Habit | null;
  closestDeadline: Deadline | null;
  overallProgress: number;
  completedHabits: number;
  totalHabits: number;
}

export function BentoGrid({ 
  onNav, 
  onDrawer, 
  streakHabit, 
  closestDeadline, 
  overallProgress, 
  completedHabits, 
  totalHabits 
}: BentoGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
      <BentoStreak onNav={onNav} habit={streakHabit} />
      <BentoDeadline onDrawer={onDrawer} onNav={onNav} deadline={closestDeadline} />
      <BentoCompletion onNav={onNav} progress={overallProgress} />
      <BentoHabitsToday onNav={onNav} completed={completedHabits} total={totalHabits} />
    </div>
  );
}
