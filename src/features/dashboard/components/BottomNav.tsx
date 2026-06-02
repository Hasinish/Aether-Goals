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

  return (
    <nav style={{
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
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        if (item.isSpecial) {
          return (
            <button
              key={item.id}
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
                transition: "transform 200ms ease"
              }}
              aria-label="Add Item"
            >
              <Plus size={24} color="#000000" strokeWidth={3} />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            <div 
              key={isActive ? 'active' : 'inactive'}
              style={{
                width: "auto",
                height: 32,
                borderRadius: 20,
                padding: isActive ? "7px 14px" : "4px 8px",
                background: isActive ? "var(--ac)" : "transparent",
                boxShadow: isActive ? "0 2px 12px rgba(204,255,0,0.2)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                animation: isActive ? 'pillIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon
                  size={22}
                  color={isActive ? "#000000" : "var(--t3)"}
                  strokeWidth={isActive ? 2.5 : 2}
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
              fontWeight: 600,
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
