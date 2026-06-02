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

  const getSegmentColor = (index: number) => {
    const pct = totalSegments > 1 ? index / (totalSegments - 1) : 0;
    // Premium electric gradient: cyan rgb(6, 182, 212) to emerald green rgb(16, 185, 129)
    const r = Math.round(6 + (16 - 6) * pct);
    const g = Math.round(182 + (185 - 182) * pct);
    const b = Math.round(212 + (129 - 212) * pct);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Imperative DOM animation — runs before first paint via useLayoutEffect.
  // Completely bypasses React's style reconciliation so DOM moves during
  // card swaps can never replay the boot-up transition.
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: skip animation when activeSegments hasn't changed (card swap).
    // Only animate on first mount or when progress actually changes.
    if (prevActiveRef.current !== null && prevActiveRef.current === activeSegments) return;
    const prevActive = prevActiveRef.current;
    prevActiveRef.current = activeSegments;

    // Cancel any pending cleanup from a previous animation run
    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    const segments = Array.from(container.children) as HTMLElement[];

    if (prevActive === null) {
      // 1. INITIAL MOUNT STAGGER BOOT-UP
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
            seg.style.backgroundColor = getSegmentColor(i);
          }
        });

        // CLEANUP: strip inline transitions after the last segment finishes.
        const maxDelay = Math.max(activeSegments, 1) * 50 + 200;
        cleanupTimerRef.current = setTimeout(() => {
          segments.forEach((seg) => {
            seg.style.transition = "";
          });
          cleanupTimerRef.current = null;
        }, maxDelay);
      });
    } else {
      // 2. INCREMENTAL PROGRESS UPDATE (Task checked/unchecked in goal details modal)
      if (activeSegments > prevActive) {
        // A. Progress Increased: animate newly activated segments from dim → bright
        for (let i = prevActive; i < activeSegments; i++) {
          if (segments[i]) {
            segments[i].style.transition = "none";
            segments[i].style.backgroundColor = "rgba(255, 255, 255, 0.06)";
          }
        }

        // Force layout flush
        void container.offsetHeight;

        // Play stagger transition only for the newly added active segments
        requestAnimationFrame(() => {
          let delayCount = 0;
          for (let i = prevActive; i < activeSegments; i++) {
            if (segments[i]) {
              segments[i].style.transition = `background-color 0.25s ease-out ${delayCount * 50}ms`;
              segments[i].style.backgroundColor = getSegmentColor(i);
              delayCount++;
            }
          }

          const maxDelay = Math.max(delayCount, 1) * 50 + 300;
          cleanupTimerRef.current = setTimeout(() => {
            segments.forEach((seg) => {
              seg.style.transition = "";
            });
            cleanupTimerRef.current = null;
          }, maxDelay);
        });
      } else {
        // B. Progress Decreased: animate removed segments from bright → dim (right-to-left)
        requestAnimationFrame(() => {
          let delayCount = 0;
          for (let i = prevActive - 1; i >= activeSegments; i--) {
            if (segments[i]) {
              segments[i].style.transition = `background-color 0.2s ease-out ${delayCount * 40}ms`;
              segments[i].style.backgroundColor = "rgba(255, 255, 255, 0.06)";
              delayCount++;
            }
          }

          const maxDelay = Math.max(delayCount, 1) * 40 + 250;
          cleanupTimerRef.current = setTimeout(() => {
            segments.forEach((seg) => {
              seg.style.transition = "";
            });
            cleanupTimerRef.current = null;
          }, maxDelay);
        });
      }
    }

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
              backgroundColor: isActive ? getSegmentColor(idx) : "rgba(255, 255, 255, 0.06)",
            }}
          />
        );
      })}
    </div>
  );
}
