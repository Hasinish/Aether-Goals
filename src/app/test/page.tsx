"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
import { useGoalsStore } from "@/lib/store";
import { Goal, Habit, Deadline } from "@/lib/types";
import AuthScreen from "@/components/AuthScreen";
import GoalDetailModal from "@/components/GoalDetailModal";
import GoalFormModal from "@/components/GoalFormModal";
import HabitFormModal from "@/components/HabitFormModal";
import DeadlineFormModal from "@/components/DeadlineFormModal";
import HabitAnalyticsModal from "@/components/HabitAnalyticsModal";
import { HabitStoreProvider, useHabitsStore } from "@/lib/habitStore";
import { DeadlineStoreProvider, useDeadlinesStore } from "@/lib/deadlineStore";
import { LogOut, Plus, Search, MoreHorizontal, Edit2, Trash2, ChevronUp, ChevronDown, AlertTriangle, Check, Calendar, Activity, Flame, ShieldCheck, GlassWater, BookOpen, Brain, Heart, Moon, Sparkles, Dumbbell, Apple, Coffee, Clock } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

// ─── Local Icon map for Habits ─────────────────────────────────────────────
const HABIT_ICONS = {
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

// ─── Local Date Helpers ──────────────────────────────────────────────────
function dateStrForOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function friendlyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Apple Premium Frosted Background ────────────────────────────────────
function AppleBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#0a0a0c]">
      {/* Soft luxurious dark mode fluid blobs */}
      <div className="absolute -top-[30%] -left-[20%] w-[90%] h-[90%] rounded-full bg-[#1c2333]/30 blur-[130px] animate-pulse duration-[8s]" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-[#182924]/30 blur-[120px] animate-pulse duration-[10s]" />
      <div className="absolute top-[35%] left-[25%] w-[60%] h-[60%] rounded-full bg-[#20172e]/25 blur-[140px] animate-pulse duration-[12s]" />
    </div>
  );
}

// ─── Apple Sans-Serif tracked Logo ───────────────────────────────────────
function AppleAetherLogo() {
  return (
    <span className="text-xl font-bold tracking-tight text-white/95 select-none bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-sans">
      Aether
    </span>
  );
}

// ─── Apple Refined Goal Card ─────────────────────────────────────────────
interface AppleGoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
  onEditTap: (goal: Goal, e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function AppleGoalCard({ 
  goal, 
  onTap, 
  onEditTap,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false
}: AppleGoalCardProps) {
  const { deleteGoal, pendingGoalIds } = useGoalsStore();
  const isPending = pendingGoalIds.has(goal.id);
  const displayPercent = useCountUp(goal.progressPercent || 0, 900);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEditTap(goal, e);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    try {
      await deleteGoal(goal.id);
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && onTap(goal)}
      className={`group relative flex flex-col justify-between w-full min-h-[145px] p-5 rounded-[24px] cursor-pointer select-none overflow-visible transition-all duration-300 border border-white/[0.05] bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-800/40 hover:scale-[1.01] active:scale-[0.985] ${
        isPending ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* iOS Action Alert Style Modal */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-[#1c1c1e]/95 border border-white/10 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-xs text-zinc-300 text-center leading-relaxed font-sans px-2">
            Delete Goal <span className="text-white font-semibold">&ldquo;{goal.title}&rdquo;</span>?<br />
            <span className="text-zinc-500 mt-1 block">This action cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="flex-1 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 active:scale-95 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Header tags and menus */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
          {goal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-3 py-0.5 text-[9px] font-sans font-semibold text-zinc-400 bg-zinc-800/40 rounded-full border border-white/5"
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Reorder Buttons inside rounded capsule */}
          {(onMoveUp || onMoveDown) && (
            <div className="flex items-center bg-zinc-800/30 border border-white/5 rounded-full p-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={isFirst}
                onClick={onMoveUp}
                className={`p-1.5 rounded-full transition-all ${
                  isFirst ? "text-zinc-700 opacity-20 pointer-events-none" : "text-zinc-400 hover:text-white"
                }`}
              >
                <ChevronUp size={11} />
              </button>
              <div className="w-[1px] h-3.5 bg-white/5 mx-0.5" />
              <button
                disabled={isLast}
                onClick={onMoveDown}
                className={`p-1.5 rounded-full transition-all ${
                  isLast ? "text-zinc-700 opacity-20 pointer-events-none" : "text-zinc-400 hover:text-white"
                }`}
              >
                <ChevronDown size={11} />
              </button>
            </div>
          )}

          {isPending ? (
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-white rounded-full animate-spin shrink-0 ml-1" />
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuToggle}
                className={`p-1.5 text-zinc-500 hover:text-white rounded-full transition-colors ${
                  showMenu ? "text-white bg-zinc-850" : ""
                }`}
              >
                <MoreHorizontal size={14} />
              </button>

              {/* Action Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-7 z-30 w-36 p-1.5 bg-[#2c2c2e]/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in">
                  <button
                    onClick={handleEditClick}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-xl transition-all text-left"
                  >
                    <Edit2 size={10} />
                    <span>Edit Goal</span>
                  </button>
                  <div className="w-full h-[1px] bg-white/5 my-1" />
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
                  >
                    <Trash2 size={10} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Goal Title */}
      <div className="flex-1 flex flex-col justify-start mb-3">
        <h2 className="text-base font-semibold tracking-tight text-white line-clamp-1 leading-snug font-sans">
          {goal.title}
        </h2>
      </div>

      {/* Progress tracking */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between select-none">
          <span className="text-[9px] font-sans text-zinc-500 uppercase tracking-widest font-semibold">
            Progress
          </span>
          <span className="text-white font-sans text-xs font-bold">
            {displayPercent}%
          </span>
        </div>

        {/* Apple Rounded Progress bar */}
        <div className="w-full h-[6px] bg-zinc-800/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#5856D6] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${goal.progressPercent || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Apple Premium Habit Card ──────────────────────────────────────────
interface AppleHabitCardProps {
  habit: Habit;
  onTap: (habit: Habit) => void;
  onEditTap: (habit: Habit) => void;
  entranceDelay?: number;
}

function AppleHabitCard({ habit, onTap, onEditTap, entranceDelay = 0 }: AppleHabitCardProps) {
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

  const IconComponent = (habit.icon && HABIT_ICONS[habit.icon as keyof typeof HABIT_ICONS]) || Activity;
  const completionsToday = habit.completionsToday ?? 0;
  const dailyTarget = habit.daily_target;
  const isFullyComplete = completionsToday >= dailyTarget;
  const progressPct = Math.min((completionsToday / dailyTarget) * 100, 100);
  const streak = habit.streak ?? 0;

  const logMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (habit.logs ?? []).forEach((l) => map.set(l.log_date, l.completions));
    return map;
  }, [habit.logs]);

  const gridCells = React.useMemo(() => {
    const cells: {
      dayIndex: number;
      state: "complete" | "partial" | "empty";
      dateStr: string;
      completions: number;
    }[] = [];

    const ROWS = 5;
    const COLS = 20;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dayIndex = c * ROWS + r;
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

  const handleCheck = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPending) return;
      
      const wasIncomplete = completionsToday < dailyTarget;
      const willComplete = completionsToday + 1 >= dailyTarget;
      if (wasIncomplete && willComplete) {
        setShowRipple(true);
        setTimeout(() => setShowRipple(false), 500);
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
      // Done
    }
  };

  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && onTap(habit)}
      className={`group relative flex flex-col justify-between w-full p-5 rounded-[24px] cursor-pointer select-none overflow-visible transition-all duration-300 border border-white/[0.05] bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-800/40 hover:scale-[1.01] active:scale-[0.985] ${
        isPending ? "opacity-60 pointer-events-none" : ""
      }`}
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      {/* Delete confirmation iOS Alert */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-[#1c1c1e]/95 border border-white/10 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={20} className="text-red-400" />
          <p className="text-xs text-zinc-300 text-center leading-relaxed font-sans px-2">
            Delete Habit <span className="text-white font-semibold">&ldquo;{habit.title}&rdquo;</span>?<br />
            <span className="text-zinc-500 mt-1 block">This action cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="flex-1 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 active:scale-95 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3.5 relative">
        <div className="flex items-center gap-2.5">
          {/* Apple-Style Accent Rounded Icon Square */}
          <div className="p-2.5 rounded-2xl border flex items-center justify-center shrink-0 bg-blue-500/10 border-blue-500/20 text-[#007AFF]">
            <IconComponent size={15} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col">
            <h3 className="text-base font-semibold tracking-tight text-white line-clamp-1 leading-snug font-sans">
              {habit.title}
            </h3>
            <p className="text-[10px] font-sans text-zinc-500">
              {completionsToday} / {dailyTarget} completed today
            </p>
          </div>
        </div>

        {/* Action checks & dropdowns */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCheck}
            disabled={isPending}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
              isFullyComplete
                ? "bg-[#30D158] text-white shadow-[0_0_12px_rgba(48,209,88,0.2)]"
                : "border-2 border-zinc-700 bg-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {isFullyComplete ? (
              <Check size={14} strokeWidth={4} />
            ) : (
              <Flame
                size={13}
                strokeWidth={2.5}
                className={streak > 0 ? "text-orange-450" : ""}
              />
            )}
          </button>

          {/* Context Options */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s); }}
              className={`p-1.5 text-zinc-500 hover:text-white rounded-full transition-colors ${showMenu ? "text-white bg-zinc-800" : ""}`}
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 z-30 w-36 p-1.5 bg-[#2c2c2e]/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onTap(habit); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-xl transition-all text-left"
                >
                  <Activity size={10} className="text-[#007AFF]" />
                  <span>Analytics</span>
                </button>
                <div className="w-full h-[1px] bg-white/5 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditTap(habit); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-xl transition-all text-left"
                >
                  <Edit2 size={10} />
                  <span>Edit Habit</span>
                </button>
                <div className="w-full h-[1px] bg-white/5 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
                >
                  <Trash2 size={10} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fitness-style Log Grid (No neon borders, soft solid boxes) */}
      <div className="mb-3.5 overflow-hidden">
        <div
          className="grid gap-[3px] w-full"
          style={{ gridTemplateColumns: `repeat(20, minmax(0, 1fr))` }}
        >
          {gridCells.map((cell) => {
            const label = `${friendlyDate(cell.dateStr)} · ${cell.completions}/${dailyTarget} completions`;
            if (cell.state === "complete") {
              return (
                <div
                  key={`day-${cell.dayIndex}`}
                  className="w-full aspect-square rounded-[3px] bg-[#30D158] transition-all duration-300"
                  title={label}
                />
              );
            }
            if (cell.state === "partial") {
              return (
                <div
                  key={`day-${cell.dayIndex}`}
                  className="w-full aspect-square rounded-[3px] bg-[#30D158]/35 border border-[#30D158]/20 transition-all duration-300"
                  title={label}
                />
              );
            }
            return (
              <div
                key={`day-${cell.dayIndex}`}
                className="w-full aspect-square rounded-[3px] bg-white/[0.04] border border-white/[0.06] hover:border-zinc-700 transition-all duration-300"
                title={label}
              />
            );
          })}
        </div>
      </div>

      {/* Apple-style Progress Indicator bar */}
      <div className="space-y-2">
        <div className="w-full h-[5px] rounded-full overflow-hidden bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#007AFF]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Tags & Streaks */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {habit.tags && habit.tags.length > 0 ? (
              habit.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-[9px] font-sans font-semibold text-zinc-400 bg-zinc-800/40 rounded-full border border-white/5"
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                </span>
              ))
            ) : (
              <div className="px-2.5 py-0.5 text-[9px] font-sans text-zinc-500 flex items-center gap-1">
                <span>Habit</span>
              </div>
            )}
          </div>
          <div
            className={`text-[10px] font-sans shrink-0 flex items-center gap-1 font-semibold ${
              streak > 0 ? "text-orange-400" : "text-zinc-500"
            }`}
          >
            {streak > 0 && (
              <Flame size={11} strokeWidth={2.5} className="text-orange-400 shrink-0" />
            )}
            <span>
              {streak} day streak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Apple Premium Deadline Card ───────────────────────────────────────
interface AppleDeadlineCardProps {
  deadline: Deadline;
  onEditTap: (deadline: Deadline) => void;
}

function AppleDeadlineCard({ deadline, onEditTap }: AppleDeadlineCardProps) {
  const { deleteDeadline, toggleDeadlineCompletion, pendingDeadlineIds } = useDeadlinesStore();
  const isPending = pendingDeadlineIds.has(deadline.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timeRemainingText, setTimeRemainingText] = useState("");
  const [urgency, setUrgency] = useState<"red" | "yellow" | "green">("green");
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

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(deadline.due_date).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemainingText("Overdue");
        setUrgency("red");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      let text = "";
      if (days > 0) {
        text += `${days}d ${hours}h`;
      } else if (hours > 0) {
        text += `${hours}h ${mins}m`;
      } else {
        text += `${mins}m ${secs}s`;
      }
      setTimeRemainingText(text);

      if (diff < 1000 * 60 * 60 * 24) {
        setUrgency("red");
      } else if (diff < 1000 * 60 * 60 * 24 * 3) {
        setUrgency("yellow");
      } else {
        setUrgency("green");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [deadline.due_date]);

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    try {
      await deleteDeadline(deadline.id);
    } catch {
      // Handled
    }
  };

  const formattedDueDate = React.useMemo(() => {
    const d = new Date(deadline.due_date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [deadline.due_date]);

  const urgencyDotClass = {
    red: "bg-[#FF453A]",
    yellow: "bg-[#FFD60A]",
    green: "bg-[#30D158]",
  }[urgency];

  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && toggleDeadlineCompletion(deadline.id)}
      className={`group relative flex flex-col justify-between w-full p-5 rounded-[24px] cursor-pointer select-none overflow-visible transition-all duration-300 border border-white/[0.05] bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-800/40 hover:scale-[1.01] active:scale-[0.985] ${
        isPending ? "opacity-60 pointer-events-none" : ""
      } ${deadline.completed ? "opacity-50" : ""}`}
    >
      {/* Delete confirmation iOS Style alert */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-[#1c1c1e]/95 border border-white/10 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={20} className="text-red-400" />
          <p className="text-xs text-zinc-300 text-center leading-relaxed font-sans px-2">
            Delete Deadline <span className="text-white font-semibold">&ldquo;{deadline.title}&rdquo;</span>?<br />
            <span className="text-zinc-500 mt-1 block">This action cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="flex-1 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-xl hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2 text-xs font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 active:scale-95 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          {/* iOS Circular Radio Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDeadlineCompletion(deadline.id);
            }}
            disabled={isPending}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
              deadline.completed
                ? "bg-[#30D158] border-transparent text-white"
                : "border-zinc-700 bg-zinc-850 hover:border-zinc-500 text-transparent"
            }`}
          >
            {deadline.completed && <Check size={12} strokeWidth={4} />}
          </button>

          <div className="flex flex-col min-w-0">
            <h3
              className={`text-base font-semibold tracking-tight text-white line-clamp-1 leading-snug font-sans ${
                deadline.completed ? "line-through text-zinc-500" : ""
              }`}
            >
              {deadline.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={11} className="text-zinc-500 shrink-0" />
              <p className="text-[10px] font-sans text-zinc-500 shrink-0">
                {formattedDueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu((s) => !s)}
            className={`p-1.5 text-zinc-500 hover:text-white rounded-full transition-colors ${
              showMenu ? "text-white bg-zinc-850" : ""
            }`}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-30 w-36 p-1.5 bg-[#2c2c2e]/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEditTap(deadline);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-zinc-200 hover:text-white hover:bg-white/10 rounded-xl transition-all text-left"
              >
                <Edit2 size={10} />
                <span>Edit Info</span>
              </button>
              <div className="w-full h-[1px] bg-white/5 my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-sans font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left"
              >
                <Trash2 size={10} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Countdown Panel */}
      <div className="flex items-center justify-between mt-1 bg-zinc-950/30 border border-white/5 p-3 rounded-2xl select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${urgencyDotClass}`} />
          <span className="text-[10px] uppercase font-sans tracking-widest text-zinc-500 font-semibold shrink-0">
            Time Left:
          </span>
        </div>
        <span
          className={`font-sans text-xs font-bold tracking-wide shrink-0 ${
            deadline.completed
              ? "text-zinc-500"
              : urgency === "red"
              ? "text-[#FF453A]"
              : urgency === "yellow"
              ? "text-[#FFD60A]"
              : "text-[#30D158]"
          }`}
        >
          {deadline.completed ? "Completed" : timeRemainingText}
        </span>
      </div>
    </div>
  );
}

// ─── Main Home Component ───────────────────────────────────────────────
export default function Home() {
  const { user } = useGoalsStore();

  // Authenticate Gate
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <HabitStoreProvider user={user}>
      <DeadlineStoreProvider user={user}>
        <HomeContent />
      </DeadlineStoreProvider>
    </HabitStoreProvider>
  );
}

function HomeContent() {
  const { goals, loading, user: rawUser, logout, reorderGoals, syncError: goalsSyncError, clearSyncError: clearGoalsSyncError } = useGoalsStore();
  const { habits, loading: habitsLoading, syncError: habitsSyncError, clearSyncError: clearHabitsSyncError } = useHabitsStore();
  const { deadlines, loading: deadlinesLoading, syncError: deadlinesSyncError, clearSyncError: clearDeadlinesSyncError } = useDeadlinesStore();
  
  const user = rawUser!;
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isHeaderCompressed, setIsHeaderCompressed] = useState(false);
  const [isTabDocked, setIsTabDocked] = useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const [prevTab, setPrevTab] = useState<"deadlines" | "goals" | "habits">("goals");
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const progressRef = React.useRef(0);
  const dragDirectionRef = React.useRef<"undecided" | "horizontal" | "vertical">("undecided");
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const pillRef = React.useRef<HTMLDivElement>(null);
  const headerPillRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const activeTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  React.useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => {
      setTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const isTabCollapsed = (tab: "deadlines" | "goals" | "habits") => {
    if (isDraggingActive) return false;
    if (activeTab === tab) return false;
    if (transitioning && prevTab === tab) return false;
    return true;
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDraggingActive(true);
    progressRef.current = 0;
    dragDirectionRef.current = "undecided";
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStartPos.current) return;
    const diffX = dragStartPos.current.x - clientX;
    const viewportWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 448) : 448;
    let newProgress = -diffX / viewportWidth;
    
    const activeTabVal = activeTabRef.current;
    
    // Dampen out of bounds drags
    if (activeTabVal === "deadlines" && newProgress > 0) {
      newProgress = Math.pow(newProgress, 0.65) * 0.3;
    } else if (activeTabVal === "habits" && newProgress < 0) {
      newProgress = -Math.pow(Math.abs(newProgress), 0.65) * 0.3;
    }
    
    newProgress = Math.max(-1, Math.min(1, newProgress));
    progressRef.current = newProgress;

    // Viewport sliding track translation
    if (trackRef.current) {
      const activeIndex = activeTabVal === "deadlines" ? 0 : activeTabVal === "goals" ? 1 : 2;
      const leftPx = -activeIndex * viewportWidth + (newProgress * viewportWidth);
      trackRef.current.style.left = `${leftPx}px`;
      trackRef.current.style.transition = "none";
    }

    // Sliding control pill tracking
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTabVal];
    const baseLeft = currentIndex * 33.333;
    const baseRight = (2 - currentIndex) * 33.333;
    
    let currentLeft = baseLeft;
    let currentRight = baseRight;

    if (newProgress < 0) {
      const lag = Math.pow(Math.abs(newProgress), 1.6) * -1;
      const lead = Math.pow(Math.abs(newProgress), 0.75) * -1;
      currentLeft = baseLeft - lag * 33.333;
      currentRight = baseRight + lead * 33.333;
    } else {
      const lead = Math.pow(newProgress, 0.75);
      const lag = Math.pow(newProgress, 1.6);
      currentLeft = baseLeft - lead * 33.333;
      currentRight = baseRight + lag * 33.333;
    }
    
    currentLeft = Math.max(0, Math.min(66.666, currentLeft));
    currentRight = Math.max(0, Math.min(66.666, currentRight));
    
    [pillRef.current, headerPillRef.current].forEach((pillEl) => {
      if (!pillEl) return;
      pillEl.style.left = `${currentLeft}%`;
      pillEl.style.right = `${currentRight}%`;
      pillEl.style.transition = "none";
      
      const innerPill = pillEl.querySelector('.bg-white') || pillEl.querySelector('.bg-[#636366]/50');
      if (innerPill) {
        (innerPill as HTMLElement).style.transform = `scaleY(${1 - Math.abs(newProgress) * 0.12})`;
        (innerPill as HTMLElement).style.transition = "none";
      }
    });

    // Dynamic Card Parallax transition scaling
    const activeIndex = activeTabVal === "deadlines" ? 0 : activeTabVal === "goals" ? 1 : 2;
    const pages = ["deadlines", "goals", "habits"] as const;
    pages.forEach((tabName, idx) => {
      const pageEl = pageRefs.current[tabName];
      if (pageEl) {
        const d = (idx - activeIndex) + newProgress;
        const clampedD = Math.max(-1, Math.min(1, d));
        const absD = Math.abs(clampedD);
        
        if (absD < 1) {
          const scale = 1 - 0.08 * absD;
          const opacity = 1 - absD;
          const translateX = clampedD * -20;
          
          pageEl.style.transform = `scale(${scale}) translateX(${translateX}px)`;
          pageEl.style.opacity = `${opacity}`;
          pageEl.style.transition = "none";
        } else {
          pageEl.style.transform = `scale(0.92) translateX(${clampedD * -20}px)`;
          pageEl.style.opacity = "0";
          pageEl.style.transition = "none";
        }
      }
    });
  };

  const handleDragEnd = (clientX: number, clientY: number) => {
    if (!dragStartPos.current) return;
    setIsDraggingActive(false);
    
    const diffX = dragStartPos.current.x - clientX;
    const threshold = 50; 
    const activeTabVal = activeTabRef.current;
    let targetTab = activeTabVal;
    
    if (diffX > threshold) {
      if (activeTabVal === "deadlines") {
        targetTab = "goals";
      } else if (activeTabVal === "goals") {
        targetTab = "habits";
      }
    } else if (diffX < -threshold) {
      if (activeTabVal === "habits") {
        targetTab = "goals";
      } else if (activeTabVal === "goals") {
        targetTab = "deadlines";
      }
    }

    if (trackRef.current) {
      const activeIndex = targetTab === "deadlines" ? 0 : targetTab === "goals" ? 1 : 2;
      trackRef.current.style.transition = "left 500ms cubic-bezier(0.16, 1, 0.3, 1)";
      trackRef.current.style.left = `${-activeIndex * 100}%`;
    }

    const targetIndex = targetTab === "deadlines" ? 0 : targetTab === "goals" ? 1 : 2;
    [pillRef.current, headerPillRef.current].forEach((pillEl) => {
      if (!pillEl) return;
      pillEl.style.transition = "left 300ms cubic-bezier(0.16, 1, 0.3, 1), right 300ms cubic-bezier(0.16, 1, 0.3, 1)";
      pillEl.style.left = `${targetIndex * 33.333}%`;
      pillEl.style.right = `${(2 - targetIndex) * 33.333}%`;
      
      const innerPill = pillEl.querySelector('.bg-white') || pillEl.querySelector('.bg-[#636366]/50');
      if (innerPill) {
        (innerPill as HTMLElement).style.transition = "transform 300ms ease-out";
        (innerPill as HTMLElement).style.transform = "";
      }
    });

    const pages = ["deadlines", "goals", "habits"] as const;
    pages.forEach((tabName, idx) => {
      const pageEl = pageRefs.current[tabName];
      if (pageEl) {
        pageEl.style.transition = "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)";
        if (idx === targetIndex) {
          pageEl.style.transform = "scale(1) translateX(0px)";
          pageEl.style.opacity = "1";
        } else {
          const d = idx - targetIndex;
          pageEl.style.transform = `scale(0.92) translateX(${d * -20}px)`;
          pageEl.style.opacity = "0";
        }
      }
    });
    
    if (targetTab !== activeTabVal) {
      setPrevTab(activeTabVal);
      setActiveTab(targetTab);
    }
    
    dragStartPos.current = null;
    progressRef.current = 0;
  };

  const getTabStyle = (tab: "deadlines" | "goals" | "habits") => {
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTab];
    const targetIndex = tabIndices[tab];
    const d = targetIndex - currentIndex;
    
    if (activeTab === tab) {
      return {
        opacity: 1,
        transform: "scale(1) translateX(0px)",
        transition: isDraggingActive ? "none" : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)"
      };
    }
    
    return {
      opacity: 0,
      transform: `scale(0.92) translateX(${d * -20}px)`,
      transition: isDraggingActive ? "none" : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)"
    };
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-modal-sheet]")) return;
      if (target.closest(".touch-pan-x")) return;
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragStartPos.current) return;
      
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      const diffX = dragStartPos.current.x - clientX;
      const diffY = dragStartPos.current.y - clientY;

      if (dragDirectionRef.current === "undecided") {
        const threshold = 6;
        if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
          if (Math.abs(diffX) > Math.abs(diffY) * 1.1) {
            dragDirectionRef.current = "horizontal";
          } else {
            dragDirectionRef.current = "vertical";
            setIsDraggingActive(false);
          }
        }
      }

      if (dragDirectionRef.current === "horizontal") {
        e.preventDefault();
        handleDragMove(clientX, clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (dragStartPos.current) {
        if (dragDirectionRef.current === "horizontal") {
          handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        } else {
          setIsDraggingActive(false);
          dragStartPos.current = null;
          progressRef.current = 0;
        }
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const cardRectsRef = React.useRef<Record<string, DOMRect>>({});
  const prevGoalsRef = React.useRef<Goal[]>([]);
  const isReorderingRef = React.useRef(false);
  const tagsRef = React.useRef<HTMLDivElement>(null);
  const introducedIdsRef = React.useRef<Set<string>>(new Set());

  const allTags = React.useMemo(() => {
    const uniqueTags = new Set(
      goals
        .flatMap((g) => g.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return Array.from(uniqueTags).sort();
  }, [goals]);

  const allHabitTags = React.useMemo(() => {
    const uniqueTags = new Set(
      habits
        .flatMap((h) => h.tags || [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return Array.from(uniqueTags).sort();
  }, [habits]);

  const tagsToDisplay = activeTab === "habits" ? allHabitTags : allTags;

  React.useEffect(() => {
    setSelectedTag(null);
  }, [activeTab]);

  const filteredGoals = React.useMemo(() => {
    return goals.filter((g) => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || g.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

      let matchesTab = true;
      if (activeTab === "deadlines") {
        matchesTab = g.tags.some(t => t.toLowerCase() === "deadline") || g.title.toLowerCase().includes("deadline");
      } else if (activeTab === "habits") {
        matchesTab = false;
      } else if (activeTab === "goals") {
        matchesTab = !g.tags.some(t => t.toLowerCase() === "habit") && 
                     !g.tags.some(t => t.toLowerCase() === "deadline") && 
                     !g.title.toLowerCase().includes("deadline");
      }

      return matchesSearch && matchesTag && matchesTab;
    });
  }, [goals, searchQuery, selectedTag, activeTab]);

  const measureCards = () => {
    const elements = document.querySelectorAll("[data-drag-id]");
    const rects: Record<string, DOMRect> = {};
    elements.forEach((el) => {
      const id = el.getAttribute("data-drag-id");
      if (id) {
        rects[id] = el.getBoundingClientRect();
      }
    });
    cardRectsRef.current = rects;
  };

  const animateCards = () => {
    const elements = document.querySelectorAll("[data-drag-id]") as NodeListOf<HTMLElement>;
    const movedElements: Array<{ el: HTMLElement }> = [];

    elements.forEach((el) => {
      const id = el.getAttribute("data-drag-id");
      if (!id) return;
      const firstRect = cardRectsRef.current[id];
      if (!firstRect) return;

      const lastRect = el.getBoundingClientRect();
      const deltaX = firstRect.left - lastRect.left;
      const deltaY = firstRect.top - lastRect.top;

      if (deltaX !== 0 || deltaY !== 0) {
        el.style.transition = "none";
        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        movedElements.push({ el });
      }
    });

    if (movedElements.length === 0) return;

    void document.body.offsetHeight;

    requestAnimationFrame(() => {
      movedElements.forEach(({ el }) => {
        el.style.transition = "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)";
        el.style.transform = "translate(0px, 0px)";
      });

      setTimeout(() => {
        movedElements.forEach(({ el }) => {
          el.style.transition = "";
          el.style.transform = "";
        });
      }, 380);
    });
  };

  React.useEffect(() => {
    if (!user) return;
    if (activeTab === "habits") {
      habits.forEach((h) => introducedIdsRef.current.add(h.id));
    } else {
      filteredGoals.forEach((g) => introducedIdsRef.current.add(g.id));
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (isReorderingRef.current && prevGoalsRef.current.length > 0) {
      animateCards();
    }
    prevGoalsRef.current = goals;
    isReorderingRef.current = false;
  }, [goals]);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderCompressed(scrollY > 20);

      const sentinel = sentinelRef.current;
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        setIsTabDocked(rect.top <= 56);
      } else {
        setIsTabDocked(scrollY > 110);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    const el = tagsRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      isDragging = false;
    };

    const onMouseLeave = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      if (isDragging) {
        const preventClick = (e: MouseEvent) => {
          e.stopImmediatePropagation();
          el.removeEventListener("click", preventClick, true);
        };
        el.addEventListener("click", preventClick, true);
      }
      isDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, [goals]);

  const handleCardTap = (goal: Goal) => {
    setSelectedGoalId(goal.id);
  };

  const handleEditTap = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleEditHabitTap = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleEditDeadlineTap = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setIsFormOpen(true);
  };

  const handleAddTap = () => {
    setEditingGoal(null);
    setEditingHabit(null);
    setEditingDeadline(null);
    setIsFormOpen(true);
  };

  const handleModalEditTrigger = (goal: Goal) => {
    setSelectedGoalId(null);
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    measureCards();
    isReorderingRef.current = true;
    reorderGoals(idx, idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= filteredGoals.length - 1) return;
    measureCards();
    isReorderingRef.current = true;
    reorderGoals(idx, idx + 1);
  };

  const renderPageContent = (type: "deadlines" | "goals" | "habits") => {
    if (type === "habits") {
      const pageHabits = habits.filter((h) => {
        const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (h.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTag = !selectedTag || (h.tags || []).some(t => t.toLowerCase() === selectedTag.toLowerCase());
        return matchesSearch && matchesTag;
      });

      if (habitsLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-sans font-semibold tracking-widest text-zinc-500 uppercase animate-pulse">
              Loading Ledger
            </span>
          </div>
        );
      }

      if (pageHabits.length === 0) {
        return (
          <div className="text-center py-20 px-4 border border-dashed border-zinc-800/80 rounded-3xl select-none space-y-3 bg-zinc-950/20 backdrop-blur-md">
            <p className="text-xs text-zinc-400 font-light font-sans">
              No habits tracked in this ledger.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-white/5 bg-zinc-900 text-[10px] font-sans font-semibold tracking-wider text-zinc-200 hover:text-white rounded-xl transition-all"
            >
              Add a Habit
            </button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 gap-4">
          {pageHabits.map((habit, idx) => {
            return (
              <div
                key={habit.id}
                data-drag-id={habit.id}
              >
                <AppleHabitCard
                  habit={habit}
                  onTap={(h) => setSelectedHabitId(h.id)}
                  onEditTap={handleEditHabitTap}
                  entranceDelay={idx * 70}
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (type === "deadlines") {
      const pageDeadlines = deadlines.filter((d) => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });

      if (deadlinesLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
            <span className="text-[10px] font-sans font-semibold tracking-widest text-zinc-500 uppercase animate-pulse">
              Loading Ledger
            </span>
          </div>
        );
      }

      if (pageDeadlines.length === 0) {
        return (
          <div className="text-center py-20 px-4 border border-dashed border-zinc-800/80 rounded-3xl select-none space-y-3 bg-zinc-950/20 backdrop-blur-md">
            <p className="text-xs text-zinc-400 font-light font-sans">
              No active deadlines recorded.
            </p>
            <button
              onClick={handleAddTap}
              className="px-4 py-2 border border-white/5 bg-zinc-900 text-[10px] font-sans font-semibold tracking-wider text-zinc-200 hover:text-white rounded-xl transition-all"
            >
              Add a Deadline
            </button>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 gap-4">
          {pageDeadlines.map((deadline) => (
            <AppleDeadlineCard
              key={deadline.id}
              deadline={deadline}
              onEditTap={handleEditDeadlineTap}
            />
          ))}
        </div>
      );
    }

    const pageGoals = goals.filter((g) => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || g.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

      let matchesTab = true;
      if (type === "goals") {
        matchesTab = !g.tags.some(t => t.toLowerCase() === "habit") && 
                     !g.tags.some(t => t.toLowerCase() === "deadline") && 
                     !g.title.toLowerCase().includes("deadline");
      }

      return matchesSearch && matchesTag && matchesTab;
    });

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
          <span className="text-[10px] font-sans font-semibold tracking-widest text-zinc-500 uppercase animate-pulse">
            Loading Ledger
          </span>
        </div>
      );
    }

    if (pageGoals.length === 0) {
      return (
        <div className="text-center py-20 px-4 border border-dashed border-zinc-800/80 rounded-3xl select-none space-y-3 bg-zinc-950/20 backdrop-blur-md">
          <p className="text-xs text-zinc-400 font-light font-sans">
            No active goals in this category.
          </p>
          <button
            onClick={handleAddTap}
            className="px-4 py-2 border border-white/5 bg-zinc-900 text-[10px] font-sans font-semibold tracking-wider text-zinc-200 hover:text-white rounded-xl transition-all"
          >
            Add a Goal
          </button>
        </div>
      );
    }

    const canReorder = type === "goals" && !searchQuery && !selectedTag;

    return (
      <div className="grid grid-cols-1 gap-4">
        {pageGoals.map((goal, idx) => {
          return (
            <div
              key={goal.id}
              data-drag-id={goal.id}
            >
              <AppleGoalCard
                goal={goal}
                onTap={handleCardTap}
                onEditTap={handleEditTap}
                onMoveUp={canReorder ? (e) => { e.stopPropagation(); handleMoveUp(idx); } : undefined}
                onMoveDown={canReorder ? (e) => { e.stopPropagation(); handleMoveDown(idx); } : undefined}
                isFirst={idx === 0}
                isLast={idx === pageGoals.length - 1}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabs = (isForHeader: boolean) => {
    const tabIndices = { deadlines: 0, goals: 1, habits: 2 };
    const currentIndex = tabIndices[activeTab];
    const prevIndex = tabIndices[prevTab];
    const progress = progressRef.current;
    
    let leftStyle = `${currentIndex * 33.333}%`;
    let rightStyle = `${(2 - currentIndex) * 33.333}%`;
    let transitionStyle = currentIndex > prevIndex
      ? "right 320ms cubic-bezier(0.16, 1, 0.3, 1), left 380ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
      : currentIndex < prevIndex
        ? "left 320ms cubic-bezier(0.16, 1, 0.3, 1), right 380ms cubic-bezier(0.16, 1, 0.3, 1) 40ms"
        : "left 300ms ease-out, right 300ms ease-out";
        
    if (isDraggingActive) {
      const baseLeft = currentIndex * 33.333;
      const baseRight = (2 - currentIndex) * 33.333;
      
      let currentLeft = baseLeft;
      let currentRight = baseRight;

      if (progress < 0) {
        const lag = Math.pow(Math.abs(progress), 1.6) * -1;
        const lead = Math.pow(Math.abs(progress), 0.75) * -1;
        currentLeft = baseLeft - lag * 33.333;
        currentRight = baseRight + lead * 33.333;
      } else {
        const lead = Math.pow(progress, 0.75);
        const lag = Math.pow(progress, 1.6);
        currentLeft = baseLeft - lead * 33.333;
        currentRight = baseRight + lag * 33.333;
      }
      
      currentLeft = Math.max(0, Math.min(66.666, currentLeft));
      currentRight = Math.max(0, Math.min(66.666, currentRight));
      
      leftStyle = `${currentLeft}%`;
      rightStyle = `${currentRight}%`;
      transitionStyle = "none";
    }
    
    return (
      <div className="relative flex w-full h-full select-none">
        {/* iOS style sliding segmented indicator pill */}
        <div 
          ref={isForHeader ? headerPillRef : pillRef}
          className="absolute inset-y-0 animate-fade-in"
          style={{
            left: leftStyle,
            right: rightStyle,
            transition: transitionStyle
          }}
        >
          <div className="w-full h-full p-0.5">
            <div 
              className="w-full h-full bg-[#636366]/50 border border-white/[0.05] rounded-xl shadow origin-center transition-transform duration-100 ease-out" 
              style={{
                transform: isDraggingActive 
                  ? `scaleY(${1 - Math.abs(progress) * 0.12})` 
                  : undefined
              }}
            />
          </div>
        </div>

        {[
          { id: "deadlines" as const, label: "Deadlines" },
          { id: "goals" as const, label: "Goals" },
          { id: "habits" as const, label: "Habits" }
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setPrevTab(activeTab);
                setActiveTab(item.id);
              }}
              className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-xl transition-colors duration-300 relative z-10 ${
                isActive 
                  ? "text-white font-bold" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  };

  const syncError = goalsSyncError || habitsSyncError;
  const handleClearSyncError = () => {
    if (goalsSyncError) clearGoalsSyncError();
    if (habitsSyncError) clearHabitsSyncError();
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen text-white md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-zinc-900 pb-28 relative flex flex-col font-sans"
      style={{ zIndex: 1 }}
    >
      {/* Premium Apple Frosted Dynamic background */}
      <AppleBackground />
      
      {/* Dynamic Header */}
      <header className={`fixed top-0 left-0 right-0 mx-auto z-40 w-full md:max-w-md bg-[#1c1c1e]/60 backdrop-blur-xl transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden ${
        isTabDocked
          ? "h-24 border-b border-white/[0.06] shadow-lg"
          : isHeaderCompressed
            ? "h-14 border-b border-transparent shadow-none"
            : "h-[76px] border-b border-white/[0.04] shadow-none"
      }`}>
        <div className={`w-full flex items-center justify-between px-6 select-none transition-all duration-300 ${
          isHeaderCompressed || isTabDocked ? "h-14" : "h-[76px]"
        }`}>
          <div className={`flex items-center gap-2 select-none transition-transform duration-300 ease-out origin-left ${
            isHeaderCompressed || isTabDocked ? "scale-[0.91]" : "scale-100"
          }`}>
            <AppleAetherLogo />
          </div>

          <div className={`flex items-center gap-1 transition-transform duration-300 ease-out origin-right ${
            isHeaderCompressed || isTabDocked ? "scale-[0.91]" : "scale-100"
          }`}>
            <span className="text-[10px] font-sans font-medium text-zinc-500 hidden sm:inline-block mr-1.5">
              {user === "guest" ? "Guest Sandbox" : user.email?.split("@")[0]}
            </span>
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery("");
                }
              }}
              className={`p-2 rounded-full transition-all ${
                showSearch 
                  ? "text-white bg-zinc-800" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800/40"
              }`}
              aria-label="Toggle Search"
            >
              <Search size={15} />
            </button>

            <button
              onClick={() => logout()}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800/40 rounded-full transition-all"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Nested Tabs inside the Header for seamless blur */}
        <div className={`px-6 pb-2 w-full transition-all duration-300 ease-out ${
          isTabDocked ? "opacity-100 translate-y-0 h-10 visible" : "opacity-0 -translate-y-2 h-0 invisible pointer-events-none"
        }`}>
          {renderTabs(true)}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-6 pt-24 pb-6 space-y-6">
        {/* Sentinel to detect when tab hits header */}
        <div ref={sentinelRef} className="h-[1px] w-full pointer-events-none -mb-[1px]" />

        {/* Navigation Tabs (Deadlines, Goals, Habits) with Morphing Pill Switcher */}
        <div 
          className={`sticky top-[55px] z-30 flex select-none shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isTabDocked
              ? "opacity-0 pointer-events-none scale-[0.96]"
              : "opacity-100 scale-100 rounded-2xl border border-white/[0.04] bg-[#1c1c1e]/85 p-1 w-full"
          }`}
          style={{ marginTop: 0 }}
        >
          {renderTabs(false)}
        </div>

        {/* Search Bar (Spotlight Style) */}
        {showSearch && (
          <div className="relative animate-fade-in px-0.5">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1c1c1e]/80 border border-white/[0.05] rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/10 transition-colors animate-fade-in"
            />
          </div>
        )}

        {/* Tag Filters Row */}
        {tagsToDisplay.length > 0 && (
          <div 
            ref={tagsRef}
            className="flex items-center gap-2 overflow-x-auto pb-3 -mx-6 px-6 touch-pan-x flex-nowrap shrink-0 pointer-events-auto select-none cursor-grab active:cursor-grabbing scrollbar-none"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTag(null)}
              className={`py-1.5 px-4 text-[10px] font-sans font-semibold rounded-full border transition-all duration-300 active:scale-95 shrink-0 ${
                !selectedTag
                  ? "bg-white text-black border-transparent shadow-md scale-102"
                  : "bg-zinc-900/60 text-zinc-400 border-white/[0.05] hover:text-white"
              }`}
            >
              {activeTab === "habits" ? "All Habits" : activeTab === "deadlines" ? "All Deadlines" : "All Goals"}
            </button>
            {tagsToDisplay.map((tag) => {
              const isActive = selectedTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isActive ? null : tag)}
                  className={`py-1.5 px-4 text-[10px] font-sans font-semibold rounded-full border transition-all duration-300 shrink-0 active:scale-95 ${
                    isActive
                      ? "bg-white text-black border-transparent shadow-md scale-102"
                      : "bg-zinc-900/60 text-zinc-400 border-white/[0.05] hover:text-white"
                  }`}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport Slider Track */}
        <div className="w-full overflow-hidden py-2 -my-2 relative">
          <div 
            ref={trackRef}
            className="flex w-[300%] relative"
            style={{
              left: (() => {
                const activeIndex = activeTab === "deadlines" ? 0 : activeTab === "goals" ? 1 : 2;
                return `${-activeIndex * 100}%`;
              })(),
              transition: isDraggingActive 
                ? "none" 
                : "left 500ms cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* Page 1: Deadlines */}
            <div 
              ref={(el) => { pageRefs.current["deadlines"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("deadlines") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("deadlines")}
            >
              {renderPageContent("deadlines")}
            </div>

            {/* Page 2: Goals */}
            <div 
              ref={(el) => { pageRefs.current["goals"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("goals") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("goals")}
            >
              {renderPageContent("goals")}
            </div>

            {/* Page 3: Habits */}
            <div 
              ref={(el) => { pageRefs.current["habits"] = el; }}
              className={`w-1/3 shrink-0 ${isTabCollapsed("habits") ? "h-0 overflow-hidden" : ""}`}
              style={getTabStyle("habits")}
            >
              {renderPageContent("habits")}
            </div>
          </div>
        </div>
      </main>

      {/* Global Sync Error Banner */}
      {syncError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-full max-w-sm px-6 pointer-events-none">
          <div className="flex items-center justify-between p-4 bg-red-950/90 border border-red-900 rounded-lg shadow-2xl backdrop-blur-md pointer-events-auto">
            <span className="text-[11px] font-sans tracking-wide text-red-200">
              {syncError}
            </span>
            <button
              onClick={handleClearSyncError}
              className="ml-4 p-1 text-red-400 hover:text-white transition-colors"
              aria-label="Dismiss Error"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Add Goal Trigger Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent py-6 flex justify-center pointer-events-none">
        <button
          onClick={handleAddTap}
          className="pointer-events-auto relative flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white text-xs font-semibold rounded-full shadow-lg hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
          aria-label={activeTab === "deadlines" ? "Add New Deadline" : activeTab === "habits" ? "Add New Habit" : "Add New Goal"}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>
            {activeTab === "deadlines"
              ? "New Deadline"
              : activeTab === "habits"
              ? "New Habit"
              : "New Goal"}
          </span>
        </button>
      </div>

      {/* Full Screen Sliding Modals */}
      {selectedGoalId && (
        <GoalDetailModal
          goalId={selectedGoalId}
          onClose={() => setSelectedGoalId(null)}
          onEditTap={handleModalEditTrigger}
        />
      )}

      {selectedHabitId && (() => {
        const habit = habits.find((h) => h.id === selectedHabitId);
        return habit ? (
          <HabitAnalyticsModal
            habit={habit}
            onClose={() => setSelectedHabitId(null)}
          />
        ) : null;
      })()}

      {isFormOpen && (
        (() => {
          if (activeTab === "habits" || editingHabit) {
            return (
              <HabitFormModal
                editHabit={editingHabit}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingHabit(null);
                }}
              />
            );
          }

          if (activeTab === "deadlines" || editingDeadline) {
            return (
              <DeadlineFormModal
                editDeadline={editingDeadline}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingDeadline(null);
                }}
              />
            );
          }

          return (
            <GoalFormModal
              editGoal={editingGoal}
              onClose={() => {
                setIsFormOpen(false);
                setEditingGoal(null);
              }}
            />
          );
        })()
      )}
    </div>
  );
}
