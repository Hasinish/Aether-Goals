"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSpringDrawerDrag } from "./useSpringDrawerDrag";

interface SpringDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeThreshold?: number;
  velocityThreshold?: number;
  autoFocusFirstField?: boolean; // Prop to prevent automatic keyboard popup
}

export function SpringDrawer({
  isOpen,
  onClose,
  title,
  children,
  closeThreshold = 100,
  velocityThreshold = 0.55,
  autoFocusFirstField = false, // Defaults to false
}: SpringDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // Clean state-driven tracking to avoid React style diff fight

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Set mounted
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync animation states
  useEffect(() => {
    if (isOpen) {
      // Save current focused element
      if (typeof document !== "undefined") {
        triggerRef.current = document.activeElement as HTMLElement | null;
      }
      setShouldRender(true);
      const t = setTimeout(() => {
        setAnimate(true);
        // Focus container or first input inside drawer for accessibility
        if (sheetRef.current) {
          if (autoFocusFirstField) {
            const input = sheetRef.current.querySelector("input, select, textarea, button") as HTMLElement | null;
            if (input) {
              input.focus();
              return;
            }
          }
          sheetRef.current.focus();
        }
      }, 20);
      return () => clearTimeout(t);
    } else {
      setAnimate(false);
      const t = setTimeout(() => {
        setShouldRender(false);
        // Restore focus
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, autoFocusFirstField]);

  // Hook handles physical drag physics & dismissal
  useSpringDrawerDrag({
    isOpen: animate,
    onClose,
    sheetRef,
    scrollRef,
    closeThreshold,
    velocityThreshold,
    onDragStateChange: setIsDragging,
  });

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !shouldRender) return null;

  const content = (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 9999,
          opacity: animate ? 1 : 0,
          transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Spring positioned Sheet container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "100%",
          maxWidth: 390,
          background: "var(--card)",
          borderTop: "1px solid var(--b2)",
          borderRadius: "28px 28px 0 0",
          padding: "12px 20px 34px",
          zIndex: 10000,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
          userSelect: "none",
          touchAction: "pan-y", // Safer touch behavior instead of none
          maxHeight: "min(86dvh, 720px)",
          display: "flex",
          flexDirection: "column",
          outline: "none",
          transform: isDragging ? undefined : (animate ? "translate3d(0, 0%, 0)" : "translate3d(0, 100%, 0)"),
          opacity: animate ? 1 : 0,
          transition: isDragging ? "opacity 300ms ease" : "transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Glass top edge highlights */}
        <div style={{
          position: 'absolute', top: 0, left: 20, right: 20, height: 1,
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        {/* Swipe Handle Indicator Bar */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          paddingTop: 4,
          paddingBottom: 16,
          cursor: "grab",
        }}>
          <div
            style={{
              width: 38,
              height: 5,
              borderRadius: 3,
              background: "var(--card-3)",
              opacity: 0.8,
            }}
          />
        </div>

        {/* Scrollable interior wrapper */}
        <div
          ref={scrollRef}
          style={{
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
