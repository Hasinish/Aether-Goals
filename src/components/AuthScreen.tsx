"use client";

import React, { useState, useEffect } from "react";
import { useGoalsStore } from "../lib/store";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

export default function AuthScreen() {
  const { loginAsGuest } = useGoalsStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isDbReady = isSupabaseConfigured();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

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
      const { error: authError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (authError) throw authError;

      setMessage("A magic link has been sent to your email. Check your inbox.");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white px-6 py-12 md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-900 select-none animate-fade-in">
      
      {/* Decorative Top Accent */}
      <div className="w-full flex justify-center mt-8">
        <div className="flex items-center gap-2 px-3 py-1 border border-neutral-800 bg-neutral-950 rounded-full">
          <Sparkles size={12} className="text-neutral-400" />
          <span className="text-[10px] uppercase tracking-widest font-mono text-neutral-400">
            AETHER v1.0
          </span>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="text-center space-y-4 my-auto">
        <h1 className="text-6xl font-extrabold tracking-tighter text-white">
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
          <div className="p-4 border border-neutral-800 bg-neutral-950/80 rounded-2xl text-xs text-neutral-300 text-center leading-normal">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 border border-red-950 bg-red-950/20 rounded-2xl text-xs text-red-400 text-center leading-normal">
            {error}
          </div>
        )}

        {isDbReady ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                Email Authentication (Magic Link)
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-650 focus:border-neutral-650 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              <span>{loading ? "Sending..." : "Send Magic Link"}</span>
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>
        ) : (
          <div className="p-4 border border-neutral-900 bg-neutral-950/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <ShieldAlert size={14} className="text-neutral-500" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Offline Sandbox Mode</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal font-light">
              Supabase connection is not initialized yet. The system will persist goals locally. Your data is secure in your browser.
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
          className="w-full py-3.5 border border-neutral-800 bg-neutral-950 text-neutral-300 font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-900 hover:text-white transition-colors"
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
