"use client";

import React from "react";

interface ParallaxCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  disabled?: boolean;
}

export function ParallaxCard({
  children,
  maxTilt = 8,
  disabled = false,
  style,
  className,
  onMouseEnter,
  onMouseLeave,
  onTouchMove,
  onTouchEnd,
  ...props
}: ParallaxCardProps) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [sheen, setSheen] = React.useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  // Mouse move handler (PC)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: rotateX, y: rotateY });

    const sheenX = (x / rect.width) * 100;
    const sheenY = (y / rect.height) * 100;
    setSheen({ x: sheenX, y: sheenY, opacity: 0.16 });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setSheen(prev => ({ ...prev, opacity: 0 }));
    if (onMouseLeave) onMouseLeave(e);
  };

  // Touch move handler (Mobile tactile)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsHovered(true);
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Slightly lower max tilt for touch drag to prevent layout hiding
      const rotateX = -((y - centerY) / centerY) * (maxTilt * 0.75);
      const rotateY = ((x - centerX) / centerX) * (maxTilt * 0.75);

      setTilt({ x: rotateX, y: rotateY });

      const sheenX = (x / rect.width) * 100;
      const sheenY = (y / rect.height) * 100;
      setSheen({ x: sheenX, y: sheenY, opacity: 0.12 });
    }
    if (onTouchMove) onTouchMove(e);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setSheen(prev => ({ ...prev, opacity: 0 }));
    if (onTouchEnd) onTouchEnd(e);
  };

  // Listen to gyroscope (device orientation) as a subtle fallback on mobile
  React.useEffect(() => {
    if (disabled || isHovered) return;

    let initialBeta: number | null = null;
    let initialGamma: number | null = null;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (isHovered) return; // Touch/Mouse takes priority
      if (e.beta === null || e.gamma === null) return;

      // Calibrate baseline angle on first event
      if (initialBeta === null) initialBeta = e.beta;
      if (initialGamma === null) initialGamma = e.gamma;

      const deltaBeta = e.beta - initialBeta;
      const deltaGamma = e.gamma - initialGamma;

      // Restrict gyro tilt to a very subtle drift (max 3 degrees)
      const gyroRotateX = Math.max(-3, Math.min(3, -deltaBeta * 0.15));
      const gyroRotateY = Math.max(-3, Math.min(3, deltaGamma * 0.15));

      setTilt({ x: gyroRotateX, y: gyroRotateY });

      // Shift sheen slightly based on tilt
      const sheenX = 50 + gyroRotateY * 8;
      const sheenY = 50 + gyroRotateX * 8;
      setSheen({ x: sheenX, y: sheenY, opacity: 0.06 });
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [disabled, isHovered]);

  return (
    <div
      className={`parallax-card-container ${className || ""}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isHovered
          ? "transform 80ms linear"
          : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 450ms cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...props}
    >
      <style jsx global>{`
        .parallax-card-container {
          will-change: transform;
        }
        @keyframes bentoDriftCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
      `}</style>

      {/* Glossy Sheen Reflection Layer */}
      {!disabled && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`,
            opacity: sheen.opacity,
            pointerEvents: "none",
            transition: sheen.opacity === 0 ? "opacity 350ms ease" : "none",
            zIndex: 10,
          }}
        />
      )}

      {children}
    </div>
  );
}
