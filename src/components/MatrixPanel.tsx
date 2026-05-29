import React from "react";

interface MatrixPanelProps {
  title: string;
  value: string;
  onClick?: () => void;
  matrixMode?: boolean;
  theme?: {
    primary: string;
    secondary: string;
    rgbPrimary: string;
    rgbSecondary: string;
  };
}

const binaryText = (length: number) => {
  const chars = "01";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
};

export const MatrixPanel: React.FC<MatrixPanelProps> = ({ 
  title, 
  value, 
  onClick, 
  matrixMode = false, 
  theme 
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (matrixMode) {
    return (
      <div
        onClick={onClick}
        className={`matrix-panel p-3 rounded-lg border bg-black/60 backdrop-blur-sm text-green-400 font-mono text-sm border-green-500/20 hover:border-green-500/50 shadow-[0_0_10px_rgba(0,255,0,0.05)] transition-all ${
          onClick ? "cursor-pointer hover:scale-[1.02]" : ""
        }`}
      >
        <div className="font-bold text-green-200 mb-1">{title}</div>
        <div className="animate-pulse" style={{ animationDuration: "2s" }}>
          {value}
        </div>
        <div className="mt-2 text-xs opacity-50 font-mono">
          {mounted ? binaryText(12) : "101010101010"}
        </div>
      </div>
    );
  }

  // Standard Premium Theme Mode
  const primaryColor = theme?.primary || "#06b6d4";
  const rgbPrimary = theme?.rgbPrimary || "6, 182, 212";

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border bg-white/[0.02] border-white/50 hover:border-white/20 transition-all ${
        onClick ? "cursor-pointer hover:scale-[1.02]" : ""
      }`}
      style={{
        boxShadow: `0 4px 20px rgba(${rgbPrimary}, 0.02)`,
      }}
    >
      <div className="font-mono font-bold text-[9px] uppercase tracking-wider text-neutral-400 mb-1">{title}</div>
      <div className="font-mono font-bold text-white text-xs tracking-tight animate-pulse" style={{ animationDuration: "3s" }}>
        {value}
      </div>
      <div 
        className="mt-2 text-[8px] font-mono tracking-widest uppercase opacity-45"
        style={{ color: primaryColor }}
      >
        SYS_{title.replace(/\s+/g, "_").toUpperCase()}_OK
      </div>
    </div>
  );
};

export default MatrixPanel;
