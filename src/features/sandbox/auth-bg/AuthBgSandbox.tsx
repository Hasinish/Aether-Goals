"use client";

import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import AnimatedNetworkGraph from "../../../components/AnimatedNetworkGraph";

const backgrounds = [
  "Networking",
  "Nebula",
  "CyberGrid",
  "LiquidAurora",
  "Starfield",
  "PulseRings",
  "Hexagon",
  "FloatingShapes",
  "NeonRays",
  "DigitalNoise",
  "MatrixRain",
  "VideoLoop"
];

function AuthBgSandbox() {
  const [activeBg, setActiveBg] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ 
      position: "relative", 
      minHeight: "100vh", 
      background: "#0a0a0a", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "40px 20px",
      boxSizing: "border-box",
      fontFamily: "sans-serif"
    }}>
      
      {/* Outer Shell Container */}
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "40px", alignItems: "center", justifyContent: "center" }}>
        
        {/* Toggle Controls for Sandbox */}
        <div style={{
          width: 180, 
          background: "rgba(20,20,20,0.85)", 
          backdropFilter: "blur(10px)", 
          padding: "20px 15px", 
          borderRadius: 20, 
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          boxSizing: "border-box"
        }}>
          <h3 style={{ color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 12, textAlign: "center" }}>SELECT BACKGROUND</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {backgrounds.map((bg, idx) => (
              <button
                key={bg}
                onClick={() => setActiveBg(idx)}
                style={{
                  background: activeBg === idx ? "#ccff00" : "transparent",
                  color: activeBg === idx ? "#000" : "#fff",
                  border: "1px solid",
                  borderColor: activeBg === idx ? "#ccff00" : "rgba(255,255,255,0.15)",
                  padding: "8px",
                  borderRadius: "8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit"
                }}
              >
                {bg}
              </button>
            ))}
          </div>
          <Link href="/" style={{ color: "#8e8e93", fontSize: 11, fontWeight: 600, display: "block", textAlign: "center", marginTop: 15, textDecoration: "none" }}>← Back to Home</Link>
        </div>

        {/* Mock Phone Device Frame */}
        <div style={{ 
          position: "relative", 
          width: 350, 
          height: 720, 
          borderRadius: 40, 
          border: "10px solid #1c1c1e", 
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), inset 0 0 4px rgba(255,255,255,0.2)", 
          overflow: "hidden", 
          background: "#000",
          display: "flex",
          flexDirection: "column",
          boxSizing: "content-box"
        }}>
          
          {/* Background Layer (Confined inside the phone) */}
          <BackgroundRenderer type={backgrounds[activeBg]} />
          
          {/* UI Overlay */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
            
            {/* TOP ZONE */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "44px 24px 12px",
            }}>
              <div style={{ marginTop: 8 }}>
                <h1 style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-1.5px",
                  lineHeight: 0.92,
                  margin: 0,
                }}>
                  AETHER<br />
                  <span style={{ color: "#ccff00" }}>Goals</span>
                </h1>
                <p style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#aaa",
                  marginTop: 4,
                }}>
                  Track what matters.
                </p>
              </div>
            </div>

            {/* BOTTOM SHEET */}
            <div style={{
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(20, 20, 20, 0.35) 100%)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: "32px 32px 0 0",
              padding: "12px 20px 16px",
              borderTop: "1.5px solid rgba(255, 255, 255, 0.55)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.22)",
              borderRight: "1px solid rgba(255, 255, 255, 0.22)",
              borderBottom: "none",
              boxShadow: "0 -12px 48px rgba(0, 0, 0, 0.65)",
            }}>
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.18)",
                margin: "0 auto 8px",
              }} />

              <div style={{ marginBottom: 8 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: 13, color: "#8e8e93", marginTop: 3 }}>
                  Sign in to your account
                </p>
              </div>

              <div style={{
                display: "flex",
                background: "#2c2c2e",
                borderRadius: 22,
                padding: 3,
                marginBottom: 8,
              }}>
                <button style={{ flex: 1, padding: "7px 0", borderRadius: 19, border: "none", background: "#ccff00", color: "#000", fontSize: 12, fontWeight: 700 }}>Sign In</button>
                <button style={{ flex: 1, padding: "7px 0", borderRadius: 19, border: "none", background: "transparent", color: "#8e8e93", fontSize: 12, fontWeight: 700 }}>Sign Up</button>
              </div>

              <form onSubmit={e => e.preventDefault()}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#48484a",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  paddingLeft: 4,
                  marginBottom: 2,
                }}>
                  Account
                </div>

                <div style={{
                  background: "#2c2c2e",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "0 16px", height: 40, gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#8e8e93", width: 72 }}>Email</span>
                    <input type="email" placeholder="you@example.com" style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none", textAlign: "right" }} />
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginLeft: 16 }} />
                  <div style={{ display: "flex", alignItems: "center", padding: "0 16px", height: 40, gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#8e8e93", width: 72 }}>Password</span>
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none", textAlign: "right" }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      {showPassword ? <EyeOff size={16} color="#48484a" /> : <Eye size={16} color="#48484a" />}
                    </button>
                  </div>
                </div>

                <button style={{
                  width: "100%", height: 40, background: "#ccff00", color: "#000", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                  Sign In →
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: 11, color: "#3a3a3c", marginTop: 10 }}>
                By continuing you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function BackgroundRenderer({ type }: { type: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {type === "Networking" && <NetworkingBackground />}
      {type === "Nebula" && <NebulaBackground />}
      {type === "CyberGrid" && <CyberGridBackground />}
      {type === "LiquidAurora" && <LiquidAuroraBackground />}
      {type === "Starfield" && <StarfieldBackground />}
      {type === "PulseRings" && <PulseRingsBackground />}
      {type === "Hexagon" && <HexagonBackground />}
      {type === "FloatingShapes" && <FloatingShapesBackground />}
      {type === "NeonRays" && <NeonRaysBackground />}
      {type === "DigitalNoise" && <DigitalNoiseBackground />}
      {type === "MatrixRain" && <MatrixRainBackground />}
      {type === "VideoLoop" && (
        <video
          src="/auth-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleY(-1)"
          }}
        />
      )}
    </div>
  );
}

function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const clouds = [
      { x: 0.3, y: 0.3, vx: 0.0003, vy: -0.0002, r: 180, color: "rgba(120, 30, 200, 0.15)" },
      { x: 0.7, y: 0.4, vx: -0.0002, vy: 0.0004, r: 220, color: "rgba(30, 80, 220, 0.12)" },
      { x: 0.5, y: 0.7, vx: 0.0004, vy: -0.0003, r: 200, color: "rgba(200, 20, 100, 0.1)" },
      { x: 0.2, y: 0.8, vx: -0.0003, vy: -0.0003, r: 150, color: "rgba(0, 180, 180, 0.08)" }
    ];

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 0.8 + 0.4,
      blinkSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      time += 1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        const opacity = 0.3 + 0.7 * Math.sin(time * star.blinkSpeed + star.phase);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "screen";
      clouds.forEach(cloud => {
        cloud.x += cloud.vx;
        cloud.y += cloud.vy;

        if (cloud.x < -0.2 || cloud.x > 1.2) cloud.vx *= -1;
        if (cloud.y < -0.2 || cloud.y > 1.2) cloud.vy *= -1;

        const cx = cloud.x * width;
        const cy = cloud.y * height;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloud.r);
        grad.addColorStop(0, cloud.color);
        grad.addColorStop(0.5, cloud.color.replace("0.1", "0.04").replace("0.15", "0.06").replace("0.12", "0.05").replace("0.08", "0.03"));
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cloud.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function CyberGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const speed = 0.015;
    let time = 0;

    const render = () => {
      time += speed;
      ctx.fillStyle = "#090014";
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * 0.4;
      ctx.strokeStyle = "rgba(255, 0, 128, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      const vpX = width / 2;
      const vpY = horizonY;

      const lineCount = 14;
      ctx.strokeStyle = "rgba(0, 240, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= lineCount; i++) {
        const xBottom = (width / lineCount) * i;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(255, 0, 128, 0.18)";
      const hLines = 10;
      for (let i = 0; i < hLines; i++) {
        const rawOffset = (i + (time % 1.0)) / hLines;
        const projectedY = vpY + Math.pow(rawOffset, 2.5) * (height - vpY);

        ctx.lineWidth = 0.5 + rawOffset * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, projectedY);
        ctx.lineTo(width, projectedY);
        ctx.stroke();
      }

      const sunGrad = ctx.createRadialGradient(vpX, vpY - 10, 0, vpX, vpY - 10, 90);
      sunGrad.addColorStop(0, "rgba(255, 0, 128, 0.15)");
      sunGrad.addColorStop(0.5, "rgba(120, 0, 255, 0.05)");
      sunGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(vpX, vpY - 10, 90, 0, Math.PI, true);
      ctx.fill();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function LiquidAuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.004;
      ctx.fillStyle = "#020205";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "screen";

      const waveCount = 3;
      const colors = [
        "rgba(204, 255, 0, 0.08)",
        "rgba(0, 255, 180, 0.07)",
        "rgba(130, 0, 255, 0.06)"
      ];

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseHeight = height * (0.35 + w * 0.12);
        
        for (let x = 0; x <= width; x += 10) {
          const angle1 = x * 0.006 + time + w * 1.5;
          const angle2 = x * 0.003 - time * 0.5 + w * 0.8;
          const waveHeight = Math.sin(angle1) * 35 + Math.cos(angle2) * 20;
          const y = baseHeight + waveHeight;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        const ribbonGrad = ctx.createLinearGradient(0, baseHeight - 60, 0, baseHeight + 60);
        ribbonGrad.addColorStop(0, "rgba(0,0,0,0)");
        ribbonGrad.addColorStop(0.5, colors[w]);
        ribbonGrad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.strokeStyle = ribbonGrad;
        ctx.lineWidth = 14 + w * 6;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const starCount = 80;
    const stars = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * 1000,
      y: (Math.random() - 0.5) * 1000,
      z: Math.random() * 1000,
      size: Math.random() * 2 + 1
    }));

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / width - 0.5;
      mouseY = (e.clientY - rect.top) / height - 0.5;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + mouseX * -80;
      const cy = height / 2 + mouseY * -80;

      stars.forEach(star => {
        star.z -= 6;
        if (star.z <= 0) {
          star.z = 1000;
          star.x = (Math.random() - 0.5) * 1000;
          star.y = (Math.random() - 0.5) * 1000;
        }

        const px = cx + (star.x / star.z) * width;
        const py = cy + (star.y / star.z) * height;

        const size = (1 - star.z / 1000) * star.size;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const prevZ = star.z + 6;
          const prevPx = cx + (star.x / prevZ) * width;
          const prevPy = cy + (star.y / prevZ) * height;

          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          
          const opacity = (1 - star.z / 1000) * 0.8;
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = size * 0.8;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fill();
        }
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function PulseRingsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const maxRings = 4;
    const rings = Array.from({ length: maxRings }, (_, i) => ({
      r: (i / maxRings) * 150,
      opacity: 1 - i / maxRings,
      speed: 0.6
    }));

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      rings.forEach(ring => {
        ring.r += ring.speed;
        ring.opacity = 1 - (ring.r / 180);

        if (ring.r > 180) {
          ring.r = 0;
          ring.opacity = 1;
        }

        if (ring.opacity > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(204, 255, 0, ${ring.opacity * 0.4})`;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
          
          if (Math.floor(ring.r / 30) % 2 === 0) {
            ctx.setLineDash([4, 6]);
          } else {
            ctx.setLineDash([12, 10]);
          }
          ctx.stroke();

          if (ring.opacity > 0.4 && Math.floor(ring.r) % 50 < 2) {
            ctx.fillStyle = `rgba(204, 255, 0, ${ring.opacity * 0.5})`;
            ctx.font = "8px monospace";
            ctx.fillText(`R: ${Math.floor(ring.r)}px`, cx + ring.r + 4, cy + 3);
          }
          ctx.restore();
        }
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 3 + Math.sin(time * 5) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ccff00";
      ctx.fill();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function HexagonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const r = 24;
    const h = r * 1.5;
    const w = r * Math.sqrt(3);

    const drawHex = (x: number, y: number, radius: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      }
      ctx.closePath();
    };

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, width, height);

      const rows = Math.ceil(height / h) + 2;
      const cols = Math.ceil(width / w) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let cx = col * w;
          const cy = row * h;

          if (row % 2 === 1) {
            cx += w / 2;
          }

          const dx = cx - width / 2;
          const dy = cy - height / 2;
          const dist = Math.hypot(dx, dy);

          const pulseVal = Math.sin(dist * 0.015 - time * 1.2) * 0.5 + 0.5;
          const opacity = 0.02 + pulseVal * 0.08;

          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;
          drawHex(cx, cy, r - 2);
          ctx.stroke();

          if (pulseVal > 0.85 && (row + col) % 5 === 0) {
            ctx.fillStyle = `rgba(204, 255, 0, ${(pulseVal - 0.85) * 0.4})`;
            ctx.beginPath();
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function FloatingShapesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const shapes = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * 200 + 50,
      y: Math.random() * 400 + 100,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 40 + 40,
      angle: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      type: i % 3
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.fillStyle = "#001212";
      ctx.fillRect(0, 0, width, height);

      shapes.forEach(shape => {
        shape.x += shape.vx;
        shape.y += shape.vy;
        shape.angle += shape.rotSpeed;

        if (shape.x - shape.size / 2 < 0 || shape.x + shape.size / 2 > width) shape.vx *= -1;
        if (shape.y - shape.size / 2 < 0 || shape.y + shape.size / 2 > height) shape.vy *= -1;

        if (mouseX > 0) {
          const dx = shape.x - mouseX;
          const dy = shape.y - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            const angle = Math.atan2(dy, dx);
            shape.x += Math.cos(angle) * force * 3;
            shape.y += Math.sin(angle) * force * 3;
          }
        }

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.angle);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, shape.size / 2);
        grad.addColorStop(0, "rgba(0, 255, 200, 0.08)");
        grad.addColorStop(1, "rgba(0, 255, 200, 0.02)");
        ctx.fillStyle = grad;
        ctx.strokeStyle = "rgba(0, 255, 200, 0.2)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        if (shape.type === 0) {
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
        } else if (shape.type === 1) {
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.closePath();
        } else {
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function NeonRaysBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const lx = width / 2;
      const ly = -20;

      ctx.globalCompositeOperation = "screen";

      const raysCount = 5;
      for (let i = 0; i < raysCount; i++) {
        const baseAngle = Math.PI / 2 + (i - (raysCount - 1) / 2) * 0.35;
        const sweep = Math.sin(time + i * 1.2) * 0.25;
        const angle = baseAngle + sweep;

        const rayLength = height * 1.5;

        const x1 = lx + Math.cos(angle - 0.1) * rayLength;
        const y1 = ly + Math.sin(angle - 0.1) * rayLength;
        const x2 = lx + Math.cos(angle + 0.1) * rayLength;
        const y2 = ly + Math.sin(angle + 0.1) * rayLength;

        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, rayLength);
        grad.addColorStop(0, "rgba(255, 0, 200, 0.18)");
        grad.addColorStop(0.5, "rgba(255, 0, 200, 0.06)");
        grad.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function DigitalNoiseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const cols = 15;
    const rows = 35;
    const cellW = 24;
    const cellH = 20;

    let time = 0;

    const render = () => {
      time += 1;
      ctx.fillStyle = "#040502";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(204, 255, 0, 0.04)";
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.fillRect(c * cellW + 12, r * cellH + 10, 2, 2);
        }
      }

      ctx.font = "8px monospace";
      ctx.fillStyle = "rgba(204, 255, 0, 0.22)";

      for (let i = 0; i < 22; i++) {
        const c = Math.floor(Math.abs(Math.sin(time * 0.02 + i) * cols)) % cols;
        const r = Math.floor(Math.abs(Math.cos(time * 0.015 + i * 2) * rows)) % rows;
        
        const val = Math.random() > 0.5 ? Math.floor(Math.random() * 10).toString() : (Math.random() > 0.5 ? "A" : "0");
        ctx.fillText(val, c * cellW + 8, r * cellH + 14);
      }

      const scanY = (time * 1.5) % height;
      ctx.strokeStyle = "rgba(204, 255, 0, 0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      if (time % 120 < 4) {
        ctx.fillStyle = "rgba(204, 255, 0, 0.03)";
        ctx.fillRect(0, Math.sin(time) * height, width, 15);
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.getBoundingClientRect().width;
      height = canvas.height = canvas.getBoundingClientRect().height;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const fontSize = 10;
    const columns = 28;
    const drops: number[] = Array.from({ length: columns }, () => Math.random() * -60);

    let lastFrameTime = Date.now();
    const frameRate = 60;

    const render = () => {
      const now = Date.now();
      const delta = now - lastFrameTime;

      if (delta >= frameRate) {
        lastFrameTime = now - (delta % frameRate);

        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
          const x = i * (width / columns);
          const y = drops[i] * fontSize;

          if (Math.random() > 0.95) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          } else {
            ctx.fillStyle = "rgba(204, 255, 0, 0.5)";
          }

          ctx.fillText(char, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          drops[i]++;
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function NetworkingBackground() {
  return <AnimatedNetworkGraph className="absolute inset-0" background="black" />;
}

export default AuthBgSandbox;
