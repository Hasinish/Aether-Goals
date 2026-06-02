"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";
import AuthScreen from "@/components/AuthScreen";
import { HabitStoreProvider } from "@/lib/habitStore";
import { DeadlineStoreProvider } from "@/lib/deadlineStore";
import { ToastProvider } from "@/features/dashboard/components/ToastProvider";
import DashboardContent from "@/features/dashboard/DashboardContent";

export default function Home() {
  const { user } = useGoalsStore();

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ToastProvider>
      <HabitStoreProvider user={user}>
        <DeadlineStoreProvider user={user}>
          <DashboardContent />
        </DeadlineStoreProvider>
      </HabitStoreProvider>
    </ToastProvider>
  );
}
