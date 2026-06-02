"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { AuthBackground } from "./AuthBackground";
import { PwaInstallAction } from "./PwaInstallAction";
import { AuthConfigRequired } from "./AuthConfigRequired";
import { MagicLinkAction } from "./MagicLinkAction";

export default function AuthScreen() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const isDbReady = isSupabaseConfigured();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIsStandalone(checkStandalone);
  }, []);

  const handleApkDownloadClick = () => {
    const link = document.createElement("a");
    link.href = "/aether-goals.apk";
    link.download = "aether-goals.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    if (!isDbReady) {
      setError("Supabase URL and API keys are missing. Cloud connection is required to launch the application.");
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();

      if (!isSignIn) {
        // Sign Up
        const { error: authError } = await client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });

        if (authError) throw authError;
        setMessage("Account created. Please check your email or log in directly if auto-confirmed.");
      } else {
        // Sign In
        const { error: authError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) throw authError;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Please enter your email address to receive a magic link.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    if (!isDbReady) {
      setError("Supabase URL and API keys are missing. Cloud connection is required to launch the application.");
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();
      const { error: authError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (authError) throw authError;
      setMagicLinkSent(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <AuthBackground>
      {/* TOP ZONE — #0f0f0f — Centered logo in the middle of spacing */}
      <div style={{
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "54px 28px 16px",
        position: "relative",
      }}>
        {/* Logo pill — top left */}
        {isDbReady && mounted && !isStandalone && (
          <PwaInstallAction onClick={handleApkDownloadClick} />
        )}

        {/* Main Brand Heading */}
        <div style={{ marginTop: 12 }}>
          <h1 style={{
            fontSize: 42,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1.5px",
            lineHeight: 0.92,
            margin: 0,
            animation: "fadeUp 0.45s 0.05s ease both",
          }}>
            AETHER<br />
            <span style={{ color: "#ccff00" }}>Goals</span>
          </h1>
          <p style={{
            fontSize: 15,
            fontWeight: 400,
            color: "#48484a",
            marginTop: 6,
            animation: "fadeUp 0.4s 0.1s ease both",
          }}>
            Track what matters.
          </p>
        </div>
      </div>

      {/* BOTTOM SHEET — #1c1c1e */}
      <div style={{
        background: "#1c1c1e",
        borderRadius: "32px 32px 0 0",
        padding: "16px 20px 20px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 -12px 48px rgba(0,0,0,0.6)",
        animation: "sheetUp 0.55s 0.1s cubic-bezier(0.16,1,0.3,1) both",
        position: "relative",
        zIndex: 50,
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.18)",
          margin: "0 auto 12px",
        }} />

        {!isDbReady ? (
          <AuthConfigRequired />
        ) : magicLinkSent ? (
          /* SUCCESS STATE (magic link sent) */
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "16px 0 8px",
            animation: "fadeUp 0.4s ease both",
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(48,209,88,0.12)",
              border: "1.5px solid rgba(48,209,88,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}>
              <Check size={26} color="#30d158" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>
              Check your inbox
            </h3>
            <p style={{ fontSize: 14, color: "#8e8e93", lineHeight: 1.5 }}>
              Magic link sent to<br />
              <span style={{ color: "#ccff00", fontWeight: 600 }}>{email}</span>
            </p>
            
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setMessage("");
                setError("");
              }}
              style={{
                marginTop: 24,
                background: "none",
                border: "none",
                color: "#ccff00",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          /* STANDARD FORM */
          <>
            {/* Sheet Heading */}
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: "#8e8e93", marginTop: 4 }}>
                Sign in to your account
              </p>
            </div>

            {/* Error alerts */}
            {error && (
              <div 
                aria-live="assertive"
                style={{
                  background: "rgba(255,69,58,0.1)",
                  border: "1px solid rgba(255,69,58,0.2)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#ff453a",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success messages */}
            {message && (
              <div 
                aria-live="polite"
                style={{
                  background: "rgba(48,209,88,0.1)",
                  border: "1px solid rgba(48,209,88,0.2)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#30d158",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Check size={14} style={{ flexShrink: 0 }} />
                <span>{message}</span>
              </div>
            )}

            {/* SIGN IN / SIGN UP PILL SWITCHER */}
            <div style={{
              display: "flex",
              background: "#2c2c2e",
              borderRadius: 22,
              padding: 3,
              marginBottom: 14,
            }}>
              {["Sign In", "Sign Up"].map(label => {
                const active = (label === "Sign In") ? isSignIn : !isSignIn;
                return (
                  <button 
                    key={label} 
                    onClick={() => {
                      setIsSignIn(label === "Sign In");
                      setError("");
                      setMessage("");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 19,
                      border: "none",
                      background: active ? "#ccff00" : "transparent",
                      color: active ? "#000" : "#8e8e93",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                      boxShadow: active ? "0 2px 10px rgba(204,255,0,0.2)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAuthSubmit}>
              {/* Section label above group */}
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#48484a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                paddingLeft: 4,
                marginBottom: 4,
                animation: "fadeUp 0.4s 0.25s ease both",
              }}>
                Account
              </div>

              {/* BENTO INPUT GROUP */}
              <div style={{
                background: "#2c2c2e",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "fadeUp 0.4s 0.25s ease both",
              }}>
                {/* EMAIL CELL */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  height: 46,
                  gap: 12,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#8e8e93", width: 72, flexShrink: 0 }}>
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    aria-label="Email Address"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "inherit",
                      outline: "none",
                      textAlign: "right",
                    }}
                  />
                </div>

                {/* HAIRLINE DIVIDER */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginLeft: 16 }} />

                {/* PASSWORD CELL */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  height: 46,
                  gap: 12,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#8e8e93", width: 72, flexShrink: 0 }}>
                    Password
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-label="Password"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: 15,
                      fontFamily: "inherit",
                      outline: "none",
                      textAlign: "right",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#48484a" />
                    ) : (
                      <Eye size={16} color="#48484a" />
                    )}
                  </button>
                </div>
              </div>

              {/* PRIMARY CTA BUTTON */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 48,
                  background: loading ? "rgba(204,255,0,0.5)" : "#ccff00",
                  color: "#000",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease",
                  boxShadow: "0 4px 20px rgba(204,255,0,0.25)",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  animation: "fadeUp 0.4s 0.32s ease both",
                }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {loading ? (
                  <span style={{ opacity: 0.7 }}>Authenticating...</span>
                ) : (
                  <>{isSignIn ? "Sign In →" : "Sign Up →"}</>
                )}
              </button>
            </form>

            {/* MAGIC LINK — SECONDARY BENTO BLOCK */}
            <MagicLinkAction onSend={handleMagicLink} />
          </>
        )}

        {/* FOOTER */}
        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: "#3a3a3c",
          marginTop: 16,
          lineHeight: 1.6,
        }}>
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </AuthBackground>
  );
}
