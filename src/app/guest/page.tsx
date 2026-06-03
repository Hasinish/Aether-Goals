"use client";

import React from "react";
import { StoreProvider, useGoalsStore } from "@/lib/store";
import { HabitStoreProvider } from "@/lib/habitStore";
import { DeadlineStoreProvider } from "@/lib/deadlineStore";
import { ToastProvider } from "@/features/dashboard/components/ToastProvider";
import DashboardContent from "@/features/dashboard/DashboardContent";

import { getInitialSeedData } from "@/lib/seed";
import { HabitLog } from "@/lib/types";

function GuestDashboardWithReset() {
  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSeed = () => {
    // 1. Seed Goals
    const { goals, subtasks } = getInitialSeedData();
    const assembledGoals = goals.map((g) => {
      const goalSubtasks = subtasks.filter((s) => s.goal_id === g.id);
      const completedCount = goalSubtasks.filter((s) => s.is_complete).length;
      const progressPercent = goalSubtasks.length === 0 ? 0 : Math.round((completedCount / goalSubtasks.length) * 100);
      return {
        ...g,
        subtasks: goalSubtasks,
        progressPercent,
      };
    });
    localStorage.setItem("guest_goals", JSON.stringify(assembledGoals));

    // 2. Seed Habits and Logs
    const habitsList = [
      {
        id: "seed-habit-leetcode",
        user_id: "guest-id",
        title: "LeetCode Daily Practice",
        tags: ["coding", "interview", "icon:code"],
        daily_target: 1,
        sort_order: 0,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "seed-habit-research",
        user_id: "guest-id",
        title: "Read Research Papers",
        tags: ["academic", "reading", "icon:book-open"],
        daily_target: 1,
        sort_order: 1,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "seed-habit-gym",
        user_id: "guest-id",
        title: "Gym Strength Training",
        tags: ["health", "fitness", "icon:activity"],
        daily_target: 1,
        sort_order: 2,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    // Generate 100 days of logs
    const logs: HabitLog[] = [];
    const today = new Date();
    
    habitsList.forEach((habit) => {
      const habitId = habit.id;
      for (let i = 0; i < 100; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        
        let completed = false;
        if (habitId === "seed-habit-leetcode") {
          // Completed today (i=0) and consecutive last 18 days, other days random 80%
          completed = i <= 18 || Math.random() < 0.8;
        } else if (habitId === "seed-habit-research") {
          // Not completed today (i=0), completed yesterday (i=1) and 2 days ago (i=2), other days random 60%
          completed = (i > 0 && i <= 3) || (i > 0 && Math.random() < 0.6);
        } else if (habitId === "seed-habit-gym") {
          // Completed today, completed last 8 days, other days random 70%
          completed = i <= 8 || Math.random() < 0.7;
        }

        if (completed) {
          logs.push({
            id: `log-${habitId}-${i}`,
            habit_id: habitId,
            user_id: "guest-id",
            log_date: dateStr,
            completions: 1,
          });
        }
      }
    });

    localStorage.setItem("guest_habits", JSON.stringify(habitsList));
    localStorage.setItem("guest_habit_logs", JSON.stringify(logs));

    // 3. Seed Deadlines
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);

    const threeDaysAway = new Date();
    threeDaysAway.setDate(threeDaysAway.getDate() + 3);
    threeDaysAway.setHours(17, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(12, 0, 0, 0);

    const deadlinesList = [
      {
        id: "seed-deadline-thesis",
        user_id: "guest-id",
        title: "Thesis Final Draft Submission",
        due_date: tomorrow.toISOString(),
        completed: false,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "seed-deadline-bs23",
        user_id: "guest-id",
        title: "Brain Station 23 Application",
        due_date: threeDaysAway.toISOString(),
        completed: false,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "seed-deadline-fiverr",
        user_id: "guest-id",
        title: "Fiverr Developer Profile Verification",
        due_date: twoDaysAgo.toISOString(),
        completed: true,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    localStorage.setItem("guest_deadlines", JSON.stringify(deadlinesList));
    window.location.reload();
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Floating Indicator Banner */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          maxWidth: 390,
          margin: "0 auto",
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(204, 255, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--ac)",
              boxShadow: "0 0 8px var(--ac)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--t1)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Guest Sandbox
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleSeed}
            style={{
              background: "rgba(204, 255, 0, 0.1)",
              border: "1px solid rgba(204, 255, 0, 0.25)",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ac)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(204, 255, 0, 0.25)";
              e.currentTarget.style.borderColor = "var(--ac)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(204, 255, 0, 0.1)";
              e.currentTarget.style.borderColor = "rgba(204, 255, 0, 0.25)";
            }}
          >
            Seed Demo
          </button>
          <button
            onClick={handleReset}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--t2)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 92, 92, 0.15)";
              e.currentTarget.style.borderColor = "var(--danger)";
              e.currentTarget.style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "var(--t2)";
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <DashboardContent />
    </div>
  );
}

function GuestWrapper() {
  const { user } = useGoalsStore();

  if (!user) {
    return null;
  }

  return (
    <HabitStoreProvider user={user}>
      <DeadlineStoreProvider user={user}>
        <GuestDashboardWithReset />
      </DeadlineStoreProvider>
    </HabitStoreProvider>
  );
}

export default function GuestPage() {
  return (
    <StoreProvider guestMode={true}>
      <ToastProvider>
        <GuestWrapper />
      </ToastProvider>
    </StoreProvider>
  );
}
