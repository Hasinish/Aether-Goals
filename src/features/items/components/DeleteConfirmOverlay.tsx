"use client";

import React from "react";

interface DeleteConfirmOverlayProps {
  activeType: "goal" | "habit" | "deadline";
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmOverlay({
  activeType,
  isDeleting,
  onCancel,
  onConfirm
}: DeleteConfirmOverlayProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)",
      zIndex: 10, padding: 24, display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", gap: 16,
      animation: "fadeUp 0.3s ease both",
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Delete this {activeType}?
      </h3>
      <p style={{ fontSize: 12, color: "var(--t2)", textAlign: "center", lineHeight: 1.4 }}>
        Are you absolutely sure? This will permanently wipe this record from your dashboard.
      </p>
      <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 8 }}>
        <button 
          onClick={onCancel}
          style={{
            flex: 1, height: 44, borderRadius: 12, background: "var(--card-3)", border: "none",
            color: "var(--t1)", fontSize: 12, fontWeight: 700, cursor: "pointer",
            outline: "none"
          }}
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={isDeleting}
          style={{
            flex: 1, height: 44, borderRadius: 12, background: "var(--danger)", border: "none",
            color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
            outline: "none"
          }}
        >
          {isDeleting ? "Deleting..." : "Yes, Delete"}
        </button>
      </div>
    </div>
  );
}
