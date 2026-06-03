"use client";

import React from "react";

interface DrawerShellProps {
  onClose: () => void;
  animate: boolean;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  title: string;
}

export function DrawerShell({ onClose, animate, sheetRef, children, title }: DrawerShellProps) {
  // Accessibility Escape key close listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Drawer Backdrop Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 999,
          opacity: animate ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Drawer Sheet Container */}
      <div 
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-sheet ${animate ? 'open' : ''}`}
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
          padding: "16px 24px 34px",
          zIndex: 1000,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          userSelect: "none",
          touchAction: "pan-y",
          maxHeight: "min(86dvh, 720px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {/* Glass top highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 20, right: 20, height: 1,
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        {/* Grab Handle / Close button */}
        <div 
          onClick={onClose}
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          style={{
            width: 36, height: 5, borderRadius: 2.5,
            background: "rgba(255, 255, 255, 0.45)", margin: "0 auto 24px",
            cursor: "pointer",
            outline: "none",
          }} 
        />
        {children}
      </div>
    </>
  );
}
