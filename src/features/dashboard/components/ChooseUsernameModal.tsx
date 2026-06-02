"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";
import { useToast } from "./ToastProvider";

export function ChooseUsernameModal() {
  const { user, username, updateUsername, loading } = useGoalsStore();
  const [inputVal, setInputVal] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const toast = useToast();

  const isVisible = !!user && !loading && !username;

  React.useEffect(() => {
    if (isVisible) {
      setInputVal("");
      setErrorMsg("");
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await updateUsername(inputVal.trim());
      toast("Username configured! Welcome to Aether Goals. 🚀");
    } catch (err) {
      setErrorMsg((err as { message?: string }).message || "Failed to set username. Try another name.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--sheet)', borderRadius: 24,
        border: '1px solid var(--b1)', width: '100%', maxWidth: 400,
        padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'fadeUp 0.4s ease both',
      }}>
        <h2 style={{
          fontSize: 22, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.5px', marginBottom: 8, textAlign: 'center',
        }}>
          Choose a Username
        </h2>
        <p style={{
          fontSize: 13, color: 'var(--t2)', lineHeight: 1.5,
          marginBottom: 20, textAlign: 'center',
        }}>
          Welcome to Aether! Let&apos;s personalize your dashboard by setting up your unique profile username.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'var(--block)', borderRadius: 16,
            border: '1px solid var(--b1)', padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. hyperion_discipline"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              required
              disabled={isSubmitting}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 15, fontWeight: 600, padding: 0, width: '100%',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ fontSize: 12, color: '#ff4040', fontWeight: 600, textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || inputVal.trim().length < 3}
            style={{
              height: 48, borderRadius: 16, background: 'var(--ac)', border: 'none',
              color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(204,255,0,0.3)', transition: 'opacity 0.2s',
              opacity: (inputVal.trim().length < 3 || isSubmitting) ? 0.5 : 1,
            }}
          >
            {isSubmitting ? "Configuring..." : "Confirm & Enter Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
