"use client";

import React from "react";
import { Capacitor } from "@capacitor/core";

interface AndroidDownloadActionProps {
  apkUrl?: string;
}

export function AndroidDownloadAction({ apkUrl }: AndroidDownloadActionProps) {
  const isNative = Capacitor.isNativePlatform();

  // Hide button completely inside the native app
  if (isNative) return null;

  if (!apkUrl) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Android APK is not available yet."
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          padding: "7px 14px",
          borderRadius: 20,
          color: "#48484a",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          cursor: "not-allowed",
          zIndex: 100,
          fontFamily: "inherit",
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#48484a" }} />
        <span>APK COMING SOON</span>
      </button>
    );
  }

  return (
    <a
      href={apkUrl}
      download
      aria-label="Download Android APK"
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
        textDecoration: "none",
        zIndex: 100,
        fontFamily: "inherit",
      }}
    >
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ccff00" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.14em" }}>
        DOWNLOAD APK
      </span>
    </a>
  );
}
