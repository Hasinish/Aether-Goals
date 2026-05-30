"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Habit } from "../lib/types";
import { useHabitsStore, getErrorMessage } from "../lib/habitStore";
import {
  X,
  Activity,
  Flame,
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

const FORM_ICONS = [
  { name: "activity", component: Activity },
  { name: "flame", component: Flame },
  { name: "water", component: GlassWater },
  { name: "book", component: BookOpen },
  { name: "brain", component: Brain },
  { name: "heart", component: Heart },
  { name: "moon", component: Moon },
  { name: "sparkles", component: Sparkles },
  { name: "dumbbell", component: Dumbbell },
  { name: "apple", component: Apple },
  { name: "coffee", component: Coffee },
  { name: "clock", component: Clock },
];

interface HabitFormModalProps {
  editHabit: Habit | null; // null = create mode
  onClose: () => void;
}

export default function HabitFormModal({ editHabit, onClose }: HabitFormModalProps) {
  const { addHabit, updateHabit } = useHabitsStore();

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dailyTarget, setDailyTarget] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState("activity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sheet animation state
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const triggerCloseRef = useRef<() => void>(() => {});

  // Mouse-only drag refs (desktop handle)
  const mouseActiveRef = useRef(false);
  const mouseStartYRef = useRef(0);
  const mouseDragYRef = useRef(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.32s cubic-bezier(0.4, 0, 1, 1)";
      sheetRef.current.style.transform = "translateY(100%)";
    }
    setTimeout(onClose, 320);
  }, [onClose]);

  useEffect(() => { triggerCloseRef.current = triggerClose; }, [triggerClose]);

  // Pre-populate when editing
  useEffect(() => {
    if (editHabit) {
      setTitle(editHabit.title);
      setTagsInput((editHabit.tags ?? []).join(", "));
      setDailyTarget(editHabit.daily_target);
      setSelectedIcon(editHabit.icon ?? "activity");
    } else {
      setTitle("");
      setTagsInput("");
      setDailyTarget(1);
      setSelectedIcon("activity");
    }
    setError("");
  }, [editHabit]);

  // ── Native touch: smart scroll vs sheet-drag detection ─────────────────
  useEffect(() => {
    const sheet = sheetRef.current;
    const form = formRef.current;
    if (!sheet || !form) return;

    let startY = 0;
    let mode: "undecided" | "sheet" | "scroll" = "undecided";
    let currentDrag = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    const onTouchStart = (e: TouchEvent) => {
      const rawTarget = e.target as Node | null;
      if (!rawTarget) return;

      // Extract element safely (handling potential text nodes)
      const target = rawTarget instanceof Element ? rawTarget : rawTarget.parentElement;
      if (!target) return;

      const insideForm = form.contains(target);

      startY = e.touches[0].clientY;
      lastY = startY;
      lastTime = performance.now();
      velocity = 0;
      currentDrag = 0;

      if (!insideForm) {
        mode = "sheet";
      } else {
        mode = "undecided";
      }

      sheet.style.transition = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (y - lastY) / dt;
      lastY = y;
      lastTime = now;

      const deltaY = y - startY;

      if (mode === "undecided") {
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaY > 1) {
          if (deltaY > 0 && form.scrollTop <= 1) {
            mode = "sheet";
          } else {
            mode = "scroll";
          }
        } else {
          // Preemptively block native scroll/bounce initiation on any down drag at top
          if (deltaY > 0 && form.scrollTop <= 1 && e.cancelable) {
            e.preventDefault();
          }
        }
      } else if (mode === "scroll") {
        // If we are scrolling natively, but hit the top and continue pulling down
        if (form.scrollTop <= 1 && y > lastY) {
          mode = "sheet";
          startY = y; // Reset startY to drag sheet smoothly from 0
        }
      }

      if (mode === "sheet") {
        if (e.cancelable) {
          e.preventDefault();
        }
        currentDrag = Math.max(0, y - startY);
        sheet.style.transform = `translateY(${currentDrag}px)`;
      }
    };

    const onTouchEnd = () => {
      if (mode === "sheet") {
        if (currentDrag > 90 || velocity > 0.5) {
          triggerCloseRef.current();
        } else {
          sheet.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
          sheet.style.transform = "translateY(0px)";
        }
      }
      mode = "undecided";
      currentDrag = 0;
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    sheet.addEventListener("touchend", onTouchEnd, { passive: true });
    sheet.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", onTouchStart, { capture: true });
      sheet.removeEventListener("touchmove", onTouchMove, { capture: true });
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse-only pointer handlers for the drag handle pill ───────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    mouseActiveRef.current = true;
    mouseStartYRef.current = e.clientY;
    mouseDragYRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseActiveRef.current) return;
    const drag = Math.max(0, e.clientY - mouseStartYRef.current);
    mouseDragYRef.current = drag;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${drag}px)`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseActiveRef.current) return;
    mouseActiveRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (mouseDragYRef.current > 90) {
      triggerClose();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";
        sheetRef.current.style.transform = "translateY(0px)";
      }
    }
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => onPointerUp(e);

  const sheetTransform = isClosing || !isMounted ? "translateY(100%)" : "translateY(0px)";
  const sheetTransition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a habit name.");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editHabit) {
        await updateHabit(editHabit.id, trimmedTitle, tags, dailyTarget, selectedIcon);
      } else {
        await addHabit(trimmedTitle, tags, dailyTarget, selectedIcon);
      }
      triggerClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={triggerClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300"
        style={{ opacity: isClosing || !isMounted ? 0 : 1 }}
      />

      {/* Drawer */}
      <div
        ref={sheetRef}
        data-modal-sheet="true"
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[92vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/10 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
      >
        {/* Drag handle — visual affordance + mouse drag trigger */}
        <div 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className="flex items-center justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-700 hover:bg-neutral-500 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-900 select-none">
          <button
            type="button"
            onClick={triggerClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            {editHabit ? "Edit Habit" : "New Habit"}
          </h3>
          <div className="w-6" />
        </div>

        {/* Scrollable form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 pb-12 space-y-7"
        >
          {error && (
            <div className="p-3.5 border border-red-900 bg-red-950/40 rounded-md text-xs text-red-400 leading-normal">
              {error}
            </div>
          )}

          {/* Habit Name */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Habit Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read for 30 minutes"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., health, routine, daily"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Daily Target */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Daily Target Completions
            </label>
            <p className="text-[10px] text-neutral-600 font-mono -mt-1">
              How many times do you want to complete this habit each day?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = dailyTarget === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDailyTarget(num)}
                    className={`flex-1 h-12 font-mono text-sm rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-white text-black border-white font-extrabold shadow-[0_0_16px_rgba(255,255,255,0.15)]"
                        : "bg-transparent text-neutral-500 border-neutral-900 hover:text-white hover:border-neutral-700"
                    }`}
                  >
                    {num}×
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-3">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Choose Icon
            </label>
            <p className="text-[10px] text-neutral-600 font-mono -mt-1">
              Select a custom visual identifier for this habit.
            </p>
            <div className="grid grid-cols-6 gap-2.5">
              {FORM_ICONS.map((ico) => {
                const isSelected = selectedIcon === ico.name;
                const IconComponent = ico.component;
                return (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() => setSelectedIcon(ico.name)}
                    className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-br from-cyan-500 to-emerald-500 text-black border-transparent shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                        : "bg-neutral-950 text-neutral-500 border-neutral-850 hover:text-white hover:border-neutral-700"
                    }`}
                    title={ico.name}
                  >
                    <IconComponent size={18} strokeWidth={2.2} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-colors select-none"
            >
              {isSubmitting ? "Saving..." : editHabit ? "Update Habit" : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
