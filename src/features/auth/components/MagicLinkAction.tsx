"use client";

import React from "react";
import { Mail } from "lucide-react";

interface MagicLinkActionProps {
  onSend: () => void;
}

export function MagicLinkAction({ onSend }: MagicLinkActionProps) {
  return (
    <div style={{ animation: "fadeUp 0.4s 0.38s ease both" }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#48484a",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        paddingLeft: 4,
        marginBottom: 4,
        marginTop: 12,
      }}>
        Or continue with
      </div>

      <button
        type="button"
        onClick={onSend}
        style={{
          background: "#2c2c2e",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "0 16px",
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background 0.15s ease",
          width: "100%",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#333335"}
        onMouseLeave={e => e.currentTarget.style.background = "#2c2c2e"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mail size={17} color="#8e8e93" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
            Send Magic Link
          </span>
        </div>
        <span style={{ fontSize: 18, color: "#48484a" }}>›</span>
      </button>
    </div>
  );
}
