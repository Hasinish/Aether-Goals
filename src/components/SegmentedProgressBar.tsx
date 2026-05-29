import React, { useState, useEffect } from "react";

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
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const activeSegments = Math.round((progressPercent / 100) * totalSegments);

  useEffect(() => {
    // Reset state to force animation re-trigger
    setShouldAnimate(false);
    
    // Tiny delay to ensure browser paints the un-animated base clipped state
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <div 
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
            style={
              isActive
                ? {
                    backgroundColor: shouldAnimate ? "#ffffff" : "rgba(255, 255, 255, 0.06)",
                    transition: shouldAnimate
                      ? `background-color 0.1s ease-out ${idx * 50}ms`
                      : "none",
                  }
                : {
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                  }
            }
          />
        );
      })}
    </div>
  );
}
