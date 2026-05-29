import React, { useRef, useEffect } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : useEffect;

interface SegmentedProgressBarProps {
  progressPercent: number;
  totalSegments?: number;
  heightClass?: string;
  gapClass?: string;
  segmentIdPrefix: string;
}

export default function SegmentedProgressBar({
  progressPercent,
  totalSegments = 20,
  heightClass = "h-3",
  gapClass = "gap-[2px]",
  segmentIdPrefix,
}: SegmentedProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSegments = Math.round((progressPercent / 100) * totalSegments);

  // Imperative DOM animation — runs before first paint via useLayoutEffect.
  // Completely bypasses React's style reconciliation so DOM moves during
  // card swaps can never replay the boot-up transition.
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: skip animation when activeSegments hasn't changed (card swap).
    // Only animate on first mount or when progress actually changes.
    if (prevActiveRef.current !== null && prevActiveRef.current === activeSegments) return;
    prevActiveRef.current = activeSegments;

    // Cancel any pending cleanup from a previous animation run
    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const segments = Array.from(container.children) as HTMLElement[];

    // INVERT: override React's bright render — set active segments to dim, no transition
    segments.forEach((seg, i) => {
      seg.style.transition = "none";
      if (i < activeSegments) {
        seg.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
      }
    });

    // Force layout flush so the browser commits the dim state
    void container.offsetHeight;

    // PLAY: stagger-transition each active segment from dim → bright
    requestAnimationFrame(() => {
      segments.forEach((seg, i) => {
        if (i < activeSegments) {
          seg.style.transition = `background-color 0.1s ease-out ${i * 50}ms`;
          seg.style.backgroundColor = "#ffffff";
        }
      });

      // CLEANUP: strip inline transitions after the last segment finishes.
      // backgroundColor is left alone — it already matches React's rendered "#ffffff".
      // Without an active transition property, the browser cannot replay anything
      // when React repositions the DOM node via insertBefore during a card swap.
      const maxDelay = Math.max(activeSegments, 1) * 50 + 200;
      cleanupTimerRef.current = setTimeout(() => {
        segments.forEach((seg) => {
          seg.style.transition = "";
        });
        cleanupTimerRef.current = null;
      }, maxDelay);
    });

    return () => {
      if (cleanupTimerRef.current !== null) {
        clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };
  }, [activeSegments]);

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`flex items-center w-full ${gapClass} ${heightClass}`}
    >
      {Array.from({ length: totalSegments }).map((_, idx) => {
        const isActive = idx < activeSegments;
        return (
          <div
            key={`${segmentIdPrefix}-${idx}`}
            className="flex-1 h-full rounded-[1px]"
            style={{
              backgroundColor: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.06)",
            }}
          />
        );
      })}
    </div>
  );
}
