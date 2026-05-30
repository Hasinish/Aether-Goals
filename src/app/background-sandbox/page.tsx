"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Sliders, Layers, Info, Zap, ZapOff, Activity, ShieldAlert } from "lucide-react";

// Types
type IntensityType = "low" | "medium" | "high";
type DensityType = "low" | "medium" | "high";
type ThemeType = "cyan" | "emerald" | "violet" | "monochrome";

interface BackgroundProps {
  intensity: IntensityType;
  motion: boolean;
  density: DensityType;
  theme: ThemeType;
  reducedMotion: boolean;
}

// Background Details Configuration
const BACKGROUNDS = [
  {
    id: "constellation",
    name: "Constellation Field",
    vibe: "calm futuristic network of stars",
    bestFor: "main dashboard and core tracking hubs",
    caution: "can feel generic if overused in simple panels",
  },
  {
    id: "flow-field",
    name: "Flow Field",
    vibe: "futuristic vector fluid currents",
    bestFor: "hero sections & high-end interactive pages",
    caution: "higher CPU load with high density and motion",
  },
  {
    id: "aurora",
    name: "Aurora Mesh",
    vibe: "soft glowing atmospheric mesh blobs",
    bestFor: "premium login gates & emotional user states",
    caution: "requires high-contrast dark card borders for readability",
  },
  {
    id: "topography",
    name: "Topographic Contours",
    vibe: "organic altitude contour map paths",
    bestFor: "strategic planning and milestone roadmaps",
    caution: "thin lines can appear to flicker on low-DPI displays",
  },
  {
    id: "orbital",
    name: "Orbital Scanner",
    vibe: "radar telemetry HUD interface",
    bestFor: "high-tech analytics displays & telemetry hubs",
    caution: "rotating sweep line might distract from core page text",
  },
  {
    id: "matrix",
    name: "Matrix Rain",
    vibe: "restrained terminal digital stream",
    bestFor: "developer logs, debug modes, & nerd styling",
    caution: "keep opacity low to ensure text elements stay readable",
  },
  {
    id: "neural",
    name: "Neural Mesh",
    vibe: "synaptic pathway pulse communications",
    bestFor: "AI insights panels & cognitive trackers",
    caution: "visually complex; keep connection limits constrained",
  },
  {
    id: "liquid-glass",
    name: "Liquid Glass Blobs",
    vibe: "merging metaball fluid liquid layer",
    bestFor: "morphing tab bar layouts & interactive buttons",
    caution: "heavy browser blur and contrast combination can lag mobile Safari",
  }
];

// Color Theme Helper
const getThemeColors = (theme: ThemeType) => {
  switch (theme) {
    case "cyan":
      return {
        primary: "rgba(6, 182, 212, 1)",
        rgbPrimary: "6, 182, 212",
        glow: "rgba(6, 182, 212, 0.4)",
        bg: "rgba(6, 182, 212, 0.05)",
        palette: ["rgba(6, 182, 212, 0.85)", "rgba(34, 211, 238, 0.85)", "rgba(8, 145, 178, 0.85)"]
      };
    case "emerald":
      return {
        primary: "rgba(16, 185, 129, 1)",
        rgbPrimary: "16, 185, 129",
        glow: "rgba(16, 185, 129, 0.4)",
        bg: "rgba(16, 185, 129, 0.05)",
        palette: ["rgba(16, 185, 129, 0.85)", "rgba(52, 211, 153, 0.85)", "rgba(5, 150, 105, 0.85)"]
      };
    case "violet":
      return {
        primary: "rgba(139, 92, 246, 1)",
        rgbPrimary: "139, 92, 246",
        glow: "rgba(139, 92, 246, 0.4)",
        bg: "rgba(139, 92, 246, 0.05)",
        palette: ["rgba(139, 92, 246, 0.85)", "rgba(167, 139, 250, 0.85)", "rgba(109, 40, 217, 0.85)"]
      };
    case "monochrome":
      return {
        primary: "rgba(245, 245, 245, 1)",
        rgbPrimary: "245, 245, 245",
        glow: "rgba(255, 255, 255, 0.25)",
        bg: "rgba(255, 255, 255, 0.05)",
        palette: ["rgba(255, 255, 255, 0.85)", "rgba(200, 200, 200, 0.85)", "rgba(150, 150, 150, 0.85)"]
      };
  }
};

export default function BackgroundSandboxPage() {
  const [activeBg, setActiveBg] = useState<string>("constellation");
  const [intensity, setIntensity] = useState<IntensityType>("medium");
  const [motion, setMotion] = useState<boolean>(true);
  const [density, setDensity] = useState<DensityType>("medium");
  const [theme, setTheme] = useState<ThemeType>("cyan");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Monitor user preference for reduced motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const activeMetadata = useMemo(() => {
    return BACKGROUNDS.find(bg => bg.id === activeBg) || BACKGROUNDS[0];
  }, [activeBg]);

  // Determine current active colors
  const themeColors = useMemo(() => getThemeColors(theme), [theme]);

  // Handle Motion toggle respecting prefers-reduced-motion
  const isMotionActive = motion && !reducedMotion;

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans select-none overflow-x-hidden antialiased">
      {/* Dynamic inline styles for selected accent color theme */}
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --accent-theme: ${themeColors.primary};
            --accent-theme-glow: ${themeColors.glow};
            --accent-theme-bg: ${themeColors.bg};
          }
          .accent-glow-border:hover {
            border-color: rgba(${themeColors.rgbPrimary}, 0.4);
            box-shadow: 0 0 15px rgba(${themeColors.rgbPrimary}, 0.05);
          }
          .accent-text {
            color: rgba(${themeColors.rgbPrimary}, 0.9);
          }
          .accent-border {
            border-color: rgba(${themeColors.rgbPrimary}, 0.35);
          }
          .accent-pill-active {
            background-color: rgba(${themeColors.rgbPrimary}, 0.15);
            border-color: rgba(${themeColors.rgbPrimary}, 0.5);
            color: #ffffff;
            box-shadow: 0 0 10px rgba(${themeColors.rgbPrimary}, 0.1);
          }
        `
      }} />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Controls & Selector Panel (40% space on lg) */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6 flex-shrink-0">
          
          {/* Header Card */}
          <div className="bg-neutral-950/40 backdrop-blur-md border border-neutral-900 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Link 
                href="/" 
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors duration-150 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </Link>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono tracking-wider font-semibold text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LAB MODE
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Background Lab
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                Interactive atmosphere and motion experiments for Aether
              </p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-neutral-950/40 backdrop-blur-md border border-neutral-900 rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Sliders size={15} className="accent-text" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200">LAB CONTROLS</h2>
            </div>

            {/* Controls Grid */}
            <div className="flex flex-col gap-4">
              {/* Theme Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">Theme Palette</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["cyan", "emerald", "violet", "monochrome"] as ThemeType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono capitalize transition-all duration-200 ${
                        theme === t 
                          ? "accent-pill-active border-accent-theme"
                          : "bg-neutral-900/60 border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {t === "monochrome" ? "Mono" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">Luminous Intensity</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["low", "medium", "high"] as IntensityType[]).map((inst) => (
                    <button
                      key={inst}
                      onClick={() => setIntensity(inst)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono capitalize transition-all duration-200 ${
                        intensity === inst 
                          ? "accent-pill-active border-accent-theme"
                          : "bg-neutral-900/60 border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density Control */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">Particle/Line Density</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["low", "medium", "high"] as DensityType[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-mono capitalize transition-all duration-200 ${
                        density === d 
                          ? "accent-pill-active border-accent-theme"
                          : "bg-neutral-900/60 border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Toggle */}
              <div className="flex items-center justify-between bg-neutral-900/40 border border-neutral-900 rounded-xl p-3 mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    {isMotionActive ? <Zap size={13} className="text-yellow-400" /> : <ZapOff size={13} className="text-neutral-500" />}
                    Animation Loops
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {reducedMotion 
                      ? "System Prefers Reduced Motion" 
                      : "Toggles frame refresh & CSS drifting"}
                  </span>
                </div>
                <button
                  disabled={reducedMotion}
                  onClick={() => setMotion(!motion)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isMotionActive ? "bg-accent-theme accent-border" : "bg-neutral-800"
                  } ${reducedMotion ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isMotionActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Background Selector Grid */}
          <div className="flex-1 bg-neutral-950/40 backdrop-blur-md border border-neutral-900 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3 flex-shrink-0">
              <Layers size={15} className="accent-text" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200">SELECT EXPERIMENT</h2>
            </div>

            {/* Grid selector scroll container */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[300px] lg:max-h-none scrollbar-thin">
              {BACKGROUNDS.map((bg) => {
                const isActive = activeBg === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => setActiveBg(bg.id)}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1 ${
                      isActive 
                        ? "accent-border bg-neutral-900/80 border-accent-theme"
                        : "bg-neutral-950/40 border-neutral-900/60 hover:bg-neutral-900/40 hover:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-neutral-300"}`}>
                        {bg.name}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-theme shadow-lg shadow-accent-theme" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 line-clamp-1 font-mono font-light">
                      vibe: {bg.vibe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Stage (60% space on lg) */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Live Preview Screen Container */}
          <div className="flex-1 min-h-[480px] lg:min-h-0 bg-neutral-950/20 border border-neutral-900 rounded-3xl relative overflow-hidden flex flex-col justify-between p-6">
            
            {/* Background Renderer */}
            <PreviewStage
              activeBg={activeBg}
              intensity={intensity}
              motion={isMotionActive}
              density={density}
              theme={theme}
              reducedMotion={reducedMotion}
            />

            {/* Preview Stage Header HUD Overlay */}
            <div className="z-10 w-full flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-neutral-950/60 backdrop-blur-md border border-neutral-900 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-theme animate-pulse" />
                <span className="text-[10px] font-mono text-neutral-400">ACTIVE: <span className="text-white uppercase font-bold">{activeMetadata.name}</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-950/60 backdrop-blur-md border border-neutral-900 px-3 py-1.5 rounded-xl">
                <Activity size={10} className="text-neutral-400 animate-pulse" />
                <span className="text-[10px] font-mono text-neutral-400">
                  D: {density} | I: {intensity} | M: {isMotionActive ? "ON" : "OFF"}
                </span>
              </div>
            </div>

            {/* Mock Dashboard Overlay (Centered for evaluation) */}
            <div className="z-10 my-auto w-full max-w-md mx-auto flex flex-col gap-4 pointer-events-none mt-12 mb-12">
              <MockDashboardOverlay />
            </div>

            {/* Bottom HUD overlay */}
            <div className="z-10 w-full flex justify-between text-[9px] font-mono text-neutral-500 pointer-events-none">
              <span>AETHER ATMOSPHERE SANDBOX</span>
              <span>RENDER = 60FPS CANVAS / CSS GRAPHICS</span>
            </div>
          </div>

          {/* Details / Notes Panel */}
          <div className="bg-neutral-950/40 backdrop-blur-md border border-neutral-900 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-accent-theme flex-shrink-0">
              <Info size={20} className="accent-text" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Active Blueprint</span>
                <span className="text-xs font-semibold text-neutral-250">{activeMetadata.name}</span>
                <span className="text-[10px] text-neutral-400 italic">&quot;{activeMetadata.vibe}&quot;</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Recommended Use</span>
                <span className="text-xs text-neutral-300">{activeMetadata.bestFor}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <ShieldAlert size={10} className="text-yellow-500/80" /> Caution
                </span>
                <span className="text-xs text-neutral-400">{activeMetadata.caution}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// PREVIEW STAGE SWITCH RENDERER
// ==========================================
interface PreviewStageProps extends BackgroundProps {
  activeBg: string;
}

function PreviewStage({ activeBg, intensity, motion, density, theme, reducedMotion }: PreviewStageProps) {
  const props: BackgroundProps = { intensity, motion, density, theme, reducedMotion };
  
  switch (activeBg) {
    case "constellation":
      return <ConstellationField {...props} />;
    case "flow-field":
      return <FlowField {...props} />;
    case "aurora":
      return <AuroraMesh {...props} />;
    case "topography":
      return <TopographicContours {...props} />;
    case "orbital":
      return <OrbitalScanner {...props} />;
    case "matrix":
      return <MatrixRain {...props} />;
    case "neural":
      return <NeuralMesh {...props} />;
    case "liquid-glass":
      return <LiquidGlassBlobs {...props} />;
    default:
      return <ConstellationField {...props} />;
  }
}

// ==========================================
// MOCK UI OVERLAYS (READABILITY CHECKERS)
// ==========================================
function MockDashboardOverlay() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in pointer-events-auto">
      {/* Morphing Header Pill Mock */}
      <div className="flex justify-between items-center bg-neutral-950/75 backdrop-blur-lg border border-neutral-900/80 rounded-full px-4 py-2 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center">
            <span className="text-[8px] font-mono font-extrabold accent-text">Æ</span>
          </div>
          <span className="text-[11px] font-mono tracking-wider font-medium text-neutral-350">AETHER</span>
        </div>
        <div className="flex gap-1">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full accent-pill-active border border-accent-theme font-medium text-white shadow-sm">
            Goals
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-900/40 text-neutral-400 hover:text-neutral-300">
            Habits
          </span>
        </div>
      </div>

      {/* Main Goal Card Mock */}
      <div className="bg-neutral-950/75 backdrop-blur-lg border border-neutral-900/80 rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">PROJECT GOAL</span>
            <h3 className="text-sm font-semibold text-white tracking-wide mt-0.5">Build Neural Core Engine</h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-400 border border-neutral-900 bg-neutral-900/50 px-2 py-0.5 rounded-md">
            Jun 15
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[9px] font-mono text-neutral-400">
            <span>Core Integration</span>
            <span className="accent-text font-bold">64% Done</span>
          </div>
          
          {/* Segmented indicator mockup */}
          <div className="grid grid-cols-10 gap-1 h-2">
            {Array.from({ length: 10 }).map((_, idx) => {
              const active = idx < 6;
              const current = idx === 6;
              return (
                <div
                  key={idx}
                  className={`h-full rounded-sm transition-all duration-300 ${
                    active 
                      ? "bg-accent-theme opacity-85 shadow-[0_0_8px_var(--accent-theme-glow)]"
                      : current
                        ? "bg-accent-theme opacity-40 animate-pulse"
                        : "bg-neutral-900 border border-neutral-850"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Card footer details */}
        <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 pt-1.5 border-t border-neutral-900/80">
          <span>TASKS: 18 / 28</span>
          <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-green-500/80 font-semibold bg-green-950/20 px-1.5 py-0.5 rounded-md">
            On Track
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. CONSTELLATION FIELD BACKGROUND
// ==========================================
function ConstellationField({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);
  const opacityFactor = intensity === "low" ? 0.25 : intensity === "medium" ? 0.45 : 0.75;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Scale properties based on controls
    const speedFactor = motion && !reducedMotion ? (intensity === "low" ? 0.4 : intensity === "medium" ? 0.85 : 1.35) : 0;
    
    let baseCount = density === "low" ? 30 : density === "medium" ? 70 : 130;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      baseCount = Math.floor(baseCount * 0.5); // scale down for mobile performance
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    // Node state arrays
    const colors = themeColors.palette;
    const particles = Array.from({ length: baseCount }, () => {
      const col = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4 * speedFactor,
        vy: (Math.random() - 0.5) * 0.4 * speedFactor,
        radius: Math.random() * (intensity === "low" ? 1.5 : intensity === "medium" ? 2.5 : 3.5) + 0.8,
        color: col
      };
    });

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const maxDistance = intensity === "low" ? 60 : intensity === "medium" ? 90 : 130;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Nodes & Connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Motion step
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce bounds
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse attraction force
        if (mouse.x > 0 && speedFactor > 0) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            p1.x += (dx / dist) * force * 0.25;
            p1.y += (dy / dist) * force * 0.25;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        // Connections to other nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / maxDistance) * 0.15;
            ctx.strokeStyle = p1.color.replace("0.85", String(alpha)).replace("1)", String(alpha));
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Connect to pointer
        if (mouse.x > 0) {
          const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (mouseDist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            const alpha = (1 - mouseDist / 120) * 0.25;
            ctx.strokeStyle = p1.color.replace("0.85", String(alpha)).replace("1)", String(alpha));
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.palette, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
      style={{ opacity: opacityFactor }}
    />
  );
}

// ==========================================
// 2. FLOW FIELD BACKGROUND
// ==========================================
function FlowField({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    let baseCount = density === "low" ? 40 : density === "medium" ? 110 : 220;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      baseCount = Math.floor(baseCount * 0.5);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Clear black base to initialize trail rendering
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    // Speed configurations
    const speed = intensity === "low" ? 0.6 : intensity === "medium" ? 1.2 : 1.8;
    const lineWeight = intensity === "low" ? 0.6 : intensity === "medium" ? 1.0 : 1.5;

    const colors = themeColors.palette;
    const particles = Array.from({ length: baseCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      prevX: 0,
      prevY: 0,
      life: Math.random() * 100,
      maxLife: Math.random() * 80 + 60,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    // Seed previous coordinates
    particles.forEach(p => {
      p.prevX = p.x;
      p.prevY = p.y;
    });

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Vector Flow function
    const getFlowAngle = (x: number, y: number, t: number) => {
      // Create organic sweeping paths using sine/cosine equations
      return Math.sin(x * 0.004 + t) * Math.cos(y * 0.003 - t) * Math.PI * 2;
    };

    const draw = () => {
      // Accumulate trailing paths via semi-transparent fills
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, width, height);

      time += motion && !reducedMotion ? 0.003 : 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        let angle = getFlowAngle(p.x, p.y, time);

        // Pointer proximity deflection
        if (mouse.x > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 160) {
            const influence = (160 - dist) / 160;
            // Guide vector to slide perpendicular around mouse
            const pushAngle = Math.atan2(dy, dx) + Math.PI / 2;
            angle = angle * (1 - influence) + pushAngle * influence * 1.3;
          }
        }

        // Update positions
        p.prevX = p.x;
        p.prevY = p.y;
        
        const speedMultiplier = motion && !reducedMotion ? 1 : 0.01; // slow-drift when motion off
        p.x += Math.cos(angle) * speed * speedMultiplier;
        p.y += Math.sin(angle) * speed * speedMultiplier;
        p.life += motion && !reducedMotion ? 1 : 0.1;

        // Reset if expired or out of canvas bounds
        const outOfBounds = p.x < 0 || p.x > width || p.y < 0 || p.y > height;
        if (p.life > p.maxLife || outOfBounds) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.prevX = p.x;
          p.prevY = p.y;
          p.life = 0;
          p.maxLife = Math.random() * 85 + 55;
        }

        // Draw flowing vector line segment
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = lineWeight;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.palette, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
      style={{ opacity: intensity === "low" ? 0.3 : intensity === "medium" ? 0.55 : 0.85 }}
    />
  );
}

// ==========================================
// 3. AURORA MESH BACKGROUND (CSS LAYERS)
// ==========================================
function AuroraMesh({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const themeColors = getThemeColors(theme);
  
  // Create 3-5 blurred blobs depending on density settings
  const blobCount = density === "low" ? 2 : density === "medium" ? 3 : 5;
  const opacityFactor = intensity === "low" ? 0.18 : intensity === "medium" ? 0.38 : 0.65;

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const blobs = Array.from(parent.children) as HTMLDivElement[];
    let animationFrameId: number;
    
    // Size constraints
    const minSize = 250;
    const maxSize = 450;

    // Set blob movement states
    const states = blobs.map(() => {
      const size = Math.random() * (maxSize - minSize) + minSize;
      return {
        x: Math.random() * (parent.clientWidth - size),
        y: Math.random() * (parent.clientHeight - size),
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        size
      };
    });

    const update = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      blobs.forEach((el, index) => {
        const state = states[index];
        if (!state || !el) return;

        // Apply motion if active
        if (motion && !reducedMotion) {
          state.x += state.vx;
          state.y += state.vy;

          // Screen boundaries collision
          if (state.x < -state.size / 2) {
            state.x = -state.size / 2;
            state.vx *= -1;
          } else if (state.x > w - state.size / 2) {
            state.x = w - state.size / 2;
            state.vx *= -1;
          }

          if (state.y < -state.size / 2) {
            state.y = -state.size / 2;
            state.vy *= -1;
          } else if (state.y > h - state.size / 2) {
            state.y = h - state.size / 2;
            state.vy *= -1;
          }
        }

        // Draw element translation directly to bypass React renders
        el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
        el.style.width = `${state.size}px`;
        el.style.height = `${state.size}px`;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blobCount, motion, reducedMotion]);

  // Map distinct soft colors for blobs to form gradients
  const blobColors = useMemo(() => {
    const pal = themeColors.palette;
    // Map list of rgb colors
    return Array.from({ length: blobCount }).map((_, i) => pal[i % pal.length]);
  }, [blobCount, themeColors]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 block pointer-events-none z-0 overflow-hidden bg-black/95 filter blur-[75px]"
      style={{ opacity: opacityFactor }}
    >
      {blobColors.map((color, idx) => (
        <div
          key={idx}
          className="absolute rounded-full mix-blend-screen opacity-55 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      ))}
    </div>
  );
}

// ==========================================
// 4. TOPOGRAPHIC CONTOURS BACKGROUND
// ==========================================
function TopographicContours({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    const lineCount = density === "low" ? 5 : density === "medium" ? 9 : 15;
    const opacityFactor = intensity === "low" ? 0.2 : intensity === "medium" ? 0.38 : 0.6;
    const strokeWidth = intensity === "low" ? 0.6 : intensity === "medium" ? 1.0 : 1.4;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      time += motion && !reducedMotion ? 0.0025 : 0;

      const colors = themeColors.palette;

      // Draw horizontal layered topographic waves
      for (let i = 0; i < lineCount; i++) {
        const baseHeight = (height * (i + 1)) / (lineCount + 1);
        const col = colors[i % colors.length];

        ctx.beginPath();
        const waveHeight = intensity === "low" ? 15 : intensity === "medium" ? 30 : 50;

        // Draw horizontal paths across screen
        for (let x = 0; x <= width; x += 15) {
          // Double sine wave patterns for topographic contours
          const wave = Math.sin(x * 0.003 + time + i * 0.9) * 
                       Math.cos(x * 0.0012 - time * 0.4 + i * 1.5) * 
                       waveHeight;
          
          let y = baseHeight + wave;

          // Mouse deflection
          if (mouse.x > 0) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 140) {
              const force = (140 - dist) / 140;
              // Repel lines away vertically from mouse cursor
              y += (y < mouse.y ? -1 : 1) * force * force * 30;
            }
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = col;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = opacityFactor * (1 - Math.abs(i - lineCount / 2) / (lineCount));
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.palette, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
    />
  );
}

// ==========================================
// 5. ORBITAL SCANNER BACKGROUND
// ==========================================
function OrbitalScanner({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let sweepAngle = 0;

    const ringCount = density === "low" ? 3 : density === "medium" ? 6 : 9;
    const opacityVal = intensity === "low" ? 0.15 : intensity === "medium" ? 0.35 : 0.65;
    const speed = motion && !reducedMotion ? 0.004 : 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Center scanner HUD on screen
      const center = { x: width / 2, y: height / 2 };
      const maxRadius = Math.min(width, height) * 0.45;

      sweepAngle += speed;
      if (sweepAngle > Math.PI * 2) sweepAngle = 0;

      // Draw Rotating Sweeper Beam Sector
      ctx.save();
      const rgb = themeColors.rgbPrimary;
      // Draw tail lines fading behind sweep angle
      for (let j = 0; j < 35; j++) {
        const trailAngle = sweepAngle - (j * 0.015);
        const alpha = (1 - j / 35) * 0.15 * opacityVal;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(
          center.x + Math.cos(trailAngle) * maxRadius,
          center.y + Math.sin(trailAngle) * maxRadius
        );
        ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      ctx.restore();

      // Draw Concentric Rings
      for (let i = 0; i < ringCount; i++) {
        const radius = (maxRadius * (i + 1)) / ringCount;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(${rgb}, ${opacityVal * 0.15})`;
        
        // Style specific rings with dashes to emulate digital telemetry UI
        if (i % 2 === 1) {
          ctx.setLineDash([6, 14]);
        } else if (i === ringCount - 1) {
          ctx.setLineDash([25, 8]);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = `rgba(${rgb}, ${opacityVal * 0.35})`;
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Render digital crosshair markers or numbers on rings
        if (i === Math.floor(ringCount / 2) && opacityVal > 0.2) {
          ctx.fillStyle = `rgba(${rgb}, ${opacityVal * 0.5})`;
          ctx.font = "8px monospace";
          ctx.fillText(`TELEMETRY.R_${i}: ${radius.toFixed(0)}`, center.x + radius + 5, center.y + 3);
          
          // Draw tick marks
          ctx.beginPath();
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const x1 = center.x + Math.cos(angle) * (radius - 3);
            const y1 = center.y + Math.sin(angle) * (radius - 3);
            const x2 = center.x + Math.cos(angle) * (radius + 3);
            const y2 = center.y + Math.sin(angle) * (radius + 3);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.strokeStyle = `rgba(${rgb}, ${opacityVal * 0.3})`;
          ctx.stroke();
        }
      }

      // Draw crosshair axes
      ctx.beginPath();
      ctx.moveTo(center.x - maxRadius * 1.05, center.y);
      ctx.lineTo(center.x + maxRadius * 1.05, center.y);
      ctx.moveTo(center.x, center.y - maxRadius * 1.05);
      ctx.lineTo(center.x, center.y + maxRadius * 1.05);
      ctx.strokeStyle = `rgba(${rgb}, ${opacityVal * 0.08})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.rgbPrimary, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
    />
  );
}

// ==========================================
// 6. MATRIX RAIN BACKGROUND
// ==========================================
function MatrixRain({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const fontSize = 10;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.floor(width / (fontSize + 4));
      
      // Select subset based on density configurations
      const maxColumns = density === "low" ? 25 : density === "medium" ? 55 : 100;
      const densityDiv = Math.max(1, Math.floor(columns / maxColumns));
      
      drops = Array.from({ length: columns }, (_, idx) => 
        idx % densityDiv === 0 ? Math.random() * -100 : -9999
      );

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    // Restrained speed configurations to remain elegant, not hectic
    const frameRate = intensity === "low" ? 140 : intensity === "medium" ? 85 : 55;
    const opacityFactor = intensity === "low" ? 0.15 : intensity === "medium" ? 0.32 : 0.55;

    let lastFrameTime = Date.now();

    const draw = () => {
      const now = Date.now();
      const delta = now - lastFrameTime;

      if (delta >= frameRate) {
        lastFrameTime = now - (delta % frameRate);

        // Subtle fading overlay trail
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px monospace`;
        const rgb = themeColors.rgbPrimary;

        for (let i = 0; i < drops.length; i++) {
          if (drops[i] === -9999) continue;

          // Render random futuristic letters/symbols
          const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
          const x = i * (fontSize + 4);
          const y = drops[i] * fontSize;

          // Draw leading symbol brighter/whiter
          if (Math.random() > 0.85) {
            ctx.fillStyle = `rgba(255, 255, 255, ${opacityFactor * 0.95})`;
          } else {
            ctx.fillStyle = `rgba(${rgb}, ${opacityFactor * 0.55})`;
          }

          ctx.fillText(char, x, y);

          // Reset drops randomly at the bottom
          if (y > height && Math.random() > 0.985) {
            drops[i] = 0;
          }

          if (motion && !reducedMotion) {
            drops[i]++;
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.rgbPrimary, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
    />
  );
}

// ==========================================
// 7. NEURAL MESH BACKGROUND
// ==========================================
interface NeuralHub {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: number[];
}

interface NeuralSignal {
  path: [number, number]; // index array: [fromHub, toHub]
  progress: number;
  speed: number;
  color: string;
}

function NeuralMesh({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    let hubCount = density === "low" ? 6 : density === "medium" ? 11 : 20;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      hubCount = Math.floor(hubCount * 0.5);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    // Map themes and node colors
    const colors = themeColors.palette;

    // Create Hub Nodes
    const hubs: NeuralHub[] = Array.from({ length: hubCount }, () => {
      const rColor = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * (width - 60) + 30,
        y: Math.random() * (height - 60) + 30,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 2 + 1.8,
        color: rColor,
        connections: []
      };
    });

    // Wire up hub network paths (proximity threshold)
    const wireDistance = Math.min(width, height) * 0.35;
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const d = Math.hypot(hubs[i].x - hubs[j].x, hubs[i].y - hubs[j].y);
        if (d < wireDistance) {
          hubs[i].connections.push(j);
          hubs[j].connections.push(i);
        }
      }
    }

    // Active Synaptic signals traveling across hubs
    const signals: NeuralSignal[] = [];
    const maxSignals = density === "low" ? 8 : density === "medium" ? 22 : 45;

    // Initialize random path triggers
    const triggerSignal = () => {
      if (hubs.length === 0) return;
      const from = Math.floor(Math.random() * hubs.length);
      const connections = hubs[from].connections;
      if (connections.length > 0) {
        const to = connections[Math.floor(Math.random() * connections.length)];
        signals.push({
          path: [from, to],
          progress: 0,
          speed: Math.random() * 0.015 + 0.008,
          color: hubs[from].color
        });
      }
    };

    // Prefill network signals
    for (let s = 0; s < maxSignals / 2; s++) {
      triggerSignal();
      if (signals.length > 0) {
        signals[signals.length - 1].progress = Math.random() * 0.8;
      }
    }

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    parent.addEventListener("mousemove", handleMouseMove, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const signalSize = intensity === "low" ? 1.5 : intensity === "medium" ? 2.2 : 3.0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const motionSpeed = motion && !reducedMotion ? 1 : 0.02; // extremely slow drift when paused

      // Update Hub positions
      for (let i = 0; i < hubs.length; i++) {
        const hub = hubs[i];
        
        hub.x += hub.vx * motionSpeed;
        hub.y += hub.vy * motionSpeed;

        // Bounce bounds
        if (hub.x < 15 || hub.x > width - 15) hub.vx *= -1;
        if (hub.y < 15 || hub.y > height - 15) hub.vy *= -1;

        // Mouse hover reaction
        const mDist = Math.hypot(hub.x - mouse.x, hub.y - mouse.y);
        let nodeAlpha = 0.6;
        let scale = 1.0;
        
        if (mDist < 100 && motion) {
          const influence = (100 - mDist) / 100;
          nodeAlpha = 0.6 + influence * 0.4;
          scale = 1.0 + influence * 0.5;
          // Slowly pull node slightly toward mouse cursor
          hub.x += (mouse.x - hub.x) * 0.015;
          hub.y += (mouse.y - hub.y) * 0.015;
        }

        // Draw Hub Node
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, hub.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = hub.color.replace("0.85", String(nodeAlpha)).replace("1)", String(nodeAlpha));
        ctx.fill();

        // Connect Hub network lines
        for (let c = 0; c < hub.connections.length; c++) {
          const targetIdx = hub.connections[c];
          if (targetIdx > i) {
            const dest = hubs[targetIdx];
            const dist = Math.hypot(hub.x - dest.x, hub.y - dest.y);
            
            ctx.beginPath();
            ctx.moveTo(hub.x, hub.y);
            ctx.lineTo(dest.x, dest.y);
            
            // Fading connections
            const alpha = 0.045 * (1 - dist / wireDistance);
            ctx.strokeStyle = hub.color.replace("0.85", String(alpha)).replace("1)", String(alpha));
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Trigger new signals randomly
      if (signals.length < maxSignals && Math.random() > 0.88 && motion) {
        triggerSignal();
      }

      // Update and Draw Synaptic impulses
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        const from = hubs[sig.path[0]];
        const to = hubs[sig.path[1]];

        if (!from || !to) {
          signals.splice(s, 1);
          continue;
        }

        // Move impulse progress
        sig.progress += sig.speed * motionSpeed;

        // Signal complete
        if (sig.progress >= 1.0) {
          // Relocate/Handshake signal to a new connecting path or delete
          const nextConnections = to.connections;
          if (nextConnections.length > 0 && Math.random() > 0.3) {
            sig.path[0] = sig.path[1];
            sig.path[1] = nextConnections[Math.floor(Math.random() * nextConnections.length)];
            sig.progress = 0;
          } else {
            signals.splice(s, 1);
            continue;
          }
        }

        // Interpolate signal coordinate
        const sigX = from.x + (to.x - from.x) * sig.progress;
        const sigY = from.y + (to.y - from.y) * sig.progress;

        // Draw pulsing spark
        ctx.beginPath();
        ctx.arc(sigX, sigY, signalSize, 0, Math.PI * 2);
        ctx.fillStyle = sig.color;
        
        // Drop shadow glowing effect for signals
        ctx.shadowBlur = 6;
        ctx.shadowColor = sig.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.palette, reducedMotion]);

  const opacityVal = intensity === "low" ? 0.35 : intensity === "medium" ? 0.65 : 0.95;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block pointer-events-none z-0"
      style={{ opacity: opacityVal }}
    />
  );
}

// ==========================================
// 8. LIQUID GLASS BLOBS BACKGROUND (METABALLS)
// ==========================================
function LiquidGlassBlobs({ intensity, motion, density, theme, reducedMotion }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    let blobCount = density === "low" ? 3 : density === "medium" ? 6 : 10;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      blobCount = Math.max(2, Math.floor(blobCount * 0.5));
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(parent);
    resize();

    // Map colors
    const colors = themeColors.palette;
    
    // Scale sizes
    const baseRadius = intensity === "low" ? 40 : intensity === "medium" ? 75 : 110;
    
    // Initialize blobs
    const blobs = Array.from({ length: blobCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.95,
      vy: (Math.random() - 0.5) * 0.95,
      radius: Math.random() * 25 + baseRadius,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render solid metaballs inside high contrast layout
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];

        if (motion && !reducedMotion) {
          b.x += b.vx;
          b.y += b.vy;

          // Wall collision bounces
          if (b.x - b.radius < -10 || b.x + b.radius > width + 10) b.vx *= -1;
          if (b.y - b.radius < -10 || b.y + b.radius > height + 10) b.vy *= -1;
        }

        // Draw radial gradient bubble
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, b.color);
        grad.addColorStop(0.3, b.color.replace("0.85", "0.5").replace("1)", "0.5"));
        grad.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, motion, density, themeColors.palette, reducedMotion]);

  // CSS combination: blur + high-contrast filter maps blobs together like liquid fluid.
  // We keep this layer completely separated from overlays to preserve widget legibility.
  const opacityVal = intensity === "low" ? 0.35 : intensity === "medium" ? 0.6 : 0.85;

  return (
    <div 
      className="absolute inset-0 block pointer-events-none z-0 overflow-hidden bg-black/95"
      style={{
        filter: "blur(24px) contrast(18)",
        opacity: opacityVal
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
