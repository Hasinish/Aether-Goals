"use client";

import React from "react";
import { StoreProvider, useGoalsStore } from "@/lib/store";
import { HabitStoreProvider } from "@/lib/habitStore";
import { DeadlineStoreProvider } from "@/lib/deadlineStore";
import { ToastProvider } from "@/features/dashboard/components/ToastProvider";
import DashboardContent from "@/features/dashboard/DashboardContent";

function GuestDashboardWithReset() {
  const handleReset = () => {
    localStorage.clear();
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
            Guest Sandbox Mode
          </span>
        </div>
        <button
          onClick={handleReset}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--t2)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(204, 255, 0, 0.15)";
            e.currentTarget.style.borderColor = "var(--ac)";
            e.currentTarget.style.color = "var(--ac)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--t2)";
          }}
        >
          Reset Walkthrough
        </button>
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
