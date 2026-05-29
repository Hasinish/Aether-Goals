import React from "react";

interface GlyphIconProps {
  Icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  size?: number;
  color?: string;
  className?: string;
  matrixMode?: boolean;
}

export const GlyphIcon: React.FC<GlyphIconProps> = ({ Icon, matrixMode = false, ...props }) => {
  if (matrixMode) {
    return (
      <div className="glyph-glow inline-block" style={{ filter: "drop-shadow(0 0 6px #00ff00)" }}>
        <Icon color="#00ff00" {...props} />
      </div>
    );
  }
  return <Icon {...props} />;
};

export default GlyphIcon;
