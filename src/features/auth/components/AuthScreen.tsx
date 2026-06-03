"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { AuthBackground } from "./AuthBackground";
import { PwaInstallAction } from "./PwaInstallAction";
import { AuthConfigRequired } from "./AuthConfigRequired";
import { MagicLinkAction } from "./MagicLinkAction";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

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
  useEffect(() => {
    setMounted(true);
  }, []);

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
        const { data, error: authError } = await client.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });

        if (authError) throw authError;

        // Supabase silently "succeeds" for existing emails to prevent enumeration.
        // The tell: user object exists but identities array is empty.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setError("An account with this email already exists. Sign in instead.");
          return;
        }

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const client = getSupabaseClient();
      const { error: authError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to sign in with Google.");
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
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "44px 24px 12px",
        position: "relative",
      }}>
        {/* Top left action buttons */}
        <div style={{
          position: "absolute",
          top: 20,
          left: 24,
          display: "flex",
          gap: 10,
          alignItems: "center",
          zIndex: 100,
        }}>
          {isDbReady && mounted && (
            <PwaInstallAction />
          )}
        </div>

        {/* Main Brand Heading */}
        <div style={{ marginTop: 8 }}>
          <h1 style={{
            fontSize: 34,
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
            fontSize: 14,
            fontWeight: 400,
            color: "#48484a",
            marginTop: 4,
            animation: "fadeUp 0.4s 0.1s ease both",
          }}>
            Track what matters.
          </p>
        </div>
      </div>

      {/* BOTTOM SHEET — #1c1c1e */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(20, 20, 20, 0.35) 100%)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "32px 32px 0 0",
        padding: "12px 20px 16px",
        borderTop: "1.5px solid rgba(255, 255, 255, 0.55)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.22)",
        borderRight: "1px solid rgba(255, 255, 255, 0.22)",
        borderBottom: "none",
        boxShadow: "0 -12px 48px rgba(0, 0, 0, 0.65)",
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
          margin: "0 auto 8px",
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
            <div style={{ marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 13, color: "#8e8e93", marginTop: 3 }}>
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
              marginBottom: 8,
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
                      padding: "7px 0",
                      borderRadius: 19,
                      border: "none",
                      background: active ? "#ccff00" : "transparent",
                      color: active ? "#000" : "#8e8e93",
                      fontSize: 12,
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
                marginBottom: 2,
                animation: "fadeUp 0.4s 0.25s ease both",
              }}>
                Account
              </div>

              {/* BENTO INPUT GROUP */}
              <div style={{
                background: "#2c2c2e",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 8,
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "fadeUp 0.4s 0.25s ease both",
              }}>
                {/* EMAIL CELL */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  height: 40,
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
                      fontSize: 14,
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
                  height: 40,
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
                      fontSize: 14,
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
                  height: 40,
                  background: loading ? "rgba(204,255,0,0.5)" : "#ccff00",
                  color: "#000",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease",
                  boxShadow: "0 4px 20px rgba(204,255,0,0.25)",
                  marginBottom: 4,
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

            {/* Divider */}
            <div style={{
              display: "flex",
              alignItems: "center",
              margin: "12px 0 10px",
              opacity: 0.35,
              animation: "fadeUp 0.4s 0.35s ease both",
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", padding: "0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                height: 40,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 14,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s, transform 0.1s",
                animation: "fadeUp 0.4s 0.38s ease both",
                marginBottom: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"; }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* MAGIC LINK — SECONDARY BENTO BLOCK */}
            <MagicLinkAction onSend={handleMagicLink} />
          </>
        )}

        {/* FOOTER */}
        <p style={{
          textAlign: "center",
          fontSize: 11,
          color: "#3a3a3c",
          marginTop: 10,
          lineHeight: 1.6,
        }}>
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </AuthBackground>
  );
}
