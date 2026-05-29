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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const startDragY = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 320);
  }, [onClose]);

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

  // ── Drawer gesture handlers ────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("a")) return;
    if (formRef.current?.contains(target) && formRef.current.scrollTop > 0) return;
    setIsDragging(true);
    startDragY.current = e.clientY - dragY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - startDragY.current;
    if (delta < 0 && formRef.current?.contains(e.target as HTMLElement)) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragY(0);
      return;
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
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[92vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/10 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-2.5 cursor-grab active:cursor-grabbing select-none touch-none">
          <div className="w-12 h-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors" />
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
