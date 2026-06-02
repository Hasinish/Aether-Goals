"use client";

interface ConstellationBackgroundProps {
  opacity?: number;
  particleCount?: number;
  /**
   * When true: uses a fixed full-viewport wrapper (for auth screen which is itself centered).
   * When false (default): uses a fixed wrapper that matches the app column (max-w-[448px] centered).
   */
  fullscreen?: boolean;
}

export default function ConstellationBackground({
  opacity,
  particleCount,
  fullscreen,
}: ConstellationBackgroundProps) {
  void opacity;
  void particleCount;
  void fullscreen;
  return null;
}
