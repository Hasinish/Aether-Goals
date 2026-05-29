"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Goal } from "../lib/types";
import { useGoalsStore, createId } from "../lib/store";
import { X, Plus, Trash2, GripVertical } from "lucide-react";

interface GoalFormModalProps {
  editGoal: Goal | null; // Null means creating a new goal
  onClose: () => void;
}

interface FormSubtask {
  id?: string;
  title: string;
  is_complete?: boolean;
}

export default function GoalFormModal({ editGoal, onClose }: GoalFormModalProps) {
  const { addGoal, updateGoal } = useGoalsStore();
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [subtasks, setSubtasks] = useState<FormSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const [draggedOffset, setDraggedOffset] = useState<number>(0);
  const [isGliding, setIsGliding] = useState<boolean>(false);

  const formRef = useRef<HTMLFormElement>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartScrollTopRef = useRef<number>(0);
  const rowHeightRef = useRef<number>(56);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Drawer Spring Sheet States & Refs
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

  // ── Drawer Pointer gesture handlers ───────────────────────────────────────
  const handleDrawerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const target = e.target as HTMLElement;

    // Ignore drag inputs on interactive elements
    const isInteractive = target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest("a");
    if (isInteractive) return;

    // If clicking inside the scrollable form container, check if we're at the top
    if (formRef.current && formRef.current.contains(target)) {
      if (formRef.current.scrollTop > 0) {
        return;
      }
    }

    setIsDragging(true);
    startDragY.current = e.clientY - dragY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDrawerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const delta = e.clientY - startDragY.current;

    // If dragging up inside the scrollable form, cancel drag to let native scroll happen
    if (delta < 0 && formRef.current) {
      const target = e.target as HTMLElement;
      if (formRef.current.contains(target)) {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragY(0);
        return;
      }
    }

    // Rubber-band resistance when dragging upward
    setDragY(delta < 0 ? delta * 0.2 : delta);
  };

  const handleDrawerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
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

  // Clear dragging timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  // Pre-populate if editing
  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setTagsInput(editGoal.tags.join(", "));
      setSubtasks(
        (editGoal.subtasks || []).map((s) => ({
          id: s.id,
          title: s.title,
          is_complete: s.is_complete,
        }))
      );
    } else {
      setTitle("");
      setTagsInput("");
      setSubtasks([]);
    }
    setError("");
  }, [editGoal]);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    if (subtasks.some((s) => s.title.toLowerCase() === trimmed.toLowerCase())) {
      setError("This subtask already exists in the list.");
      return;
    }

    setSubtasks([...subtasks, { id: createId("subtask"), title: trimmed, is_complete: false }]);
    setNewSubtaskTitle("");
    setError("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleEditSubtaskTitle = (idx: number, newTitle: string) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, title: newTitle } : s))
    );
  };

  // --- POINTER EVENT DRAG SORTING HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>, idx: number) => {
    // Only drag with left mouse button / primary touch pointer
    if (e.button !== 0) return;

    const rowEl = e.currentTarget.closest("[data-subtask-id]") as HTMLElement;
    if (!rowEl) return;

    // Capture the pointer to trace moves even outside the grip handle/modal boundaries
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = rowEl.getBoundingClientRect();
    rowHeightRef.current = rect.height + 10; // 10px spacing (from space-y-2.5)

    dragStartYRef.current = e.clientY;
    dragStartScrollTopRef.current = formRef.current ? formRef.current.scrollTop : 0;

    draggedIndexRef.current = idx;
    hoveredIndexRef.current = idx;

    setDraggedIndex(idx);
    setHoveredIndex(idx);
    setDraggedOffset(0);
    setIsGliding(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const from = draggedIndexRef.current;
    if (from === null || isGliding) return;

    const currentY = e.clientY;
    const currentScrollTop = formRef.current ? formRef.current.scrollTop : 0;
    const scrollDelta = currentScrollTop - dragStartScrollTopRef.current;
    const deltaY = currentY - dragStartYRef.current + scrollDelta;

    setDraggedOffset(deltaY);

    const rowHeight = rowHeightRef.current;
    const slotDelta = Math.round(deltaY / rowHeight);
    let targetIdx = from + slotDelta;
    targetIdx = Math.max(0, Math.min(subtasks.length - 1, targetIdx));

    if (targetIdx !== hoveredIndexRef.current) {
      hoveredIndexRef.current = targetIdx;
      setHoveredIndex(targetIdx);
    }

    // Auto-scroll the form modal when dragging near boundaries
    if (formRef.current) {
      const containerRect = formRef.current.getBoundingClientRect();
      const threshold = 60;
      const relativeY = currentY - containerRect.top;

      if (relativeY < threshold) {
        formRef.current.scrollBy(0, -6);
      } else if (relativeY > containerRect.height - threshold) {
        formRef.current.scrollBy(0, 6);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const from = draggedIndexRef.current;
    const to = hoveredIndexRef.current;

    if (from === null || to === null) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const rowHeight = rowHeightRef.current;
    const targetOffset = (to - from) * rowHeight;

    // Transition to the target resting slot
    setIsGliding(true);
    setDraggedOffset(targetOffset);

    // Commit state changes after transition finishes (280ms)
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      if (from !== to) {
        setSubtasks((prev) => {
          const updated = [...prev];
          const [draggedItem] = updated.splice(from, 1);
          updated.splice(to, 0, draggedItem);
          return updated;
        });
      }

      // Reset all drag related state
      draggedIndexRef.current = null;
      hoveredIndexRef.current = null;
      setDraggedIndex(null);
      setHoveredIndex(null);
      setDraggedOffset(0);
      setIsGliding(false);
    }, 280);
  };
 
  const handleGripKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) return;
      setSubtasks((prev) => {
        const updated = [...prev];
        const [movedItem] = updated.splice(idx, 1);
        updated.splice(idx - 1, 0, movedItem);
        return updated;
      });
      requestAnimationFrame(() => {
        const buttons = formRef.current?.querySelectorAll("[data-subtask-grip]") as NodeListOf<HTMLButtonElement>;
        buttons[idx - 1]?.focus();
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (idx === subtasks.length - 1) return;
      setSubtasks((prev) => {
        const updated = [...prev];
        const [movedItem] = updated.splice(idx, 1);
        updated.splice(idx + 1, 0, movedItem);
        return updated;
      });
      requestAnimationFrame(() => {
        const buttons = formRef.current?.querySelectorAll("[data-subtask-grip]") as NodeListOf<HTMLButtonElement>;
        buttons[idx + 1]?.focus();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please provide a goal title.");
      return;
    }

    // Filter out any empty subtask titles that were accidentally blanked out by the user
    const validatedSubtasks = subtasks
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title.length > 0);

    // Process and deduplicate tags
    const processedTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    );

    setIsSubmitting(true);
    try {
      if (editGoal) {
        // Pass full subtask structures to keep ID mappings intact
        await updateGoal(editGoal.id, trimmedTitle, processedTags, validatedSubtasks);
      } else {
        // Pass just titles for new goals (which generates IDs)
        await addGoal(
          trimmedTitle,
          processedTags,
          validatedSubtasks.map((s) => s.title)
        );
      }
      triggerClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to save goal.");
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

      {/* Spring Drawer Sheet */}
      <div
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[90vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/50 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
        onPointerDown={handleDrawerPointerDown}
        onPointerMove={handleDrawerPointerMove}
        onPointerUp={handleDrawerPointerUp}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center pt-3 pb-2.5 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="w-12 h-1 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors" />
        </div>

        {/* Top Header */}
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
            {editGoal ? "Edit Goal" : "Create Goal"}
          </h3>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Form Content (Scrollable) */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 pb-12 space-y-6"
        >
          {error && (
            <div className="p-3.5 border border-red-900 bg-red-950/40 rounded-md text-xs text-red-400 leading-normal">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Code Visualizer Project"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., dev, front-end, structure"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(
                  new Set(
                    tagsInput
                      .split(",")
                      .map((t) => t.trim().toLowerCase())
                      .filter((t) => t.length > 0)
                  )
                ).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-mono text-neutral-400 border border-neutral-800 bg-neutral-950 rounded"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Subtasks Builder */}
          <div className="space-y-4 pt-2 border-t border-neutral-900">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Subtasks Checklist (Drag handle to sort, tap title to rename)
            </label>

            {/* Add Subtask Sub-Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask title..."
                className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                aria-label="Add Subtask"
                className="flex items-center justify-center p-3 border border-neutral-800 bg-neutral-950 text-white rounded-md hover:border-neutral-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Subtask list */}
            <div className="space-y-2.5">
              {subtasks.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic py-2">
                  No subtasks added yet. Define some checkpoints above to calculate progress.
                </p>
              ) : (
                subtasks.map((task, idx) => {
                  const isDraggingActive = draggedIndex !== null && hoveredIndex !== null;
                  const isCurrentDragged = draggedIndex === idx;
                  let translateY = 0;

                  if (isDraggingActive) {
                    if (isCurrentDragged) {
                      translateY = draggedOffset;
                    } else {
                      const rowHeight = rowHeightRef.current;
                      if (hoveredIndex > draggedIndex) {
                        if (idx > draggedIndex && idx <= hoveredIndex) {
                          translateY = -rowHeight;
                        }
                      } else if (hoveredIndex < draggedIndex) {
                        if (idx >= hoveredIndex && idx < draggedIndex) {
                          translateY = rowHeight;
                        }
                      }
                    }
                  }

                  // Premium visual styling rules
                  let cardClassName = "relative z-0 bg-neutral-950/40 border-neutral-900 opacity-100 scale-100 text-neutral-200";
                  if (isDraggingActive) {
                    if (isCurrentDragged) {
                      cardClassName = "relative z-50 bg-neutral-900/95 border-neutral-600 backdrop-blur-md scale-[1.02] shadow-[0_12px_32px_rgba(0,0,0,0.85)] text-white";
                    } else {
                      cardClassName = "relative z-0 bg-neutral-950/30 border-neutral-950/60 opacity-50 scale-[0.98] text-neutral-400";
                    }
                  }

                  const transitionStyle = isDraggingActive
                    ? isCurrentDragged && !isGliding
                      ? "box-shadow 0.28s, border-color 0.28s, background-color 0.28s, opacity 0.28s, transform 0s"
                      : "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms, border-color 280ms, background-color 280ms, opacity 280ms"
                    : "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms, border-color 280ms, background-color 280ms";

                  return (
                    <div
                      key={task.id}
                      data-subtask-index={idx}
                      data-subtask-id={task.id}
                      className={`flex items-center justify-between gap-3 p-3.5 border rounded-md focus-within:border-neutral-700 select-none ${cardClassName}`}
                      style={{
                        transform: `translateY(${translateY}px)`,
                        transition: transitionStyle,
                      }}
                    >
                      {/* Grip Handle Icon (Restricted Draggability Handle via PointerEvents) */}
                      <button
                        type="button"
                        data-subtask-grip="true"
                        aria-label={`Move subtask "${task.title}" up or down`}
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onKeyDown={(e) => handleGripKeyDown(e, idx)}
                        className="cursor-grab active:cursor-grabbing p-1 text-neutral-600 hover:text-neutral-400 focus-visible:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded transition-colors shrink-0 touch-none"
                      >
                        <GripVertical size={14} />
                      </button>

                      <input
                        type="text"
                        required
                        value={task.title}
                        onChange={(e) => handleEditSubtaskTitle(idx, e.target.value)}
                        className="flex-1 bg-transparent border-none text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none"
                      />
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                        aria-label="Remove Subtask"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Bar */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-md hover:bg-neutral-200 disabled:opacity-50 transition-colors select-none"
            >
              {isSubmitting ? "Saving..." : editGoal ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
