"use client";

import React, { useState, useEffect, useRef } from "react";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { MoreHorizontal, ArrowUpRight, Edit2, Trash2 } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
  onEditTap: (goal: Goal, e: React.MouseEvent) => void;
}

export default function GoalCard({ goal, onTap, onEditTap }: GoalCardProps) {
  const { pendingGoalId, deleteGoal } = useGoalsStore();
  const isPending = pendingGoalId === goal.id;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Configurable number of segments in the progress bar (e.g. 30 segments)
  const totalSegments = 30;
  const activeSegments = Math.round(((goal.progressPercent || 0) / 100) * totalSegments);

  // Close the dropdown when clicking outside of it
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

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm(`Are you sure you want to permanently delete the goal "${goal.title}"?`)) {
      await deleteGoal(goal.id);
    }
  };
  
  return (
    <div
      onClick={() => !isPending && onTap(goal)}
      onMouseLeave={() => setShowMenu(false)} // Auto-close when cursor exits card (sleek usability)
      className={`group relative flex flex-col justify-between w-full min-h-[320px] p-6 bg-black border border-neutral-800 rounded-2xl cursor-pointer hover:border-neutral-700 select-none overflow-visible transition-all duration-300 ${
        isPending ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Header Row: Tags and Options/Pending spinner */}
      <div className="flex items-center justify-between gap-4 mb-5 relative">
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className={`p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors duration-200 ${
                showMenu ? "text-white bg-neutral-900" : ""
              }`}
              aria-label="Goal Options"
            >
              <MoreHorizontal size={18} />
            </button>

            {/* Dropdown Options Popup Menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 z-30 w-40 p-1.5 bg-neutral-950 border border-neutral-850 border-neutral-800 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.8)] animate-fade-in select-none">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] uppercase tracking-wider font-mono text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors text-left"
                >
                  <Edit2 size={12} />
                  <span>Edit Goal</span>
                </button>
                <div className="w-full h-[1px] bg-neutral-900 my-1" />
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] uppercase tracking-wider font-mono text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors text-left"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
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
