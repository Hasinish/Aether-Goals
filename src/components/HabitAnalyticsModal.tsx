"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Habit, HabitLog } from "../lib/types";
import { X, Calendar, Award, CheckCircle, Percent, Flame } from "lucide-react";
function friendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface HabitAnalyticsModalProps {
  habit: Habit;
  onClose: () => void;
}

export default function HabitAnalyticsModal({ habit, onClose }: HabitAnalyticsModalProps) {
  const [activeMonthOffset, setActiveMonthOffset] = useState(0); // 0 = current month, 1 = 1 month ago, 2 = 2 months ago
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const startDragY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 320);
  }, [onClose]);

  // ── Gestures ─────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("select") || target.closest("a")) return;

    // If clicking inside the scrollable container, check if we're at the top.
    // If we're scrolled down, let standard scrolling work.
    if (scrollRef.current && scrollRef.current.contains(target)) {
      if (scrollRef.current.scrollTop > 0) {
        return;
      }
    }

    setIsDragging(true);
    startDragY.current = e.clientY - dragY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - startDragY.current;

    // If dragging up inside the scrollable area, cancel sheet drag to allow native scroll down
    if (delta < 0 && scrollRef.current) {
      const target = e.target as HTMLElement;
      if (scrollRef.current.contains(target)) {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragY(0);
        return;
      }
    }

    setDragY(delta < 0 ? delta * 0.2 : delta);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragY > 90) triggerClose();
    else setDragY(0);
  };

  const sheetTransform = isClosing || !isMounted ? "translateY(100%)" : `translateY(${dragY}px)`;
  const sheetTransition = isDragging ? "none" : "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";

  // ── Month calculations ────────────────────────────────────────────────────
  const months = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        year: d.getFullYear(),
        month: d.getMonth(), // 0-indexed
      });
    }
    return list;
  }, []);

  const selectedMonth = months[activeMonthOffset];

  // ── Build monthly logs and calendar days ──────────────────────────────
  const { calendarDays, stats } = React.useMemo(() => {
    if (!selectedMonth) return { calendarDays: [], stats: { totalCompleted: 0, completionRate: 0, partialDays: 0, perfectDays: 0 } };

    const { year, month } = selectedMonth;
    const logMap = new Map<string, number>();
    (habit.logs ?? []).forEach((l) => logMap.set(l.log_date, l.completions));

    // Get first day of month and total days
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map Sun-based getDay() to Mon-based (0 = Mon, ..., 6 = Sun)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: {
      dateStr: string;
      dayNumber: number;
      state: "complete" | "partial" | "empty" | "future";
      completions: number;
      isToday: boolean;
    }[] = [];

    // Empty spaces before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        dateStr: "",
        dayNumber: 0,
        state: "future",
        completions: 0,
        isToday: false,
      });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let perfectDays = 0;
    let partialDays = 0;
    let trackableDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const completions = logMap.get(dateStr) ?? 0;
      const isToday = dateStr === todayStr;
      const isFuture = current > today;

      let state: "complete" | "partial" | "empty" | "future";
      if (isFuture) {
        state = "future";
      } else {
        trackableDays++;
        if (completions >= habit.daily_target) {
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
        isToday,
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
  }, [selectedMonth, habit.logs, habit.daily_target]);

  const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={triggerClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300 animate-fade-in"
        style={{ opacity: isClosing || !isMounted ? 0 : 1 }}
      />

      {/* Spring Drawer Sheet */}
      <div
        ref={sheetRef}
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[90vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/50 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
      >
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex items-center justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
        >
          <div className="w-12 h-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors" />
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-neutral-900 select-none shrink-0">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            Habit Analytics
          </h3>
          <button
            onClick={triggerClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
            aria-label="Close analytics"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 pb-8 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5 line-clamp-1 leading-snug">
              {habit.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 border border-cyan-500/20 text-cyan-400 bg-cyan-950/25 rounded-md">
                Target: {habit.daily_target} / day
              </span>
              {habit.streak !== undefined && habit.streak > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 border border-orange-500/20 text-orange-400 bg-orange-950/25 rounded-md flex items-center gap-1">
                  <Flame size={10} className="fill-orange-500/20 text-orange-400 animate-pulse" />
                  {habit.streak} day streak
                </span>
              )}
            </div>
          </div>

          {/* Month Selector Tabs */}
          <div className="flex items-center border-b border-neutral-900 p-0.5 gap-1 bg-neutral-950 rounded-lg shrink-0">
            {months.map((m, idx) => (
              <button
                key={m.label}
                onClick={() => setActiveMonthOffset(idx)}
                className={`flex-1 py-2 text-[10px] uppercase font-mono tracking-wider transition-all rounded-md border ${
                  activeMonthOffset === idx
                    ? "bg-neutral-900 border-neutral-850 text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300 border-transparent"
                }`}
              >
                {m.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-neutral-900 bg-white/[0.01] rounded-xl flex flex-col justify-between min-h-[75px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 uppercase">
                <Percent size={11} className="text-cyan-400" />
                <span>Success</span>
              </div>
              <span className="text-lg font-bold font-mono text-white mt-1">
                {stats.completionRate}%
              </span>
            </div>

            <div className="p-3 border border-neutral-900 bg-white/[0.01] rounded-xl flex flex-col justify-between min-h-[75px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 uppercase">
                <CheckCircle size={11} className="text-emerald-400" />
                <span>Perfect</span>
              </div>
              <span className="text-lg font-bold font-mono text-white mt-1">
                {stats.perfectDays} <span className="text-[10px] font-mono text-neutral-600">days</span>
              </span>
            </div>

            <div className="p-3 border border-neutral-900 bg-white/[0.01] rounded-xl flex flex-col justify-between min-h-[75px]">
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 uppercase">
                <Award size={11} className="text-cyan-400" />
                <span>Partial</span>
              </div>
              <span className="text-lg font-bold font-mono text-white mt-1">
                {stats.partialDays} <span className="text-[10px] font-mono text-neutral-600">days</span>
              </span>
            </div>
          </div>

          {/* Monthly Calendar View */}
          <div className="border border-neutral-900 bg-neutral-950/60 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar size={13} className="text-cyan-400" />
              <span className="text-[11px] uppercase tracking-wider font-mono font-semibold">
                {selectedMonth.label}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-mono text-neutral-600 font-bold border-b border-neutral-900 pb-2">
              {WEEK_LABELS.map((lbl) => (
                <div key={lbl}>{lbl}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day.dayNumber === 0) {
                  return <div key={`empty-${idx}`} />;
                }

                return (
                  <div
                    key={day.dateStr}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-all duration-300 relative ${
                      day.state === "complete"
                        ? "bg-gradient-to-br from-cyan-500 to-emerald-500 border-transparent text-black font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                        : day.state === "partial"
                        ? "bg-cyan-900/40 border-cyan-800/40 text-cyan-400 font-bold"
                        : day.state === "future"
                        ? "bg-transparent border-transparent text-neutral-700"
                        : "bg-white/[0.02] border-white/[0.08] text-neutral-400"
                    } ${day.isToday ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-black" : ""}`}
                    title={
                      day.state !== "future"
                        ? `${day.dateStr} · ${day.completions}/${habit.daily_target} completions`
                        : "Future"
                    }
                  >
                    <span className="text-[10px] font-mono">{day.dayNumber}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
