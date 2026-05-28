import React from "react";

interface SegmentedProgressBarProps {
  progressPercent: number;
  totalSegments?: number;
  heightClass?: string;
  gapClass?: string;
  activeColorClass?: string;
  inactiveColorClass?: string;
  segmentIdPrefix: string;
}

export default function SegmentedProgressBar({
  progressPercent,
  totalSegments = 20,
  heightClass = "h-3",
  gapClass = "gap-[2px]",
  activeColorClass = "bg-neutral-200 opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.05)]",
  inactiveColorClass = "bg-neutral-800 opacity-30",
  segmentIdPrefix,
}: SegmentedProgressBarProps) {
  const activeSegments = Math.round((progressPercent / 100) * totalSegments);

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
            className={`flex-1 h-full rounded-[1px] transition-all duration-500 ${
              isActive ? activeColorClass : inactiveColorClass
            }`}
          />
        );
      })}
    </div>
  );
}
