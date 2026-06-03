"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    // Disable default browser pull-to-refresh
    const style = document.createElement("style");
    style.innerHTML = `
      html, body {
        overscroll-behavior-y: contain !important;
      }
    `;
    document.head.appendChild(style);

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger pull-to-refresh if we are scrolled to the top
      if (window.scrollY > 0 || isRefreshing) return;

      const target = e.target as HTMLElement;

      // Do NOT trigger pull-to-refresh inside drawers, dialogs, or bottom sheets
      if (
        target.closest('[role="dialog"]') ||
        target.closest('.drawer-sheet') ||
        target.closest('[data-modal-sheet="true"]') ||
        target.closest('.drawer') ||
        target.closest('[class*="drawer"]')
      ) {
        return;
      }

      startYRef.current = e.touches[0].pageY;
      isPullingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].pageY;
      const diff = currentY - startYRef.current;

      // If dragging downward at the top of the window
      if (diff > 0 && window.scrollY === 0) {
        // Prevent default browser scroll or pull-refresh
        e.preventDefault();

        // Apply logarithmic-like damping to pull distance
        const distance = Math.min(100, Math.pow(diff, 0.8));
        setPullDistance(distance);
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;

      // Threshold is 60px
      if (pullDistance > 60) {
        setIsRefreshing(true);
        setPullDistance(50); // keep spinner visible

        // Vibrate for feedback if API is available
        if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(15);
        }

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      style.remove();
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  if (pullDistance === 0 && !isRefreshing) return null;

  const rotation = Math.min(360, (pullDistance / 50) * 360);
  const opacity = Math.min(1, pullDistance / 40);

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999, // below Toast notifications but above everything else
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "rgba(10, 10, 10, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 12px rgba(204, 255, 0, 0.12)",
        opacity,
        transition: isPullingRef.current ? "none" : "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "none",
      }}
    >
      <Loader2
        size={18}
        color="var(--ac)"
        style={{
          transform: `rotate(${rotation}deg)`,
          animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
          transition: isRefreshing ? "none" : "transform 0.05s linear",
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
