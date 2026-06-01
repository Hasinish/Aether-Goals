/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import { Home as HomeIcon, Target, Plus, Flame, Settings, Zap, BarChart2, Edit2, Trash2, Calendar, Award, CheckCircle, Percent, X, LogOut, Check, ChevronUp, ChevronDown, Clock, GripVertical } from "lucide-react";

import { useGoalsStore } from "@/lib/store";
import AuthScreen from "@/components/AuthScreen";
import { HabitStoreProvider, useHabitsStore } from "@/lib/habitStore";
import { DeadlineStoreProvider, useDeadlinesStore } from "@/lib/deadlineStore";
import { Goal, Habit, Deadline, Subtask, HabitLog } from "@/lib/types";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";


// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000, delay = 0): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let rafId: number | null = null;
    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        }
      };
      rafId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [target, duration, delay]);

  return value;
}

interface TimeRemaining {
  d: number;
  h: number;
  m: number;
  s: number;
  overdue: boolean;
}

function useCountdown(targetDate: Date): TimeRemaining {
  const calc = React.useCallback((): TimeRemaining => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, overdue: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      overdue: false,
    };
  }, [targetDate]);

  const [time, setTime] = React.useState<TimeRemaining>(calc);

  React.useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  return time;
}

function formatTime(t: TimeRemaining): string {
  if (t.overdue) return "OVERDUE";
  if (t.d > 0) return `${t.d}d ${String(t.h).padStart(2, "0")}h left`;
  return `${String(t.h).padStart(2, "0")}h ${String(t.m).padStart(2, "0")}m left`;
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const ToastContext = React.createContext<(msg: string, type?: Toast["type"]) => void>(() => {});

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const counter = React.useRef(0);

  const addToast = React.useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div style={{
        position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
        width: "90%", maxWidth: 350, pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === "success" ? "var(--ac)"
              : t.type === "error" ? "#ff4040" : "#1e1e1e",
            color: t.type === "success" ? "#000" : "#fff",
            padding: "12px 18px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: t.type === "success"
              ? "0 4px 20px rgba(204,255,0,0.35)"
              : "0 4px 20px rgba(0,0,0,0.4)",
            animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            border: t.type === "info" ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}>
            {t.type === "success" ? "✓ " : t.type === "error" ? "✗ " : "ℹ "}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  return React.useContext(ToastContext);
}

// ─── TAB TRANSITION ────────────────────────────────────────────────────────────

function TabContent({ id, active, children }: {
  id: string;
  active: string;
  children: React.ReactNode;
}) {
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

// ─── GREETING HELPER ───────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 21) return "Good evening,";
  return "Working late,";
}

// ─── DEADLINE PROPS MAPPER ───────────────────────────────────────────────────

function mapDeadlineProps(deadline: Deadline): Omit<DeadlineProps, "onToggle" | "onClick"> {
  const due = new Date(deadline.due_date).getTime();
  const created = deadline.created_at ? new Date(deadline.created_at).getTime() : due - 7 * 86400000;
  const total = Math.max(3600000, due - created);
  const diff = due - Date.now();
  const isCritical = diff > 0 && diff < 24 * 3600 * 1000;
  const isHigh = diff > 0 && diff >= 24 * 3600 * 1000 && diff < 3 * 24 * 3600 * 1000;
  const priority = deadline.completed ? "COMPLETED" : (isCritical ? "CRITICAL" : (isHigh ? "HIGH" : "NORMAL"));
  const sub = deadline.completed
    ? "Timeline successfully achieved"
    : (isCritical
        ? "Due today, urgent action required"
        : isHigh
          ? "Upcoming short-term milestone"
          : "Timeline checkpoint on track");
  return {
    id: deadline.id,
    title: deadline.title,
    sub,
    priority,
    due,
    total,
    completed: deadline.completed,
  };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function StatusBar() {
  return (
    <div style={{
      height: 44,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px",
      color: "var(--t1)",
      fontSize: 13,
      fontWeight: 600,
      background: "transparent",
      userSelect: "none"
    }}>
      <span>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Signal dots */}
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          {[1, 2, 3, 4].map((dot) => (
            <div key={dot} style={{ width: 4, height: 4, borderRadius: "50%", background: "#ffffff" }} />
          ))}
        </div>
        
        {/* WiFi SVG Icon */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5 L8 9.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M5.5 7.5 Q8 5.5 10.5 7.5" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M3 5.5 Q8 2 13 5.5" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>

        {/* Battery Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <div style={{
            width: 20,
            height: 10,
            border: "1px solid #ffffff",
            borderRadius: 2,
            position: "relative",
            padding: 1
          }}>
            <div style={{ width: "70%", height: "100%", background: "#ffffff", borderRadius: 1 }} />
          </div>
          <div style={{ width: 1.5, height: 4, background: "#ffffff", borderRadius: "0 1px 1px 0" }} />
        </div>
      </div>
    </div>
  );
}

interface GreetingHeroProps {
  onProfileClick: () => void;
}

function GreetingHero({ onProfileClick }: GreetingHeroProps) {
  const [greeting] = React.useState(getGreeting);
  const { user, goals } = useGoalsStore();

  const userName = user && user !== "guest" ? (user.email?.split("@")[0] || "User") : "Guest";
  const userInitial = userName.charAt(0).toUpperCase();

  const activeGoalsCount = goals.length;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / goals.length)
    : 0;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    year: "numeric"
  });

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
            fontSize: 42,          // LARGE — this is the typographic moment
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

const bentoCardBaseStyle: React.CSSProperties = {
  borderRadius: 22,
  background: 'var(--card)',
  border: '1px solid var(--b1)',
  padding: 18,
  minHeight: 130,
  position: 'relative',
  overflow: 'hidden',
};

interface BentoHeroCardProps {
  onDrawer: (d: { type: string; data: any }) => void;
}

interface BentoHeroCardProps {
  onDrawer: (d: { type: string; data: any }) => void;
  onNav: (tab: string) => void;
}

function BentoHeroCard({ onDrawer, onNav }: BentoHeroCardProps) {
  const { goals } = useGoalsStore();
  const goal = goals[0];

  const title = goal ? goal.title : "INITIALIZE FIRST MILESTONE";
  const progressPercent = goal ? (goal.progressPercent || 0) : 0;
  const completedTasks = goal ? (goal.subtasks?.filter(s => s.is_complete).length || 0) : 0;
  const totalTasks = goal ? (goal.subtasks?.length || 0) : 0;
  const tags = goal ? goal.tags : ["BEGIN", "AETHER"];
  const deltaText = goal && goal.deltaPercent !== undefined 
    ? `↑ ${goal.deltaPercent >= 0 ? '+' : ''}${goal.deltaPercent}% this week` 
    : "↑ +100% start";
  const firstTag = tags[0] ? `#${tags[0].toUpperCase()}` : "#GOAL";

  const progress = useCountUp(progressPercent, 1000, 200);
  const [barWidth, setBarWidth] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setBarWidth(progressPercent), 500);
    return () => clearTimeout(t);
  }, [progressPercent]);

  const handleCardClick = () => {
    if (goal) {
      onDrawer({ type: 'goal', data: goal });
    } else {
      onNav('add');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      style={{
        background: 'var(--ac)',    // FULL accent fill
        borderRadius: 28,
        padding: '22px 22px 20px',
        minHeight: 240,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        animation: 'scaleIn 0.55s 0.12s ease both',
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
      }}
    >

      {/* ── Glass top edge highlight ── */}
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 1,
        background: 'rgba(255,255,255,0.5)', pointerEvents: 'none',
      }} />

      {/* ── Dot grid — radial fade top-right ── */}
      <svg
        style={{ position: 'absolute', top: 14, right: 14, pointerEvents: 'none' }}
        width="88" height="72" viewBox="0 0 88 72"
      >
        {Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const normX = col / 7;
            const normY = row / 6;
            const dist = Math.sqrt(normX * normX + normY * normY) / Math.SQRT2;
            const opacity = Math.max(0, 0.55 - dist * 0.9);
            return (
              <circle
                key={`${row}-${col}`}
                cx={col * 12 + 6} cy={row * 10 + 5} r={2.2}
                fill="#000" opacity={opacity}
              />
            );
          })
        )}
      </svg>

      {/* ── Decorative ring bottom-right ── */}
      <div style={{
        position: 'absolute', bottom: -50, right: -50,
        width: 160, height: 160, borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.1)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -25, right: -25,
        width: 110, height: 110, borderRadius: '50%',
        background: 'rgba(0,0,0,0.07)', pointerEvents: 'none',
      }} />

      {/* ── Wave lines bottom-left ── */}
      <svg
        style={{ position: 'absolute', bottom: 14, left: 18, opacity: 0.12, pointerEvents: 'none' }}
        width="90" height="32" viewBox="0 0 90 32"
      >
        {[8, 16, 24].map((y, i) => (
          <path key={i}
            d={`M0 ${y} Q11 ${y - 8} 22 ${y} Q33 ${y + 8} 44 ${y} Q55 ${y - 8} 66 ${y} Q77 ${y + 8} 88 ${y}`}
            fill="none" stroke="#000" strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* ── TOP ROW: tag + settings ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <span style={{
          background: 'rgba(0,0,0,0.18)', color: '#000',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          padding: '5px 12px', borderRadius: 20,
        }}>
          {firstTag}
        </span>
        <button style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(0,0,0,0.15)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          {/* 3-dot menu */}
          <div style={{ display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.6)' }} />
            ))}
          </div>
        </button>
      </div>

      {/* ── BOTTOM: number + meta + bar ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Goal title */}
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.55)',
          letterSpacing: '0.03em', marginBottom: 6, textTransform: 'uppercase',
        }}>
          {title}
        </div>

        {/* BIG percentage */}
        <div style={{
          fontSize: 72,        // THE signature moment
          fontWeight: 900,
          color: '#000',
          letterSpacing: '-3px',
          lineHeight: 0.88,
          marginBottom: 8,
        }}>
          {progress}%
        </div>

        {/* Sub-label */}
        <div style={{
          fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: 600, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{completedTasks} of {totalTasks} subtasks</span>
          <span style={{ color: 'rgba(0,0,0,0.3)' }}>·</span>
          <span style={{ color: '#000', fontWeight: 800 }}>{deltaText}</span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 7, background: 'rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: 'rgba(0,0,0,0.85)', borderRadius: 4,
            width: `${barWidth}%`,
            transition: 'width 1s 0.5s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>

        {/* Bottom tags row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14,
        }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                background: 'rgba(0,0,0,0.15)', color: '#000',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                padding: '4px 10px', borderRadius: 20,
              }}>{tag}</span>
            ))}
          </div>
          <span style={{
            background: 'rgba(0,0,0,0.2)', color: '#000',
            fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
          }}>{completedTasks}/{totalTasks}</span>
        </div>
      </div>
    </div>
  );
}

interface BentoStreakProps {
  onNav: (id: string) => void;
  habit: Habit | null;
}

function BentoStreak({ onNav, habit }: BentoStreakProps) {
  const streakVal = habit ? (habit.streak || 0) : 0;
  const habitName = habit ? habit.title : "No Habits Tracked";
  const streak = useCountUp(streakVal, 800, 220);
  const toast = useToast();
  return (
    <div 
      onClick={() => { onNav('habits'); toast('Viewing habit streaks'); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140, // Polish height
        animation: 'fadeUp 0.4s 0.22s ease both', 
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      {/* Radial glow behind the number */}
      <div style={{
        position: 'absolute',
        bottom: 20, left: 10,
        width: 80, height: 60,
        background: 'radial-gradient(ellipse, rgba(204,255,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(12px)',
      }} />

      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(204,255,0,0.1)',
        border: '1px solid rgba(204,255,0,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        position: 'relative', zIndex: 1,
      }}>
        <Flame size={20} color="var(--ac)" fill="rgba(204,255,0,0.35)" />
      </div>
      <div style={{
        fontSize: 48, fontWeight: 900, color: '#fff',
        lineHeight: 0.9, letterSpacing: '-1px', marginBottom: 6,
        position: 'relative', zIndex: 1,
      }}>{streak}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', position: 'relative', zIndex: 1 }}>day streak</div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, position: 'relative', zIndex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{habitName}</div>
    </div>
  );
}

interface BentoDeadlineProps {
  onDrawer: (d: { type: string; data: any }) => void;
  onNav: (id: string) => void;
  deadline: Deadline | null;
}

function BentoDeadline({ onDrawer, onNav, deadline }: BentoDeadlineProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const time = useCountdown(React.useMemo(() => {
    return deadline ? new Date(deadline.due_date) : new Date();
  }, [deadline]));

  const display = mounted 
    ? (deadline ? formatTime(time) : "No Deadlines") 
    : "--h --m left";

  const diff = deadline ? new Date(deadline.due_date).getTime() - Date.now() : 0;
  const isCritical = diff > 0 && diff < 24 * 3600 * 1000;
  const isHigh = diff > 0 && diff >= 24 * 3600 * 1000 && diff < 3 * 24 * 3600 * 1000;
  const priorityLabel = deadline ? (deadline.completed ? "COMPLETED" : (isCritical ? "CRITICAL" : (isHigh ? "HIGH" : "NORMAL"))) : "ALL CLEAR";

  const handleCardClick = () => {
    if (deadline) {
      onDrawer({ type: 'deadline', data: deadline });
    } else {
      onNav('deadlines');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        minHeight: 140, // Polish height
        animation: 'fadeUp 0.4s 0.29s ease both', 
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: deadline && deadline.completed ? 'rgba(74,222,128,0.1)' : 'rgba(255,64,64,0.1)',
          border: deadline && deadline.completed ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,64,64,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={20} color={deadline && deadline.completed ? 'var(--ok)' : '#ff4040'} fill={deadline && deadline.completed ? 'rgba(74,222,128,0.3)' : 'rgba(255,64,64,0.3)'} />
        </div>
        {/* Pulsing dot */}
        {deadline && !deadline.completed && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%', 
            background: isCritical ? '#ff4040' : (isHigh ? 'var(--warn)' : 'var(--ok)'),
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        )}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 900, 
        color: deadline && deadline.completed ? 'var(--ok)' : (isCritical ? '#ff4040' : (isHigh ? 'var(--warn)' : '#fff')),
        lineHeight: 0.9, letterSpacing: '-0.5px', marginBottom: 6,
      }}>{display}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {deadline ? deadline.title : "All Clear"}
      </div>
      <div style={{
        display: 'inline-block', marginTop: 6,
        background: deadline && deadline.completed ? 'rgba(74,222,128,0.12)' : (isCritical ? 'rgba(255,64,64,0.12)' : 'var(--ac-soft)'), 
        color: deadline && deadline.completed ? 'var(--ok)' : (isCritical ? '#ff4040' : 'var(--ac)'),
        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
        padding: '3px 8px', borderRadius: 20,
      }}>{priorityLabel}</div>
    </div>
  );
}

interface BentoCompletionProps {
  onNav: (id: string) => void;
  progress: number;
}

function BentoCompletion({ onNav, progress: progressPercent }: BentoCompletionProps) {
  const rate = useCountUp(progressPercent, 900, 240);
  const toast = useToast();
  const [ring, setRing] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setRing(progressPercent), 400);
    return () => clearTimeout(t);
  }, [progressPercent]);

  // SVG ring
  const size = 56, stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (ring / 100) * circ;
  const c = size / 2;

  return (
    <div 
      onClick={() => { onNav('goals'); toast('Viewing all goals', 'info'); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        animation: 'fadeUp 0.4s 0.36s ease both', 
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--ac)" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <div style={{
          fontSize: 36, fontWeight: 900, color: 'var(--ac)',
          lineHeight: 0.9, letterSpacing: '-0.5px', textAlign: 'right',
        }}>{rate}%</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Completion</div>
      <div style={{ fontSize: 10, color: 'var(--ok)', fontWeight: 700, marginTop: 4 }}>↑ Trending up</div>
    </div>
  );
}

interface BentoHabitsTodayProps {
  onNav: (id: string) => void;
  completed: number;
  total: number;
}

function BentoHabitsToday({ onNav, completed, total }: BentoHabitsTodayProps) {
  const toast = useToast();
  const [filled, setFilled] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setFilled(completed), 450);
    return () => clearTimeout(t);
  }, [completed]);

  const activeSlots = Math.max(3, total);

  return (
    <div 
      onClick={() => { onNav('habits'); toast('Viewing daily habits', 'info'); }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
      style={{ 
        ...bentoCardBaseStyle, 
        animation: 'fadeUp 0.4s 0.43s ease both', 
        cursor: 'pointer',
        transition: 'transform 200ms ease, border-color 200ms ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
        <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 0.9 }}>{completed}</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--t3)', lineHeight: 1 }}>/{total}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 14 }}>
        Habits Today
      </div>
      {/* Thick segmented bar */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: activeSlots }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 10, borderRadius: 3,
            background: i < completed ? 'var(--ac)' : 'var(--card-3)',
            boxShadow: i < completed ? '0 0 10px rgba(204,255,0,0.4)' : 'none',
            transition: `background 0.5s ${i * 0.15}s ease, box-shadow 0.5s ${i * 0.15}s ease`,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>Today</div>
    </div>
  );
}

interface BentoGridProps {
  onNav: (id: string) => void;
  onDrawer: (d: { type: string; data: any }) => void;
  streakHabit: Habit | null;
  closestDeadline: Deadline | null;
  overallProgress: number;
  completedHabits: number;
  totalHabits: number;
}

function BentoGrid({ onNav, onDrawer, streakHabit, closestDeadline, overallProgress, completedHabits, totalHabits }: BentoGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
      <BentoStreak onNav={onNav} habit={streakHabit} />
      <BentoDeadline onDrawer={onDrawer} onNav={onNav} deadline={closestDeadline} />
      <BentoCompletion onNav={onNav} progress={overallProgress} />
      <BentoHabitsToday onNav={onNav} completed={completedHabits} total={totalHabits} />
    </div>
  );
}

function SectionHeader({
  title,
  onSeeAll,
  style,
}: {
  title: string;
  onSeeAll?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16, ...style }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', letterSpacing:'-0.3px' }}>{title}</h2>
      {onSeeAll && (
        <span
          onClick={onSeeAll}
          style={{ fontSize:12, fontWeight:600, color:'var(--ac)', cursor:'pointer', letterSpacing:'0.02em' }}
        >
          See all →
        </span>
      )}
    </div>
  );
}

interface GoalCardProps {
  title: string;
  progress: number;
  tags: string[];
  delta: string;
  done: number;
  total: number;
  animDelay: number;
  onClick?: () => void;
}

function GoalCard({ title, progress, tags, delta, done, total, animDelay, onClick }: GoalCardProps) {
  const [width, setWidth] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setWidth(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  const stripColor = progress > 60 ? 'var(--ac)' : progress >= 30 ? 'var(--warn)' : 'var(--t3)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card)',
        borderRadius: 20,
        border: `1px solid ${hovered ? 'var(--b2)' : 'var(--b1)'}`,
        padding: '18px 18px 18px 22px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 10,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), border-color 200ms ease',
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${animDelay}ms`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Left accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: stripColor, borderRadius: '20px 0 0 20px',
        transform: 'scaleY(0)',
        transformOrigin: 'top',
        animation: `stripGrow 0.4s ${animDelay + 200}ms cubic-bezier(0.16,1,0.3,1) both`,
      }} />

      {/* Glass top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 22, right: 18, height: 1,
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700, color: 'var(--t1)',
          letterSpacing: '0.03em', lineHeight: 1.3,
          flex: 1, paddingRight: 10,
        }}>{title}</h3>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--ac)',
          background: 'var(--ac-soft)', padding: '4px 10px',
          borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
        }}>↑ {delta}</span>
      </div>

      {/* Progress row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          flex: 1, height: 5, background: 'var(--card-3)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: 'var(--ac)', borderRadius: 3,
            width: `${width}%`,
            transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <span style={{
          fontSize: 16, fontWeight: 900, color: 'var(--t1)',
          minWidth: 42, textAlign: 'right', letterSpacing: '-0.3px',
        }}>{progress}%</span>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
              border: '1px solid var(--b1)', background: 'var(--card-3)',
              color: 'var(--t3)', borderRadius: 20, padding: '3px 8px',
            }}>{tag}</span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>
          {done}/{total} tasks
        </span>
      </div>
    </div>
  );
}

interface HabitCardProps {
  name: string;
  target: number;
  done: number;
  streak: number;
  rate: number;
  animDelay: number;
  onClick?: () => void;
  onCheckIn?: () => void;
}

function HabitCard({ name, target, done, streak, rate, animDelay, onClick, onCheckIn }: HabitCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const [ringProg, setRingProg] = React.useState(0);
  const isComplete = done >= target;

  React.useEffect(() => {
    const t = setTimeout(() => setRingProg(rate), 300);
    return () => clearTimeout(t);
  }, [rate]);

  const size = 54, stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (ringProg / 100) * circ;
  const c = size / 2;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isComplete ? 'rgba(204,255,0,0.06)' : 'var(--card)',
        borderRadius: 20,
        border: `1px solid ${
          isComplete ? 'rgba(204,255,0,0.18)' 
          : hovered ? 'var(--b2)' 
          : 'var(--b1)'
        }`,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 10,
        transition: 'all 220ms ease',
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${animDelay}ms`,
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Glass top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 18, height: 1,
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      {/* Circle ring — inline SVG */}
      <div 
        onClick={(e) => { e.stopPropagation(); onCheckIn?.(); }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        style={{ 
          position: 'relative', width: size, height: size, flexShrink: 0, cursor: 'pointer',
          transition: 'transform 100ms ease',
        }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle cx={c} cy={c} r={r} fill="none"
            stroke={rate > 0 ? 'var(--ac)' : 'rgba(255,255,255,0.06)'}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        {/* Center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{done}</span>
          <span style={{ fontSize: 9, color: 'var(--t3)', lineHeight: 1.2 }}>/{target}</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.02em' }}>{name}</h3>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ac)' }}>{rate}%</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--t2)', display: 'block', marginBottom: 8 }}>
          {done} of {target} check-ins
        </span>
        {/* Thicker progress bar */}
        <div style={{ height: 5, background: 'var(--card-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--ac)', borderRadius: 3,
            width: `${ringProg}%`,
            transition: 'width 900ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>
            {streak} day streak
          </span>
        </div>
      </div>
    </div>
  );
}

interface DeadlineProps {
  id: string;
  title: string;
  sub: string;
  priority: string;
  due: number;
  total: number;
  completed: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

function FeaturedDeadline({ id, title, sub, priority, due, total, completed, onToggle, onClick }: DeadlineProps) {
  const [mounted, setMounted] = React.useState(false);
  const toast = useToast();
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const targetDate = React.useMemo(() => new Date(due), [due]);
  const time = useCountdown(targetDate);
  const formattedText = mounted ? (completed ? "DONE" : formatTime(time)) : "--h --m left";

  // Compute elapsed percentage
  const remainingMs = Math.max(0, due - Date.now());
  const elapsedPercent = completed ? 100 : Math.round(Math.min(100, Math.max(0, (1 - remainingMs / total) * 100)));

  return (
    <div 
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 16,
        borderLeft: completed ? "4px solid var(--ok)" : "4px solid var(--danger)",
        backgroundImage: completed 
          ? "linear-gradient(90deg, rgba(74,222,128,0.04) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(255,92,92,0.04) 0%, transparent 100%)",
        borderTop: "1px solid var(--b1)",
        borderRight: "1px solid var(--b1)",
        borderBottom: "1px solid var(--b1)",
        padding: 20,
        minHeight: 200,
        position: "relative",
        overflow: "hidden",
        marginBottom: 12,
        animation: "fadeUp 400ms ease both",
        animationDelay: "550ms",
        cursor: onClick ? 'pointer' : 'default',
        transition: "all 0.2s ease",
      }}
    >
      {/* Glass highlight first child */}
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Pulsing dot before badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!completed && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ff4040',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          )}
          <span style={{
            background: completed ? "rgba(74,222,128,0.2)" : "rgba(255, 92, 92, 0.2)",
            color: completed ? "var(--ok)" : "var(--danger)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 20
          }}>
            {priority}
          </span>
        </div>
        <span style={{
          fontSize: 28,
          fontWeight: 900,
          color: completed ? "var(--ok)" : "var(--danger)",
          animation: completed ? "none" : "pulse 1.5s ease-in-out infinite"
        }}>
          {formattedText}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--t1)" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>{sub}</p>
      </div>

      {/* Progress container */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 16 }}>
        <div style={{
          flex: 1,
          height: 6,
          background: "var(--card-3)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            background: completed ? "var(--ok)" : "var(--danger)",
            borderRadius: 3,
            width: `${elapsedPercent}%`,
            transition: "width 800ms ease"
          }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t2)" }}>
          {completed ? "100% achieved" : `${elapsedPercent}% elapsed`}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
          toast(completed ? 'Marked incomplete' : `${title} marked complete! ✓`);
        }}
        style={{
          width: "100%",
          height: 48,
          background: completed ? "var(--card-3)" : "var(--ac)",
          color: completed ? "var(--t2)" : "#000000",
          borderRadius: 14,
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        {completed ? "✓ Completed" : "Mark Complete"}
      </button>
    </div>
  );
}

interface DeadlineListItemProps extends DeadlineProps {
  index: number;
}

function DeadlineListItem({ index, title, priority, due, total, completed, onClick }: DeadlineListItemProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const targetDate = React.useMemo(() => new Date(due), [due]);
  const time = useCountdown(targetDate);
  const formattedText = mounted ? (completed ? "DONE" : formatTime(time)) : "--h --m left";

  const remainingMs = Math.max(0, due - Date.now());
  const elapsedPercent = completed ? 100 : Math.round(Math.min(100, Math.max(0, (1 - remainingMs / total) * 100)));

  return (
    <div 
      onClick={onClick}
      style={{
        background: "var(--card)",
        borderRadius: 16,
        border: completed ? "1px solid rgba(74,222,128,0.18)" : "1px solid var(--b1)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 12,
        animation: "fadeUp 400ms ease both",
        animationDelay: `${550 + (index - 1) * 80}ms`,
        cursor: onClick ? 'pointer' : 'default',
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            background: completed ? "rgba(74,222,128,0.15)" : "var(--ac-soft)",
            color: completed ? "var(--ok)" : "var(--ac)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "3px 8px",
            borderRadius: 20
          }}>
            {priority}
          </span>
          <h4 style={{ 
            fontSize: 14, 
            fontWeight: 700, 
            color: completed ? "var(--t2)" : "var(--t1)",
            textDecoration: completed ? "line-through" : "none"
          }}>{title}</h4>
        </div>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 700, 
          color: completed ? "var(--ok)" : "var(--t1)" 
        }}>
          {formattedText}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          flex: 1,
          height: 3,
          background: "var(--card-3)",
          borderRadius: 1.5,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            background: completed ? "var(--ok)" : "var(--ac)",
            borderRadius: 1.5,
            width: `${elapsedPercent}%`
          }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--t2)" }}>{completed ? "100% achieved" : `${elapsedPercent}% elapsed`}</span>
        <span style={{ fontSize: 16, color: "var(--t3)", userSelect: "none" }}>›</span>
      </div>
    </div>
  );
}

interface BottomNavProps {
  active: string;
  onSelect: (id: string) => void;
}

function BottomNav({ active, onSelect }: BottomNavProps) {
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
      height: 80,
      background: "rgba(20,20,20,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      paddingBottom: 16,
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

interface AddItemSheetProps {
  onClose: () => void;
  onCreate?: (type: 'goal' | 'habit' | 'deadline') => void;
  editItem?: { type: 'goal' | 'habit' | 'deadline'; data: any } | null;
}

function AddItemSheet({ onClose, onCreate, editItem }: AddItemSheetProps) {
  const toast = useToast();
  const { addGoal, updateGoal, deleteGoal } = useGoalsStore();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabitsStore();
  const { addDeadline, updateDeadline, deleteDeadline } = useDeadlinesStore();

  const [activeType, setActiveType] = React.useState<'goal' | 'habit' | 'deadline'>('goal');

  // Form States
  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalTags, setGoalTags] = React.useState("");
  const [goalSubtasks, setGoalSubtasks] = React.useState<{ id?: string; title: string; is_complete: boolean }[]>([{ title: "", is_complete: false }]);

  const [habitTitle, setHabitTitle] = React.useState("");
  const [habitTags, setHabitTags] = React.useState("");
  const [habitTarget, setHabitTarget] = React.useState(1);
  const [habitIcon, setHabitIcon] = React.useState("activity");

  const [deadlineTitle, setDeadlineTitle] = React.useState("");
  const [deadlineHours, setDeadlineHours] = React.useState(24);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  // Load edit item data if present
  React.useEffect(() => {
    if (editItem) {
      setActiveType(editItem.type);
      if (editItem.type === 'goal') {
        setGoalTitle(editItem.data.title);
        setGoalTags(editItem.data.tags?.join(", ") || "");
        setGoalSubtasks(editItem.data.subtasks?.map((s: any) => ({
          id: s.id,
          title: s.title,
          is_complete: s.is_complete
        })) || [{ title: "", is_complete: false }]);
      } else if (editItem.type === 'habit') {
        setHabitTitle(editItem.data.title);
        setHabitTags(editItem.data.tags?.join(", ") || "");
        setHabitTarget(editItem.data.daily_target || 1);
        setHabitIcon(editItem.data.icon || "activity");
      } else if (editItem.type === 'deadline') {
        setDeadlineTitle(editItem.data.title);
        const hoursLeft = Math.max(1, Math.round((new Date(editItem.data.due_date).getTime() - Date.now()) / 3600000));
        setDeadlineHours(hoursLeft);
      }
    } else {
      setGoalTitle("");
      setGoalTags("");
      setGoalSubtasks([{ title: "", is_complete: false }]);
      setHabitTitle("");
      setHabitTags("");
      setHabitTarget(1);
      setHabitIcon("activity");
      setDeadlineTitle("");
      setDeadlineHours(24);
    }
  }, [editItem]);

  const handleAddSubtaskInput = () => {
    setGoalSubtasks([...goalSubtasks, { title: "", is_complete: false }]);
  };

  const handleSubtaskChange = (idx: number, val: string) => {
    const next = [...goalSubtasks];
    next[idx] = { ...next[idx], title: val };
    setGoalSubtasks(next);
  };

  const handleSubtaskRemove = (idx: number) => {
    const filtered = goalSubtasks.filter((_, i) => i !== idx);
    setGoalSubtasks(filtered.length === 0 ? [{ title: "", is_complete: false }] : filtered);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (activeType === 'goal') {
        const titleTrimmed = goalTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        const parsedTags = goalTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
        const subtasksFiltered = goalSubtasks.filter(s => s.title.trim() !== "");

        if (editItem && editItem.type === 'goal') {
          const subtasksInput = subtasksFiltered.map((sub, idx) => ({
            id: sub.id,
            title: sub.title.trim(),
            is_complete: sub.is_complete,
            sort_order: idx
          }));
          await updateGoal(editItem.data.id, titleTrimmed, parsedTags, subtasksInput);
          toast("Goal updated successfully! ✓");
        } else {
          await addGoal(titleTrimmed, parsedTags, subtasksFiltered.map(s => s.title.trim()));
          toast("Goal created successfully! ✓");
        }
      } else if (activeType === 'habit') {
        const titleTrimmed = habitTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        const parsedTags = habitTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

        if (editItem && editItem.type === 'habit') {
          await updateHabit(editItem.data.id, titleTrimmed, parsedTags, habitTarget, habitIcon);
          toast("Habit updated successfully! ✓");
        } else {
          await addHabit(titleTrimmed, parsedTags, habitTarget, habitIcon);
          toast("Habit created successfully! ✓");
        }
      } else if (activeType === 'deadline') {
        const titleTrimmed = deadlineTitle.trim();
        if (!titleTrimmed) throw new Error("Title is required");
        const targetDate = new Date(Date.now() + deadlineHours * 3600000).toISOString();

        if (editItem && editItem.type === 'deadline') {
          await updateDeadline(editItem.data.id, titleTrimmed, targetDate, editItem.data.completed);
          toast("Deadline updated successfully! ✓");
        } else {
          await addDeadline(titleTrimmed, targetDate);
          toast("Deadline created successfully! ✓");
        }
      }

      if (onCreate) onCreate(activeType);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error saving item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem || isDeleting) return;
    setIsDeleting(true);

    try {
      if (editItem.type === 'goal') {
        await deleteGoal(editItem.data.id);
        toast("Goal deleted successfully ✓");
      } else if (editItem.type === 'habit') {
        await deleteHabit(editItem.data.id);
        toast("Habit deleted successfully ✓");
      } else if (editItem.type === 'deadline') {
        await deleteDeadline(editItem.data.id);
        toast("Deadline deleted successfully ✓");
      }
      onClose();
    } catch (e) {
      toast("Failed to delete item", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      animation: 'fadeUp 0.4s ease both',
      background: 'var(--card)',
      borderRadius: 24,
      border: '1px solid var(--b1)',
      padding: 24,
      marginTop: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Visual Confirm delete overlay */}
      {showConfirmDelete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 10, padding: 24, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', gap: 16,
          animation: 'fadeUp 0.3s ease both',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Delete this {activeType}?
          </h3>
          <p style={{ fontSize: 12, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.4 }}>
            Are you absolutely sure? This will permanently wipe this record from your dashboard.
          </p>
          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
            <button 
              onClick={() => setShowConfirmDelete(false)}
              style={{
                flex: 1, height: 44, borderRadius: 12, background: 'var(--card-3)', border: 'none',
                color: 'var(--t1)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                flex: 1, height: 44, borderRadius: 12, background: 'var(--danger)', border: 'none',
                color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        {editItem ? "Edit Existing" : "Create New"} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
        {activeType === 'goal' && "Establish a premium metrics-driven milestone."}
        {activeType === 'habit' && "Build daily routines and track consistent streaks."}
        {activeType === 'deadline' && "Set critical priorities and overdue guardrails."}
      </p>

      {/* Dynamic Selector Switcher — Disabled in Edit mode to prevent model type shifting */}
      {!editItem && (
        <div style={{
          display: 'flex',
          background: 'var(--bg)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 20,
          border: '1px solid var(--b1)',
        }}>
          {(['goal', 'habit', 'deadline'] as const).map((t) => {
            const isActive = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  background: isActive ? 'var(--ac)' : 'transparent',
                  color: isActive ? '#000000' : 'var(--t2)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 2px 10px rgba(204,255,0,0.2)' : 'none',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      {/* Form Input fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {activeType === 'goal' && (
          <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Goal Title
              </label>
              <input 
                type="text" 
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                placeholder="e.g. Advanced Graphics Pipeline" 
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Tags (Comma-separated)
              </label>
              <input 
                type="text" 
                value={goalTags}
                onChange={e => setGoalTags(e.target.value)}
                placeholder="e.g. WEBGL, SHADERS" 
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Premium Interactive Checklist Builder */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Subtasks Checklist
                </label>
                <button
                  type="button"
                  onClick={handleAddSubtaskInput}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--ac)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Plus size={12} /> Add Task
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {goalSubtasks.map((task, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={task.title}
                      onChange={e => handleSubtaskChange(idx, e.target.value)}
                      placeholder={`Subtask deliverable #${idx + 1}`}
                      style={{
                        flex: 1, height: 40, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--b1)',
                        padding: '0 12px', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSubtaskRemove(idx)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,92,92,0.1)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--danger)', cursor: 'pointer', flexShrink: 0
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeType === 'habit' && (
          <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Habit Name
              </label>
              <input 
                type="text" 
                value={habitTitle}
                onChange={e => setHabitTitle(e.target.value)}
                placeholder="e.g. DEEP WORK SESSIONS" 
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Habit Category Tag
              </label>
              <input 
                type="text" 
                value={habitTags}
                onChange={e => setHabitTags(e.target.value)}
                placeholder="e.g. WORK, HEALTH" 
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Daily Target Check-ins
                </label>
                <input 
                  type="number" 
                  value={habitTarget}
                  onChange={e => setHabitTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                    padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Icon Glyph
                </label>
                <select
                  value={habitIcon}
                  onChange={e => setHabitIcon(e.target.value)}
                  style={{
                    width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                    padding: '0 10px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="activity" style={{ background: '#1e1e1e', color: '#fff' }}>Activity ●</option>
                  <option value="flame" style={{ background: '#1e1e1e', color: '#fff' }}>Flame 🔥</option>
                  <option value="zap" style={{ background: '#1e1e1e', color: '#fff' }}>Power ⚡</option>
                  <option value="target" style={{ background: '#1e1e1e', color: '#fff' }}>Target 🎯</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeType === 'deadline' && (
          <>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Deadline Title
              </label>
              <input 
                type="text" 
                value={deadlineTitle}
                onChange={e => setDeadlineTitle(e.target.value)}
                placeholder="e.g. CV Submission" 
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Hours Left Until Due
              </label>
              <input 
                type="number" 
                value={deadlineHours}
                onChange={e => setDeadlineHours(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '100%', height: 46, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--b1)',
                  padding: '0 14px', color: '#fff', fontSize: 13, fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {editItem ? (
          <button 
            onClick={() => setShowConfirmDelete(true)}
            style={{
              flex: 1, height: 46, borderRadius: 12, background: 'rgba(255,92,92,0.1)', border: '1px solid var(--danger)',
              color: 'var(--danger)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Delete
          </button>
        ) : (
          <button 
            onClick={onClose}
            style={{
              flex: 1, height: 46, borderRadius: 12, background: 'var(--card-3)', border: 'none',
              color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            flex: 2, height: 46, borderRadius: 12, background: 'var(--ac)', border: 'none',
            color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(204,255,0,0.3)',
          }}
        >
          {isSubmitting ? "Saving..." : (editItem ? "Update" : "Create")} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
        </button>
      </div>
    </div>
  );
}

function SettingsSheet({ onNav }: { onNav: (id: string) => void }) {
  const toast = useToast();
  const [syncEnabled, setSyncEnabled] = React.useState(true);

  const settingsItems = [
    {
      title: "Edit Profile",
      subtitle: "Name, avatar, bio & email",
      action: "Manage",
      onClick: () => toast('Profile editor coming soon!', 'info'),
    },
    {
      title: "Dashboard Colors",
      subtitle: "Current: Cyber Lime #ccff00",
      action: "Lime ●",
      onClick: () => toast('Color themes coming soon!', 'info'),
    },
    {
      title: "App Syncing",
      subtitle: syncEnabled ? "Saving to localStorage" : "Sync disabled",
      action: syncEnabled ? "ON" : "OFF",
      actionColor: syncEnabled ? 'var(--ac)' : 'var(--t3)',
      onClick: () => {
        const next = !syncEnabled;
        setSyncEnabled(next);
        toast(next ? 'Sync enabled' : 'Sync disabled', next ? 'success' : 'error');
      },
    },
    {
      title: "Back to Home",
      subtitle: "Return to dashboard",
      action: "Go →",
      onClick: () => onNav('home'),
    },
  ];

  return (
    <div style={{
      animation: 'fadeUp 0.4s ease both',
      background: 'var(--card)',
      borderRadius: 24,
      border: '1px solid var(--b1)',
      padding: 24,
      marginTop: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 1,
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />

      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        Settings
      </h2>
      <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
        Configure your dashboard & preferences.
      </p>

      {/* Settings list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {settingsItems.map((item, idx) => (
          <div 
            key={idx}
            onClick={item.onClick}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              background: 'var(--bg)',
              borderRadius: 16,
              border: '1px solid var(--b1)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--b2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--b1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{item.subtitle}</div>
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: (item as any).actionColor || 'var(--ac)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--b1)',
              padding: '4px 10px',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {item.action}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DetailDrawerProps {
  activeDrawer: { type: string; data: any } | null;
  onClose: () => void;
  onEditTap?: (type: 'goal' | 'habit' | 'deadline', data: any) => void;
}

function DetailDrawer({ activeDrawer, onClose, onEditTap }: DetailDrawerProps) {
  const [shouldRender, setShouldRender] = React.useState(false);
  const [animate, setAnimate] = React.useState(false);

  const toast = useToast();
  const { goals, toggleSubtask } = useGoalsStore();
  const { habits, logCompletion } = useHabitsStore();
  const { deadlines, toggleDeadlineCompletion } = useDeadlinesStore();

  const sheetRef = React.useRef<HTMLDivElement | null>(null);

  useBottomSheetDrag({
    sheetRef,
    onClose,
  });

  React.useEffect(() => {
    if (activeDrawer) {
      setShouldRender(true);
      const t = setTimeout(() => setAnimate(true), 20);
      return () => clearTimeout(t);
    } else {
      setAnimate(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [activeDrawer]);

  const { type, data } = activeDrawer || { type: '', data: {} as any };

  // Reactively retrieve the active item from the store to update in real-time
  const activeGoal = type === 'goal' ? goals.find(g => g.id === data.id) : null;
  const activeHabit = type === 'habit' ? habits.find(h => h.id === data.id) : null;
  const activeDeadline = type === 'deadline' ? deadlines.find(d => d.id === data.id) : null;

  const currentData = activeGoal || activeHabit || activeDeadline || data || {};

  // Calculation variables for goal checklist
  const subtasks = currentData.subtasks || [];
  const completedTasksCount = subtasks.filter((s: any) => s.is_complete).length;
  const totalTasksCount = subtasks.length;
  const goalProgress = Math.round((totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0) * 100);

  // Calculation variables for habit logs
  const habitTarget = currentData.daily_target || 1;
  const habitDone = currentData.completionsToday || 0;
  const habitCheckedIn = habitDone >= habitTarget;
  const habitProgress = Math.round((habitDone / habitTarget) * 100);

  // Radial ring properties for habit
  const size = 68, stroke = 6;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, habitProgress) / 100) * circ;
  const c = size / 2;

  // Helper date
  const todayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Build monthly logs and calendar days dynamically
  const { calendarDays, stats } = React.useMemo(() => {
    const logMap = new Map<string, number>();
    (currentData.logs || []).forEach((l: any) => logMap.set(l.log_date, l.completions));

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map Sun-based getDay() to Mon-based (0 = Mon, ..., 6 = Sun)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: {
      dateStr: string;
      dayNumber: number;
      state: "complete" | "partial" | "empty" | "future";
      completions: number;
    }[] = [];

    // Empty spaces before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        dateStr: "",
        dayNumber: 0,
        state: "future",
        completions: 0,
      });
    }

    const todayStr = todayString();
    let perfectDays = 0;
    let partialDays = 0;
    let trackableDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const completions = logMap.get(dateStr) ?? 0;
      const isFuture = current > now;

      let state: "complete" | "partial" | "empty" | "future";
      if (isFuture) {
        state = "future";
      } else {
        trackableDays++;
        if (completions >= habitTarget) {
          state = "complete";
          perfectDays++;
        } else if (completions > 0) {
          state = "partial";
          partialDays++;
        } else {
          state = "empty";
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        state,
        completions,
      });
    }

    const completionRate = trackableDays > 0 ? Math.round((perfectDays / trackableDays) * 100) : 0;

    return {
      calendarDays: days,
      stats: {
        totalCompleted: perfectDays,
        completionRate,
        partialDays,
        perfectDays,
      },
    };
  }, [currentData, habitTarget]);

  // Dynamic urgency / countdown calculation for deadline
  const time = useCountdown(React.useMemo(() => {
    return currentData.due_date ? new Date(currentData.due_date) : new Date();
  }, [currentData.due_date]));

  if (!shouldRender || !activeDrawer) return null;

  return (
    <>
      {/* Drawer Backdrop Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 999,
          opacity: animate ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      />

      {/* Drawer Sheet Container */}
      <div 
        ref={sheetRef}
        className={`drawer-sheet ${animate ? 'open' : ''}`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "100%",
          maxWidth: 390,
          background: "var(--card)",
          borderTop: "1px solid var(--b2)",
          borderRadius: "28px 28px 0 0",
          padding: "16px 24px 34px",
          zIndex: 1000,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Glass top highlight */}
        <div style={{
          position: 'absolute', top: 0, left: 20, right: 20, height: 1,
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        {/* Grab Handle */}
        <div 
          onClick={onClose}
          style={{
            width: 36, height: 5, borderRadius: 2.5,
            background: "var(--card-3)", margin: "0 auto 24px",
            cursor: "pointer",
          }} 
        />

        {/* 1. GOAL DETAILED LAYOUT */}
        {type === "goal" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: 'var(--ac-soft)', color: 'var(--ac)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
              }}>
                Goal Details
              </span>
              <button
                onClick={() => onEditTap?.('goal', currentData)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
                title="Edit Goal"
              >
                <Edit2 size={15} />
              </button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 12, marginBottom: 6, letterSpacing: '-0.3px' }}>
              {currentData.title}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 20 }}>
              Track dynamic execution deliverables and task status.
            </p>

            {/* Progress Segment */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
              <div style={{ flex: 1, height: 6, background: 'var(--card-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: 'var(--ac)', borderRadius: 3,
                  width: `${goalProgress}%`,
                  transition: 'width 300ms ease',
                }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', minWidth: 42, textAlign: 'right' }}>
                {goalProgress}%
              </span>
            </div>

            {/* Checklist */}
            <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Tasks deliverables checklist ({completedTasksCount} of {totalTasksCount})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, maxHeight: 180, overflowY: 'auto' }}>
              {subtasks.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-2">No subtasks defined. Tap Edit to add checkpoint tasks.</p>
              ) : (
                subtasks.map((task: any, idx: number) => {
                  return (
                    <div 
                      key={task.id}
                      onClick={() => {
                        toggleSubtask(task.id);
                        toast(task.is_complete ? "Task marked incomplete" : "Task completed! 💪");
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', background: 'var(--bg)', borderRadius: 12,
                        border: '1px solid var(--b1)', cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: task.is_complete ? 'none' : '1px solid var(--t3)',
                        background: task.is_complete ? 'var(--ac)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {task.is_complete && <span style={{ color: '#000', fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        color: task.is_complete ? 'var(--t2)' : 'var(--t1)',
                        textDecoration: task.is_complete ? 'line-through' : 'none',
                        transition: 'color 0.2s',
                      }}>{task.title}</span>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={onClose}
              style={{
                width: '100%', height: 46, borderRadius: 12, background: 'var(--ac)', border: 'none',
                color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(204,255,0,0.3)',
              }}
            >
              Save Deliverables
            </button>
          </div>
        )}

        {/* 2. HABIT DETAILED LAYOUT */}
        {type === "habit" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: 'var(--ac-soft)', color: 'var(--ac)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
              }}>
                Habit Tracker
              </span>
              <button
                onClick={() => onEditTap?.('habit', currentData)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
                title="Edit Habit"
              >
                <Edit2 size={15} />
              </button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 12, marginBottom: 6, letterSpacing: '-0.3px' }}>
              {currentData.title}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 20 }}>
              Maintain streaks and check in daily to build routine memory.
            </p>

            {/* Circular Ring and Stats */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '16px 20px', background: 'var(--bg)', borderRadius: 20,
              border: '1px solid var(--b1)', marginBottom: 22,
            }}>
              <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                  <circle cx={c} cy={c} r={r} fill="none"
                    stroke={habitProgress > 0 ? 'var(--ac)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 400ms ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{habitDone}</span>
                  <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: -2 }}>/{habitTarget}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ac)' }}>
                  {habitProgress}% Rate
                </div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                  Streak: 🔥 {currentData.streak || 0} days active
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  Check-ins: {habitDone} out of target {habitTarget}
                </div>
              </div>
            </div>

            {/* Premium Monthly Analytics Calendar Grid */}
            <div style={{
              border: "1px solid var(--b1)", background: "var(--bg)", 
              padding: 14, borderRadius: 16, marginBottom: 22
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--t2)", marginBottom: 12 }}>
                <Calendar size={14} color="var(--ac)" />
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace', fontWeight: 600 }}>
                  {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>

              <div style={{ 
                display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center",
                fontSize: 9, fontFamily: 'monospace', color: 'var(--t3)', fontWeight: 'bold',
                borderBottom: '1px solid var(--b1)', paddingBottom: 6, marginBottom: 8
              }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(lbl => (
                  <div key={lbl}>{lbl}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {calendarDays.map((day, idx) => {
                  if (day.dayNumber === 0) {
                    return <div key={`empty-${idx}`} />;
                  }

                  const isDayComplete = day.state === "complete";
                  const isDayPartial = day.state === "partial";
                  const isDayFuture = day.state === "future";

                  let bg = "rgba(255,255,255,0.02)";
                  let border = "1px solid rgba(255,255,255,0.08)";
                  let color = "var(--t2)";

                  if (isDayComplete) {
                    bg = "var(--ac)";
                    border = "1px solid transparent";
                    color = "#000";
                  } else if (isDayPartial) {
                    bg = "rgba(204,255,0,0.15)";
                    border = "1px solid rgba(204,255,0,0.3)";
                    color = "var(--ac)";
                  } else if (isDayFuture) {
                    bg = "transparent";
                    border = "1px solid transparent";
                    color = "var(--t3)";
                  }

                  return (
                    <div
                      key={day.dateStr}
                      style={{
                        aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", border, background: bg, color,
                        fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', transition: 'all 0.3s'
                      }}
                      title={`${day.completions}/${habitTarget} completions`}
                    >
                      {day.dayNumber}
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => {
                logCompletion(currentData.id);
                toast(habitCheckedIn ? 'Check-in removed' : 'Habit logged successfully! 🔥');
              }}
              style={{
                width: '100%', height: 46, borderRadius: 12,
                background: habitCheckedIn ? 'var(--card-3)' : 'var(--ac)',
                color: habitCheckedIn ? 'var(--t1)' : '#000',
                border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: habitCheckedIn ? 'none' : '0 4px 14px rgba(204,255,0,0.3)',
              }}
            >
              {habitCheckedIn ? "✓ Already Checked In (Undo)" : "Complete Daily Check-in"}
            </button>
          </div>
        )}

        {/* 3. DEADLINE DETAILED LAYOUT */}
        {type === "deadline" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(255,64,64,0.12)', color: '#ff4040',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
              }}>
                Urgent Deadline
              </span>
              <button
                onClick={() => onEditTap?.('deadline', currentData)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--t2)', cursor: 'pointer',
                  padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t2)'}
                title="Edit Deadline"
              >
                <Edit2 size={15} />
              </button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 12, marginBottom: 6, letterSpacing: '-0.3px' }}>
              {currentData.title}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 20 }}>
              Critical deliverables due in real-time. Complete immediately.
            </p>

            {/* Progress countdown section */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', background: 'var(--bg)', borderRadius: 16,
              border: '1px solid var(--b1)', marginBottom: 20,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Target Countdown
                </div>
                <div style={{ 
                  fontSize: 26, fontWeight: 900, 
                  color: currentData.completed ? 'var(--ok)' : '#ff4040', 
                  marginTop: 4, letterSpacing: '-0.5px' 
                }}>
                  {currentData.completed ? "COMPLETED" : formatTime(time)}
                </div>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: currentData.completed ? 'rgba(74,222,128,0.1)' : 'rgba(255,64,64,0.1)',
                border: currentData.completed ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,64,64,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color={currentData.completed ? 'var(--ok)' : '#ff4040'} fill={currentData.completed ? 'rgba(74,222,128,0.3)' : 'rgba(255,64,64,0.3)'} />
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.4, marginBottom: 26 }}>
              {currentData.completed ? "This deadline has been completed successfully! ✓" : "This represents an outstanding high-priority deliverable timeline checkpoint."}
            </p>

            <button 
              onClick={() => {
                toggleDeadlineCompletion(currentData.id);
                toast(currentData.completed ? 'Marked incomplete' : 'Deadline complete! ✓');
              }}
              style={{
                width: '100%', height: 46, borderRadius: 12, 
                background: currentData.completed ? 'var(--card-3)' : 'var(--danger)', 
                color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                border: 'none', boxShadow: currentData.completed ? 'none' : '0 4px 14px rgba(255,92,92,0.3)',
              }}
            >
              {currentData.completed ? "Undo Completion" : "Mark Complete"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useGoalsStore();

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ToastProvider>
      <HabitStoreProvider user={user}>
        <DeadlineStoreProvider user={user}>
          <DashboardContent />
        </DeadlineStoreProvider>
      </HabitStoreProvider>
    </ToastProvider>
  );
}

function DashboardContent() {
  const [activeNav, setActiveNav] = React.useState("home");
  const [activeDrawer, setActiveDrawer] = React.useState<{ type: string; data: any } | null>(null);
  const toast = useToast();

  const { goals, loading: goalsLoading, addGoal, updateGoal, deleteGoal, toggleSubtask, reorderGoals, logout } = useGoalsStore();
  const { habits, loading: habitsLoading, addHabit, updateHabit, deleteHabit, logCompletion } = useHabitsStore();
  const { deadlines, loading: deadlinesLoading, addDeadline, updateDeadline, deleteDeadline, toggleDeadlineCompletion } = useDeadlinesStore();

  const [editingItem, setEditingItem] = React.useState<{ type: 'goal' | 'habit' | 'deadline'; data: any } | null>(null);

  // ─── DYNAMIC METRICS FOR BENTO & HOME CURATION ──────────────────────────────
  const activeGoalsCount = goals.length;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progressPercent || 0), 0) / goals.length)
    : 0;

  const bentoStreakHabit = habits.length > 0
    ? habits.reduce<Habit>((highest, h) => {
        return (h.streak || 0) > (highest.streak || 0) ? h : highest;
      }, habits[0])
    : null;

  const activeDeadlines = deadlines.filter(d => !d.completed);
  const closestDeadline = activeDeadlines.length > 0
    ? activeDeadlines.reduce<Deadline>((closest, d) => {
        return new Date(d.due_date).getTime() < new Date(closest.due_date).getTime() ? d : closest;
      }, activeDeadlines[0])
    : (deadlines.length > 0 ? deadlines[0] : null);

  const completedHabitsTodayCount = habits.filter(h => (h.completionsToday || 0) >= h.daily_target).length;
  const totalHabitsCount = habits.length;

  const bestGoal = goals.length > 0
    ? goals.reduce<Goal>((best, g) => {
        return (g.progressPercent || 0) > (best.progressPercent || 0) ? g : best;
      }, goals[0])
    : null;

  const activeHabit = habits.length > 0
    ? (habits.find(h => (h.completionsToday || 0) > 0) || habits[0])
    : null;

  const laggingHabit = habits.length > 1
    ? (habits.find(h => (h.completionsToday || 0) < h.daily_target && h.id !== activeHabit?.id) ||
       habits.find(h => h.id !== activeHabit?.id) ||
       habits[1])
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        :root {
          /* Backgrounds */
          --bg:        #141414;
          --card:      #1e1e1e;
          --card-2:    #252525;
          --card-3:    #2a2a2a;

          /* Accent */
          --ac:        #ccff00;
          --ac-soft:   rgba(204,255,0,0.12);
          --ac-mid:    rgba(204,255,0,0.35);

          /* Text */
          --t1:        #ffffff;
          --t2:        #9a9a9a;
          --t3:        #555555;

          /* Borders */
          --b1:        rgba(255,255,255,0.07);
          --b2:        rgba(255,255,255,0.13);

          /* Semantic */
          --danger:    #ff5c5c;
          --ok:        #4ade80;
          --warn:      #fbbf24;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        body {
          background: #141414;
        }

        ::-webkit-scrollbar {
          display: none;
        }

        input::placeholder {
          color: #555555;
          opacity: 1;
        }
        
        input:focus {
          outline: none;
          border-color: rgba(204, 255, 0, 0.4) !important;
          box-shadow: 0 0 0 3px rgba(204, 255, 0, 0.08);
        }

        @keyframes fillBar {
          from { width: 0; }
          to   { width: 67%; }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.9);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.91);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes stripGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }

        @keyframes pillIn {
          from { opacity: 0.5; transform: scale(0.85); }
          to   { opacity: 1;   transform: scale(1); }
        }

        .drawer-sheet {
          transform: translateY(100%);
          opacity: 0;
          transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease;
        }
        .drawer-sheet.open {
          transform: translateY(0);
          opacity: 1;
        }
      `}</style>

      <div style={{
        background: "var(--bg)",
        minHeight: "100vh",
        maxWidth: 390,
        margin: "0 auto",
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        paddingBottom: 100,
        position: "relative",
        overflowX: "hidden",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale"
      }}>
        {/* Main Content */}
        <div style={{ padding: "0 20px" }}>
          {/* Header section trigger profile -> settings */}
          <GreetingHero onProfileClick={() => setActiveNav("settings")} />

          <TabContent id="home" active={activeNav}>
            {/* Hero Bento grid section */}
            <BentoHeroCard onDrawer={setActiveDrawer} onNav={setActiveNav} />
            <BentoGrid 
              onNav={setActiveNav} 
              onDrawer={setActiveDrawer} 
              streakHabit={bentoStreakHabit}
              closestDeadline={closestDeadline}
              overallProgress={overallProgress}
              completedHabits={completedHabitsTodayCount}
              totalHabits={totalHabitsCount}
            />

            {/* Curated Goal section (Only show 1 best/trending goal) */}
            {bestGoal && (
              <>
                <SectionHeader title="Curated Goal" onSeeAll={() => setActiveNav('goals')} style={{ marginTop: 24 }} />
                <GoalCard
                  title={bestGoal.title}
                  progress={bestGoal.progressPercent || 0}
                  tags={bestGoal.tags}
                  delta={bestGoal.deltaPercent !== undefined ? `${bestGoal.deltaPercent >= 0 ? '+' : ''}${bestGoal.deltaPercent}%` : "+10%"}
                  done={bestGoal.subtasks?.filter(s => s.is_complete).length || 0}
                  total={bestGoal.subtasks?.length || 0}
                  animDelay={200}
                  onClick={() => setActiveDrawer({ type: "goal", data: bestGoal })}
                />
              </>
            )}

            {/* Curated Habits section (Active doing and Lagging behind) */}
            {habits.length > 0 && (
              <>
                <SectionHeader title="Daily Habits" onSeeAll={() => setActiveNav('habits')} style={{ marginTop: 28 }} />
                {activeHabit && (
                  <HabitCard
                    name={activeHabit.title}
                    target={activeHabit.daily_target}
                    done={activeHabit.completionsToday || 0}
                    streak={activeHabit.streak || 0}
                    rate={activeHabit.daily_target > 0 ? Math.round(((activeHabit.completionsToday || 0) / activeHabit.daily_target) * 100) : 0}
                    animDelay={400}
                    onClick={() => setActiveDrawer({ type: "habit", data: activeHabit })}
                    onCheckIn={() => { logCompletion(activeHabit.id); toast(`${activeHabit.title} checked in! 🔥`); }}
                  />
                )}
                {laggingHabit && laggingHabit.id !== activeHabit?.id && (
                  <HabitCard
                    name={laggingHabit.title}
                    target={laggingHabit.daily_target}
                    done={laggingHabit.completionsToday || 0}
                    streak={laggingHabit.streak || 0}
                    rate={laggingHabit.daily_target > 0 ? Math.round(((laggingHabit.completionsToday || 0) / laggingHabit.daily_target) * 100) : 0}
                    animDelay={480}
                    onClick={() => setActiveDrawer({ type: "habit", data: laggingHabit })}
                    onCheckIn={() => { logCompletion(laggingHabit.id); toast(`${laggingHabit.title} checked in! 🔥`); }}
                  />
                )}
              </>
            )}

            {/* Curated Deadline section (Only show the single closest/urgent deadline) */}
            {closestDeadline && (
              <>
                <SectionHeader title="Closest Deadline" onSeeAll={() => setActiveNav('deadlines')} style={{ marginTop: 28 }} />
                <FeaturedDeadline 
                  {...mapDeadlineProps(closestDeadline)} 
                  onToggle={() => toggleDeadlineCompletion(closestDeadline.id)}
                  onClick={() => setActiveDrawer({ type: "deadline", data: closestDeadline })} 
                />
              </>
            )}
          </TabContent>

          <TabContent id="goals" active={activeNav}>
            <SectionHeader title="All Active Goals" style={{ marginTop: 8 }} />
            {goals.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No goals tracked. Tap Add to initialize one.</p>
              </div>
            ) : (
              goals.map((g, i) => (
                <GoalCard 
                  key={g.id} 
                  title={g.title}
                  progress={g.progressPercent || 0}
                  tags={g.tags}
                  delta={g.deltaPercent !== undefined ? `${g.deltaPercent >= 0 ? '+' : ''}${g.deltaPercent}%` : "+10%"}
                  done={g.subtasks?.filter(s => s.is_complete).length || 0}
                  total={g.subtasks?.length || 0}
                  animDelay={100 + i * 80} 
                  onClick={() => setActiveDrawer({ type: "goal", data: g })} 
                />
              ))
            )}
          </TabContent>

          <TabContent id="habits" active={activeNav}>
            <SectionHeader title="Daily Habits Checklist" style={{ marginTop: 8 }} />
            {habits.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No habits tracked. Tap Add to initialize one.</p>
              </div>
            ) : (
              habits.map((h, i) => (
                <HabitCard 
                  key={h.id} 
                  name={h.title}
                  target={h.daily_target}
                  done={h.completionsToday || 0}
                  streak={h.streak || 0}
                  rate={h.daily_target > 0 ? Math.round(((h.completionsToday || 0) / h.daily_target) * 100) : 0}
                  animDelay={100 + i * 80} 
                  onClick={() => setActiveDrawer({ type: "habit", data: h })} 
                  onCheckIn={() => { logCompletion(h.id); toast(`${h.title} checked in! 🔥`); }}
                />
              ))
            )}
          </TabContent>

          <TabContent id="deadlines" active={activeNav}>
            <SectionHeader title="All Deadlines" style={{ marginTop: 8 }} />
            {deadlines.length === 0 ? (
              <div className="text-center py-20 px-4 border border-dashed border-neutral-900 rounded-lg select-none space-y-3">
                <p className="text-xs text-neutral-300 font-light">No deadlines tracked. Tap Add to initialize one.</p>
              </div>
            ) : (
              <>
                {closestDeadline && (
                  <FeaturedDeadline 
                    {...mapDeadlineProps(closestDeadline)} 
                    onToggle={() => toggleDeadlineCompletion(closestDeadline.id)}
                    onClick={() => setActiveDrawer({ type: "deadline", data: closestDeadline })} 
                  />
                )}
                {deadlines.filter(d => d.id !== closestDeadline?.id).map((d, i) => (
                  <DeadlineListItem 
                    key={d.id} 
                    index={i + 2} 
                    {...mapDeadlineProps(d)} 
                    onClick={() => setActiveDrawer({ type: "deadline", data: d })} 
                  />
                ))}
              </>
            )}
          </TabContent>

          <TabContent id="add" active={activeNav}>
            <AddItemSheet 
              onClose={() => {
                setActiveNav("home");
                setEditingItem(null);
              }} 
              editItem={editingItem}
              onCreate={(type) => {
                setEditingItem(null);
                if (type === 'goal') {
                  setActiveNav('goals');
                } else if (type === 'habit') {
                  setActiveNav('habits');
                } else if (type === 'deadline') {
                  setActiveNav('deadlines');
                }
              }}
            />
          </TabContent>

          <TabContent id="settings" active={activeNav}>
            <SettingsSheet onNav={setActiveNav} />
          </TabContent>
        </div>

        {/* Spring Bottom Sheet Drawer Details Overlay */}
        <DetailDrawer 
          activeDrawer={activeDrawer} 
          onClose={() => setActiveDrawer(null)} 
          onEditTap={(type, data) => {
            setEditingItem({ type, data });
            setActiveNav("add");
            setActiveDrawer(null);
          }}
        />

        {/* Sticky centered Bottom Navigation Bar */}
        <BottomNav active={activeNav} onSelect={setActiveNav} />
      </div>
    </>
  );
}
