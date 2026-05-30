"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Habit } from "../lib/types";
import { useHabitsStore } from "../lib/habitStore";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  Activity,
  Check,
  Flame,
  ShieldCheck,
  GlassWater,
  BookOpen,
  Brain,
  Heart,
  Moon,
  Sparkles,
  Dumbbell,
  Apple,
  Coffee,
  Clock,
} from "lucide-react";

export const HABIT_ICONS = {
  activity: Activity,
  flame: Flame,
  water: GlassWater,
  book: BookOpen,
  brain: Brain,
  heart: Heart,
  moon: Moon,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  apple: Apple,
  coffee: Coffee,
  clock: Clock,
} as const;
interface HabitCardProps {
  habit: Habit;
  onTap: (habit: Habit) => void;
  onEditTap: (habit: Habit) => void;
  entranceDelay?: number; // ms stagger for entrance animation
}

// ─── Visual Theme (Cyan-Emerald Gradient for all habits) ─────────────────────

const HABIT_THEME = {
  icon: Activity,
  accentText: "text-cyan-400",
  accentBg: "bg-cyan-500/10",
  accentBorder: "border-cyan-500/20",
  gridFilled:
    "bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-[0_0_5px_rgba(6,182,212,0.45)]",
  gridPartial: "bg-cyan-900/60 border-cyan-700/40",
  progressFill: "bg-gradient-to-r from-cyan-500 to-emerald-500",
  buttonBg:
    "bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
  badgeBorder: "border-cyan-500/20",
  badgeText: "text-cyan-400",
  badgeBg: "bg-cyan-950/20",
} as const;

// ─── Date helpers ─────────────────────────────────────────────────────────────


function dateStrForOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function friendlyDate(dateStr: string): string {
  // dateStr = "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitCard({ habit, onTap, onEditTap, entranceDelay = 0 }: HabitCardProps) {
  const { deleteHabit, logCompletion, pendingHabitIds } = useHabitsStore();
  const isPending = pendingHabitIds.has(habit.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const theme = HABIT_THEME;
  const IconComponent = (habit.icon && HABIT_ICONS[habit.icon as keyof typeof HABIT_ICONS]) || Activity;

  // ── Completion metrics ──────────────────────────────────────────────────
  const completionsToday = habit.completionsToday ?? 0;
  const dailyTarget = habit.daily_target;
  const isFullyComplete = completionsToday >= dailyTarget;
  const progressPct = Math.min((completionsToday / dailyTarget) * 100, 100);
  const streak = habit.streak ?? 0;

  // ── Build log map: date string → completions ────────────────────────────
  const logMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (habit.logs ?? []).forEach((l) => map.set(l.log_date, l.completions));
    return map;
  }, [habit.logs]);

  // ── Last 100 days (0 = today, 99 = 99 days ago) → 5 rows × 20 cols ─────
  const ROWS = 5;
  const COLS = 20;

  const gridCells = React.useMemo(() => {
    const cells: {
      dayIndex: number; // 0 = oldest shown, 99 = today
      state: "complete" | "partial" | "empty";
      dateStr: string;
      completions: number;
    }[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dayIndex = c * ROWS + r; // column-major: 0 = top-left (oldest), 99 = bottom-right (today)
        const daysAgo = 99 - dayIndex;
        const dateStr = dateStrForOffset(daysAgo);
        const completions = logMap.get(dateStr) ?? 0;

        let state: "complete" | "partial" | "empty";
        if (completions >= dailyTarget) state = "complete";
        else if (completions > 0) state = "partial";
        else state = "empty";

        cells.push({ dayIndex, state, dateStr, completions });
      }
    }
    return cells;
  }, [logMap, dailyTarget]);



  // ── Handlers ─────────────────────────────────────────────────────────
  const handleCheck = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPending) return;
      const wasIncomplete = completionsToday < dailyTarget;
      const willComplete = completionsToday + 1 >= dailyTarget;
      if (wasIncomplete && willComplete) {
        // Trigger ripple
        setShowRipple(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setShowRipple(true));
        });
        setTimeout(() => setShowRipple(false), 600);
      }
      await logCompletion(habit.id);
    },
    [isPending, completionsToday, dailyTarget, habit.id, logCompletion]
  );

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    try {
      await deleteHabit(habit.id);
    } catch {
      // Error shown via store syncError
    }
  };

  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && onTap(habit)}
      className={`animate-habit-entrance group relative flex flex-col justify-between w-full p-4 rounded-lg cursor-pointer select-none overflow-visible transition-all duration-300 ${
        isPending
          ? "bg-neutral-900/75 border border-white/10 opacity-50 pointer-events-none backdrop-blur-[8px]"
          : isFullyComplete
          ? "border-sweep-card habit-card-complete"
          : "border-sweep-card"
      }`}
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/95 border border-red-900/50 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-[11px] font-mono text-neutral-300 text-center leading-relaxed">
            Delete Habit <span className="text-white font-semibold">&ldquo;{habit.title}&rdquo;</span>?<br />
            <span className="text-neutral-500">This cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-white bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-2.5 relative">
        <div className="flex items-center gap-2.5">
          {/* Icon Box */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${theme.accentBg} ${theme.accentBorder} ${theme.accentText}`}>
            <IconComponent size={15} strokeWidth={2.2} />
          </div>

          {/* Title & today's count */}
          <div className="flex flex-col">
            <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1 leading-snug">
              {habit.title}
            </h3>
            <p className="text-[10px] font-mono tracking-wide text-neutral-500">
              {completionsToday}&thinsp;/&thinsp;{dailyTarget} today
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Check / Complete Button */}
          <button
            onClick={handleCheck}
            disabled={isPending}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 overflow-visible ${
              isFullyComplete
                ? `${theme.buttonBg} text-black`
                : "border border-neutral-800 bg-neutral-950 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            } ${showRipple ? "habit-check-ripple" : ""}`}
            title={isFullyComplete ? "Tap to reset" : "Log completion"}
          >
            {isFullyComplete ? (
              <Check size={14} strokeWidth={3} className="relative z-10" />
            ) : (
              <Flame
                size={13}
                strokeWidth={2.5}
                className={streak > 0 ? "flame-wiggle text-cyan-400" : ""}
              />
            )}
          </button>

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s); }}
              className={`p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors ${showMenu ? "text-white bg-neutral-900" : ""}`}
              aria-label="Habit options"
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 z-30 w-36 p-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.85)] animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onTap(habit); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-200 hover:text-white hover:bg-neutral-900 rounded-md transition-colors text-left"
                >
                  <Activity size={10} className="text-cyan-400" />
                  <span>Analytics</span>
                </button>
                <div className="w-full h-[1px] bg-neutral-900 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditTap(habit); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-200 hover:text-white hover:bg-neutral-900 rounded-md transition-colors text-left"
                >
                  <Edit2 size={10} />
                  <span>Edit Habit</span>
                </button>
                <div className="w-full h-[1px] bg-neutral-900 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors text-left"
                >
                  <Trash2 size={10} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* ── Contribution Grid (Last 100 Days) ───────────────────────── */}
      <div className="mb-2.5 overflow-hidden">
        <div
          className="grid gap-[3px] w-full"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {gridCells.map((cell) => {
            const label = `${friendlyDate(cell.dateStr)} · ${cell.completions}/${dailyTarget} completions`;
            if (cell.state === "complete") {
              return (
                <div
                  key={`day-${cell.dayIndex}`}
                  className={`w-full aspect-square rounded-[2px] border border-transparent transition-all duration-300 ${theme.gridFilled}`}
                  title={label}
                />
              );
            }
            if (cell.state === "partial") {
              return (
                <div
                  key={`day-${cell.dayIndex}`}
                  className="w-full aspect-square rounded-[2px] border border-cyan-700/30 bg-cyan-900/40 transition-all duration-300"
                  title={label}
                />
              );
            }
            // empty
            return (
              <div
                key={`day-${cell.dayIndex}`}
                className="w-full aspect-square rounded-[2px] border border-white/[0.15] bg-white/[0.02] hover:border-neutral-700 transition-all duration-300"
                title={label}
              />
            );
          })}
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="w-full h-[2px] rounded-full overflow-hidden bg-neutral-900">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${theme.progressFill}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Tags + streak */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {habit.tags && habit.tags.length > 0 ? (
              habit.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-200 border border-neutral-850 bg-neutral-950/60 rounded-md"
                >
                  {tag}
                </span>
              ))
            ) : (
              <div className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-850 bg-neutral-950/60 rounded-md flex items-center gap-1">
                <ShieldCheck size={10} className="stroke-[2.5] text-neutral-500" />
                <span>Habit</span>
              </div>
            )}
          </div>
          <div
            className={`text-[10px] font-mono shrink-0 flex items-center gap-1 ${
              streak > 0 ? "text-cyan-400 streak-glow-active" : "text-neutral-500"
            }`}
          >
            {streak > 0 && (
              <Flame size={10} strokeWidth={2.5} className="text-orange-400 shrink-0" />
            )}
            <span>
              Streak{" "}
              <span className={streak > 0 ? "text-white font-bold" : "text-white font-bold"}>
                {streak} {streak === 1 ? "day" : "days"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
