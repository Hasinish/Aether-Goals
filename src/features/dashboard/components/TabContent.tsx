"use client";

import React from "react";

interface TabContentProps {
  id: string;
  active: string;
  children: React.ReactNode;
}

export function TabContent({ id, active, children }: TabContentProps) {
  const [visible, setVisible] = React.useState(id === active);
  const [animKey, setAnimKey] = React.useState(0);

  React.useEffect(() => {
    if (id === active) {
      setVisible(true);
      setAnimKey(k => k + 1);
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [active, id]);

  if (!visible) return null;

  return (
    <div
      key={animKey}
      style={{
        animation: id === active
          ? "fadeUp 0.35s ease both"
          : "none",
      }}
    >
      {children}
    </div>
  );
}
