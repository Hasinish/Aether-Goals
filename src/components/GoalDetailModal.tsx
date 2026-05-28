"use client";

import React, { useEffect, useState } from "react";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { X, Check, Edit2, Trash2 } from "lucide-react";
import SegmentedProgressBar from "./SegmentedProgressBar";

interface GoalDetailModalProps {
  goalId: string | null;
  onClose: () => void;
  onEditTap: (goal: Goal) => void;
}

export default function GoalDetailModal({ goalId, onClose, onEditTap }: GoalDetailModalProps) {
  const { goals, deleteGoal, toggleSubtask } = useGoalsStore();
  const goal = goals.find((g) => g.id === goalId);
  const goalExists = !!goal;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    // If the modal is open but the goal no longer exists (e.g. deleted), close it
    if (goalId && !goalExists) {
      onClose();
    }
  }, [goalId, goalExists, onClose]);

  if (!goal) return null;

  const subtasks = goal.subtasks || [];
  
  const completedCount = subtasks.filter((s) => s.is_complete).length;
  const totalCount = subtasks.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade-in md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-800">
      {/* Top Navigation / Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950">
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">Goal Overview</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEditTap(goal)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
            aria-label="Edit Goal"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className={`p-2 rounded-lg hover:bg-neutral-900 transition-colors ${
              isConfirmingDelete ? "text-red-500 bg-red-950/20" : "text-neutral-400 hover:text-red-500"
            }`}
            aria-label="Delete Goal"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        
        {/* Inline Deletion Confirmation Panel (FIX 9) */}
        {isConfirmingDelete && (
          <div className="p-4 border border-red-900 bg-red-950/20 rounded-lg flex flex-col gap-3 select-none animate-fade-in">
            <div className="text-xs text-red-400 font-bold tracking-wide uppercase">
              Permanently Delete Goal?
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Are you absolutely sure you want to delete this goal and all its subtasks? This process is irreversible.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteGoal(goal.id);
                    onClose();
                  } catch {
                    // Handled globally by store/UI
                  }
                }}
                className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-white bg-red-700 hover:bg-red-800 rounded-md transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Goal Hero Details */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {goal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            {goal.title}
          </h1>

          <div className="w-full h-[1px] bg-neutral-800 my-4" />

          <p className="text-xs text-neutral-400 leading-relaxed font-light">
            {goal.statusMessage || "On track to reach your goals."}
          </p>
        </div>

        {/* Progress Stats Box */}
        <div className="p-5 border border-neutral-800 bg-neutral-950 rounded-lg">
          <div className="flex items-baseline gap-4 mb-4 select-none">
            <span className="text-5xl font-extrabold tracking-tighter text-white">
              {goal.progressPercent || 0}%
            </span>
          </div>

          {/* Custom Segmented Progress Bar */}
          <SegmentedProgressBar
            progressPercent={goal.progressPercent || 0}
            totalSegments={30}
            heightClass="h-7"
            gapClass="gap-[3px]"
            activeColorClass="bg-neutral-200 opacity-100"
            segmentIdPrefix={`detail-segment-${goal.id}`}
          />

          <div className="flex justify-between items-center mt-4 text-[10px] font-mono text-neutral-500">
            <span>Progress Details</span>
            <span>{completedCount} of {totalCount} Subtasks Complete</span>
          </div>
        </div>

        {/* Checklist Header */}
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-widest font-mono text-neutral-500">Subtasks Checklist</h2>

          {subtasks.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No subtasks defined. Tap Edit to add some.</p>
          ) : (
            <div className="space-y-2.5">
              {subtasks.map((task) => {
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleSubtask(task.id)}
                    className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-md cursor-pointer hover:border-neutral-800 hover:bg-neutral-950/90 select-none transition-all duration-200"
                  >
                    {/* Custom Minimalist Checkbox */}
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ${
                        task.is_complete
                          ? "bg-white border-white text-black"
                          : "border-neutral-700 bg-transparent text-transparent"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>

                    <span
                      className={`text-xs leading-normal transition-all duration-300 ${
                        task.is_complete ? "text-neutral-500 line-through" : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
