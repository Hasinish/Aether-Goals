"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Deadline } from "../lib/types";
import { useDeadlinesStore } from "../lib/deadlineStore";
import { X, Calendar, Sparkles, AlertTriangle } from "lucide-react";
import * as chrono from "chrono-node";
import { useBottomSheetDrag } from "../hooks/useBottomSheetDrag";

interface DeadlineFormModalProps {
  editDeadline: Deadline | null; // null = create mode
  onClose: () => void;
}

export default function DeadlineFormModal({ editDeadline, onClose }: DeadlineFormModalProps) {
  const { addDeadline, updateDeadline } = useDeadlinesStore();

  const [title, setTitle] = useState("");
  const [nlpInput, setNlpInput] = useState("");
  const [manualDate, setManualDate] = useState(""); // YYYY-MM-DDTHH:MM
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sheet animation state
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const triggerClose = useCallback(() => {
    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.32s cubic-bezier(0.4, 0, 1, 1)";
      sheetRef.current.style.transform = "translateY(100%)";
    }
    setTimeout(onClose, 320);
  }, [onClose]);

  useBottomSheetDrag({
    sheetRef,
    scrollRef: formRef,
    onClose: triggerClose,
  });

  const sheetTransform = isClosing || !isMounted ? "translateY(100%)" : "translateY(0px)";
  const sheetTransition = "transform 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.18)";

  // Pre-populate when editing
  useEffect(() => {
    if (editDeadline) {
      setTitle(editDeadline.title);
      // Set manual date picker value
      const d = new Date(editDeadline.due_date);
      // Format as local YYYY-MM-DDTHH:MM
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      const isoStr = localTime.toISOString().slice(0, 16);
      setManualDate(isoStr);
      setParsedDate(d);
      setNlpInput(""); // blank NLP since it's already saved
    } else {
      setTitle("");
      setNlpInput("");
      setManualDate("");
      setParsedDate(null);
    }
    setError("");
  }, [editDeadline]);

  // ── Real-Time NLP Parsing ────────────────────────────────────────────────
  useEffect(() => {
    if (!nlpInput.trim()) {
      // If NLP is blank, rely entirely on manualDate (if selected)
      if (manualDate) {
        setParsedDate(new Date(manualDate));
      } else {
        setParsedDate(null);
      }
      return;
    }

    const parsed = chrono.parseDate(nlpInput);
    if (parsed) {
      setParsedDate(parsed);
      // Auto-update manual date picker input to match parsed result for transparency
      const offset = parsed.getTimezoneOffset();
      const localTime = new Date(parsed.getTime() - offset * 60 * 1000);
      setManualDate(localTime.toISOString().slice(0, 16));
    } else {
      // If parsing fails, fall back to manual date
      if (manualDate) {
        setParsedDate(new Date(manualDate));
      } else {
        setParsedDate(null);
      }
    }
  }, [nlpInput, manualDate]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a deadline title.");
      return;
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      setError("Please specify a valid due date (using NLP input or manual picker).");
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDueDate = parsedDate.toISOString();
      if (editDeadline) {
        await updateDeadline(editDeadline.id, trimmedTitle, isoDueDate, editDeadline.completed);
      } else {
        await addDeadline(trimmedTitle, isoDueDate);
      }
      triggerClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save deadline";
      setError(errorMsg);
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

      {/* Drawer Sheet */}
      <div
        ref={sheetRef}
        data-modal-sheet="true"
        style={{ transform: sheetTransform, transition: sheetTransition }}
        className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col max-h-[92vh] bg-[#0d0d0d] text-white rounded-t-3xl border-t border-white/10 shadow-[0_-16px_48px_rgba(0,0,0,0.7)] md:max-w-md md:mx-auto"
      >
        {/* Drag handle — visual affordance + mouse drag trigger */}
        <div 
          className="flex items-center justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing select-none touch-none shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-700 hover:bg-neutral-500 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-900 select-none shrink-0">
          <button
            type="button"
            onClick={triggerClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            {editDeadline ? "Edit Deadline" : "New Deadline"}
          </h3>
          <div className="w-6" />
        </div>

        {/* Scrollable Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 pb-12 space-y-6"
        >
          {error && (
            <div className="p-3.5 border border-red-900/50 bg-red-950/40 rounded-md text-xs text-red-400 leading-normal">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Deadline Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Submit proposal draft"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* NLP Date Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Sparkles size={11} className="text-cyan-400 animate-pulse" />
              <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                Type Date (Natural Language)
              </label>
            </div>
            <input
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder="e.g., due next Tuesday at 3pm"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
            />
          </div>

          {/* Parsed Live Confirmation Preview */}
          {parsedDate && !isNaN(parsedDate.getTime()) ? (
            <div className="p-3.5 border border-emerald-950 bg-gradient-to-r from-emerald-950/20 to-cyan-950/20 rounded-xl flex items-start gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)] select-none">
              <Calendar size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                  Parsed Due Date Confirmation:
                </span>
                <span className="text-xs font-mono text-neutral-200">
                  {parsedDate.toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ) : (
            nlpInput && (
              <div className="p-3.5 border border-neutral-900 bg-neutral-950/60 rounded-xl flex items-start gap-2.5 select-none">
                <AlertTriangle size={14} className="text-neutral-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 block font-bold">
                    NLP Status:
                  </span>
                  <span className="text-xs text-neutral-500 font-mono italic">
                    Waiting for recognizable date syntax...
                  </span>
                </div>
              </div>
            )
          )}

          {/* Manual Fallback Date Picker */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-500">
              Manual Date Fallback / Override
            </label>
            <input
              type="datetime-local"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-850 rounded-md text-sm text-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-all select-none shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-95"
            >
              {isSubmitting ? "Saving..." : editDeadline ? "Update Deadline" : "Create Deadline"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
