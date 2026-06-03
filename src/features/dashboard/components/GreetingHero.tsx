"use client";

import React from "react";
import { useGoalsStore } from "@/lib/store";

interface GreetingHeroProps {
  onProfileClick: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 21) return "Good evening,";
  return "Working late,";
}

export function GreetingHero({ onProfileClick }: GreetingHeroProps) {
  const [greeting] = React.useState(getGreeting);
  const { user, username, goals } = useGoalsStore();

  const userName = user ? (username || user.email?.split("@")[0] || "User") : "Guest";
  const userInitial = userName.charAt(0).toUpperCase();

  const activeGoalsCount = goals.length;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / goals.length)
    : 0;

  const now = new Date();
  const day = now.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = weekdayNames[now.getDay()];
  const formattedDate = `${day} ${month} ${year} ${weekday}`;

  return (
    <div style={{
      padding: '8px 0 24px',
      animation: 'fadeUp 0.5s ease both',
    }}>
      {/* Eyebrow label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--ac)',
          boxShadow: '0 0 8px rgba(204,255,0,0.8)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--t3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {formattedDate}
        </span>
      </div>

      {/* Main greeting — LARGE */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--t2)',
            marginBottom: 4,
          }}>
            {greeting}
          </div>
          <h1 style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-1.5px',
            lineHeight: 0.95,
          }}>
            {userName}.
          </h1>
        </div>

        {/* Avatar — larger, more presence */}
        <div 
          onClick={onProfileClick}
          style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'var(--ac)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 4,
            boxShadow: '0 0 0 3px rgba(204,255,0,0.2), 0 8px 24px rgba(204,255,0,0.25)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: '#000' }}>{userInitial}</span>
        </div>
      </div>

      {/* Progress summary line */}
      <div style={{
        marginTop: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 400 }}>
          {activeGoalsCount} {activeGoalsCount === 1 ? 'goal' : 'goals'} active
        </span>
        <span style={{ fontSize: 13, color: 'var(--t3)' }}>·</span>
        <span style={{ fontSize: 13, color: 'var(--ac)', fontWeight: 600 }}>
          {overallProgress}% overall completion
        </span>
      </div>
    </div>
  );
}
