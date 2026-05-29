"use client";

import React, { useEffect, useRef } from "react";

interface ConstellationBackgroundProps {
  opacity?: number;
  particleCount?: number;
}

export default function ConstellationBackground({
  opacity = 0.45,
  particleCount = 100
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

    // Initialize float nodes with cyan and emerald colors
    const colors = [
      "6, 182, 212",  // Cyan
      "16, 185, 129"  // Emerald
    ];

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    // Enforce initial spacing check
    const minInitDist = 45;
    let attempts = 0;
    while (particles.length < particleCount && attempts < 2000) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      let tooClose = false;
      for (const p of particles) {
        if (Math.hypot(p.x - x, p.y - y) < minInitDist) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.24,
          vy: (Math.random() - 0.5) * 0.24,
          radius: Math.random() * 2.0 + 1.2,
          color: randomColor
        });
      }
      attempts++;
    }

    // Fallback if boundary space is tight
    while (particles.length < particleCount) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        radius: Math.random() * 2.0 + 1.2,
        color: randomColor
      });
    }

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

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const minDist = 40; // Minimum separation distance between nodes in motion

      // Render vector constellations
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Gentle bounds bounce checks
        if (p1.x < 0) { p1.x = 0; p1.vx *= -1; }
        if (p1.x > width) { p1.x = width; p1.vx *= -1; }
        if (p1.y < 0) { p1.y = 0; p1.vy *= -1; }
        if (p1.y > height) { p1.y = height; p1.vy *= -1; }

        // Draw individual dot node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p1.color}, 0.85)`;
        ctx.fill();

        // Connect nearby nodes and apply separation force
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);

          // 1. Avoidance/Repulsion force
          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / minDist * 0.012; // Gentle repulsion
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            p1.vx -= fx;
            p1.vy -= fy;
            p2.vx += fx;
            p2.vy += fy;
          }

          // 2. Draw connections
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p1.color}, ${0.75 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        // Limit velocity speed cap to keep floating motion slow and premium
        const speed = Math.hypot(p1.vx, p1.vy);
        const maxSpeed = 0.28;
        if (speed > maxSpeed) {
          p1.vx = (p1.vx / speed) * maxSpeed;
          p1.vy = (p1.vy / speed) * maxSpeed;
        }

        p1.x += p1.vx;
        p1.y += p1.vy;

        // Draw connections to user pointer
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
