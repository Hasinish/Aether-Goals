"use client";

import React, { useState, useEffect, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";

interface AuthBackgroundProps {
  children: React.ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Helper: mark video ready exactly once
    const markVideoReady = () => {
      if (!loadedRef.current) {
        loadedRef.current = true;
        setVideoLoaded(true);
      }
    };

    // Respect prefers-reduced-motion — skip waiting for video entirely
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      markVideoReady();
      return;
    }

    const video = videoRef.current;

    // Timeout fallback: never block the app more than 2500ms
    const timeoutId = setTimeout(markVideoReady, 2500);

    if (!video) {
      // No video element — unblock immediately
      markVideoReady();
      clearTimeout(timeoutId);
      return;
    }

    // If already buffered enough, unblock now
    if (video.readyState >= 2) {
      markVideoReady();
      clearTimeout(timeoutId);
      return;
    }

    video.addEventListener("canplay", markVideoReady);
    video.addEventListener("canplaythrough", markVideoReady);
    video.addEventListener("playing", markVideoReady);
    video.addEventListener("loadeddata", markVideoReady);
    video.addEventListener("error", markVideoReady);

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener("canplay", markVideoReady);
      video.removeEventListener("canplaythrough", markVideoReady);
      video.removeEventListener("playing", markVideoReady);
      video.removeEventListener("loadeddata", markVideoReady);
      video.removeEventListener("error", markVideoReady);
    };
  }, []);

  return (
    <div style={{
      background: "#000000",
      minHeight: "100dvh",
      maxWidth: 390,
      margin: "0 auto",
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      position: "relative",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }}>
      <style>{`
        :root {
          --bg:       #0f0f0f;
          --sheet:    #1c1c1e;
          --block:    #2c2c2e;
          --block-2:  #242426;
          --ac:       #ccff00;
          --t1:       #ffffff;
          --t2:       #8e8e93;
          --t3:       #48484a;
          --sep:      rgba(255,255,255,0.08);
          --danger:   #ff453a;
          --ok:        #30d158;
        }

        input::placeholder {
          color: #444444 !important;
          opacity: 1;
        }
        
        input:focus {
          outline: none;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sheetUp {
          from {
            opacity: 0.5;
            transform: translateY(48px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <LoadingScreen isLoaded={videoLoaded} />

      {/* Volumetric Full Bleed Looping Video Background — decorative only */}
      <video
        ref={videoRef}
        src="/auth-loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        onError={() => {
          if (!loadedRef.current) {
            loadedRef.current = true;
            setVideoLoaded(true);
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleY(-1)",
          zIndex: 0,
          pointerEvents: "none"
        }}
      />

      {/* Children container overlaid on top of video */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: "space-between"
      }}>
        {children}
      </div>
    </div>
  );
}
