"use client";

import React, { useEffect, useRef } from "react";

interface ConstellationBackgroundProps {
  opacity?: number;
  particleCount?: number; // Kept for compatibility
}

export default function ConstellationBackground({
  opacity = 0.45,
  particleCount = 100 // Kept for compatibility
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = parent.clientWidth || window.innerWidth);
    let height = (canvas.height = parent.clientHeight || window.innerHeight);

    // Track resize dynamically
    const handleResize = () => {
      if (!canvas || !parent) return;
      width = canvas.width = parent.clientWidth || window.innerWidth;
      height = canvas.height = parent.clientHeight || window.innerHeight;
    };
    
    // ResizeObserver tracks actual parent element dimension changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(parent);

    const mouse = { x: -1000, y: -1000 };

    // Track cursor on parent container
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    // Track touch gesture on parent container (for mobile/Android)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const rect = parent.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    };

    const handleTouchEnd = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    parent.addEventListener("touchmove", handleTouchMove, { passive: true });
    parent.addEventListener("touchend", handleTouchEnd, { passive: true });

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.5;

      const spacing = 38; // Evenly-spaced vector grid size (px)
      const lineLength = 12; // Length of individual lines
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      // Render flowing grid of vectors
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          // Center of the canvas (creates global vortex origin)
          const centerX = width / 2;
          const centerY = height / 2;

          const dxToCenter = x - centerX;
          const dyToCenter = y - centerY;
          const distToCenter = Math.hypot(dxToCenter, dyToCenter) || 1;

          // Ambient spiral math (Vortex Flow Field)
          const spiralAngle = Math.atan2(dyToCenter, dxToCenter) + Math.PI / 2;
          // Breathing wave displacement over time
          const waveOffset = Math.sin(time * 0.007 + distToCenter * 0.0028) * 0.4;
          const baseAngle = spiralAngle + waveOffset;

          let angle = baseAngle;
          const dxToMouse = mouse.x - x;
          const dyToMouse = mouse.y - y;
          const distToMouse = Math.hypot(dxToMouse, dyToMouse);

          let intensity = 0.22; // Idle ambient opacity
          let scaleMultiplier = 1.0;

          // Interactive mouse integration
          if (mouse.x !== -1000 && mouse.y !== -1000) {
            const influenceRadius = 240;
            if (distToMouse < influenceRadius) {
              const influence = 1 - distToMouse / influenceRadius;
              
              // Smooth cubic easing for fluid blending
              const smoothInfluence = influence * influence * (3 - 2 * influence);
              
              // Local Swirl (spiral around mouse pointer) + direct attraction hybrid
              const directAngle = Math.atan2(dyToMouse, dxToMouse);
              const swirlAngle = Math.atan2(dyToMouse, dxToMouse) + Math.PI / 2;
              
              const blendRatio = Math.min(1, distToMouse / 100); // 0 = close (attract), 1 = far (swirl)
              const mouseAngle = (1 - blendRatio) * directAngle + blendRatio * swirlAngle;
              
              // Fluidly interpolate between global center swirl and local mouse swirl
              angle = (1 - smoothInfluence) * baseAngle + smoothInfluence * mouseAngle;
              
              // Glow brighter and scale slightly near pointer
              intensity = 0.22 + smoothInfluence * 0.65;
              scaleMultiplier = 1.0 + smoothInfluence * 0.55;
            }
          }

          // Generate vector line endpoints
          const halfL = (lineLength / 2) * scaleMultiplier;
          const lx = Math.cos(angle) * halfL;
          const ly = Math.sin(angle) * halfL;

          // Draw the vector segment
          ctx.beginPath();
          ctx.moveTo(x - lx, y - ly);
          ctx.lineTo(x + lx, y + ly);

          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
          ctx.lineWidth = intensity > 0.3 ? 1.35 : 0.85;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      parent.removeEventListener("touchmove", handleTouchMove);
      parent.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
      style={{ opacity }}
    />
  );
}
