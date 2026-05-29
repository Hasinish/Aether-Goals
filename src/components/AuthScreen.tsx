"use client";

import React, { useState, useEffect } from "react";
import { useGoalsStore } from "../lib/store";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { ArrowRight, KeyRound, Mail, ShieldAlert } from "lucide-react";
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
  const { loginAsGuest } = useGoalsStore();
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
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Instantly pull prompt if captured globally by layout.tsx before mount
    const earlyPrompt = ("deferredPrompt" in window) 
      ? (window as Window & { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt 
      : null;
    
    if (earlyPrompt) {
      setDeferredPrompt(earlyPrompt);
      setIsInstallable(true);
    }

    // 2. Custom event listener to capture prompts flowing post-mount
    const handleCustomPromptCaptured = () => {
      const captured = ("deferredPrompt" in window)
        ? (window as Window & { deferredPrompt?: BeforeInstallPromptEvent | null }).deferredPrompt
        : null;
      
      if (captured) {
        setDeferredPrompt(captured);
        setIsInstallable(true);
      }
    };

    window.addEventListener("pwa-prompt-captured", handleCustomPromptCaptured);

    // 3. Fallback standard browser beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setMessage("Aether Goals has been successfully installed as an app!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

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
        setIsInstallable(false);
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
      setError("Supabase URL and API keys are missing. Please continue in Guest Mode.");
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
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white px-6 py-12 md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 select-none animate-fade-in relative overflow-hidden">
      <ConstellationBackground opacity={0.3} particleCount={60} />
      
      {/* Decorative Top Accent / Clickable PWA Installer */}
      <div className="w-full flex justify-center mt-8">
        <button
          type="button"
          onClick={handlePwaInstallClick}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full cursor-pointer hover:bg-neutral-800 hover:border-neutral-700 active:scale-[0.97] transition-all duration-200 select-none outline-none focus-visible:ring-1 focus-visible:ring-neutral-700"
          aria-label="Install Aether PWA App"
        >
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 bg-emerald-400 ${isInstallable ? "animate-pulse" : ""}`} />
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 flex items-center">
            AETHER
            <span className="text-[8px] text-neutral-500 font-sans font-bold ml-1.5 opacity-80 tracking-normal normal-case">v1.0</span>
          </span>
        </button>
      </div>

      {/* Main Title Area */}
      <div className="text-center space-y-4 my-auto">
        <h1 className="text-6xl font-black tracking-tighter uppercase aether-logo-metallic-auto select-none">
          AETHER
        </h1>
        <p className="text-xs text-neutral-400 font-light max-w-[260px] mx-auto leading-relaxed">
          Premium, high-fidelity dark-mode goal tracker. Build discipline, measure milestones.
        </p>
      </div>

      {/* Sign-In Forms / Options */}
      <div className="w-full space-y-6">
        {/* Messages */}
        {message && (
          <div className="p-4 border border-neutral-800 bg-neutral-950/80 rounded-lg text-xs text-neutral-300 text-center leading-normal">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 border border-red-950 bg-red-950/20 rounded-lg text-xs text-red-400 text-center leading-normal">
            {error}
          </div>
        )}

        {isDbReady ? (
          <div className="space-y-4">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                  />
                </div>

                {isPasswordMode && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password..."
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50"
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
            </form>

            {/* Mode Switchers */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordMode(!isPasswordMode);
                  setError("");
                  setMessage("");
                }}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {isPasswordMode ? (
                  <>
                    <Mail size={12} />
                    <span>Use Magic Link Login</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={12} />
                    <span>Use Password Login</span>
                  </>
                )}
              </button>

              {isPasswordMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setMessage("");
                  }}
                  className="text-[9px] font-mono text-neutral-600 hover:text-neutral-400 underline transition-colors"
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 border border-neutral-900 bg-neutral-950/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <ShieldAlert size={14} className="text-neutral-500" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Offline Sandbox Mode</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal font-light">
              Supabase connection is not initialized yet. Your goals will be saved locally on your device using browser LocalStorage. Syncing and backup will be disabled.
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-900"></div>
          </div>
          <span className="relative px-3 text-[9px] uppercase font-mono tracking-widest text-neutral-600 bg-black">
            or
          </span>
        </div>

        {/* Guest Access Option */}
        <button
          type="button"
          onClick={loginAsGuest}
          className="w-full py-3.5 border border-neutral-800 bg-neutral-950 text-neutral-300 font-semibold text-xs tracking-wider uppercase rounded-md hover:bg-neutral-900 hover:text-white transition-colors"
        >
          {isDbReady ? "Try as Guest (Offline)" : "Enter Workspace"}
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-[9px] font-mono text-neutral-600">
        Designed for absolute focus.
      </div>
    </div>
  );
}
