"use client";

import React from "react";

export function SectionHeader({
  title,
  onSeeAll,
  style,
}: {
  title: string;
  onSeeAll?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, ...style }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.3px" }}>{title}</h2>
      {onSeeAll && (
        <span
          role="button"
          tabIndex={0}
          onClick={onSeeAll}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSeeAll();
            }
          }}
          style={{ fontSize: 12, fontWeight: 600, color: "var(--ac)", cursor: "pointer", letterSpacing: "0.02em", outline: "none" }}
        >
          See all →
        </span>
      )}
    </div>
  );
}
