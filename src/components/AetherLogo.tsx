"use client";

import { useEffect, useRef } from "react";

export default function AetherLogo() {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!textRef.current) return;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      // background-size: 800% = 8 × element width (W).
      // Shimmer lives at 50% of gradient = 4W from gradient start.
      // At backgroundPositionX = -4W: shimmer aligns to left edge (0).
      // At backgroundPositionX = -3W: shimmer aligns to right edge (W).
      // So: sweep from -(4.1W) → -(2.9W) = starts just off-left, ends just off-right.
      const W = textRef.current.getBoundingClientRect().width;
      // 2 sweeps per full scroll. Each cycle: shimmer starts 0.5W off-left, ends 1.5W off-right.
      // Total travel = 2W per cycle → shimmer fully exits before reset snap.
      const cycle = (pct * 2) % 1;
      const offset = -(4.5 * W) + cycle * 2 * W;
      textRef.current.style.backgroundPositionX = `${offset}px`;
    };

    // Set initial position
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <span ref={textRef} className="aether-logo-metallic text-xl font-black tracking-tighter uppercase">
      Aether
    </span>
  );
}
