"use client";

import React, { useEffect, useRef } from "react";

export type AnimatedNetworkGraphProps = {
  className?: string;
  background?: "transparent" | "black";
  speed?: number; // default 1
  density?: number; // default 1
  opacity?: number; // default 1
};

const PATH = [
  { t: 0.00, x: 0.50, y: 0.30 },
  { t: 0.50, x: 0.39, y: 0.31 },
  { t: 1.00, x: 0.38, y: 0.37 },
  { t: 1.50, x: 0.38, y: 0.44 },
  { t: 2.00, x: 0.34, y: 0.45 },
  { t: 2.50, x: 0.43, y: 0.35 },
  { t: 3.00, x: 0.62, y: 0.23 },
  { t: 3.50, x: 0.85, y: 0.15 },
  { t: 4.00, x: 0.90, y: 0.17 },
  { t: 4.50, x: 0.68, y: 0.19 },
  { t: 5.00, x: 0.40, y: 0.19 },
  { t: 5.50, x: 0.25, y: 0.21 },
  { t: 6.00, x: 0.33, y: 0.26 },
  { t: 6.50, x: 0.52, y: 0.26 },
  { t: 6.63, x: 0.50, y: 0.30 }
];

export default function AnimatedNetworkGraph({
  className,
  background = "transparent",
  speed = 1,
  density = 1,
  opacity = 1
}: AnimatedNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    // Catmull-Rom Spline Interpolation for Hub Position
    const getHubPosition = (tCurr: number) => {
      let wrappedT = tCurr % 6.63;
      if (wrappedT < 0) wrappedT += 6.63;

      let i = 0;
      for (let j = 0; j < PATH.length - 1; j++) {
        if (wrappedT >= PATH[j].t && wrappedT <= PATH[j+1].t) {
          i = j;
          break;
        }
      }

      const p1 = PATH[i];
      const p2 = PATH[i+1];

      // Wrap around closed loop for P0 and P3
      const p0 = i === 0 ? PATH[PATH.length - 2] : PATH[i - 1];
      const p3 = i === PATH.length - 2 ? PATH[1] : PATH[i + 2];

      const segmentDuration = p2.t - p1.t;
      const u = segmentDuration > 0 ? (wrappedT - p1.t) / segmentDuration : 0;

      const interpolate = (v0: number, v1: number, v2: number, v3: number, uVal: number) => {
        return 0.5 * (
          (2 * v1) +
          (-v0 + v2) * uVal +
          (2 * v0 - 5 * v1 + 4 * v2 - v3) * Math.pow(uVal, 2) +
          (-v0 + 3 * v1 - 3 * v2 + v3) * Math.pow(uVal, 3)
        );
      };

      return {
        x: interpolate(p0.x, p1.x, p2.x, p3.x, u),
        y: interpolate(p0.y, p1.y, p2.y, p3.y, u)
      };
    };

    const handleResize = () => {
      if (!canvas || !parent) return;
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(parent);
    handleResize();

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const startTime = Date.now();

    const drawFrame = () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const time = elapsedSeconds * speed;

      // 1. Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 2. Fill black background only if background === "black"
      if (background === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      // Calculate relative spacing and limits
      let gridSpacing = (Math.min(width, height) * 0.11) / density;
      gridSpacing = Math.max(42, Math.min(76, gridSpacing));

      // 3. Generate dots matrix (deterministic placement & seed to prevent resize jumpiness)
      const dots: { x: number; y: number; seed: number }[] = [];
      let colIdx = 0;
      for (let gx = -gridSpacing; gx <= width + gridSpacing; gx += gridSpacing) {
        let rowIdx = 0;
        for (let gy = -gridSpacing; gy <= height + gridSpacing; gy += gridSpacing) {
          dots.push({
            x: gx,
            y: gy,
            seed: (colIdx * 17.3 + rowIdx * 31.7) % (Math.PI * 2)
          });
          rowIdx++;
        }
        colIdx++;
      }

      // 4. Calculate Hub Position
      const normHub = getHubPosition(time);
      const hub = {
        x: normHub.x * width,
        y: normHub.y * height
      };

      const fadeRadius = gridSpacing * 4.0;
      const connectionRadius = gridSpacing * 2.35;

      // 5. Draw faint grid dots (draw inactive ones first)
      dots.forEach(dot => {
        const dist = Math.hypot(dot.x - hub.x, dot.y - hub.y);
        const nearAmount = Math.max(0, Math.min(1, 1 - dist / fadeRadius));
        const activeAmount = Math.max(0, Math.min(1, 1 - (dist - connectionRadius) / gridSpacing));

        const pulse = 0.85 + 0.15 * Math.sin(time * 2.2 + dot.seed);
        const dotOpacity = (0.035 + nearAmount * 0.16 + activeAmount * 0.55) * pulse;
        const dotRadius = 0.8 + nearAmount * 1.4 + activeAmount * 3.4;

        // Draw faint dots that are not fully active/connected
        if (dist > connectionRadius) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(248, 245, 248, ${dotOpacity * opacity})`;
          ctx.fill();
        }
      });

      // 6. Draw connection lines from hub to active nearby dots
      dots.forEach(dot => {
        const dist = Math.hypot(dot.x - hub.x, dot.y - hub.y);
        if (dist <= connectionRadius) {
          const lineOpacity = (0.28 + 0.5 * (1 - dist / connectionRadius)) * opacity;
          const strokeWidth = 1.4 + 0.6 * (1 - dist / connectionRadius);

          ctx.beginPath();
          ctx.moveTo(hub.x, hub.y);
          ctx.lineTo(dot.x, dot.y);
          ctx.strokeStyle = `rgba(245, 245, 245, ${lineOpacity})`;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      });

      // 7. Draw active endpoint dots (drawn after lines to cover endpoints)
      dots.forEach(dot => {
        const dist = Math.hypot(dot.x - hub.x, dot.y - hub.y);
        if (dist <= connectionRadius) {
          const nearAmount = Math.max(0, Math.min(1, 1 - dist / fadeRadius));
          const activeAmount = Math.max(0, Math.min(1, 1 - (dist - connectionRadius) / gridSpacing));

          const pulse = 0.85 + 0.15 * Math.sin(time * 2.2 + dot.seed);
          const dotOpacity = (0.035 + nearAmount * 0.16 + activeAmount * 0.55) * pulse;
          const dotRadius = 0.8 + nearAmount * 1.4 + activeAmount * 3.4;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(248, 245, 248, ${dotOpacity * opacity})`;
          ctx.fill();
        }
      });

      // 8. Draw central hub node
      const hubRadius = Math.max(8, Math.min(13, Math.min(width, height) * 0.018));
      const hubPulse = 1 + 0.04 * Math.sin(time * 2.5);
      const finalHubRadius = hubRadius * hubPulse;

      ctx.beginPath();
      ctx.arc(hub.x, hub.y, finalHubRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#f8f5f8";
      ctx.fill();
    };

    const loop = () => {
      drawFrame();
      if (!isReducedMotion) {
        animFrameId = requestAnimationFrame(loop);
      }
    };

    if (isReducedMotion) {
      drawFrame();
    } else {
      loop();
    }

    return () => {
      resizeObserver.disconnect();
      mediaQuery.removeEventListener("change", handleMotionChange);
      cancelAnimationFrame(animFrameId);
    };
  }, [background, speed, density, opacity]);

  return <canvas ref={canvasRef} className={className} style={{ display: "block" }} />;
}
