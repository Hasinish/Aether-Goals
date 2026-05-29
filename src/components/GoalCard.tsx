"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { MoreHorizontal, Edit2, Trash2, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import SegmentedProgressBar from "./SegmentedProgressBar";

interface GoalCardProps {
  goal: Goal;
  onTap: (goal: Goal) => void;
  onEditTap: (goal: Goal, e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function GoalCard({ 
  goal, 
  onTap, 
  onEditTap,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false
}: GoalCardProps) {
  const { deleteGoal, pendingGoalIds } = useGoalsStore();
  const isPending = pendingGoalIds.has(goal.id);
  const displayPercent = useCountUp(goal.progressPercent || 0, 900);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && onTap(goal)}
      onMouseLeave={() => setShowMenu(false)}
      className={`group relative flex flex-col justify-between w-full min-h-[160px] p-4 rounded-lg cursor-pointer select-none overflow-visible ${
        isPending || showDeleteConfirm
          ? "bg-neutral-950 border border-neutral-800" + (isPending ? " opacity-50 pointer-events-none" : "")
          : "border-sweep-card"
      }`}
    >
      {/* Inline delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/95 border border-red-900/50 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-[11px] font-mono text-neutral-300 text-center leading-relaxed">
            Delete <span className="text-white font-semibold">&ldquo;{goal.title}&rdquo;</span>?<br />
            <span className="text-neutral-500">This cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleCancelDelete}
              className="flex-1 py-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2 text-[10px] font-mono uppercase tracking-widest text-white bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Top Header Row: Tags and Options/Pending spinner */}
      <div className="flex items-center justify-between gap-4 mb-3.5 relative">
        <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
          {/* Up / Down chevrons for reordering */}
          {(onMoveUp || onMoveDown) && (
            <div className="flex items-center bg-neutral-950 border border-neutral-900 rounded-lg p-1 shrink-0 mr-1.5 select-none" onClick={(e) => e.stopPropagation()}>
              <button
                disabled={isFirst}
                onClick={onMoveUp}
                aria-label="Move Goal Up"
                className={`p-1.5 rounded-md transition-all ${
                  isFirst
                    ? "text-neutral-700 opacity-30 pointer-events-none"
                    : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                }`}
                title="Move Goal Up"
              >
                <ChevronUp size={14} />
              </button>
              <div className="w-[1px] h-3 bg-neutral-900 mx-0.5" />
              <button
                disabled={isLast}
                onClick={onMoveDown}
                aria-label="Move Goal Down"
                className={`p-1.5 rounded-md transition-all ${
                  isLast
                    ? "text-neutral-700 opacity-30 pointer-events-none"
                    : "text-neutral-500 hover:text-white hover:bg-neutral-900"
                }`}
                title="Move Goal Down"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
          {goal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono text-neutral-400 border border-neutral-800 bg-neutral-950/60 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {isPending ? (
          <div className="w-4 h-4 border-2 border-neutral-800 border-t-white rounded-full animate-spin shrink-0" />
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className={`p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors duration-200 ${
                showMenu ? "text-white bg-neutral-900" : ""
              }`}
              aria-label="Goal Options"
            >
              <MoreHorizontal size={15} />
            </button>

            {/* Dropdown Options Popup Menu */}
            {showMenu && (
              <div className="absolute right-0 top-6 z-30 w-36 p-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.8)] animate-fade-in select-none">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors text-left"
                >
                  <Edit2 size={10} />
                  <span>Edit Goal</span>
                </button>
                <div className="w-full h-[1px] bg-neutral-900 my-1" />
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-wider font-mono text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors text-left"
                >
                  <Trash2 size={10} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Goal Title */}
      <div className="flex-1 flex flex-col justify-start mb-3">
        <h2 className="text-lg font-bold tracking-tight text-white line-clamp-1 leading-snug">
          {goal.title}
        </h2>
      </div>

      {/* Stats and Segmented Progress Bar */}
      <div>
        {/* Stats Row */}
        <div className="flex items-center justify-between gap-4 mb-2 select-none">
          <span className="text-white font-mono text-sm tracking-wider font-extrabold">
            {displayPercent}%
          </span>
        </div>

        {/* Custom Segmented Progress Bar */}
        <div className="mt-1">
          <SegmentedProgressBar
            progressPercent={goal.progressPercent || 0}
            totalSegments={30}
            heightClass="h-8"
            gapClass="gap-[3px]"
            segmentIdPrefix={`segment-${goal.id}`}
          />
        </div>
      </div>


    </div>
  );
}
