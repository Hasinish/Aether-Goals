import React, { useEffect, useRef } from "react";

interface MatrixBackgroundProps {
  density?: number; // number of columns
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ density = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);
    const fontSize = 16;
    const columns = Math.min(density, Math.floor(width / fontSize));
    const drops: number[] = Array(columns).fill(0);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#00ff00";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30a0 + Math.random() * 96);
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, [density]);

  return <canvas ref={canvasRef} className="matrix-bg" style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} />;
};

export default MatrixBackground;
