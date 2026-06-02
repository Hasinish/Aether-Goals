"use client";

import React from "react";

interface PwaInstallActionProps {
  onClick: () => void;
}

export function PwaInstallAction({ onClick }: PwaInstallActionProps) {
  return (
    <button 
      onClick={onClick}
      style={{
        position: "absolute",
        top: 20,
        left: 24,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        padding: "7px 14px",
        borderRadius: 20,
        cursor: "pointer",
        animation: "fadeUp 0.4s ease both",
        zIndex: 100,
        fontFamily: "inherit",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ccff00" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.14em" }}>
        DOWNLOAD APK
      </span>
    </button>
  );
}
