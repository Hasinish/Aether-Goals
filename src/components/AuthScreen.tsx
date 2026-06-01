"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { ArrowRight, KeyRound, Mail, ShieldAlert, Download } from "lucide-react";
import ConstellationBackground from "./ConstellationBackground";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function AuthScreen() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isDbReady = isSupabaseConfigured();

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setMounted(true);

    // 1. Instantly pull prompt if captured globally by layout.tsx before mount
    const earlyPrompt = ("deferredPrompt" in window) 
      ? (window as Window & { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt 
      : null;
    
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
    }

    // 2. Custom event listener to capture prompts flowing post-mount
    const handleCustomPromptCaptured = () => {
      const captured = ("deferredPrompt" in window)
        ? (window as Window & { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt
        : null;
      
      if (captured) {
        setDeferredPrompt(captured);
      }
    };

    window.addEventListener("pwa-prompt-captured", handleCustomPromptCaptured);

    // 3. Fallback standard browser beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setMessage("Aether Goals has been successfully installed as an app!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-prompt-captured", handleCustomPromptCaptured);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handlePwaInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setMessage("Initiated installation for Aether Goals...");
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("PWA install prompt failed:", err);
      }
    } else {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
        ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !("MSStream" in window);

      if (isStandalone) {
        setMessage("Aether is already running as a standalone PWA.");
      } else if (isIOS) {
        setMessage("To install Aether on iOS: Tap 'Share' in Safari, then select 'Add to Home Screen'.");
      } else {
        setMessage("Aether is PWA ready! To install, check your browser's options menu (e.g., three dots -> Install App).");
      }
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (isPasswordMode && !password) return;

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

      if (isPasswordMode) {
        if (isSignUp) {
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
          const { error: authError } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (authError) throw authError;
        }
      } else {
        const { error: authError } = await client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });

        if (authError) throw authError;
        setMessage("A magic link has been sent to your email. Check your inbox.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "var(--bg)",
      minHeight: "100vh",
      maxWidth: 390,
      margin: "0 auto",
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "24px 20px 48px",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
          /* Backgrounds */
          --bg:        #141414;
          --card:      #1e1e1e;
          --card-2:    #252525;
          --card-3:    #2a2a2a;

          /* Accent */
          --ac:        #ccff00;
          --ac-soft:   rgba(204,255,0,0.12);
          --ac-mid:    rgba(204,255,0,0.35);

          /* Text */
          --t1:        #ffffff;
          --t2:        #9a9a9a;
          --t3:        #555555;

          /* Borders */
          --b1:        rgba(255,255,255,0.07);
          --b2:        rgba(255,255,255,0.13);

          /* Semantic */
          --danger:    #ff5c5c;
          --ok:        #4ade80;
          --warn:      #fbbf24;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        input::placeholder {
          color: #555555;
          opacity: 1;
        }
        
        input:focus {
          outline: none;
          border-color: rgba(204, 255, 0, 0.4) !important;
          box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.08);
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Ambient background stars overlaid in dark theme */}
      <ConstellationBackground opacity={0.45} particleCount={80} fullscreen={false} />
      
      {/* Decorative Top Accent / Clickable PWA Installer */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginTop: 12,
        animation: "fadeUp 0.6s ease both",
        position: "relative",
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={handlePwaInstallClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "var(--card)",
            border: "1px solid var(--b1)",
            borderRadius: 100,
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(204, 255, 0, 0.3)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--b1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--ac)",
            boxShadow: "0 0 6px var(--ac)"
          }} className="animate-breath-cyan-green" />
          <span style={{
            fontSize: 10,
            fontFamily: "var(--font-geist-mono), monospace",
            letterSpacing: "0.15em",
            color: "var(--t2)",
            fontWeight: 700
          }}>
            AETHER <span style={{ color: "var(--ac)" }}>v1.0</span>
          </span>
          <Download size={10} style={{ color: "var(--ac)" }} />
        </button>
      </div>

      {/* Main Title Area */}
      <div style={{
        textAlign: "center",
        margin: "auto 0",
        padding: "36px 0",
        animation: "fadeUp 0.7s ease both",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
          <span className="absolute inset-0 text-6xl font-black tracking-tighter uppercase text-black select-none pointer-events-none" aria-hidden="true" style={{ fontSize: 56, letterSpacing: "-2px", lineHeight: 0.9 }}>
            AETHER
          </span>
          <h1 style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: "-2px",
            textTransform: "uppercase",
            lineHeight: 0.9
          }} className="aether-logo-metallic-auto">
            AETHER
          </h1>
        </div>
        <p style={{
          fontSize: 12,
          color: "var(--t2)",
          fontWeight: 400,
          maxWidth: 240,
          margin: "8px auto 0",
          lineHeight: 1.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          Premium, high-fidelity dark-mode goal tracker. Build discipline, measure milestones.
        </p>
      </div>

      {/* Sign-In Forms / Options Bento Card */}
      <div style={{
        width: "100%",
        background: "var(--card)",
        border: "1px solid var(--b1)",
        borderRadius: 28,
        padding: "26px 22px",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
        position: "relative",
        zIndex: 10,
        animation: "fadeUp 0.8s ease both"
      }}>
        {/* Messages */}
        {message && (
          <div style={{
            background: "rgba(74, 222, 128, 0.08)",
            border: "1px solid rgba(74, 222, 128, 0.2)",
            color: "var(--ok)",
            padding: "12px 14px",
            borderRadius: 14,
            fontSize: 11,
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.4,
            marginBottom: 16
          }}>
            ✓ {message}
          </div>
        )}
        {error && (
          <div style={{
            background: "rgba(255, 92, 92, 0.08)",
            border: "1px solid rgba(255, 92, 92, 0.2)",
            color: "var(--danger)",
            padding: "12px 14px",
            borderRadius: 14,
            fontSize: 11,
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.4,
            marginBottom: 16
          }}>
            ✗ {error}
          </div>
        )}

        {isDbReady ? (
          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--t2)",
                textTransform: "uppercase",
                letterSpacing: "0.12em"
              }}>
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid var(--b1)",
                  borderRadius: 14,
                  fontSize: 13,
                  color: "#ffffff",
                  transition: "all 0.2s ease",
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              />
            </div>

            {isPasswordMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }} className="animate-fade-in">
                <label style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--t2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em"
                }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid var(--b1)",
                    borderRadius: 14,
                    fontSize: 13,
                    color: "#ffffff",
                    transition: "all 0.2s ease",
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "15px 20px",
                background: "var(--ac)",
                color: "#000000",
                border: "none",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 6px 20px rgba(204, 255, 0, 0.25)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1.5px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(204, 255, 0, 0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(204, 255, 0, 0.25)";
              }}
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : isPasswordMode
                  ? isSignUp
                    ? "Create Account"
                    : "Sign In"
                  : "Send Magic Link"}
              </span>
              {!loading && <ArrowRight size={14} />}
            </button>

            {/* Switchers */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginTop: 8
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordMode(!isPasswordMode);
                  setError("");
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ac)",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
              >
                {isPasswordMode ? <Mail size={12} /> : <KeyRound size={12} />}
                <span>{isPasswordMode ? "Use Magic Link Login" : "Use Password Login"}</span>
              </button>

              {isPasswordMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--t2)",
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "8px 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--danger)" }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Supabase Required
              </span>
            </div>
            <p style={{
              fontSize: 11,
              color: "var(--t2)",
              lineHeight: 1.5,
              fontWeight: 400
            }}>
              Cloud connection is not configured. Please define your <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment variables to launch the application. Local storage fallback is disabled.
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div style={{
        textAlign: "center",
        fontSize: 10,
        color: "var(--t3)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginTop: 24,
        animation: "fadeUp 0.9s ease both",
        position: "relative",
        zIndex: 10
      }}>
        Designed for absolute focus.
      </div>
    </div>
  );
}
