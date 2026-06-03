"use client";

import React, { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoaded: boolean;
}

export default function LoadingScreen({ isLoaded }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 500); // 500ms fade duration
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: fadeOut ? "none" : "auto",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {/* Shimmering logo/text */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-1.5px",
              lineHeight: 0.95,
              margin: 0,
            }}
          >
            AETHER<br />
            <span style={{ color: "#ccff00" }}>Goals</span>
          </h1>
          <p style={{ fontSize: 11, color: "#8e8e93", marginTop: 12, letterSpacing: "0.08em", fontWeight: 600 }}>
            LOADING VISUAL EXPERIENCE
          </p>
        </div>

        {/* Circular progress loop */}
        <div style={{ position: "relative", width: 40, height: 40, marginTop: 4 }}>
          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(255, 255, 255, 0.05)",
            }}
          />
          {/* Active rotating arc */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "#ccff00",
              animation: "spin 0.75s linear infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
