"use client";

import React from "react";
import { Home as HomeIcon, Target, Plus, BarChart2, Zap } from "lucide-react";

interface BottomNavProps {
  active: string;
  onSelect: (id: string) => void;
}

export function BottomNav({ active, onSelect }: BottomNavProps) {
  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "goals", label: "Goals", icon: Target },
    { id: "add", label: "Add", icon: Plus, isSpecial: true },
    { id: "habits", label: "Habits", icon: BarChart2 },
    { id: "deadlines", label: "Deadlines", icon: Zap },
  ];

  const navRef = React.useRef<HTMLDivElement>(null);
  const [orbStyle, setOrbStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
    left: "0px",
    width: "0px",
  });

  const updateOrbPosition = React.useCallback(() => {
    if (!navRef.current || active === "add") {
      setOrbStyle({ opacity: 0 });
      return;
    }

    const activeBtn = navRef.current.querySelector(`[data-tab="${active}"]`) as HTMLElement;
    if (activeBtn) {
      const parentRect = navRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      
      const leftOffset = btnRect.left - parentRect.left;
      const width = btnRect.width;

      setOrbStyle({
        opacity: 1,
        left: `${leftOffset}px`,
        width: `${width}px`,
        transition: "left 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease",
      });
    } else {
      setOrbStyle({ opacity: 0 });
    }
  }, [active]);

  React.useEffect(() => {
    updateOrbPosition();
    
    const t = setTimeout(updateOrbPosition, 60);

    window.addEventListener("resize", updateOrbPosition);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateOrbPosition);
    };
  }, [active, updateOrbPosition]);

  return (
    <nav 
      ref={navRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        margin: "0 auto",
        width: "100%",
        maxWidth: 390,
        height: "calc(80px + env(safe-area-inset-bottom))",
        background: "rgba(20,20,20,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        zIndex: 100,
        animation: "fadeUp 400ms ease both",
        animationDelay: "800ms"
      }}
    >
      {/* Shared elastic sliding top indicator line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          pointerEvents: "none",
          zIndex: 10,
          ...orbStyle,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 3,
            borderRadius: "0 0 3px 3px",
            background: "var(--ac)",
            boxShadow: "0 2px 10px rgba(204,255,0,0.55), 0 0 15px rgba(204,255,0,0.25)",
          }}
        />
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        if (item.isSpecial) {
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                paddingBottom: 10,
              }}
            >
              <button
                onClick={() => onSelect(item.id)}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "var(--ac)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "translateY(-14px)",
                  boxShadow: "0 6px 24px rgba(204,255,0,0.5), 0 2px 8px rgba(0,0,0,0.6)",
                  cursor: "pointer",
                  transition: "transform 200ms ease",
                  position: "relative",
                  zIndex: 6,
                }}
                aria-label="Add Item"
              >
                <Plus size={24} color="#000000" strokeWidth={3} />
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            data-tab={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              cursor: "pointer",
              padding: "0 12px",
              height: "100%",
              position: "relative",
              zIndex: 5,
            }}
          >
            <div 
              style={{
                width: 52,
                height: 32,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                transition: "all 300ms ease",
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon
                  size={22}
                  color={isActive ? "var(--ac)" : "var(--t3)"}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    transition: "color 280ms ease, transform 280ms ease",
                    transform: isActive ? "scale(1.05)" : "scale(1)",
                  }}
                />
                {/* Critical indicator dot */}
                {item.id === "deadlines" && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#ff4040',
                    border: '1.5px solid var(--bg)',
                    display: isActive ? 'none' : 'block',
                    animation: 'pulse 2s ease-in-out infinite',
                  }} />
                )}
              </div>
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: isActive ? "var(--ac)" : "var(--t3)",
              transition: "color 300ms ease"
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
