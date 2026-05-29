import React, { useState, useEffect, useRef } from "react";

interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  rgbPrimary: string;
  rgbSecondary: string;
  gradient: string;
}

interface CRTScreenProps {
  matrixMode?: boolean;
  theme?: Theme;
}

const matrixLogs = [
  "PARSING DATA STREAM MATRIX CHANNELS...",
  "ESTABLISHING SECURE NEURAL PORTS...",
  "WARNING: QUANTUM DECOHERENCE DETECTED",
  "RE-ROUTING INTERMEDIATE CONDUITS...",
  "DECRYPTING PROGRESS SHARDS BLOCK...",
  "COMPILING CORE KERNEL IN SEGMENTS...",
  "MEM BUFFER: ACTIVE RECONSTITUTION",
  "AETHER PROTOCOL ENGINE INTEGRITY... OK"
];

export const CRTScreen: React.FC<CRTScreenProps> = ({ matrixMode = false, theme }) => {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logIndexRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    setLogs([
      ">> INITIALIZING DIAGNOSTICS CONSOLE...",
      ">> TERMINAL LINK ACTIVE -- PORT 2026",
      ">> DIAGNOSTICS SYSTEM LEVEL: NOMINAL"
    ]);
  }, []);

  useEffect(() => {
    if (!matrixMode || !mounted) return;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = matrixLogs[logIndexRef.current % matrixLogs.length];
        logIndexRef.current++;
        return [...prev.slice(1), `>> ${nextLog}`];
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [matrixMode, mounted]);

  const primaryColor = theme?.primary || "#06b6d4";
  const rgbPrimary = theme?.rgbPrimary || "6, 182, 212";

  return (
    <div 
      className="relative w-full h-52 bg-black rounded-xl overflow-hidden border transition-all duration-700 flex flex-col justify-between p-4 select-none font-mono"
      style={{ 
        borderColor: matrixMode ? "#00ff00" : `rgba(${rgbPrimary}, 0.2)`,
        boxShadow: matrixMode 
          ? "0 0 20px rgba(0, 255, 0, 0.12), inset 0 0 15px rgba(0, 255, 0, 0.08)"
          : `0 0 20px rgba(${rgbPrimary}, 0.03), inset 0 0 15px rgba(${rgbPrimary}, 0.01)`
      }}
    >
      {/* Phosphor glass overlay sweep scanline */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 3px)"
        }}
      />
      
      {/* CRT Scanline Beam sweep */}
      <div 
        className="absolute left-0 right-0 h-[1.5px] pointer-events-none z-10 animate-sweep" 
        style={{
          background: matrixMode ? "rgba(0, 255, 0, 0.25)" : `rgba(${rgbPrimary}, 0.25)`,
          boxShadow: matrixMode 
            ? "0 0 6px rgba(0, 255, 0, 0.6)" 
            : `0 0 6px rgba(${rgbPrimary}, 0.6)`
        }}
      />

      {/* Retro Flicker Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 animate-crt-flicker bg-transparent" />

      {/* Screen Header */}
      <div className="flex justify-between items-center border-b pb-1.5 z-10"
           style={{ borderColor: matrixMode ? "rgba(0, 255, 0, 0.15)" : `rgba(${rgbPrimary}, 0.12)` }}>
        <div className="flex items-center gap-2">
          <span 
            className="w-1.5 h-1.5 rounded-full animate-ping"
            style={{ backgroundColor: matrixMode ? "#00ff00" : primaryColor }}
          />
          <span 
            className="text-[9px] font-bold uppercase tracking-widest transition-colors duration-500"
            style={{ color: matrixMode ? "#00ff00" : primaryColor }}
          >
            {matrixMode ? "MATRIX SYSTEM MONITOR" : "AETHER DIAGNOSTICS"}
          </span>
        </div>
        <span 
          className="text-[7px] opacity-60 uppercase transition-colors duration-500"
          style={{ color: matrixMode ? "#00ff00" : primaryColor }}
        >
          SYS V1.2
        </span>
      </div>

      {/* Middle Display Area */}
      <div className="flex-1 py-3 flex flex-col justify-center gap-1 z-10 overflow-hidden text-[9px]">
        {matrixMode ? (
          // Matrix Scrolling Console
          <div className="space-y-1.5 text-green-400 font-mono">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-1 text-[8.5px] animate-fade-in font-mono leading-relaxed" style={{ textShadow: "0 0 3px rgba(0,255,0,0.4)" }}>
                <span>{log}</span>
              </div>
            ))}
          </div>
        ) : (
          // Standard Premium Telemetry Visualization
          <div className="flex flex-col gap-2.5">
            {/* Scrolling Oscilloscope Sine Waves */}
            <div className="h-10 overflow-hidden relative flex items-center justify-center">
              <svg className="w-full h-10 opacity-70" viewBox="0 0 300 40">
                <path
                  d="M0 20 Q 30 5, 60 20 T 120 20 T 180 20 T 240 20 T 300 20 M-300 20"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="1.5"
                  className="animate-oscilloscope"
                />
                <path
                  d="M0 20 Q 35 35, 70 20 T 140 20 T 210 20 T 280 20 T 350 20 M-350 20"
                  fill="none"
                  stroke={`rgba(${rgbPrimary}, 0.35)`}
                  strokeWidth="1"
                  className="animate-oscilloscope-slow"
                />
              </svg>
            </div>
            
            {/* Telemetry Stats */}
            <div className="flex justify-between items-center text-[7.5px] text-neutral-500 uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1">
                <span>FREQ:</span>
                <span className="text-white font-bold">428.6 MHz</span>
              </span>
              <span className="flex items-center gap-1">
                <span>INTEGRITY:</span>
                <span className="text-white font-bold">100% SECURE</span>
              </span>
              <span className="flex items-center gap-1">
                <span>FPS:</span>
                <span className="text-white font-bold">60.0 BUFFER</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Screen Footer */}
      <div 
        className="flex justify-between items-center text-[7px] border-t pt-1.5 uppercase font-bold z-10"
        style={{ 
          borderColor: matrixMode ? "rgba(0, 255, 0, 0.15)" : `rgba(${rgbPrimary}, 0.12)`,
          color: matrixMode ? "#00ff00" : primaryColor 
        }}
      >
        <span>CORE DIAGS: {matrixMode ? "MATRIX_ACTIVE" : "NOMINAL"}</span>
        <span>SHARD ID: 0x7E49A9C2</span>
      </div>

      {/* Dynamic inline keyframes style block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sweep {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-sweep {
          animation: sweep 4s linear infinite;
        }
        @keyframes crt-flicker {
          0%, 100% { opacity: 0.98; }
          50% { opacity: 1.0; }
          25% { opacity: 0.99; }
          75% { opacity: 0.985; }
        }
        .animate-crt-flicker {
          animation: crt-flicker 0.15s infinite;
        }
        @keyframes oscilloscope {
          0% { transform: translateX(0); }
          100% { transform: translateX(300px); }
        }
        .animate-oscilloscope {
          animation: oscilloscope 3s linear infinite;
        }
        @keyframes oscilloscope-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(350px); }
        }
        .animate-oscilloscope-slow {
          animation: oscilloscope-slow 5s linear infinite;
        }
      `}} />
    </div>
  );
};

export default CRTScreen;
