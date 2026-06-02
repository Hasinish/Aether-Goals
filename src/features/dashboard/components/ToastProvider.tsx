"use client";

import React from "react";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export const ToastContext = React.createContext<(msg: string, type?: Toast["type"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const counter = React.useRef(0);

  const addToast = React.useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div style={{
        position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
        width: "90%", maxWidth: 350, pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.type === "error" ? "assertive" : "polite"}
            style={{
            background: t.type === "success" ? "var(--ac)"
              : t.type === "error" ? "#ff4040" : "#1e1e1e",
            color: t.type === "success" ? "#000" : "#fff",
            padding: "12px 18px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: t.type === "success"
              ? "0 4px 20px rgba(204,255,0,0.35)"
              : "0 4px 20px rgba(0,0,0,0.4)",
            animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            border: t.type === "info" ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✗ " : "ℹ "}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
