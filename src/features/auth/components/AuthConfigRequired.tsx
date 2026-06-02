"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export function AuthConfigRequired() {
  return (
    <div style={{
      padding: "12px 4px 20px",
      animation: "fadeUp 0.4s ease both",
    }}>
      <div style={{
        background: "rgba(255,69,58,0.08)",
        border: "1px solid rgba(255,69,58,0.2)",
        borderRadius: 16,
        padding: "18px 16px",
        fontSize: 13,
        color: "#ff453a",
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldAlert size={20} />
          <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 14 }}>
            Supabase Required
          </span>
        </div>
        <p style={{ color: "#8e8e93", lineHeight: 1.5, fontSize: 13 }}>
          Secure cloud synchronization is required to run this application. No offline sandbox workspace is active.
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 20,
      }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
          Configuration Steps
        </h4>
        <p style={{ fontSize: 12, color: "#8e8e93", lineHeight: 1.5, marginBottom: 12 }}>
          Please create a <code>.env.local</code> file in your project root with the following keys:
        </p>
        <div style={{
          background: "#000",
          borderRadius: 8,
          padding: "10px 12px",
          fontFamily: "monospace",
          fontSize: 11,
          color: "#ccff00",
          lineHeight: 1.6,
          overflowX: "auto",
        }}>
          NEXT_PUBLIC_SUPABASE_URL=...<br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY=...
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#48484a", textAlign: "center", lineHeight: 1.4 }}>
        Define environment variables to automatically enable registration & OTP magic link login features.
      </p>
    </div>
  );
}
