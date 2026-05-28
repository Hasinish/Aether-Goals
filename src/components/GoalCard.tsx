"use client";

import React from "react";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { MoreHorizontal, ArrowUpRight } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
  onEditTap: (goal: Goal, e: React.MouseEvent) => void;
}

export default function GoalCard({ goal, onTap, onEditTap }: GoalCardProps) {
  const { pendingGoalId } = useGoalsStore();
  const isPending = pendingGoalId === goal.id;

  // Configurable number of segments in the progress bar (e.g. 30 segments)
  const totalSegments = 30;
  const activeSegments = Math.round(((goal.progressPercent || 0) / 100) * totalSegments);
  
  return (
    <div
      onClick={() => !isPending && onTap(goal)}
      className={`group relative flex flex-col justify-between w-full min-h-[320px] p-6 bg-black border border-neutral-800 rounded-2xl cursor-pointer hover:border-neutral-700 select-none overflow-hidden transition-all duration-300 ${
        isPending ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Header Row: Tags and Options/Pending spinner */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap gap-1.5 max-w-[80%]">
          {goal.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {isPending ? (
          <div className="w-5 h-5 border-2 border-neutral-800 border-t-white rounded-full animate-spin shrink-0" />
        ) : (
          <button
            onClick={(e) => onEditTap(goal, e)}
            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors duration-200"
            aria-label="Goal Options"
          >
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {/* Goal Title */}
      <div className="flex-1 flex flex-col justify-start">
        <h2 className="text-3xl font-bold tracking-tight text-white line-clamp-2 leading-none mb-4">
          {goal.title}
        </h2>
        
        {/* Divider line matching the uploaded design */}
        <div className="w-full h-[1px] bg-neutral-800 mb-4" />
        
        {/* Status Message */}
        <p className="text-xs text-neutral-400 font-normal leading-relaxed mb-6">
          {goal.statusMessage || "On track to reach your goals."}
        </p>
      </div>

      {/* Stats and Segmented Progress Bar */}
      <div>
        {/* Stats Row */}
        <div className="flex items-baseline gap-4 mb-4 select-none">
          <span className="text-5xl font-extrabold tracking-tighter text-white">
            {goal.progressPercent || 0}%
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-white border border-neutral-800 bg-neutral-950 rounded-md">
              <ArrowUpRight size={12} className="text-white" />
              <span>+{goal.deltaPercent || 12}%</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">since you last checked</span>
          </div>
        </div>

        {/* Custom Segmented Progress Bar matching original screenshot */}
        <div className="flex items-center gap-[3px] w-full h-8 mt-2">
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const isActive = idx < activeSegments;
            return (
              <div
                key={idx}
                className={`flex-1 h-full rounded-[2px] transition-all duration-500 ${
                  isActive
                    ? "bg-neutral-200 opacity-100 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                    : "bg-neutral-800 opacity-40"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
