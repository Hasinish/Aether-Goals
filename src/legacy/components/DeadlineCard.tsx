"use client";

import React, { useState, useEffect, useRef } from "react";
import { Deadline } from "../../lib/types";
import { useDeadlinesStore } from "../../lib/deadlineStore";
import { MoreHorizontal, Edit2, Trash2, AlertTriangle, Check, Clock } from "lucide-react";

interface DeadlineCardProps {
  deadline: Deadline;
  onEditTap: (deadline: Deadline) => void;
}

export default function DeadlineCard({ deadline, onEditTap }: DeadlineCardProps) {
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

  // ── Countdown Timer & Urgency State Ticker ────────────────────────────────
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

      // Calculate time components
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      // Format string
      let text = "";
      if (days > 0) {
        text += `${days}d ${hours}h ${mins}m`;
      } else if (hours > 0) {
        text += `${hours}h ${mins}m ${secs}s`;
      } else {
        text += `${mins}m ${secs}s`;
      }
      setTimeRemainingText(text);

      // Urgency glowing dots
      if (diff < 1000 * 60 * 60 * 24) {
        // < 24 Hours
        setUrgency("red");
      } else if (diff < 1000 * 60 * 60 * 24 * 3) {
        // < 3 Days
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
      // Handled via store error state
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

  // Urgency glow class definitions
  const urgencyDotClass = {
    red: "bg-red-500 shadow-[0_0_12px_#ef4444]",
    yellow: "bg-yellow-500 shadow-[0_0_12px_#eab308]",
    green: "bg-emerald-500 shadow-[0_0_12px_#10b981]",
  }[urgency];

  return (
    <div
      onClick={() => !isPending && !showDeleteConfirm && toggleDeadlineCompletion(deadline.id)}
      className={`group relative flex flex-col justify-between w-full p-4 rounded-lg select-none overflow-visible transition-all duration-300 border-sweep-card ${
        isPending
          ? "bg-white/20 border border-white/30 opacity-70 pointer-events-none backdrop-blur-[12px]"
          : deadline.completed
          ? "bg-neutral-950/40 opacity-70"
          : ""
      }`}
    >
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/95 border border-red-900/50 p-5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-[11px] font-mono text-neutral-300 text-center leading-relaxed">
            Delete Deadline <span className="text-white font-semibold">&ldquo;{deadline.title}&rdquo;</span>?<br />
            <span className="text-neutral-500">This cannot be undone.</span>
          </p>
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-neutral-950 rounded-md hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-2.5 text-[10px] font-mono uppercase tracking-widest text-white bg-red-700 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Header Row: Title & options */}
      <div className="flex items-start justify-between gap-3 mb-3 relative">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Quick Check toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDeadlineCompletion(deadline.id);
            }}
            disabled={isPending}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 overflow-visible ${
              deadline.completed
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 border-transparent text-black"
                : "border-neutral-800 bg-neutral-950 text-neutral-600 hover:text-neutral-300 hover:border-neutral-700"
            }`}
            title={deadline.completed ? "Mark Incomplete" : "Mark Completed"}
          >
            {deadline.completed && <Check size={12} strokeWidth={3} />}
          </button>

          <div className="flex flex-col min-w-0">
            <h3
              className={`text-lg font-bold tracking-tight text-white line-clamp-1 leading-snug ${
                deadline.completed ? "line-through text-neutral-500" : ""
              }`}
            >
              {deadline.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={10} className="text-neutral-500 shrink-0" />
              <p className="text-[10px] font-mono tracking-wide text-neutral-500 shrink-0">
                {formattedDueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu((s) => !s)}
            className={`p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors ${
              showMenu ? "text-white bg-neutral-900" : ""
            }`}
            aria-label="Deadline Options"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-30 w-36 p-1 bg-neutral-950 border border-neutral-800 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.85)] animate-fade-in">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEditTap(deadline);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-200 hover:text-white hover:bg-neutral-900 rounded-md transition-colors text-left"
              >
                <Edit2 size={10} />
                <span>Edit Info</span>
              </button>
              <div className="w-full h-[1px] bg-neutral-900 my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors text-left"
              >
                <Trash2 size={10} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Countdown and Urgency Dot */}
      <div className="flex items-center justify-between mt-1 bg-neutral-950/60 border border-neutral-900 p-2.5 rounded-lg select-none">
        <div className="flex items-center gap-2 min-w-0">
          {/* Glowing Urgency Dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 shrink-0 ${urgencyDotClass} ${
              urgency === "red" && !deadline.completed ? "animate-pulse" : ""
            }`}
          />
          <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 shrink-0">
            Time Remaining:
          </span>
        </div>
        <span
          className={`font-mono text-sm font-extrabold tracking-wider shrink-0 ${
            deadline.completed
              ? "text-neutral-500"
              : urgency === "red"
              ? "text-red-400"
              : urgency === "yellow"
              ? "text-yellow-400"
              : "text-emerald-400"
          }`}
        >
          {deadline.completed ? "Completed" : timeRemainingText}
        </span>
      </div>
    </div>
  );
}
