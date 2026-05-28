"use client";

import React, { useState, useEffect } from "react";
import { Goal } from "../lib/types";
import { useGoalsStore } from "../lib/store";
import { X, Plus, Trash2 } from "lucide-react";

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

    setSubtasks([...subtasks, { title: trimmed, is_complete: false }]);
    setNewSubtaskTitle("");
    setError("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please provide a goal title.");
      return;
    }

    // Process tags
    const processedTags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);
    try {
      if (editGoal) {
        // Pass full subtask structures to keep ID mappings intact
        await updateGoal(editGoal.id, trimmedTitle, processedTags, subtasks);
      } else {
        // Pass just titles for new goals (which generates IDs)
        await addGoal(
          trimmedTitle,
          processedTags,
          subtasks.map((s) => s.title)
        );
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || "Failed to save goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white animate-fade-in md:max-w-md md:mx-auto md:shadow-2xl md:border-x md:border-neutral-800">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950">
        <button
          onClick={onClose}
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
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-3.5 border border-red-900 bg-red-950/40 rounded-xl text-xs text-red-400 leading-normal">
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
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
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
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {tagsInput.trim() && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tagsInput
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter((t) => t.length > 0)
                .map((tag, idx) => (
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
            Subtasks Checklist
          </label>

          {/* Add Subtask Sub-Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add subtask title..."
              className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
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
              className="flex items-center justify-center p-3 border border-neutral-800 bg-neutral-950 text-white rounded-xl hover:border-neutral-600 transition-colors"
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
              subtasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3.5 border border-neutral-900 bg-neutral-950/40 rounded-xl"
                >
                  <span className="text-xs text-neutral-300">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    aria-label="Remove Subtask"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-colors select-none"
          >
            {isSubmitting ? "Saving..." : editGoal ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </div>
  );
}
