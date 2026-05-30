"use client";

import { useEffect, useRef } from "react";

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
  opacity = 0.45,
  particleCount = 100,
  fullscreen = false,
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const applySize = () => {
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      canvas.width = w;
      canvas.height = h;
      return { w, h };
    };

    let { w: width, h: height } = applySize();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const s = applySize();
      width = s.w;
      height = s.h;
    };
    window.addEventListener("resize", handleResize);

    const colors = ["6, 182, 212", "16, 185, 129"];

    const particles = Array.from({ length: particleCount }, () => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: Math.random() * 0.8 + 0.5,
        color: randomColor,
      };
    });

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const rect = wrapper.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    };
    const handleTouchEnd = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p1.color}, 0.85)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p1.color}, ${0.75 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
        if (mouseDist < 120) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${p1.color}, ${0.85 * (1 - mouseDist / 120)})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, fullscreen]);

  // Fixed wrapper: full viewport or clamped to md column (448px centered)
  const wrapperStyle: React.CSSProperties = fullscreen
    ? {
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
      opacity,
      overflow: "hidden",
    }
    : {
      position: "fixed",
      top: 0,
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "448px",
      pointerEvents: "none",
      zIndex: 0,
      opacity,
      overflow: "hidden",
    };

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
