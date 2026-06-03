"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, Target, CheckSquare, Sparkles } from "lucide-react";

interface RadialNavBarProps {
  theme?: {
    primary: string;
    secondary: string;
    rgbPrimary: string;
  };
}

export default function RadialNavBar({
  theme = { primary: "#06b6d4", secondary: "#10b981", rgbPrimary: "6, 182, 212" }
}: RadialNavBarProps) {
  const items = [
    { id: "deadlines", label: "Deadlines", icon: Clock, angle: -35 },
    { id: "goals", label: "Goals", icon: Target, angle: 0 },
    { id: "habits", label: "Habits", icon: CheckSquare, angle: 35 }
  ];

  const [activeIndex, setActiveIndex] = useState(1); // Default to Goals (index 1)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentDragOffset = useRef(0);

  // Animation snap state
  const [transitioning, setTransitioning] = useState(false);

  // We map index to a base offset (index 0 is active when offset is 35deg, index 1 when 0deg, index 2 when -35deg)
  const getIndexOffset = (idx: number) => {
    if (idx === 0) return 35;
    if (idx === 1) return 0;
    return -35;
  };

  const activeOffset = getIndexOffset(activeIndex);
  // Total angle is the snapped offset + the active drag offset
  const currentAngle = activeOffset + dragOffset;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setTransitioning(false);
    startX.current = e.clientX;
    currentDragOffset.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    
    // Convert pixels to degrees of rotation (1px ≈ 0.18 degrees)
    const angleDelta = dx * 0.18;
    
    // Apply boundaries with elastic resistance
    const totalPotentialAngle = activeOffset + angleDelta;
    if (totalPotentialAngle > 55) {
      // Elastic drag past Deadlines
      const over = totalPotentialAngle - 55;
      setDragOffset(55 - activeOffset + over * 0.25);
    } else if (totalPotentialAngle < -55) {
      // Elastic drag past Habits
      const over = totalPotentialAngle + 55;
      setDragOffset(-55 - activeOffset + over * 0.25);
    } else {
      setDragOffset(angleDelta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Calculate final resting angle
    const finalAngle = activeOffset + dragOffset;

    // Find the nearest item
    let nearestIndex = activeIndex;
    let minDiff = Infinity;

    items.forEach((item, idx) => {
      const itemTargetOffset = getIndexOffset(idx);
      const diff = Math.abs(finalAngle - itemTargetOffset);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = idx;
      }
    });

    // Snap to nearest item
    setActiveIndex(nearestIndex);
    setDragOffset(0);
    setTransitioning(true);
  };

  // Turn off transition flag after animation finishes
  useEffect(() => {
    if (transitioning) {
      const timer = setTimeout(() => setTransitioning(false), 450);
      return () => clearTimeout(timer);
    }
  }, [transitioning]);

  return (
    <div className="w-full flex flex-col items-center justify-end select-none mt-4 overflow-hidden relative pb-4">
      {/* Active Selection Display Pill */}
      <div 
        className="mb-14 px-4 py-2 bg-neutral-950/80 border rounded-full backdrop-blur-md flex items-center gap-2 transition-all duration-300 transform scale-100"
        style={{
          borderColor: `rgba(${theme.rgbPrimary}, 0.35)`,
          boxShadow: `0 0 15px rgba(${theme.rgbPrimary}, 0.08)`
        }}
      >
        <Sparkles size={11} style={{ color: theme.primary }} className="animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
          Active view: <span className="font-bold text-white" style={{ textShadow: `0 0 8px ${theme.primary}` }}>{items[activeIndex].label}</span>
        </span>
      </div>

      {/* Swipeable Radial Container Area */}
      <div
        className="w-full max-w-[360px] h-[190px] relative flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Glow Ring Indicator */}
        <div 
          className="absolute top-[-8px] w-2.5 h-2.5 rounded-full z-30 transition-all duration-500 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            boxShadow: `0 0 12px 3px ${theme.primary}`
          }}
        />

        {/* Center Target Notch */}
        <div className="absolute top-[2px] w-5 h-5 border-t-2 border-dashed rounded-full pointer-events-none opacity-40" 
             style={{ borderColor: theme.primary }} />

        {/* SVG Curved Track Arc */}
        <svg className="absolute top-0 w-full h-[180px] pointer-events-none opacity-30 z-0">
          <defs>
            <linearGradient id="radialTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#181818" />
              <stop offset="35%" stopColor={theme.primary} />
              <stop offset="50%" stopColor={theme.secondary} />
              <stop offset="65%" stopColor={theme.primary} />
              <stop offset="100%" stopColor="#181818" />
            </linearGradient>
          </defs>
          <path
            d="M 30,170 A 150,150 0 0,1 330,170"
            fill="none"
            stroke="url(#radialTrackGrad)"
            strokeWidth="2"
            strokeDasharray="4, 4"
          />
          {/* Tick marks */}
          <circle cx="180" cy="20" r="1.5" fill={theme.primary} opacity="0.6" />
          <circle cx="95" cy="45" r="1.5" fill={theme.primary} opacity="0.4" />
          <circle cx="265" cy="45" r="1.5" fill={theme.primary} opacity="0.4" />
        </svg>

        {/* Rotating Dial Wrapper */}
        <div
          className="absolute w-[300px] h-[300px] rounded-full top-[20px] origin-center flex justify-center"
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transition: transitioning ? "transform 0.45s cubic-bezier(0.19, 1, 0.22, 1)" : "none"
          }}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            
            // Calculate distance angle to active spot (currentAngle + item.angle)
            // But item is active when dial rotation is -item.angle.
            // Angle of item relative to the top vertical axis (0 deg)
            const relativeAngle = item.angle + currentAngle;
            const distance = Math.abs(relativeAngle);
            
            // Premium visual scaling & opacity highlights based on distance from center top
            const isActive = idx === activeIndex;
            const scale = Math.max(0.72, 1 - distance * 0.007);
            const opacity = Math.max(0.25, 1 - distance * 0.018);

            return (
              <div
                key={item.id}
                className="absolute flex flex-col items-center justify-center pointer-events-none origin-bottom select-none"
                style={{
                  transform: `rotate(${item.angle}deg) translateY(-145px) rotate(${-item.angle}deg)`,
                  transformOrigin: "center 150px",
                  opacity: opacity,
                  transition: transitioning ? "all 0.45s cubic-bezier(0.19, 1, 0.22, 1)" : "opacity 0.1s ease"
                }}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                    isActive 
                      ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.15)]" 
                      : "bg-neutral-950/60 text-neutral-400 border-neutral-800"
                  }`}
                  style={{
                    transform: `scale(${scale})`,
                    borderColor: isActive ? theme.primary : "rgba(255,255,255,0.06)",
                    boxShadow: isActive ? `0 0 15px rgba(${theme.rgbPrimary}, 0.28)` : ""
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? theme.secondary : undefined }} />
                </div>
                
                <span 
                  className={`mt-2 font-mono text-[9px] uppercase tracking-wider transition-all duration-300 font-bold ${
                    isActive ? "text-white scale-110" : "text-neutral-400"
                  }`}
                  style={{
                    textShadow: isActive ? `0 0 8px ${theme.primary}` : "none"
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helper swipe directions */}
      <span className="text-[7.5px] font-mono tracking-widest text-neutral-500 uppercase mt-[-10px] animate-pulse">
        ← Swipe or drag to rotate wheel →
      </span>
    </div>
  );
}
