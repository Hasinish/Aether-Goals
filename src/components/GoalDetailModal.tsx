"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { Check, Edit2, Trash2 } from "lucide-react";
import SegmentedProgressBar from "./SegmentedProgressBar";

interface GoalDetailModalProps {
  goalId: string | null;
  onClose: () => void;
  onEditTap: (goal: Goal) => void;
}

export default function GoalDetailModal({
  goalId,
  onClose,
  onEditTap,
}: GoalDetailModalProps) {
  const { goals, deleteGoal, toggleSubtask } = useGoalsStore();
  const goal = goals.find((g) => g.id === goalId);
  const goalExists = !!goal;

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const startDragY = useRef(0);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 320);
  }, [onClose]);

  useEffect(() => {
    // Delay mount so the entry spring animation triggers
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (goalId && !goalExists) {
      triggerClose();
    }
  }, [goalId, goalExists, triggerClose]);

  // Don't render content until we have a goal
  if (!goal) return null;

  const subtasks = goal.subtasks || [];
  const completedCount = subtasks.filter((s) => s.is_complete).length;
  const totalCount = subtasks.length;

  // ── Pointer gesture handlers ──────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setIsDragging(true);
    startDragY.current = e.clientY - dragY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - startDragY.current;
    // Rubber-band resistance when dragging upward
    setDragY(delta < 0 ? delta * 0.2 : delta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (dragY > 90) {
      triggerClose();
    } else {
      setDragY(0);
    }
  };

  // ── Derived transform ─────────────────────────────────────────────────────
  const sheetTransform = isClosing || !isMounted
    ? "translateY(100%)"
    : `translateY(${dragY}px)`;

  const sheetTransition = isDragging
    ? "none"
    : "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={triggerClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300"
        style={{ opacity: isClosing || !isMounted ? 0 : 1 }}
      />

      {/* Spring Drawer Sheet */}
      <div
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[90vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/50 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
      >
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-center pt-2.5 pb-2 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="w-12 h-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors" />
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-neutral-900 select-none">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            Goal Overview
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEditTap(goal)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
              aria-label="Edit Goal"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className={`p-1.5 rounded-lg hover:bg-neutral-900 transition-colors ${
                isConfirmingDelete
                  ? "text-red-500 bg-red-950/20"
                  : "text-neutral-400 hover:text-red-500"
              }`}
              aria-label="Delete Goal"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 pb-8 space-y-5">
          {/* Delete confirmation */}
          {isConfirmingDelete && (
            <div className="p-4 border border-red-900 bg-red-950/20 rounded-lg flex flex-col gap-3 select-none animate-fade-in">
              <div className="text-xs text-red-400 font-bold tracking-wide uppercase">
                Permanently Delete Goal?
              </div>
              <p className="text-[11px] text-neutral-200 leading-relaxed">
                Are you absolutely sure? This process is irreversible.
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteGoal(goal.id);
                      triggerClose();
                    } catch {
                      // handled globally
                    }
                  }}
                  className="flex-1 py-2 text-[10px] font-mono uppercase tracking-widest text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          )}

          {/* Goal hero */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1">
              {goal.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-mono text-neutral-200 border border-neutral-850 bg-neutral-950 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              {goal.title}
            </h1>

            <div className="w-full h-px bg-neutral-900" />

            <p className="text-[11px] text-neutral-300 leading-relaxed font-light">
              {goal.statusMessage || "On track to reach your goals."}
            </p>
          </div>

          {/* Progress stats */}
          <div className="p-3.5 rounded-lg border-sweep-card-auto">
            <div className="flex items-baseline gap-2 mb-2 select-none">
              <span className="text-4xl font-extrabold tracking-tighter text-white">
                {goal.progressPercent || 0}%
              </span>
            </div>

            <SegmentedProgressBar
              progressPercent={goal.progressPercent || 0}
              totalSegments={30}
              heightClass="h-4"
              gapClass="gap-[3px]"
              segmentIdPrefix={`detail-segment-${goal.id}`}
            />

            <div className="flex justify-between items-center mt-2.5 text-[9px] font-mono text-neutral-300">
              <span>Progress Details</span>
              <span>
                {completedCount} of {totalCount} Subtasks Complete
              </span>
            </div>
          </div>

          {/* Subtasks checklist */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest font-mono text-neutral-300">
              Subtasks Checklist
            </h2>

            {subtasks.length === 0 ? (
              <p className="text-xs text-neutral-300 italic">
                No subtasks defined. Tap Edit to add some.
              </p>
            ) : (
              <div className="space-y-2.5">
                {subtasks.map((task, idx) => {
                  const pct = subtasks.length > 1 ? idx / (subtasks.length - 1) : 0;
                  const r = Math.round(6 + (16 - 6) * pct);
                  const g = Math.round(182 + (185 - 182) * pct);
                  const b = Math.round(212 + (129 - 212) * pct);
                  const checkboxColor = `rgb(${r}, ${g}, ${b})`;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      role="checkbox"
                      aria-checked={task.is_complete}
                      aria-label={`Toggle subtask: ${task.title}`}
                      onClick={() => toggleSubtask(task.id)}
                      className="w-full text-left flex items-center gap-3 p-3 border border-neutral-900 bg-neutral-950/60 rounded-md cursor-pointer hover:border-neutral-800 hover:bg-neutral-950/90 select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700"
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${
                          task.is_complete
                            ? "text-black animate-checkbox-spring"
                            : "border-neutral-700 bg-transparent text-transparent hover:border-neutral-500"
                        }`}
                        style={
                          task.is_complete
                            ? { backgroundColor: checkboxColor, borderColor: checkboxColor }
                            : undefined
                        }
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>

                      <span
                        className={`text-xs leading-normal transition-all duration-300 ${
                          task.is_complete
                            ? "text-neutral-400 animate-strike-sweep"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
