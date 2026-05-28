"use client";

import React, { useEffect, useState } from "react";
import { Goal, Subtask } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { X, Check, Edit2, Trash2, ArrowUpRight } from "lucide-react";

interface GoalDetailModalProps {
  goalId: string | null;
  onClose: () => void;
  onEditTap: (goal: Goal) => void;
}

export default function GoalDetailModal({ goalId, onClose, onEditTap }: GoalDetailModalProps) {
  const { goals, toggleSubtask, deleteGoal } = useGoalsStore();
  const [goal, setGoal] = useState<Goal | null>(null);

  // Sync state with global store whenever goals array updates or selected ID changes
  useEffect(() => {
    if (goalId) {
      const found = goals.find((g) => g.id === goalId);
      if (found) {
        setGoal(found);
      } else {
        onClose(); // Goal was deleted
      }
    } else {
      setGoal(null);
    }
  }, [goals, goalId, onClose]);

  if (!goal) return null;

  const totalSegments = 30;
  const activeSegments = Math.round(((goal.progressPercent || 0) / 100) * totalSegments);
  const subtasks = goal.subtasks || [];
  
  const completedCount = subtasks.filter((s) => s.is_complete).length;
  const totalCount = subtasks.length;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteGoal(goal.id);
      onClose();
    }
  };

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
            onClick={handleDelete}
            className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-900 transition-colors"
            aria-label="Delete Goal"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        
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
        <div className="p-5 border border-neutral-800 bg-neutral-950 rounded-2xl">
          <div className="flex items-baseline gap-4 mb-4 select-none">
            <span className="text-5xl font-extrabold tracking-tighter text-white">
              {goal.progressPercent || 0}%
            </span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-white border border-neutral-800 bg-neutral-900 rounded-md">
                <ArrowUpRight size={12} className="text-white" />
                <span>+{goal.deltaPercent || 12}%</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">since you last checked</span>
            </div>
          </div>

          {/* Custom Segmented Progress Bar */}
          <div className="flex items-center gap-[3px] w-full h-7">
            {Array.from({ length: totalSegments }).map((_, idx) => {
              const isActive = idx < activeSegments;
              return (
                <div
                  key={idx}
                  className={`flex-1 h-full rounded-[2px] transition-all duration-500 ${
                    isActive ? "bg-neutral-200 opacity-100" : "bg-neutral-850 bg-neutral-800 opacity-30"
                  }`}
                />
              );
            })}
          </div>

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
                    className="flex items-center gap-4 p-4 border border-neutral-900 bg-neutral-950/60 rounded-xl cursor-pointer hover:border-neutral-800 hover:bg-neutral-950/90 select-none transition-all duration-200"
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
