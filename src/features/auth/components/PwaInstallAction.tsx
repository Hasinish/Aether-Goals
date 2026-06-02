"use client";

import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type WindowWithDeferredPrompt = typeof window & {
  deferredPrompt?: BeforeInstallPromptEvent | null;
};

export function PwaInstallAction() {
  const [mounted, setMounted] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isNative = Capacitor.isNativePlatform();
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    
    setIsStandalone(isNative || checkStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent) && !/lkbx/.test(userAgent); // Exclude inside wrappers if any
    setIsIos(detectIos);

    const win = window as WindowWithDeferredPrompt;

    // Check if deferredPrompt is already captured
    if (win.deferredPrompt) {
      setIsInstallable(true);
    }

    // Event listener for layout.tsx dispatch
    const handlePromptCaptured = () => {
      setIsInstallable(true);
    };

    window.addEventListener("pwa-prompt-captured", handlePromptCaptured);
    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener("pwa-prompt-captured", handlePromptCaptured);
    };
  }, []);

  if (!mounted || isStandalone) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const win = window as WindowWithDeferredPrompt;
      const promptEvent = win.deferredPrompt;
      if (!promptEvent) return;

      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`PWA install prompt outcome: ${outcome}`);
      
      // Clear deferred prompt so it can't be used again
      win.deferredPrompt = null;
      setIsInstallable(false);
    } else if (isIos) {
      setShowIosTip((prev) => !prev);
    }
  };

  // Only show if installable (Android Chrome, Desktop, etc.) or if on iOS Safari
  if (!isInstallable && !isIos) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleInstallClick}
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          padding: "7px 14px",
          borderRadius: 20,
          cursor: "pointer",
          animation: "fadeUp 0.4s ease both",
          fontFamily: "inherit",
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ccff00" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.14em" }}>
          INSTALL APP
        </span>
      </button>

      {showIosTip && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: 8,
          width: 240,
          background: "#1c1c1e",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 200,
          animation: "fadeUp 0.2s ease both",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#e5e5ea", lineHeight: 1.4 }}>
            To install Aether Goals on iOS:<br />
            1. Tap the **Share** button ⎙ below.<br />
            2. Scroll down and select **Add to Home Screen**.
          </p>
        </div>
      )}
    </div>
  );
}
